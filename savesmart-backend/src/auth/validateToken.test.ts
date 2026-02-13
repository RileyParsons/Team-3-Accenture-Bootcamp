/**
 * Unit tests for validateToken middleware
 * Requirements: 4.1, 4.2, 4.3, 8.3
 */

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { validateToken } from './validateToken';
import { TokenService } from './TokenService';

// Mock TokenService
jest.mock('./TokenService');

describe('validateToken middleware', () => {
  let mockTokenService: jest.Mocked<TokenService>;
  let mockEvent: APIGatewayProxyEvent;

  beforeEach(() => {
    // Create mock TokenService
    mockTokenService = new TokenService('test-secret') as jest.Mocked<TokenService>;

    // Create base mock event
    mockEvent = {
      headers: {},
      multiValueHeaders: {},
      body: null,
      httpMethod: 'GET',
      isBase64Encoded: false,
      path: '/users/123',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    };

    jest.clearAllMocks();
  });

  describe('Token extraction', () => {
    it('should extract token from Authorization header with Bearer prefix', () => {
      mockEvent.headers = {
        Authorization: 'Bearer valid-token',
      };

      mockTokenService.validateToken.mockReturnValue({
        userId: 'user-123',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      });

      const result = validateToken(mockEvent, mockTokenService);

      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(mockTokenService.validateToken).toHaveBeenCalledWith('valid-token');
    });

    it('should handle case-insensitive authorization header', () => {
      mockEvent.headers = {
        authorization: 'Bearer valid-token',
      };

      mockTokenService.validateToken.mockReturnValue({
        userId: 'user-123',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      });

      const result = validateToken(mockEvent, mockTokenService);

      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-123');
    });

    it('should return 401 if no Authorization header provided', () => {
      mockEvent.headers = {};

      const result = validateToken(mockEvent, mockTokenService);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No token provided');
      expect(result.statusCode).toBe(401);
      expect(mockTokenService.validateToken).not.toHaveBeenCalled();
    });

    it('should return 401 if Authorization header does not have Bearer prefix', () => {
      mockEvent.headers = {
        Authorization: 'Basic some-credentials',
      };

      const result = validateToken(mockEvent, mockTokenService);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No token provided');
      expect(result.statusCode).toBe(401);
      expect(mockTokenService.validateToken).not.toHaveBeenCalled();
    });

    it('should return 401 if Authorization header has invalid format', () => {
      mockEvent.headers = {
        Authorization: 'InvalidFormat',
      };

      const result = validateToken(mockEvent, mockTokenService);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No token provided');
      expect(result.statusCode).toBe(401);
    });
  });

  describe('Token validation', () => {
    beforeEach(() => {
      mockEvent.headers = {
        Authorization: 'Bearer test-token',
      };
    });

    it('should return 401 if token signature is invalid', () => {
      mockTokenService.validateToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = validateToken(mockEvent, mockTokenService);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
      expect(result.statusCode).toBe(401);
    });

    it('should return 401 if token is expired', () => {
      mockTokenService.validateToken.mockImplementation(() => {
        throw new Error('Token expired');
      });

      const result = validateToken(mockEvent, mockTokenService);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
      expect(result.statusCode).toBe(401);
    });

    it('should return 401 if token type is not "access"', () => {
      mockTokenService.validateToken.mockReturnValue({
        userId: 'user-123',
        type: 'refresh',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      });

      const result = validateToken(mockEvent, mockTokenService);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
      expect(result.statusCode).toBe(401);
    });

    it('should return 401 if token does not contain userId', () => {
      mockTokenService.validateToken.mockReturnValue({
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      });

      const result = validateToken(mockEvent, mockTokenService);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
      expect(result.statusCode).toBe(401);
    });

    it('should return 401 if userId is not a string', () => {
      mockTokenService.validateToken.mockReturnValue({
        userId: 12345 as any,
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      });

      const result = validateToken(mockEvent, mockTokenService);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
      expect(result.statusCode).toBe(401);
    });

    it('should successfully validate a valid access token', () => {
      mockTokenService.validateToken.mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      });

      const result = validateToken(mockEvent, mockTokenService);

      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.error).toBeUndefined();
      expect(result.statusCode).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors gracefully', () => {
      mockEvent.headers = {
        Authorization: 'Bearer test-token',
      };

      mockTokenService.validateToken.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = validateToken(mockEvent, mockTokenService);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
      expect(result.statusCode).toBe(401);
    });
  });

  describe('UserId extraction', () => {
    it('should extract userId from valid token for downstream use', () => {
      mockEvent.headers = {
        Authorization: 'Bearer valid-token',
      };

      mockTokenService.validateToken.mockReturnValue({
        userId: 'extracted-user-id',
        email: 'user@example.com',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      });

      const result = validateToken(mockEvent, mockTokenService);

      expect(result.success).toBe(true);
      expect(result.userId).toBe('extracted-user-id');
    });
  });
});
