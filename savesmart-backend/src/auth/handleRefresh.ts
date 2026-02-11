/**
 * handleRefresh
 *
 * Handles token refresh requests including:
 * - Request payload validation
 * - Refresh token validation
 * - Token type verification
 * - New token generation
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TokenService } from './TokenService';
import { UserRepository } from './UserRepository';

interface RefreshRequest {
  refreshToken: string;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

const createResponse = (statusCode: number, body: object): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

/**
 * Handles token refresh
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export async function handleRefresh(
  event: APIGatewayProxyEvent,
  tokenService: TokenService,
  userRepository: UserRepository
): Promise<APIGatewayProxyResult> {
  try {
    // Parse request body
    if (!event.body) {
      return createResponse(400, {
        error: 'Request body is required',
      });
    }

    const body: RefreshRequest = JSON.parse(event.body);

    // Validate request payload (refreshToken)
    if (!body.refreshToken || typeof body.refreshToken !== 'string') {
      return createResponse(400, {
        error: 'Validation failed',
        details: ['refreshToken is required and must be a string'],
      });
    }

    // Validate refresh token using TokenService
    // Requirements: 5.1
    let decoded;
    try {
      decoded = tokenService.validateToken(body.refreshToken);
    } catch (error) {
      // Requirements: 5.4 - Return authentication error for invalid/expired tokens
      return createResponse(401, {
        error: 'Invalid or expired token',
      });
    }

    // Check token type is "refresh"
    // Requirements: 5.1
    if (decoded.type !== 'refresh') {
      return createResponse(401, {
        error: 'Invalid or expired token',
      });
    }

    // Extract userId from token
    if (!decoded.userId || typeof decoded.userId !== 'string') {
      return createResponse(401, {
        error: 'Invalid or expired token',
      });
    }

    const userId = decoded.userId;

    // Get user to retrieve email for access token
    const user = await userRepository.getUserById(userId);
    if (!user) {
      return createResponse(401, {
        error: 'Invalid or expired token',
      });
    }

    // Generate new access and refresh tokens
    // Requirements: 5.2, 5.3
    const accessToken = tokenService.generateAccessToken(userId, user.email);
    const refreshToken = tokenService.generateRefreshToken(userId);

    // Return response with new tokens
    // Requirements: 5.5
    const response: RefreshResponse = {
      accessToken,
      refreshToken,
    };

    return createResponse(200, response);
  } catch (error) {
    console.error('Error in handleRefresh:', error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return createResponse(400, {
        error: 'Invalid JSON in request body',
      });
    }

    // Generic error response for security
    return createResponse(500, {
      error: 'Internal server error',
    });
  }
}
