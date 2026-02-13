import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { getJWTSecret, clearJWTSecretCache } from './ssm';

// Mock the AWS SDK
jest.mock('@aws-sdk/client-ssm');

describe('SSM Helper', () => {
  const mockSend = jest.fn();
  const mockSSMClient = SSMClient as jest.MockedClass<typeof SSMClient>;

  beforeEach(() => {
    // Clear cache before each test
    clearJWTSecretCache();

    // Reset mocks
    jest.clearAllMocks();

    // Mock SSMClient constructor and send method
    mockSSMClient.mockImplementation(() => ({
      send: mockSend,
    } as any));
  });

  describe('getJWTSecret', () => {
    it('should retrieve secret from SSM Parameter Store', async () => {
      const mockSecret = 'test-jwt-secret-12345';

      mockSend.mockResolvedValueOnce({
        Parameter: {
          Value: mockSecret,
        },
      });

      const result = await getJWTSecret();

      expect(result).toBe(mockSecret);
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(expect.any(GetParameterCommand));
    });

    it('should use custom parameter name when provided', async () => {
      const customParamName = '/custom/jwt-secret';
      const mockSecret = 'custom-secret';

      mockSend.mockResolvedValueOnce({
        Parameter: {
          Value: mockSecret,
        },
      });

      await getJWTSecret(customParamName);

      // Verify the function returns the correct secret
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should request decryption for SecureString parameters', async () => {
      mockSend.mockResolvedValueOnce({
        Parameter: {
          Value: 'secret',
        },
      });

      const result = await getJWTSecret();

      // Verify the function successfully retrieves and returns the secret
      expect(result).toBe('secret');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should cache secret in memory for subsequent calls', async () => {
      const mockSecret = 'cached-secret';

      mockSend.mockResolvedValueOnce({
        Parameter: {
          Value: mockSecret,
        },
      });

      // First call - should hit SSM
      const result1 = await getJWTSecret();
      expect(result1).toBe(mockSecret);
      expect(mockSend).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await getJWTSecret();
      expect(result2).toBe(mockSecret);
      expect(mockSend).toHaveBeenCalledTimes(1); // Still only 1 call

      // Third call - should still use cache
      const result3 = await getJWTSecret();
      expect(result3).toBe(mockSecret);
      expect(mockSend).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should throw error when parameter has no value', async () => {
      mockSend.mockResolvedValueOnce({
        Parameter: {
          Value: undefined,
        },
      });

      await expect(getJWTSecret()).rejects.toThrow(
        'SSM parameter /savesmart/jwt-secret has no value'
      );
    });

    it('should throw error when parameter is missing', async () => {
      mockSend.mockResolvedValueOnce({
        Parameter: undefined,
      });

      await expect(getJWTSecret()).rejects.toThrow(
        'SSM parameter /savesmart/jwt-secret has no value'
      );
    });

    it('should handle SSM client errors gracefully', async () => {
      const ssmError = new Error('ParameterNotFound');
      mockSend.mockRejectedValueOnce(ssmError);

      await expect(getJWTSecret()).rejects.toThrow(
        'Failed to retrieve JWT secret from SSM: ParameterNotFound'
      );
    });

    it('should handle unknown errors gracefully', async () => {
      mockSend.mockRejectedValueOnce('Unknown error');

      await expect(getJWTSecret()).rejects.toThrow(
        'Failed to retrieve JWT secret from SSM: Unknown error'
      );
    });

    it('should use correct AWS region from environment variable', async () => {
      const originalRegion = process.env.AWS_REGION;
      process.env.AWS_REGION = 'us-west-2';

      mockSend.mockResolvedValueOnce({
        Parameter: {
          Value: 'secret',
        },
      });

      await getJWTSecret();

      expect(mockSSMClient).toHaveBeenCalledWith({ region: 'us-west-2' });

      // Restore original region
      process.env.AWS_REGION = originalRegion;
    });

    it('should default to ap-southeast-2 region when not specified', async () => {
      const originalRegion = process.env.AWS_REGION;
      delete process.env.AWS_REGION;

      mockSend.mockResolvedValueOnce({
        Parameter: {
          Value: 'secret',
        },
      });

      await getJWTSecret();

      expect(mockSSMClient).toHaveBeenCalledWith({ region: 'ap-southeast-2' });

      // Restore original region
      process.env.AWS_REGION = originalRegion;
    });
  });

  describe('clearJWTSecretCache', () => {
    it('should clear the cached secret', async () => {
      const mockSecret = 'cached-secret';

      mockSend.mockResolvedValue({
        Parameter: {
          Value: mockSecret,
        },
      });

      // First call - cache the secret
      await getJWTSecret();
      expect(mockSend).toHaveBeenCalledTimes(1);

      // Second call - use cache
      await getJWTSecret();
      expect(mockSend).toHaveBeenCalledTimes(1);

      // Clear cache
      clearJWTSecretCache();

      // Third call - should hit SSM again
      await getJWTSecret();
      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });
});
