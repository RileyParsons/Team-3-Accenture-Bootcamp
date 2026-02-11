/**
 * Unit tests for handleResetRequest
 *
 * Tests password reset request functionality including:
 * - Request validation
 * - Token generation and storage
 * - Security behavior (always return success)
 */

import { handleResetRequest } from './handleResetRequest';
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
} as unknown as UserRepository;

// Helper to create mock API Gateway event
const createMockEvent = (body: object | null): APIGatewayProxyEvent => ({
  body: body ? JSON.stringify(body) : null,
  headers: {},
  multiValueHeaders: {},
  httpMethod: 'POST',
  isBase64Encoded: false,
  path: '/auth/reset-request',
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {} as any,
  resource: '',
});

describe('handleResetRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Request validation', () => {
    it('should return 400 when body is missing', async () => {
      const event = createMockEvent(null);

      const response = await handleResetRequest(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Request body is required');
    });

    it('should return 400 when email is missing', async () => {
      const event = createMockEvent({});

      const response = await handleResetRequest(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation failed');
      expect(body.details).toContain('email is required and must be a string');
    });

    it('should return 400 when email format is invalid', async () => {
      const event = createMockEvent({ email: 'invalid-email' });
      (mockValidationService.validateEmail as jest.Mock).mockReturnValue(false);

      const response = await handleResetRequest(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation failed');
      expect(body.details).toContain('Invalid email format');
    });

    it('should return 400 for invalid JSON', async () => {
      const event = {
        ...createMockEvent(null),
        body: 'invalid json',
      };

      const response = await handleResetRequest(
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

  describe('Token generation and storage', () => {
    it('should generate reset token and store hash for existing user', async () => {
      const email = 'user@example.com';
      const userId = 'user-123';
      const tokenHash = '$2b$10$hashedtoken';

      const event = createMockEvent({ email });

      (mockValidationService.validateEmail as jest.Mock).mockReturnValue(true);
      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue({
        userId,
        email,
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      (mockPasswordService.hashPassword as jest.Mock).mockResolvedValue(tokenHash);

      const response = await handleResetRequest(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('If the email exists, a reset token has been generated');
      expect(body.resetToken).toBeDefined();
      expect(typeof body.resetToken).toBe('string');

      // Verify token was hashed
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(body.resetToken);

      // Verify token was stored with expiration
      expect(mockUserRepository.setResetToken).toHaveBeenCalledWith(
        userId,
        tokenHash,
        expect.any(String)
      );

      // Verify expiration is approximately 1 hour from now
      const expiryCall = (mockUserRepository.setResetToken as jest.Mock).mock.calls[0][2];
      const expiryTime = new Date(expiryCall).getTime();
      const expectedExpiry = Date.now() + 60 * 60 * 1000;
      expect(Math.abs(expiryTime - expectedExpiry)).toBeLessThan(1000); // Within 1 second
    });

    it('should return success with token for non-existent email (security)', async () => {
      const email = 'nonexistent@example.com';
      const event = createMockEvent({ email });

      (mockValidationService.validateEmail as jest.Mock).mockReturnValue(true);
      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue(null);

      const response = await handleResetRequest(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('If the email exists, a reset token has been generated');
      expect(body.resetToken).toBeDefined();

      // Verify no token was stored
      expect(mockUserRepository.setResetToken).not.toHaveBeenCalled();
    });

    it('should generate unique tokens for each request', async () => {
      const email = 'user@example.com';
      const event = createMockEvent({ email });

      (mockValidationService.validateEmail as jest.Mock).mockReturnValue(true);
      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue({
        userId: 'user-123',
        email,
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      (mockPasswordService.hashPassword as jest.Mock).mockResolvedValue('$2b$10$hash');

      const response1 = await handleResetRequest(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );
      const response2 = await handleResetRequest(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      const body1 = JSON.parse(response1.body);
      const body2 = JSON.parse(response2.body);

      expect(body1.resetToken).not.toBe(body2.resetToken);
    });
  });

  describe('Error handling', () => {
    it('should return 500 for database errors', async () => {
      const email = 'user@example.com';
      const event = createMockEvent({ email });

      (mockValidationService.validateEmail as jest.Mock).mockReturnValue(true);
      (mockUserRepository.getUserByEmail as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await handleResetRequest(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal server error');
    });

    it('should return 500 for hashing errors', async () => {
      const email = 'user@example.com';
      const event = createMockEvent({ email });

      (mockValidationService.validateEmail as jest.Mock).mockReturnValue(true);
      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue({
        userId: 'user-123',
        email,
        hashedPassword: '$2b$10$hashedpassword',
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      (mockPasswordService.hashPassword as jest.Mock).mockRejectedValue(
        new Error('Hashing error')
      );

      const response = await handleResetRequest(
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
      const email = 'user@example.com';
      const event = createMockEvent({ email });

      (mockValidationService.validateEmail as jest.Mock).mockReturnValue(true);
      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue(null);

      const response = await handleResetRequest(
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
      const email = 'user@example.com';
      const event = createMockEvent({ email });

      (mockValidationService.validateEmail as jest.Mock).mockReturnValue(true);
      (mockUserRepository.getUserByEmail as jest.Mock).mockResolvedValue(null);

      const response = await handleResetRequest(
        event,
        mockValidationService,
        mockPasswordService,
        mockUserRepository
      );

      expect(() => JSON.parse(response.body)).not.toThrow();
    });
  });
});
