/**
 * Unit tests for getUser handler
 *
 * Tests authentication requirement, authorization, and data access
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handleGetUser } from './getUser';
import { TokenService } from '../auth/TokenService';
import { UserRepository, UserRecord } from '../auth/UserRepository';

// Mock services
const mockTokenService = {
  validateToken: jest.fn(),
} as unknown as TokenService;

const mockUserRepository = {
  getUserById: jest.fn(),
} as unknown as UserRepository;

// Helper to create mock API Gateway event
const createMockEvent = (
  userId: string | undefined,
  authHeader?: string
): APIGatewayProxyEvent => ({
  body: null,
  headers: authHeader ? { Authorization: authHeader } : {},
  multiValueHeaders: {},
  httpMethod: 'GET',
  isBase64Encoded: false,
  path: `/users/${userId}`,
  pathParameters: userId ? { userId } : null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  resource: '/users/{userId}',
  stageVariables: null,
  requestContext: {} as any,
});

describe('handleGetUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication requirement', () => {
    it('should return 401 when no token is provided', async () => {
      // Arrange
      const event = createMockEvent('user-123');

      // Act
      const result = await handleGetUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('No token provided');
    });

    it('should return 401 when token is invalid', async () => {
      // Arrange
      const event = createMockEvent('user-123', 'Bearer invalid-token');
      (mockTokenService.validateToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      const result = await handleGetUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Invalid or expired token');
    });

    it('should return 401 when token is expired', async () => {
      // Arrange
      const event = createMockEvent('user-123', 'Bearer expired-token');
      (mockTokenService.validateToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      // Act
      const result = await handleGetUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Invalid or expired token');
    });

    it('should return 401 when token type is not "access"', async () => {
      // Arrange
      const event = createMockEvent('user-123', 'Bearer refresh-token');
      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        type: 'refresh',
      });

      // Act
      const result = await handleGetUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Invalid or expired token');
    });
  });

  describe('Authorization (userId matching)', () => {
    it('should return 403 when token userId does not match requested userId', async () => {
      // Arrange
      const event = createMockEvent('user-456', 'Bearer valid-token');
      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        email: 'user@example.com',
        type: 'access',
      });

      // Act
      const result = await handleGetUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(403);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Forbidden: You can only access your own data');
    });

    it('should return 400 when userId path parameter is missing', async () => {
      // Arrange
      const event = createMockEvent(undefined, 'Bearer valid-token');
      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        email: 'user@example.com',
        type: 'access',
      });

      // Act
      const result = await handleGetUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Missing userId parameter');
    });
  });

  describe('Successful data access', () => {
    it('should return user data when authentication and authorization succeed', async () => {
      // Arrange
      const userId = 'user-123';
      const event = createMockEvent(userId, 'Bearer valid-token');

      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: userId,
        email: 'user@example.com',
        type: 'access',
      });

      const mockUser: UserRecord = {
        userId: userId,
        email: 'user@example.com',
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-15T10:30:00.000Z',
      };

      (mockUserRepository.getUserById as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await handleGetUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.userId).toBe(userId);
      expect(body.email).toBe('user@example.com');
      expect(body.createdAt).toBe('2024-01-15T10:30:00.000Z');

      // Verify sensitive fields are excluded
      expect(body.hashedPassword).toBeUndefined();
      expect(body.resetToken).toBeUndefined();
      expect(body.resetTokenExpiry).toBeUndefined();
    });

    it('should exclude resetToken and resetTokenExpiry when present', async () => {
      // Arrange
      const userId = 'user-123';
      const event = createMockEvent(userId, 'Bearer valid-token');

      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: userId,
        email: 'user@example.com',
        type: 'access',
      });

      const mockUser: UserRecord = {
        userId: userId,
        email: 'user@example.com',
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-15T10:30:00.000Z',
        resetToken: '$2b$10$resettoken',
        resetTokenExpiry: '2024-01-15T11:30:00.000Z',
      };

      (mockUserRepository.getUserById as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await handleGetUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.userId).toBe(userId);
      expect(body.email).toBe('user@example.com');

      // Verify all sensitive fields are excluded
      expect(body.hashedPassword).toBeUndefined();
      expect(body.resetToken).toBeUndefined();
      expect(body.resetTokenExpiry).toBeUndefined();
    });

    it('should return 404 when user does not exist', async () => {
      // Arrange
      const userId = 'non-existent-user';
      const event = createMockEvent(userId, 'Bearer valid-token');

      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: userId,
        email: 'user@example.com',
        type: 'access',
      });

      (mockUserRepository.getUserById as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await handleGetUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('User not found');
    });
  });

  describe('Error handling', () => {
    it('should return 500 when repository throws an error', async () => {
      // Arrange
      const userId = 'user-123';
      const event = createMockEvent(userId, 'Bearer valid-token');

      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: userId,
        email: 'user@example.com',
        type: 'access',
      });

      (mockUserRepository.getUserById as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const result = await handleGetUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('CORS headers', () => {
    it('should include CORS headers in response', async () => {
      // Arrange
      const userId = 'user-123';
      const event = createMockEvent(userId, 'Bearer valid-token');

      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: userId,
        email: 'user@example.com',
        type: 'access',
      });

      const mockUser: UserRecord = {
        userId: userId,
        email: 'user@example.com',
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-15T10:30:00.000Z',
      };

      (mockUserRepository.getUserById as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await handleGetUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.headers).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      });
    });
  });
});
