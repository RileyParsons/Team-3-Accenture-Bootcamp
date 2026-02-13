/**
 * User Lambda Handler Entry Point
 *
 * Main handler function that routes user management requests with authentication:
 * - Service initialization (TokenService, UserRepository)
 * - JWT secret retrieval from SSM on cold start
 * - Authentication middleware for protected routes
 * - Request routing based on routeKey
 * - Error handling for authentication and authorization
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { getJWTSecret } from '../shared/utils/ssm';
import { TokenService } from '../auth/TokenService';
import { UserRepository } from '../auth/UserRepository';
import { handleGetUser } from '../getUser/getUser';
import { handleUpdateUser } from '../updateUser/updateUser';

// Service instances cached across Lambda invocations
let tokenService: TokenService | null = null;
let userRepository: UserRepository | null = null;

/**
 * Reset service cache - useful for testing
 */
export function resetServices(): void {
  tokenService = null;
  userRepository = null;
}

/**
 * Initialize services on cold start
 * Gets JWT secret from SSM and creates service instances
 * Requirements: 8.1, 8.2
 */
async function initializeServices(): Promise<void> {
  if (tokenService && userRepository) {
    // Services already initialized
    return;
  }

  // Get JWT secret from SSM Parameter Store
  const jwtSecret = await getJWTSecret(process.env.JWT_SECRET_PARAM || '/savesmart/jwt-secret');

  // Initialize services
  tokenService = new TokenService(jwtSecret);

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
 * Routes requests based on routeKey and handles authentication
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Initialize services on cold start
    await initializeServices();

    // Ensure services are initialized
    if (!tokenService || !userRepository) {
      throw new Error('Services not initialized');
    }

    // Route requests based on HTTP method and path
    // Support both API Gateway v1 (httpMethod + path) and v2 (routeKey)
    const routeKey = (event as any).routeKey || `${event.httpMethod} ${event.path}`;

    // Apply authentication middleware to protected routes
    // Requirements: 8.1, 8.2, 8.3
    switch (routeKey) {
      case 'GET /users/{userId}':
        // Protected endpoint - requires authentication
        // Requirements: 8.1, 8.2, 8.3, 8.4
        return await handleGetUser(event, tokenService, userRepository);

      case 'PUT /users/{userId}':
        // Protected endpoint - requires authentication
        // Requirements: 8.1, 8.2, 8.3, 8.4
        return await handleUpdateUser(event, tokenService, userRepository);

      default:
        // Handle unknown routes
        return createResponse(404, {
          error: 'Not found',
        });
    }
  } catch (error) {
    // Log error details for monitoring
    console.error('Error in user handler:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      method: event.httpMethod,
      path: event.path,
    });

    // Handle authentication and authorization errors
    // Requirements: 8.3
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('token')) {
        return createResponse(401, {
          error: 'Unauthorized',
        });
      }
      if (error.message.includes('Forbidden')) {
        return createResponse(403, {
          error: 'Forbidden',
        });
      }
    }

    // Return generic error response
    return createResponse(500, {
      error: 'Internal server error',
    });
  }
}
