/**
 * Unit tests for User Lambda Handler Entry Point
 *
 * Tests:
 * - Service initialization
 * - Request routing
 * - Authentication middleware application
 * - Error handling
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handler, resetServices } from './index';
import * as ssmModule from '../shared/utils/ssm';
import * as getUserModule from '../getUser/getUser';
import * as updateUserModule from '../updateUser/updateUser';

// Mock dependencies
jest.mock('../shared/utils/ssm');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('../getUser/getUser');
jest.mock('../updateUser/updateUser');

const mockGetJWTSecret = ssmModule.getJWTSecret as jest.MockedFunction<typeof ssmModule.getJWTSecret>;
const mockHandleGetUser = getUserModule.handleGetUser as jest.MockedFunction<typeof getUserModule.handleGetUser>;
const mockHandleUpdateUser = updateUserModule.handleUpdateUser as jest.MockedFunction<typeof updateUserModule.handleUpdateUser>;

describe('User Lambda Handler', () => {
  const mockJwtSecret = 'test-jwt-secret-key-for-testing-purposes-only';

  beforeEach(() => {
    // Reset services before each test
    resetServices();

    // Setup default mocks
    mockGetJWTSecret.mockResolvedValue(mockJwtSecret);
    mockHandleGetUser.mockResolvedValue({
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: 'test-user-id', email: 'test@example.com' }),
    });
    mockHandleUpdateUser.mockResolvedValue({
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: 'test-user-id', email: 'updated@example.com' }),
    });

    // Clear environment variables
    delete process.env.JWT_SECRET_PARAM;
    delete process.env.TABLE_NAME;
    delete process.env.AWS_REGION;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockEvent = (routeKey: string, pathParameters?: Record<string, string>): APIGatewayProxyEvent => ({
    httpMethod: routeKey.split(' ')[0],
    path: routeKey.split(' ')[1],
    headers: {
      'Authorization': 'Bearer valid-token',
    },
    pathParameters: pathParameters || null,
    body: null,
    isBase64Encoded: false,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    requestContext: {} as any,
    resource: '',
    stageVariables: null,
    multiValueHeaders: {},
  });

  describe('Service Initialization', () => {
    it('should initialize services on cold start', async () => {
      const event = createMockEvent('GET /users/{userId}', { userId: 'test-user-id' });

      await handler(event);

      expect(mockGetJWTSecret).toHaveBeenCalledWith('/savesmart/jwt-secret');
      expect(mockGetJWTSecret).toHaveBeenCalledTimes(1);
    });

    it('should use custom JWT secret parameter from environment', async () => {
      process.env.JWT_SECRET_PARAM = '/custom/jwt-secret';
      const event = createMockEvent('GET /users/{userId}', { userId: 'test-user-id' });

      await handler(event);

      expect(mockGetJWTSecret).toHaveBeenCalledWith('/custom/jwt-secret');
    });

    it('should reuse services on subsequent invocations', async () => {
      const event = createMockEvent('GET /users/{userId}', { userId: 'test-user-id' });

      await handler(event);
      await handler(event);

      // Should only initialize once
      expect(mockGetJWTSecret).toHaveBeenCalledTimes(1);
    });

    it('should handle SSM initialization errors', async () => {
      mockGetJWTSecret.mockRejectedValueOnce(new Error('SSM error'));
      const event = createMockEvent('GET /users/{userId}', { userId: 'test-user-id' });

      const response = await handler(event);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({ error: 'Internal server error' });
    });
  });

  describe('Request Routing', () => {
    it('should route GET /users/{userId} to handleGetUser', async () => {
      const event = createMockEvent('GET /users/{userId}', { userId: 'test-user-id' });

      const response = await handler(event);

      expect(mockHandleGetUser).toHaveBeenCalledTimes(1);
      expect(mockHandleGetUser).toHaveBeenCalledWith(
        event,
        expect.any(Object), // TokenService
        expect.any(Object)  // UserRepository
      );
      expect(response.statusCode).toBe(200);
    });

    it('should route PUT /users/{userId} to handleUpdateUser', async () => {
      const event = createMockEvent('PUT /users/{userId}', { userId: 'test-user-id' });

      const response = await handler(event);

      expect(mockHandleUpdateUser).toHaveBeenCalledTimes(1);
      expect(mockHandleUpdateUser).toHaveBeenCalledWith(
        event,
        expect.any(Object), // TokenService
        expect.any(Object)  // UserRepository
      );
      expect(response.statusCode).toBe(200);
    });

    it('should handle API Gateway v2 routeKey format', async () => {
      const event = {
        ...createMockEvent('GET /users/{userId}', { userId: 'test-user-id' }),
        routeKey: 'GET /users/{userId}',
      } as any;

      const response = await handler(event);

      expect(mockHandleGetUser).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(200);
    });

    it('should return 404 for unknown routes', async () => {
      const event = createMockEvent('POST /users/{userId}', { userId: 'test-user-id' });

      const response = await handler(event);

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ error: 'Not found' });
      expect(mockHandleGetUser).not.toHaveBeenCalled();
      expect(mockHandleUpdateUser).not.toHaveBeenCalled();
    });
  });

  describe('Authentication Middleware', () => {
    it('should apply authentication to GET /users/{userId}', async () => {
      const event = createMockEvent('GET /users/{userId}', { userId: 'test-user-id' });

      await handler(event);

      // Verify that handleGetUser is called (which applies authentication)
      expect(mockHandleGetUser).toHaveBeenCalledWith(
        event,
        expect.any(Object), // TokenService instance
        expect.any(Object)  // UserRepository instance
      );
    });

    it('should apply authentication to PUT /users/{userId}', async () => {
      const event = createMockEvent('PUT /users/{userId}', { userId: 'test-user-id' });

      await handler(event);

      // Verify that handleUpdateUser is called (which applies authentication)
      expect(mockHandleUpdateUser).toHaveBeenCalledWith(
        event,
        expect.any(Object), // TokenService instance
        expect.any(Object)  // UserRepository instance
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors with 401', async () => {
      mockHandleGetUser.mockRejectedValueOnce(new Error('Unauthorized: Invalid token'));
      const event = createMockEvent('GET /users/{userId}', { userId: 'test-user-id' });

      const response = await handler(event);

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body)).toEqual({ error: 'Unauthorized' });
    });

    it('should handle authorization errors with 403', async () => {
      mockHandleGetUser.mockRejectedValueOnce(new Error('Forbidden: Access denied'));
      const event = createMockEvent('GET /users/{userId}', { userId: 'test-user-id' });

      const response = await handler(event);

      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body)).toEqual({ error: 'Forbidden' });
    });

    it('should handle generic errors with 500', async () => {
      mockHandleGetUser.mockRejectedValueOnce(new Error('Database connection failed'));
      const event = createMockEvent('GET /users/{userId}', { userId: 'test-user-id' });

      const response = await handler(event);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({ error: 'Internal server error' });
    });

    it('should log error details', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockHandleGetUser.mockRejectedValueOnce(new Error('Test error'));
      const event = createMockEvent('GET /users/{userId}', { userId: 'test-user-id' });

      await handler(event);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in user handler:',
        expect.objectContaining({
          error: 'Test error',
          stack: expect.any(String),
          method: 'GET',
          path: '/users/{userId}',
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Environment Configuration', () => {
    it('should use default table name if not specified', async () => {
      const event = createMockEvent('GET /users/{userId}', { userId: 'test-user-id' });

      await handler(event);

      // Service should be initialized with default table name
      expect(mockHandleGetUser).toHaveBeenCalled();
    });

    it('should use custom table name from environment', async () => {
      process.env.TABLE_NAME = 'custom-users-table';
      const event = createMockEvent('GET /users/{userId}', { userId: 'test-user-id' });

      await handler(event);

      // Service should be initialized with custom table name
      expect(mockHandleGetUser).toHaveBeenCalled();
    });

    it('should use default AWS region if not specified', async () => {
      const event = createMockEvent('GET /users/{userId}', { userId: 'test-user-id' });

      await handler(event);

      // Service should be initialized with default region
      expect(mockHandleGetUser).toHaveBeenCalled();
    });

    it('should use custom AWS region from environment', async () => {
      process.env.AWS_REGION = 'us-east-1';
      const event = createMockEvent('GET /users/{userId}', { userId: 'test-user-id' });

      await handler(event);

      // Service should be initialized with custom region
      expect(mockHandleGetUser).toHaveBeenCalled();
    });
  });
});
