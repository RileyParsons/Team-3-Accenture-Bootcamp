/**
 * Unit tests for auth Lambda handler entry point
 *
 * Tests:
 * - Route dispatching to correct handlers
 * - Error handling and generic error responses
 * - Service initialization
 * - 404 handling for unknown routes
 *
 * Requirements: 9.1, 9.3, 9.4
 */

import { handler, resetServices } from './index';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { getJWTSecret } from '../shared/utils/ssm';

// Mock all dependencies
jest.mock('../shared/utils/ssm');
jest.mock('./handleRegister');
jest.mock('./handleLogin');
jest.mock('./handleRefresh');
jest.mock('./handleResetRequest');
jest.mock('./handleResetComplete');

const mockGetJWTSecret = getJWTSecret as jest.MockedFunction<typeof getJWTSecret>;

// Import mocked handlers
import { handleRegister } from './handleRegister';
import { handleLogin } from './handleLogin';
import { handleRefresh } from './handleRefresh';
import { handleResetRequest } from './handleResetRequest';
import { handleResetComplete } from './handleResetComplete';

const mockHandleRegister = handleRegister as jest.MockedFunction<typeof handleRegister>;
const mockHandleLogin = handleLogin as jest.MockedFunction<typeof handleLogin>;
const mockHandleRefresh = handleRefresh as jest.MockedFunction<typeof handleRefresh>;
const mockHandleResetRequest = handleResetRequest as jest.MockedFunction<typeof handleResetRequest>;
const mockHandleResetComplete = handleResetComplete as jest.MockedFunction<typeof handleResetComplete>;

describe('Auth Lambda Handler', () => {
  const mockEvent = (routeKey: string, body?: object): APIGatewayProxyEvent => {
    const [method, path] = routeKey.split(' ');
    return {
      body: body ? JSON.stringify(body) : null,
      headers: {},
      multiValueHeaders: {},
      httpMethod: method,
      isBase64Encoded: false,
      path: path,
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
      routeKey,
    } as any;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resetServices(); // Reset service cache before each test
    mockGetJWTSecret.mockResolvedValue('test-secret-key');
  });

  describe('Route Dispatching', () => {
    it('should route POST /auth/register to handleRegister', async () => {
      const event = mockEvent('POST /auth/register', { email: 'test@example.com', password: 'Test123' });
      const expectedResponse = { statusCode: 200, body: JSON.stringify({ userId: '123' }) };
      mockHandleRegister.mockResolvedValue(expectedResponse);

      const result = await handler(event);

      expect(mockHandleRegister).toHaveBeenCalledWith(
        event,
        expect.any(Object), // validationService
        expect.any(Object), // passwordService
        expect.any(Object), // tokenService
        expect.any(Object)  // userRepository
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should route POST /auth/login to handleLogin', async () => {
      const event = mockEvent('POST /auth/login', { email: 'test@example.com', password: 'Test123' });
      const expectedResponse = { statusCode: 200, body: JSON.stringify({ userId: '123' }) };
      mockHandleLogin.mockResolvedValue(expectedResponse);

      const result = await handler(event);

      expect(mockHandleLogin).toHaveBeenCalledWith(
        event,
        expect.any(Object), // validationService
        expect.any(Object), // passwordService
        expect.any(Object), // tokenService
        expect.any(Object)  // userRepository
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should route POST /auth/refresh to handleRefresh', async () => {
      const event = mockEvent('POST /auth/refresh', { refreshToken: 'token' });
      const expectedResponse = { statusCode: 200, body: JSON.stringify({ accessToken: 'new-token' }) };
      mockHandleRefresh.mockResolvedValue(expectedResponse);

      const result = await handler(event);

      expect(mockHandleRefresh).toHaveBeenCalledWith(
        event,
        expect.any(Object), // tokenService
        expect.any(Object)  // userRepository
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should route POST /auth/reset-request to handleResetRequest', async () => {
      const event = mockEvent('POST /auth/reset-request', { email: 'test@example.com' });
      const expectedResponse = { statusCode: 200, body: JSON.stringify({ message: 'Success' }) };
      mockHandleResetRequest.mockResolvedValue(expectedResponse);

      const result = await handler(event);

      expect(mockHandleResetRequest).toHaveBeenCalledWith(
        event,
        expect.any(Object), // validationService
        expect.any(Object), // passwordService
        expect.any(Object)  // userRepository
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should route POST /auth/reset-complete to handleResetComplete', async () => {
      const event = mockEvent('POST /auth/reset-complete', { resetToken: 'token', newPassword: 'NewPass123' });
      const expectedResponse = { statusCode: 200, body: JSON.stringify({ message: 'Success' }) };
      mockHandleResetComplete.mockResolvedValue(expectedResponse);

      const result = await handler(event);

      expect(mockHandleResetComplete).toHaveBeenCalledWith(
        event,
        expect.any(Object), // validationService
        expect.any(Object), // passwordService
        expect.any(Object)  // userRepository
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should return 404 for unknown routes', async () => {
      const event = mockEvent('GET /auth/unknown');

      const result = await handler(event);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({ error: 'Not found' });
    });
  });

  describe('Service Initialization', () => {
    it('should initialize services on cold start', async () => {
      const event = mockEvent('POST /auth/register', { email: 'test@example.com', password: 'Test123' });
      mockHandleRegister.mockResolvedValue({ statusCode: 200, body: '{}' });

      await handler(event);

      expect(mockGetJWTSecret).toHaveBeenCalledWith('/savesmart/jwt-secret');
    });

    it('should use JWT_SECRET_PARAM environment variable if set', async () => {
      process.env.JWT_SECRET_PARAM = '/custom/jwt-secret';
      const event = mockEvent('POST /auth/register', { email: 'test@example.com', password: 'Test123' });
      mockHandleRegister.mockResolvedValue({ statusCode: 200, body: '{}' });

      await handler(event);

      expect(mockGetJWTSecret).toHaveBeenCalledWith('/custom/jwt-secret');
      delete process.env.JWT_SECRET_PARAM;
    });
  });

  describe('Error Handling', () => {
    it('should return 500 with generic error message when SSM fails', async () => {
      mockGetJWTSecret.mockRejectedValue(new Error('SSM error'));
      const event = mockEvent('POST /auth/register', { email: 'test@example.com', password: 'Test123' });

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({ error: 'Internal server error' });
    });

    it('should return 500 with generic error message when handler throws', async () => {
      mockHandleRegister.mockRejectedValue(new Error('Handler error'));
      const event = mockEvent('POST /auth/register', { email: 'test@example.com', password: 'Test123' });

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({ error: 'Internal server error' });
    });

    it('should log error details without exposing them to client', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockHandleRegister.mockRejectedValue(new Error('Detailed error message'));
      const event = mockEvent('POST /auth/register', { email: 'test@example.com', password: 'Test123' });

      const result = await handler(event);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in auth handler:',
        expect.objectContaining({
          error: 'Detailed error message',
          stack: expect.any(String),
          method: 'POST',
          path: '/auth/register',
        })
      );
      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({ error: 'Internal server error' });

      consoleErrorSpy.mockRestore();
    });

    it('should never log request body to prevent password exposure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockHandleRegister.mockRejectedValue(new Error('Error'));
      const event = mockEvent('POST /auth/register', { email: 'test@example.com', password: 'SecretPassword123' });

      await handler(event);

      const loggedData = consoleErrorSpy.mock.calls[0][1];
      expect(JSON.stringify(loggedData)).not.toContain('SecretPassword123');
      expect(JSON.stringify(loggedData)).not.toContain('password');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Response Format', () => {
    it('should include CORS headers in responses', async () => {
      const event = mockEvent('GET /auth/unknown');

      const result = await handler(event);

      expect(result.headers).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      });
    });
  });
});
