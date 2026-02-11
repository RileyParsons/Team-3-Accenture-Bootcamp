/**
 * Unit tests for handleRegister function
 *
 * Tests cover:
 * - Successful registration flow
 * - Validation errors
 * - Duplicate email handling
 * - Error handling
 *
 * Requirements: 1.1, 1.2, 1.3, 1.6
 */

import { handleRegister } from './handleRegister';
import { ValidationService } from './ValidationService';
import { PasswordService } from './PasswordService';
import { TokenService } from './TokenService';
import { UserRepository } from './UserRepository';
import type { APIGatewayProxyEvent } from 'aws-lambda';

// Mock services
const mockValidationService = {
  validateRegistrationPayload: jest.fn(),
} as unknown as ValidationService;

const mockPasswordService = {
  hashPassword: jest.fn(),
} as unknown as PasswordService;

const mockTokenService = {
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
} as unknown as TokenService;

const mockUserRepository = {
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
} as unknown as UserRepository;

// Helper to create mock API Gateway event
const createMockEvent = (body: any): APIGatewayProxyEvent => ({
  body: JSON.stringify(body),
  headers: {},
  multiValueHeaders: {},
  httpMethod: 'POST',
  isBase64Encoded: false,
  path: '/auth/register',
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {} as any,
  resource: '',
});

describe('handleRegister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful registration', () => {
    it('should register a new user and return tokens', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: 'SecurePass123',
      };

      const event = createMockEvent(requestBody);

      (mockValidationService.validateRegistrationPayload as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });

      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue(null);
      (mockPasswordService.hashPassword as jest.Mock).mockResolvedValue('$2b$10$hashedpassword');
      (mockTokenService.generateAccessToken as jest.Mock).mockReturnValue('access-token-123');
      (mockTokenService.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token-456');
      (mockUserRepository.createUser as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await handleRegister(
        event,
        mockValidationService,
        mockPasswordService,
        mockTokenService,
        mockUserRepository
      );

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('userId');
      expect(body.email).toBe('test@example.com');
      expect(body.accessToken).toBe('access-token-123');
      expect(body.refreshToken).toBe('refresh-token-456');

      // Verify service calls
      expect(mockValidationService.validateRegistrationPayload).toHaveBeenCalledWith(requestBody);
      expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith('SecurePass123');
      expect(mockUserRepository.createUser).toHaveBeenCalled();
      expect(mockTokenService.generateAccessToken).toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalled();
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
      const result = await handleRegister(
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

      (mockValidationService.validateRegistrationPayload as jest.Mock).mockReturnValue({
        valid: false,
        errors: ['Invalid email format'],
      });

      // Act
      const result = await handleRegister(
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

    it('should return 400 when password is weak', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: 'weak',
      };

      const event = createMockEvent(requestBody);

      (mockValidationService.validateRegistrationPayload as jest.Mock).mockReturnValue({
        valid: false,
        errors: [
          'Password must be at least 8 characters',
          'Password must contain at least 1 uppercase letter',
          'Password must contain at least 1 number',
        ],
      });

      // Act
      const result = await handleRegister(
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
      expect(body.details).toHaveLength(3);
    });

    it('should return 400 when email is missing', async () => {
      // Arrange
      const requestBody = {
        password: 'SecurePass123',
      };

      const event = createMockEvent(requestBody);

      (mockValidationService.validateRegistrationPayload as jest.Mock).mockReturnValue({
        valid: false,
        errors: ['Email is required'],
      });

      // Act
      const result = await handleRegister(
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

      (mockValidationService.validateRegistrationPayload as jest.Mock).mockReturnValue({
        valid: false,
        errors: ['Password is required'],
      });

      // Act
      const result = await handleRegister(
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

  describe('Duplicate email handling', () => {
    it('should return 409 when email already exists', async () => {
      // Arrange
      const requestBody = {
        email: 'existing@example.com',
        password: 'SecurePass123',
      };

      const event = createMockEvent(requestBody);

      (mockValidationService.validateRegistrationPayload as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });

      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue({
        userId: 'existing-user-id',
        email: 'existing@example.com',
        hashedPassword: '$2b$10$existinghash',
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      // Act
      const result = await handleRegister(
        event,
        mockValidationService,
        mockPasswordService,
        mockTokenService,
        mockUserRepository
      );

      // Assert
      expect(result.statusCode).toBe(409);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Email already registered');

      // Verify password hashing and user creation were not called
      expect(mockPasswordService.hashPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
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
      const result = await handleRegister(
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

      (mockValidationService.validateRegistrationPayload as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });

      (mockUserRepository.getUserByEmail as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const result = await handleRegister(
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

    it('should return 500 for password hashing errors', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: 'SecurePass123',
      };

      const event = createMockEvent(requestBody);

      (mockValidationService.validateRegistrationPayload as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });

      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue(null);
      (mockPasswordService.hashPassword as jest.Mock).mockRejectedValue(
        new Error('Hashing failed')
      );

      // Act
      const result = await handleRegister(
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
    it('should generate both access and refresh tokens', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: 'SecurePass123',
      };

      const event = createMockEvent(requestBody);

      (mockValidationService.validateRegistrationPayload as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });

      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue(null);
      (mockPasswordService.hashPassword as jest.Mock).mockResolvedValue('$2b$10$hashedpassword');
      (mockTokenService.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (mockTokenService.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      (mockUserRepository.createUser as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await handleRegister(
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
  });
});
