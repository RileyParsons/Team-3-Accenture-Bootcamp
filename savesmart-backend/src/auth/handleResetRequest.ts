/**
 * handleResetRequest
 *
 * Handles password reset request including:
 * - Request payload validation
 * - User lookup by email
 * - Reset token generation and hashing
 * - Token storage with expiration
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { v4 as uuidv4 } from 'uuid';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ValidationService } from './ValidationService';
import { PasswordService } from './PasswordService';
import { UserRepository } from './UserRepository';

interface ResetRequestPayload {
  email: string;
}

interface ResetRequestResponse {
  message: string;
  resetToken?: string;
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
 * Handles password reset request
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export async function handleResetRequest(
  event: APIGatewayProxyEvent,
  validationService: ValidationService,
  passwordService: PasswordService,
  userRepository: UserRepository
): Promise<APIGatewayProxyResult> {
  try {
    // Parse request body
    if (!event.body) {
      return createResponse(400, {
        error: 'Request body is required',
      });
    }

    const body: ResetRequestPayload = JSON.parse(event.body);

    // Validate request payload (email)
    // Requirements: 6.1
    if (!body.email || typeof body.email !== 'string') {
      return createResponse(400, {
        error: 'Validation failed',
        details: ['email is required and must be a string'],
      });
    }

    if (!validationService.validateEmail(body.email)) {
      return createResponse(400, {
        error: 'Validation failed',
        details: ['Invalid email format'],
      });
    }

    // Get user by email via UserRepository
    // Requirements: 6.1
    const user = await userRepository.getUserByEmail(body.email);

    // Generate unique reset token (UUID v4)
    // Requirements: 6.2
    const resetToken = uuidv4();

    // Always return success even if email doesn't exist (security requirement)
    // Requirements: 6.5
    if (!user) {
      return createResponse(200, {
        message: 'If the email exists, a reset token has been generated',
        resetToken,
      });
    }

    // Hash reset token using bcrypt
    // Requirements: 6.3
    const tokenHash = await passwordService.hashPassword(resetToken);

    // Set expiration to 1 hour from now
    // Requirements: 6.2
    const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Store token hash and expiration via UserRepository
    // Requirements: 6.3
    await userRepository.setResetToken(user.userId, tokenHash, expiry);

    // Return success response with reset token
    // Requirements: 6.4
    const response: ResetRequestResponse = {
      message: 'If the email exists, a reset token has been generated',
      resetToken,
    };

    return createResponse(200, response);
  } catch (error) {
    console.error('Error in handleResetRequest:', error);

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
