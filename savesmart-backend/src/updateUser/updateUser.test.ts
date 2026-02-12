/**
 * Unit tests for updateUser handler
 *
 * Tests authentication requirement, authorization, payload validation, and data updates
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handleUpdateUser } from './updateUser';
import { TokenService } from '../auth/TokenService';
import { UserRepository, UserRecord } from '../auth/UserRepository';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  UpdateItemCommand: jest.fn(),
}));

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
  body: any,
  authHeader?: string
): APIGatewayProxyEvent => ({
  body: body ? JSON.stringify(body) : null,
  headers: authHeader ? { Authorization: authHeader } : {},
  multiValueHeaders: {},
  httpMethod: 'PUT',
  isBase64Encoded: false,
  path: `/users/${userId}`,
  pathParameters: userId ? { userId } : null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  resource: '/users/{userId}',
  stageVariables: null,
  requestContext: {} as any,
});

describe('handleUpdateUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication requirement', () => {
    it('should return 401 when no token is provided', async () => {
      // Arrange
      const event = createMockEvent('user-123', { email: 'new@example.com' });

      // Act
      const result = await handleUpdateUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('No token provided');
    });

    it('should return 401 when token is invalid', async () => {
      // Arrange
      const event = createMockEvent('user-123', { email: 'new@example.com' }, 'Bearer invalid-token');
      (mockTokenService.validateToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      const result = await handleUpdateUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Invalid or expired token');
    });

    it('should return 401 when token type is not "access"', async () => {
      // Arrange
      const event = createMockEvent('user-123', { email: 'new@example.com' }, 'Bearer refresh-token');
      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        type: 'refresh',
      });

      // Act
      const result = await handleUpdateUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Invalid or expired token');
    });
  });

  describe('Authorization (userId matching)', () => {
    it('should return 403 when token userId does not match requested userId', async () => {
      // Arrange
      const event = createMockEvent('user-456', { email: 'new@example.com' }, 'Bearer valid-token');
      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        email: 'user@example.com',
        type: 'access',
      });

      // Act
      const result = await handleUpdateUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(403);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Forbidden: You can only update your own data');
    });

    it('should return 400 when userId path parameter is missing', async () => {
      // Arrange
      const event = createMockEvent(undefined, { email: 'new@example.com' }, 'Bearer valid-token');
      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        email: 'user@example.com',
        type: 'access',
      });

      // Act
      const result = await handleUpdateUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Missing userId parameter');
    });
  });

  describe('Payload validation', () => {
    it('should return 400 when request body is missing', async () => {
      // Arrange
      const event = createMockEvent('user-123', null, 'Bearer valid-token');
      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        email: 'user@example.com',
        type: 'access',
      });

      // Act
      const result = await handleUpdateUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Request body is required');
    });

    it('should return 400 when request body is invalid JSON', async () => {
      // Arrange
      const event = createMockEvent('user-123', null, 'Bearer valid-token');
      event.body = 'invalid json{';
      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        email: 'user@example.com',
        type: 'access',
      });

      // Act
      const result = await handleUpdateUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Invalid JSON in request body');
    });

    it('should return 400 when trying to update password', async () => {
      // Arrange
      const event = createMockEvent('user-123', { password: 'newpass123' }, 'Bearer valid-token');
      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        email: 'user@example.com',
        type: 'access',
      });

      // Act
      const result = await handleUpdateUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Password updates are not allowed through this endpoint');
    });

    it('should return 400 when trying to update hashedPassword', async () => {
      // Arrange
      const event = createMockEvent('user-123', { hashedPassword: '$2b$10$hash' }, 'Bearer valid-token');
      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        email: 'user@example.com',
        type: 'access',
      });

      // Act
      const result = await handleUpdateUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Password updates are not allowed through this endpoint');
    });

    it('should return 400 when no valid fields to update', async () => {
      // Arrange
      const event = createMockEvent('user-123', { invalidField: 'value' }, 'Bearer valid-token');
      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        email: 'user@example.com',
        type: 'access',
      });

      // Act
      const result = await handleUpdateUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('No valid fields to update');
    });
  });

  describe('Successful data updates', () => {
    it('should update user data and return updated user', async () => {
      // Arrange
      const userId = 'user-123';
      const updateData = {
        email: 'newemail@example.com',
        name: 'John Doe',
        income: 50000,
      };
      const event = createMockEvent(userId, updateData, 'Bearer valid-token');

      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: userId,
        email: 'user@example.com',
        type: 'access',
      });

      const existingUser: UserRecord = {
        userId: userId,
        email: 'user@example.com',
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-15T10:30:00.000Z',
      };

      const updatedUser: UserRecord = {
        ...existingUser,
        email: 'newemail@example.com',
      };

      (mockUserRepository.getUserById as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(updatedUser);

      const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
      const mockSend = jest.fn().mockResolvedValue({});
      (DynamoDBClient as jest.Mock).mockImplementation(() => ({
        send: mockSend,
      }));

      // Act
      const result = await handleUpdateUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.userId).toBe(userId);
      expect(body.email).toBe('newemail@example.com');

      // Verify sensitive fields are excluded
      expect(body.hashedPassword).toBeUndefined();
      expect(body.resetToken).toBeUndefined();
      expect(body.resetTokenExpiry).toBeUndefined();
    });

    it('should handle multiple field updates', async () => {
      // Arrange
      const userId = 'user-123';
      const updateData = {
        email: 'newemail@example.com',
        name: 'John Doe',
        income: 50000,
        savings: 10000,
        location: 'Sydney',
      };
      const event = createMockEvent(userId, updateData, 'Bearer valid-token');

      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: userId,
        email: 'user@example.com',
        type: 'access',
      });

      const existingUser: UserRecord = {
        userId: userId,
        email: 'user@example.com',
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-15T10:30:00.000Z',
      };

      (mockUserRepository.getUserById as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(existingUser);

      const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
      const mockSend = jest.fn().mockResolvedValue({});
      (DynamoDBClient as jest.Mock).mockImplementation(() => ({
        send: mockSend,
      }));

      // Act
      const result = await handleUpdateUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.statusCode).toBe(200);
    });

    it('should return 404 when user does not exist', async () => {
      // Arrange
      const userId = 'non-existent-user';
      const event = createMockEvent(userId, { email: 'new@example.com' }, 'Bearer valid-token');

      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: userId,
        email: 'user@example.com',
        type: 'access',
      });

      (mockUserRepository.getUserById as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await handleUpdateUser(event, mockTokenService, mockUserRepository);

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
      const event = createMockEvent(userId, { email: 'new@example.com' }, 'Bearer valid-token');

      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: userId,
        email: 'user@example.com',
        type: 'access',
      });

      (mockUserRepository.getUserById as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const result = await handleUpdateUser(event, mockTokenService, mockUserRepository);

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
      const event = createMockEvent(userId, { email: 'new@example.com' }, 'Bearer valid-token');

      (mockTokenService.validateToken as jest.Mock).mockReturnValue({
        userId: userId,
        email: 'user@example.com',
        type: 'access',
      });

      const existingUser: UserRecord = {
        userId: userId,
        email: 'user@example.com',
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-15T10:30:00.000Z',
      };

      (mockUserRepository.getUserById as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(existingUser);

      const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
      const mockSend = jest.fn().mockResolvedValue({});
      (DynamoDBClient as jest.Mock).mockImplementation(() => ({
        send: mockSend,
      }));

      // Act
      const result = await handleUpdateUser(event, mockTokenService, mockUserRepository);

      // Assert
      expect(result.headers).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      });
    });
  });
});
