/**
 * Auth Lambda Handler Entry Point
 *
 * Main handler function that routes authentication requests including:
 * - Service initialization (TokenService, PasswordService, UserRepository, ValidationService)
 * - JWT secret retrieval from SSM on cold start
 * - Request routing based on routeKey
 * - Error handling with appropriate status codes
 * - Generic error responses for security
 * - Password secrecy in logs
 *
 * Requirements: 9.1, 9.3, 9.4, 9.5
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { getJWTSecret } from '../shared/utils/ssm';
import { TokenService } from './TokenService';
import { PasswordService } from './PasswordService';
import { UserRepository } from './UserRepository';
import { ValidationService } from './ValidationService';
import { handleRegister } from './handleRegister';
import { handleLogin } from './handleLogin';
import { handleRefresh } from './handleRefresh';
import { handleResetRequest } from './handleResetRequest';
import { handleResetComplete } from './handleResetComplete';

// Service instances cached across Lambda invocations
let tokenService: TokenService | null = null;
let passwordService: PasswordService | null = null;
let userRepository: UserRepository | null = null;
let validationService: ValidationService | null = null;

/**
 * Reset service cache - useful for testing
 */
export function resetServices(): void {
  tokenService = null;
  passwordService = null;
  userRepository = null;
  validationService = null;
}

/**
 * Initialize services on cold start
 * Gets JWT secret from SSM and creates service instances
 */
async function initializeServices(): Promise<void> {
  if (tokenService && passwordService && userRepository && validationService) {
    // Services already initialized
    return;
  }

  // Get JWT secret from SSM Parameter Store
  // Requirements: 3.5
  const jwtSecret = await getJWTSecret(process.env.JWT_SECRET_PARAM || '/savesmart/jwt-secret');

  // Initialize services
  tokenService = new TokenService(jwtSecret);
  passwordService = new PasswordService();
  validationService = new ValidationService();

  const tableName = process.env.TABLE_NAME || 'savesmart-users';
  const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-southeast-2' });
  userRepository = new UserRepository(tableName, dynamoClient);
}

/**
 * Create standardized API Gateway response
 */
const createResponse = (statusCode: number, body: object): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

/**
 * Main Lambda handler function
 * Routes requests based on routeKey and handles errors
 * Requirements: 9.1, 9.3, 9.4, 9.5
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Initialize services on cold start
    await initializeServices();

    // Ensure services are initialized
    if (!tokenService || !passwordService || !userRepository || !validationService) {
      throw new Error('Services not initialized');
    }

    // Route requests based on HTTP method and path
    // Support both API Gateway v1 (httpMethod + path) and v2 (routeKey)
    const routeKey = (event as any).routeKey || `${event.httpMethod} ${event.path}`;

    switch (routeKey) {
      case 'POST /auth/register':
        return await handleRegister(event, validationService, passwordService, tokenService, userRepository);

      case 'POST /auth/login':
        return await handleLogin(event, validationService, passwordService, tokenService, userRepository);

      case 'POST /auth/refresh':
        return await handleRefresh(event, tokenService, userRepository);

      case 'POST /auth/reset-request':
        return await handleResetRequest(event, validationService, passwordService, userRepository);

      case 'POST /auth/reset-complete':
        return await handleResetComplete(event, validationService, passwordService, userRepository);

      default:
        // Handle unknown routes
        return createResponse(404, {
          error: 'Not found',
        });
    }
  } catch (error) {
    // Log error details for monitoring (never log passwords)
    // Requirements: 9.3, 9.5
    console.error('Error in auth handler:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      method: event.httpMethod,
      path: event.path,
      // Never log request body as it may contain passwords
    });

    // Return generic error response for security
    // Requirements: 9.1
    return createResponse(500, {
      error: 'Internal server error',
    });
  }
}
