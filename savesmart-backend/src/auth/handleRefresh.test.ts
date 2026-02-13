/**
 * Unit tests for handleRefresh function
 *
 * Tests cover:
 * - Successful refresh flow
 * - Invalid token handling
 * - Expired token handling
 * - Token type validation
 *
 * Requirements: 5.1, 5.4, 5.5
 */

import { handleRefresh } from './handleRefresh';
import { TokenService } from './TokenService';
import { UserRepository } from './UserRepository';
import type { APIGatewayProxyEvent } from 'aws-lambda';

// Mock services
const mockTokenService = {
  validateToken: jest.fn(),
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
} as unknown as TokenService;

const mockUserRepository = {
  getUserById: jest.fn(),
} as unknown as UserRepository;

// Helper to create mock API Gateway event
const createMockEvent = (body: any): APIGatewayProxyEvent => ({
  body: JSON.stringify(body),
  headers: {},
  multiValueHeaders: {},
  httpMethod: 'POST',
  isBase64Encoded: false,
  path: '/auth/refresh',
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {} as any,
  resource: '',
});

describe('handleRefresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful refresh', () => {
    it('should refresh tokens and return new tokens', async () => {
      // Arrange
      const requestBody = {
        refreshToken: 'valid-refresh-token',
      };

      const event = createMockEvent(requestBody);

      const mockDecodedToken = {
        userId: 'user-123',
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };

      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      (mockTokenService.validateToken as jest.Mock).mockReturnValue(mockDecodedToken);
      (mockUserRepository.getUserById as jest.Mock).mockResolvedValue(mockUser);
      (mockTokenService.generateAccessToken as jest.Mock).mockReturnValue('new-access-token');
      (mockTokenService.generateRefreshToken as jest.Mock).mockReturnValue('new-refresh-token');

      // Act
      const result = await handleRefresh(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.accessToken).toBe('new-access-token');
      expect(body.refreshToken).toBe('new-refresh-token');

      // Verify service calls
      expect(mockTokenService.validateToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith('user-123');
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith('user-123', 'test@example.com');
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith('user-123');
    });

    it('should generate both new access and refresh tokens', async () => {
      // Arrange
      const requestBody = {
        refreshToken: 'valid-refresh-token',
      };

      const event = createMockEvent(requestBody);

      const mockDecodedToken = {
        userId: 'user-456',
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };

      const mockUser = {
        userId: 'user-456',
        email: 'user@example.com',
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      (mockTokenService.validateToken as jest.Mock).mockReturnValue(mockDecodedToken);
      (mockUserRepository.getUserById as jest.Mock).mockResolvedValue(mockUser);
      (mockTokenService.generateAccessToken as jest.Mock).mockReturnValue('access-token-abc');
      (mockTokenService.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token-xyz');

      // Act
      const result = await handleRefresh(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.accessToken).toBe('access-token-abc');
      expect(body.refreshToken).toBe('refresh-token-xyz');

      // Verify both token generation methods were called
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledTimes(1);
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when request body is missing', async () => {
      // Arrange
      const event = {
        ...createMockEvent({}),
        body: null,
      };

      // Act
      const result = await handleRefresh(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Request body is required');
    });

    it('should return 400 when refreshToken is missing', async () => {
      // Arrange
      const requestBody = {};

      const event = createMockEvent(requestBody);

      // Act
      const result = await handleRefresh(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Validation failed');
      expect(body.details).toContain('refreshToken is required and must be a string');
    });

    it('should return 400 when refreshToken is not a string', async () => {
      // Arrange
      const requestBody = {
        refreshToken: 12345,
      };

      const event = createMockEvent(requestBody);

      // Act
      const result = await handleRefresh(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Validation failed');
      expect(body.details).toContain('refreshToken is required and must be a string');
    });

    it('should return 400 when refreshToken is empty string', async () => {
      // Arrange
      const requestBody = {
        refreshToken: '',
      };

      const event = createMockEvent(requestBody);

      // Act
      const result = await handleRefresh(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Validation failed');
      expect(body.details).toContain('refreshToken is required and must be a string');
    });
  });

  describe('Invalid token handling', () => {
    it('should return 401 when token signature is invalid', async () => {
      // Arrange
      const requestBody = {
        refreshToken: 'invalid-token',
      };

      const event = createMockEvent(requestBody);

      (mockTokenService.validateToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      const result = await handleRefresh(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Invalid or expired token');

      // Verify token generation was not called
      expect(mockTokenService.generateAccessToken).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', async () => {
      // Arrange
      const requestBody = {
        refreshToken: 'expired-token',
      };

      const event = createMockEvent(requestBody);

      (mockTokenService.validateToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      // Act
      const result = await handleRefresh(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Invalid or expired token');

      // Verify token generation was not called
      expect(mockTokenService.generateAccessToken).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
    });

    it('should return 401 when token type is not refresh', async () => {
      // Arrange
      const requestBody = {
        refreshToken: 'access-token-instead',
      };

      const event = createMockEvent(requestBody);

      const mockDecodedToken = {
        userId: 'user-123',
        type: 'access', // Wrong type
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      (mockTokenService.validateToken as jest.Mock).mockReturnValue(mockDecodedToken);

      // Act
      const result = await handleRefresh(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Invalid or expired token');

      // Verify token generation was not called
      expect(mockTokenService.generateAccessToken).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
    });

    it('should return 401 when userId is missing from token', async () => {
      // Arrange
      const requestBody = {
        refreshToken: 'token-without-userid',
      };

      const event = createMockEvent(requestBody);

      const mockDecodedToken = {
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        // userId is missing
      };

      (mockTokenService.validateToken as jest.Mock).mockReturnValue(mockDecodedToken);

      // Act
      const result = await handleRefresh(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Invalid or expired token');

      // Verify token generation was not called
      expect(mockTokenService.generateAccessToken).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
    });

    it('should return 401 when userId is not a string', async () => {
      // Arrange
      const requestBody = {
        refreshToken: 'token-with-invalid-userid',
      };

      const event = createMockEvent(requestBody);

      const mockDecodedToken = {
        userId: 12345, // Not a string
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };

      (mockTokenService.validateToken as jest.Mock).mockReturnValue(mockDecodedToken);

      // Act
      const result = await handleRefresh(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Invalid or expired token');

      // Verify token generation was not called
      expect(mockTokenService.generateAccessToken).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
    });

    it('should return 401 when user does not exist', async () => {
      // Arrange
      const requestBody = {
        refreshToken: 'valid-token-nonexistent-user',
      };

      const event = createMockEvent(requestBody);

      const mockDecodedToken = {
        userId: 'nonexistent-user',
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };

      (mockTokenService.validateToken as jest.Mock).mockReturnValue(mockDecodedToken);
      (mockUserRepository.getUserById as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await handleRefresh(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Invalid or expired token');

      // Verify token generation was not called
      expect(mockTokenService.generateAccessToken).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should return 400 for invalid JSON', async () => {
      // Arrange
      const event = {
        ...createMockEvent({}),
        body: 'invalid-json{',
      };

      // Act
      const result = await handleRefresh(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Invalid JSON in request body');
    });

    it('should return 500 for database errors', async () => {
      // Arrange
      const requestBody = {
        refreshToken: 'valid-refresh-token',
      };

      const event = createMockEvent(requestBody);

      const mockDecodedToken = {
        userId: 'user-123',
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };

      (mockTokenService.validateToken as jest.Mock).mockReturnValue(mockDecodedToken);
      (mockUserRepository.getUserById as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const result = await handleRefresh(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Internal server error');
    });

    it('should return 500 for token generation errors', async () => {
      // Arrange
      const requestBody = {
        refreshToken: 'valid-refresh-token',
      };

      const event = createMockEvent(requestBody);

      const mockDecodedToken = {
        userId: 'user-123',
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };

      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      (mockTokenService.validateToken as jest.Mock).mockReturnValue(mockDecodedToken);
      (mockUserRepository.getUserById as jest.Mock).mockResolvedValue(mockUser);
      (mockTokenService.generateAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token generation failed');
      });

      // Act
      const result = await handleRefresh(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('Token type validation', () => {
    it('should reject access tokens', async () => {
      // Arrange
      const requestBody = {
        refreshToken: 'access-token',
      };

      const event = createMockEvent(requestBody);

      const mockDecodedToken = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      (mockTokenService.validateToken as jest.Mock).mockReturnValue(mockDecodedToken);

      // Act
      const result = await handleRefresh(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Invalid or expired token');
    });

    it('should only accept refresh tokens', async () => {
      // Arrange
      const requestBody = {
        refreshToken: 'valid-refresh-token',
      };

      const event = createMockEvent(requestBody);

      const mockDecodedToken = {
        userId: 'user-123',
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };

      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      (mockTokenService.validateToken as jest.Mock).mockReturnValue(mockDecodedToken);
      (mockUserRepository.getUserById as jest.Mock).mockResolvedValue(mockUser);
      (mockTokenService.generateAccessToken as jest.Mock).mockReturnValue('new-access-token');
      (mockTokenService.generateRefreshToken as jest.Mock).mockReturnValue('new-refresh-token');

      // Act
      const result = await handleRefresh(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(200);
    });
  });
});
