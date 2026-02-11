/**
 * Unit tests for handleLogin function
 *
 * Tests cover:
 * - Successful login flow
 * - Invalid credentials handling
 * - Error message consistency
 * - Token generation
 *
 * Requirements: 2.1, 2.2, 2.3, 2.6
 */

import { handleLogin } from './handleLogin';
import { ValidationService } from './ValidationService';
import { PasswordService } from './PasswordService';
import { TokenService } from './TokenService';
import { UserRepository } from './UserRepository';
import type { APIGatewayProxyEvent } from 'aws-lambda';

// Mock services
const mockValidationService = {
  validateLoginPayload: jest.fn(),
} as unknown as ValidationService;

const mockPasswordService = {
  verifyPassword: jest.fn(),
} as unknown as PasswordService;

const mockTokenService = {
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
} as unknown as TokenService;

const mockUserRepository = {
  getUserByEmail: jest.fn(),
} as unknown as UserRepository;

// Helper to create mock API Gateway event
const createMockEvent = (body: any): APIGatewayProxyEvent => ({
  body: JSON.stringify(body),
  headers: {},
  multiValueHeaders: {},
  httpMethod: 'POST',
  isBase64Encoded: false,
  path: '/auth/login',
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {} as any,
  resource: '',
});

describe('handleLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful login', () => {
    it('should login user and return tokens', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: 'SecurePass123',
      };

      const event = createMockEvent(requestBody);

      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      (mockValidationService.validateLoginPayload as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });

      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (mockPasswordService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (mockTokenService.generateAccessToken as jest.Mock).mockReturnValue('access-token-123');
      (mockTokenService.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token-456');

      // Act
      const result = await handleLogin(
        event,
        mockValidationService,
        mockPasswordService,
        mockTokenService,
        mockUserRepository
      );

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.userId).toBe('user-123');
      expect(body.email).toBe('test@example.com');
      expect(body.accessToken).toBe('access-token-123');
      expect(body.refreshToken).toBe('refresh-token-456');

      // Verify service calls
      expect(mockValidationService.validateLoginPayload).toHaveBeenCalledWith(requestBody);
      expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith(
        'SecurePass123',
        '$2b$10$hashedpassword'
      );
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith('user-123', 'test@example.com');
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith('user-123');
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
      const result = await handleLogin(
        event,
        mockValidationService,
        mockPasswordService,
        mockTokenService,
        mockUserRepository
      );

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Request body is required');
    });

    it('should return 400 when email is invalid', async () => {
      // Arrange
      const requestBody = {
        email: 'invalid-email',
        password: 'SecurePass123',
      };

      const event = createMockEvent(requestBody);

      (mockValidationService.validateLoginPayload as jest.Mock).mockReturnValue({
        valid: false,
        errors: ['Invalid email format'],
      });

      // Act
      const result = await handleLogin(
        event,
        mockValidationService,
        mockPasswordService,
        mockTokenService,
        mockUserRepository
      );

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Validation failed');
      expect(body.details).toContain('Invalid email format');
    });

    it('should return 400 when email is missing', async () => {
      // Arrange
      const requestBody = {
        password: 'SecurePass123',
      };

      const event = createMockEvent(requestBody);

      (mockValidationService.validateLoginPayload as jest.Mock).mockReturnValue({
        valid: false,
        errors: ['Email is required'],
      });

      // Act
      const result = await handleLogin(
        event,
        mockValidationService,
        mockPasswordService,
        mockTokenService,
        mockUserRepository
      );

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Validation failed');
      expect(body.details).toContain('Email is required');
    });

    it('should return 400 when password is missing', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
      };

      const event = createMockEvent(requestBody);

      (mockValidationService.validateLoginPayload as jest.Mock).mockReturnValue({
        valid: false,
        errors: ['Password is required'],
      });

      // Act
      const result = await handleLogin(
        event,
        mockValidationService,
        mockPasswordService,
        mockTokenService,
        mockUserRepository
      );

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Validation failed');
      expect(body.details).toContain('Password is required');
    });
  });

  describe('Invalid credentials handling', () => {
    it('should return 401 with generic error when user not found', async () => {
      // Arrange
      const requestBody = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123',
      };

      const event = createMockEvent(requestBody);

      (mockValidationService.validateLoginPayload as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });

      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await handleLogin(
        event,
        mockValidationService,
        mockPasswordService,
        mockTokenService,
        mockUserRepository
      );

      // Assert
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Invalid credentials');

      // Verify password verification was not called
      expect(mockPasswordService.verifyPassword).not.toHaveBeenCalled();
      expect(mockTokenService.generateAccessToken).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
    });

    it('should return 401 with generic error when password is incorrect', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: 'WrongPassword123',
      };

      const event = createMockEvent(requestBody);

      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      (mockValidationService.validateLoginPayload as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });

      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (mockPasswordService.verifyPassword as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await handleLogin(
        event,
        mockValidationService,
        mockPasswordService,
        mockTokenService,
        mockUserRepository
      );

      // Assert
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Invalid credentials');

      // Verify password verification was called but tokens were not generated
      expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith(
        'WrongPassword123',
        '$2b$10$hashedpassword'
      );
      expect(mockTokenService.generateAccessToken).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
    });

    it('should use same error message for non-existent user and wrong password', async () => {
      // Arrange
      const event1 = createMockEvent({
        email: 'nonexistent@example.com',
        password: 'SecurePass123',
      });

      const event2 = createMockEvent({
        email: 'test@example.com',
        password: 'WrongPassword123',
      });

      (mockValidationService.validateLoginPayload as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });

      // First call: user not found
      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValueOnce(null);

      // Second call: user found but wrong password
      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValueOnce({
        userId: 'user-123',
        email: 'test@example.com',
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      (mockPasswordService.verifyPassword as jest.Mock).mockResolvedValue(false);

      // Act
      const result1 = await handleLogin(
        event1,
        mockValidationService,
        mockPasswordService,
        mockTokenService,
        mockUserRepository
      );

      const result2 = await handleLogin(
        event2,
        mockValidationService,
        mockPasswordService,
        mockTokenService,
        mockUserRepository
      );

      // Assert - both should return same error message
      expect(result1.statusCode).toBe(401);
      expect(result2.statusCode).toBe(401);

      const body1 = JSON.parse(result1.body);
      const body2 = JSON.parse(result2.body);

      expect(body1.error).toBe('Invalid credentials');
      expect(body2.error).toBe('Invalid credentials');
      expect(body1.error).toBe(body2.error);
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
      const result = await handleLogin(
        event,
        mockValidationService,
        mockPasswordService,
        mockTokenService,
        mockUserRepository
      );

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Invalid JSON in request body');
    });

    it('should return 500 for database errors', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: 'SecurePass123',
      };

      const event = createMockEvent(requestBody);

      (mockValidationService.validateLoginPayload as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });

      (mockUserRepository.getUserByEmail as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const result = await handleLogin(
        event,
        mockValidationService,
        mockPasswordService,
        mockTokenService,
        mockUserRepository
      );

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Internal server error');
    });

    it('should return 500 for password verification errors', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: 'SecurePass123',
      };

      const event = createMockEvent(requestBody);

      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      (mockValidationService.validateLoginPayload as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });

      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (mockPasswordService.verifyPassword as jest.Mock).mockRejectedValue(
        new Error('Verification failed')
      );

      // Act
      const result = await handleLogin(
        event,
        mockValidationService,
        mockPasswordService,
        mockTokenService,
        mockUserRepository
      );

      // Assert
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('Token generation', () => {
    it('should generate both access and refresh tokens on successful login', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: 'SecurePass123',
      };

      const event = createMockEvent(requestBody);

      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      (mockValidationService.validateLoginPayload as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });

      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (mockPasswordService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (mockTokenService.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (mockTokenService.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');

      // Act
      const result = await handleLogin(
        event,
        mockValidationService,
        mockPasswordService,
        mockTokenService,
        mockUserRepository
      );

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.accessToken).toBe('access-token');
      expect(body.refreshToken).toBe('refresh-token');

      // Verify both token generation methods were called
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledTimes(1);
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledTimes(1);
    });

    it('should pass correct parameters to token generation', async () => {
      // Arrange
      const requestBody = {
        email: 'user@example.com',
        password: 'SecurePass123',
      };

      const event = createMockEvent(requestBody);

      const mockUser = {
        userId: 'user-456',
        email: 'user@example.com',
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      (mockValidationService.validateLoginPayload as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });

      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (mockPasswordService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (mockTokenService.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (mockTokenService.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');

      // Act
      await handleLogin(
        event,
        mockValidationService,
        mockPasswordService,
        mockTokenService,
        mockUserRepository
      );

      // Assert
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith('user-456', 'user@example.com');
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith('user-456');
    });
  });
});
