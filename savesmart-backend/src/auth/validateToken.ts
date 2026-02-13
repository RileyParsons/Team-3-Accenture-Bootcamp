/**
 * validateToken middleware
 *
 * Middleware function for validating JWT access tokens on protected endpoints.
 * Extracts token from Authorization header, validates it, and attaches userId to event context.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.3
 */

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { TokenService } from './TokenService';

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  userId?: string;
}

export interface ValidationResult {
  success: boolean;
  userId?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Extracts Bearer token from Authorization header
 * @param headers - Request headers
 * @returns Token string or null if not found
 */
function extractTokenFromHeader(headers: { [key: string]: string | undefined }): string | null {
  // Handle case-insensitive header lookup
  const authHeader = headers.Authorization || headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Check for Bearer token format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Validates JWT access token from request
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.3
 *
 * @param event - API Gateway event
 * @param tokenService - TokenService instance for validation
 * @returns ValidationResult with success status and userId or error details
 */
export function validateToken(
  event: APIGatewayProxyEvent,
  tokenService: TokenService
): ValidationResult {
  try {
    // Extract token from Authorization header (Bearer token)
    const token = extractTokenFromHeader(event.headers);

    // Return 401 if no token provided
    // Requirements: 8.3
    if (!token) {
      return {
        success: false,
        error: 'No token provided',
        statusCode: 401,
      };
    }

    // Validate token using TokenService
    // Requirements: 4.1
    let decoded;
    try {
      decoded = tokenService.validateToken(token);
    } catch (error) {
      // Return 401 if token invalid or expired
      // Requirements: 4.2, 4.3
      return {
        success: false,
        error: 'Invalid or expired token',
        statusCode: 401,
      };
    }

    // Check token type is "access"
    // Requirements: 4.5
    if (decoded.type !== 'access') {
      return {
        success: false,
        error: 'Invalid or expired token',
        statusCode: 401,
      };
    }

    // Extract userId from token
    // Requirements: 4.4
    if (!decoded.userId || typeof decoded.userId !== 'string') {
      return {
        success: false,
        error: 'Invalid or expired token',
        statusCode: 401,
      };
    }

    // Return success with userId for downstream use
    return {
      success: true,
      userId: decoded.userId,
    };
  } catch (error) {
    console.error('Error in validateToken:', error);
    return {
      success: false,
      error: 'Invalid or expired token',
      statusCode: 401,
    };
  }
}
