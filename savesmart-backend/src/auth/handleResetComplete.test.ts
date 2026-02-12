/**
 * Unit tests for handleResetComplete
 *
 * Tests password reset completion functionality including:
 * - Request validation
 * - Token verification
 * - Password update
 * - Token cleanup
 */

import { handleResetComplete } from './handleResetComplete';
import { ValidationService } from './ValidationService';
import { PasswordService } from './PasswordService';
import { UserRepository } from './UserRepository';
import type { APIGatewayProxyEvent } from 'aws-lambda';

// Mock services
const mockValidationService = {
  validateEmail: jest.fn(),
  validatePassword: jest.fn(),
  validateRegistrationPayload: jest.fn(),
  validateLoginPayload: jest.fn(),
} as unknown as ValidationService;

const mockPasswordService = {
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  validatePasswordRequirements: jest.fn(),
} as unknown as PasswordService;

const mockUserRepository = {
  createUser: jest.fn(),
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
  updatePassword: jest.fn(),
  setResetToken: jest.fn(),
  clearResetToken: jest.fn(),
  getAllUsers: jest.fn(),
} as unknown as UserRepository;

// Helper to create mock API Gateway event
const createMockEvent = (body: object | null): APIGatewayProxyEvent => ({
  body: body ? JSON.stringify(body) : null,
  headers: {},
  multiValueHeaders: {},
  httpMethod: 'POST',
  isBase64Encoded: false,
  path: '/auth/reset-complete',
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {} as any,
  resource: '',
});

describe('handleResetComplete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Request validation', () => {
    it('should return 400 when body is missing', async () => {
      const event = createMockEvent(null);

      const response = await handleResetComplete(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Request body is required');
    });

    it('should return 400 when resetToken is missing', async () => {
      const event = createMockEvent({ newPassword: 'NewPass123' });

      const response = await handleResetComplete(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation failed');
      expect(body.details).toContain('resetToken is required and must be a string');
    });

    it('should return 400 when newPassword is missing', async () => {
      const event = createMockEvent({ resetToken: 'token-123' });

      const response = await handleResetComplete(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation failed');
      expect(body.details).toContain('newPassword is required and must be a string');
    });

    it('should return 400 when newPassword does not meet requirements', async () => {
      const event = createMockEvent({
        resetToken: 'token-123',
        newPassword: 'weak',
      });

      (mockValidationService.validatePassword as jest.Mock).mockReturnValue({
        valid: false,
        errors: ['Password must be at least 8 characters'],
      });

      const response = await handleResetComplete(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation failed');
      expect(body.details).toContain('Password must be at least 8 characters');
    });

    it('should return 400 for invalid JSON', async () => {
      const event = {
        ...createMockEvent(null),
        body: 'invalid json',
      };

      const response = await handleResetComplete(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid JSON in request body');
    });
  });

  describe('Token verification', () => {
    it('should return 401 when no user has matching reset token', async () => {
      const event = createMockEvent({
        resetToken: 'invalid-token',
        newPassword: 'NewPass123',
      });

      (mockValidationService.validatePassword as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });
      (mockUserRepository.getAllUsers as jest.Mock).mockResolvedValue([
        {
          userId: 'user-1',
          email: 'user1@example.com',
          hashedPassword: '$2b$10$hash',
          createdAt: '2024-01-01T00:00:00.000Z',
          resetToken: '$2b$10$differenttoken',
          resetTokenExpiry: new Date(Date.now() + 3600000).toISOString(),
        },
      ]);
      (mockPasswordService.verifyPassword as jest.Mock).mockResolvedValue(false);

      const response = await handleResetComplete(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid or expired reset token');
    });

    it('should return 401 when reset token is expired', async () => {
      const resetToken = 'valid-token';
      const event = createMockEvent({
        resetToken,
        newPassword: 'NewPass123',
      });

      (mockValidationService.validatePassword as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });
      (mockUserRepository.getAllUsers as jest.Mock).mockResolvedValue([
        {
          userId: 'user-1',
          email: 'user1@example.com',
          hashedPassword: '$2b$10$hash',
          createdAt: '2024-01-01T00:00:00.000Z',
          resetToken: '$2b$10$tokenHash',
          resetTokenExpiry: new Date(Date.now() - 1000).toISOString(), // Expired
        },
      ]);
      (mockPasswordService.verifyPassword as jest.Mock).mockResolvedValue(true);

      const response = await handleResetComplete(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid or expired reset token');
    });

    it('should return 401 when resetTokenExpiry is missing', async () => {
      const resetToken = 'valid-token';
      const event = createMockEvent({
        resetToken,
        newPassword: 'NewPass123',
      });

      (mockValidationService.validatePassword as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });
      (mockUserRepository.getAllUsers as jest.Mock).mockResolvedValue([
        {
          userId: 'user-1',
          email: 'user1@example.com',
          hashedPassword: '$2b$10$hash',
          createdAt: '2024-01-01T00:00:00.000Z',
          resetToken: '$2b$10$tokenHash',
          // resetTokenExpiry is missing
        },
      ]);
      (mockPasswordService.verifyPassword as jest.Mock).mockResolvedValue(true);

      const response = await handleResetComplete(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid or expired reset token');
    });
  });

  describe('Password reset flow', () => {
    it('should successfully reset password with valid token', async () => {
      const resetToken = 'valid-token';
      const newPassword = 'NewPass123';
      const userId = 'user-1';
      const hashedNewPassword = '$2b$10$newHash';

      const event = createMockEvent({
        resetToken,
        newPassword,
      });

      (mockValidationService.validatePassword as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });
      (mockUserRepository.getAllUsers as jest.Mock).mockResolvedValue([
        {
          userId,
          email: 'user@example.com',
          hashedPassword: '$2b$10$oldHash',
          createdAt: '2024-01-01T00:00:00.000Z',
          resetToken: '$2b$10$tokenHash',
          resetTokenExpiry: new Date(Date.now() + 3600000).toISOString(),
        },
      ]);
      (mockPasswordService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (mockPasswordService.hashPassword as jest.Mock).mockResolvedValue(hashedNewPassword);

      const response = await handleResetComplete(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Password reset successful');

      // Verify password was hashed
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(newPassword);

      // Verify password was updated
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(userId, hashedNewPassword);

      // Verify reset token was cleared
      expect(mockUserRepository.clearResetToken).toHaveBeenCalledWith(userId);
    });

    it('should find matching user among multiple users', async () => {
      const resetToken = 'valid-token';
      const newPassword = 'NewPass123';
      const userId = 'user-2';

      const event = createMockEvent({
        resetToken,
        newPassword,
      });

      (mockValidationService.validatePassword as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });
      (mockUserRepository.getAllUsers as jest.Mock).mockResolvedValue([
        {
          userId: 'user-1',
          email: 'user1@example.com',
          hashedPassword: '$2b$10$hash1',
          createdAt: '2024-01-01T00:00:00.000Z',
          resetToken: '$2b$10$token1',
          resetTokenExpiry: new Date(Date.now() + 3600000).toISOString(),
        },
        {
          userId,
          email: 'user2@example.com',
          hashedPassword: '$2b$10$hash2',
          createdAt: '2024-01-01T00:00:00.000Z',
          resetToken: '$2b$10$token2',
          resetTokenExpiry: new Date(Date.now() + 3600000).toISOString(),
        },
      ]);
      (mockPasswordService.verifyPassword as jest.Mock)
        .mockResolvedValueOnce(false) // First user doesn't match
        .mockResolvedValueOnce(true); // Second user matches
      (mockPasswordService.hashPassword as jest.Mock).mockResolvedValue('$2b$10$newHash');

      const response = await handleResetComplete(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(200);
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(userId, '$2b$10$newHash');
      expect(mockUserRepository.clearResetToken).toHaveBeenCalledWith(userId);
    });

    it('should skip users without reset tokens', async () => {
      const resetToken = 'valid-token';
      const newPassword = 'NewPass123';
      const userId = 'user-2';

      const event = createMockEvent({
        resetToken,
        newPassword,
      });

      (mockValidationService.validatePassword as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });
      (mockUserRepository.getAllUsers as jest.Mock).mockResolvedValue([
        {
          userId: 'user-1',
          email: 'user1@example.com',
          hashedPassword: '$2b$10$hash1',
          createdAt: '2024-01-01T00:00:00.000Z',
          // No reset token
        },
        {
          userId,
          email: 'user2@example.com',
          hashedPassword: '$2b$10$hash2',
          createdAt: '2024-01-01T00:00:00.000Z',
          resetToken: '$2b$10$token2',
          resetTokenExpiry: new Date(Date.now() + 3600000).toISOString(),
        },
      ]);
      (mockPasswordService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (mockPasswordService.hashPassword as jest.Mock).mockResolvedValue('$2b$10$newHash');

      const response = await handleResetComplete(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(200);
      // Verify password was only called once (for user-2)
      expect(mockPasswordService.verifyPassword).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('should return 500 for database errors', async () => {
      const event = createMockEvent({
        resetToken: 'token-123',
        newPassword: 'NewPass123',
      });

      (mockValidationService.validatePassword as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });
      (mockUserRepository.getAllUsers as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await handleResetComplete(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal server error');
    });

    it('should return 500 for password hashing errors', async () => {
      const event = createMockEvent({
        resetToken: 'token-123',
        newPassword: 'NewPass123',
      });

      (mockValidationService.validatePassword as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });
      (mockUserRepository.getAllUsers as jest.Mock).mockResolvedValue([
        {
          userId: 'user-1',
          email: 'user@example.com',
          hashedPassword: '$2b$10$hash',
          createdAt: '2024-01-01T00:00:00.000Z',
          resetToken: '$2b$10$tokenHash',
          resetTokenExpiry: new Date(Date.now() + 3600000).toISOString(),
        },
      ]);
      (mockPasswordService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (mockPasswordService.hashPassword as jest.Mock).mockRejectedValue(
        new Error('Hashing error')
      );

      const response = await handleResetComplete(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('Response format', () => {
    it('should include CORS headers', async () => {
      const event = createMockEvent({
        resetToken: 'token-123',
        newPassword: 'NewPass123',
      });

      (mockValidationService.validatePassword as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });
      (mockUserRepository.getAllUsers as jest.Mock).mockResolvedValue([
        {
          userId: 'user-1',
          email: 'user@example.com',
          hashedPassword: '$2b$10$hash',
          createdAt: '2024-01-01T00:00:00.000Z',
          resetToken: '$2b$10$tokenHash',
          resetTokenExpiry: new Date(Date.now() + 3600000).toISOString(),
        },
      ]);
      (mockPasswordService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (mockPasswordService.hashPassword as jest.Mock).mockResolvedValue('$2b$10$newHash');

      const response = await handleResetComplete(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.headers).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      });
    });

    it('should return valid JSON', async () => {
      const event = createMockEvent({
        resetToken: 'token-123',
        newPassword: 'NewPass123',
      });

      (mockValidationService.validatePassword as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });
      (mockUserRepository.getAllUsers as jest.Mock).mockResolvedValue([]);

      const response = await handleResetComplete(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(() => JSON.parse(response.body)).not.toThrow();
    });
  });
});
