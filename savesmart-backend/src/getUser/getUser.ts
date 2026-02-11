/**
 * getUser handler
 *
 * Handles user retrieval requests with authentication:
 * - Validates access token
 * - Ensures user can only access their own data
 * - Returns user data excluding sensitive fields
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { validateToken } from '../auth/validateToken';
import { TokenService } from '../auth/TokenService';
import { UserRepository } from '../auth/UserRepository';

interface ErrorResponse {
  error: string;
  code?: string;
  statusCode?: number;
}

const createResponse = (statusCode: number, body: object): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
});

const createErrorResponse = (statusCode: number, error: string, code?: string): APIGatewayProxyResult => {
  const errorBody: ErrorResponse = { error };
  if (code) {
    errorBody.code = code;
    errorBody.statusCode = statusCode;
  }
  return createResponse(statusCode, errorBody);
};

/**
 * Handles GET /users/{userId} with authentication
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export async function handleGetUser(
  event: APIGatewayProxyEvent,
  tokenService: TokenService,
  userRepository: UserRepository
): Promise<APIGatewayProxyResult> {
  try {
    // Apply validateToken middleware
    // Requirements: 8.1, 8.2, 8.3
    const validationResult = validateToken(event, tokenService);

    if (!validationResult.success) {
      return createErrorResponse(
        validationResult.statusCode || 401,
        validationResult.error || 'Unauthorized'
      );
    }

    // Extract userId from token context
    const tokenUserId = validationResult.userId!;

    // Extract requested userId from path parameters
    const requestedUserId = event.pathParameters?.userId;

    if (!requestedUserId) {
      return createErrorResponse(400, "Missing userId parameter", "VALIDATION_ERROR");
    }

    // Return 403 if token userId doesn't match requested userId
    // Requirements: 8.4
    if (tokenUserId !== requestedUserId) {
      return createErrorResponse(403, "Forbidden: You can only access your own data");
    }

    // Get user data via UserRepository
    const user = await userRepository.getUserById(requestedUserId);

    if (!user) {
      return createErrorResponse(404, "User not found", "USER_NOT_FOUND");
    }

    // Return user data (exclude hashedPassword, resetToken fields)
    // Requirements: 8.4
    const { hashedPassword, resetToken, resetTokenExpiry, ...safeUserData } = user;

    console.log("User retrieved:", requestedUserId);

    return createResponse(200, safeUserData);

  } catch (error) {
    console.error("Error retrieving user:", error);

    return createErrorResponse(500, "Internal server error", "INTERNAL_ERROR");
  }
}

// Legacy handler for backward compatibility
// This will be replaced when the Lambda is updated to use the new handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return createErrorResponse(501, "This endpoint requires authentication. Please update the Lambda configuration.");
};
