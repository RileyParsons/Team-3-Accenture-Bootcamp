/**
 * handleResetComplete
 *
 * Handles password reset completion including:
 * - Request payload validation
 * - New password validation
 * - Reset token verification
 * - Password update
 * - Reset token cleanup
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ValidationService } from './ValidationService';
import { PasswordService } from './PasswordService';
import { UserRepository } from './UserRepository';

interface ResetCompletePayload {
  resetToken: string;
  newPassword: string;
}

interface ResetCompleteResponse {
  message: string;
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
 * Handles password reset completion
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
export async function handleResetComplete(
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

    const body: ResetCompletePayload = JSON.parse(event.body);

    // Validate request payload (resetToken, newPassword)
    // Requirements: 7.1
    if (!body.resetToken || typeof body.resetToken !== 'string') {
      return createResponse(400, {
        error: 'Validation failed',
        details: ['resetToken is required and must be a string'],
      });
    }

    if (!body.newPassword || typeof body.newPassword !== 'string') {
      return createResponse(400, {
        error: 'Validation failed',
        details: ['newPassword is required and must be a string'],
      });
    }

    // Validate new password meets requirements
    // Requirements: 7.2
    const passwordValidation = validationService.validatePassword(body.newPassword);
    if (!passwordValidation.valid) {
      return createResponse(400, {
        error: 'Validation failed',
        details: passwordValidation.errors,
      });
    }

    // Hash the provided reset token
    // Requirements: 7.1
    const tokenHash = await passwordService.hashPassword(body.resetToken);

    // Query all users to find matching reset token hash
    // Note: In production, this would use a GSI on resetToken for efficiency
    // Requirements: 7.1
    const users = await userRepository.getAllUsers();

    let matchingUser = null;
    for (const user of users) {
      if (user.resetToken) {
        // Verify the token hash matches
        const isMatch = await passwordService.verifyPassword(body.resetToken, user.resetToken);
        if (isMatch) {
          matchingUser = user;
          break;
        }
      }
    }

    // Return error if token invalid
    // Requirements: 7.6
    if (!matchingUser) {
      return createResponse(401, {
        error: 'Invalid or expired reset token',
      });
    }

    // Check reset token expiration
    // Requirements: 7.1, 7.6
    if (!matchingUser.resetTokenExpiry) {
      return createResponse(401, {
        error: 'Invalid or expired reset token',
      });
    }

    const expiryDate = new Date(matchingUser.resetTokenExpiry);
    const now = new Date();

    if (now > expiryDate) {
      return createResponse(401, {
        error: 'Invalid or expired reset token',
      });
    }

    // Hash new password using PasswordService
    // Requirements: 7.3
    const hashedPassword = await passwordService.hashPassword(body.newPassword);

    // Update user password via UserRepository
    // Requirements: 7.4
    await userRepository.updatePassword(matchingUser.userId, hashedPassword);

    // Clear reset token fields via UserRepository
    // Requirements: 7.5
    await userRepository.clearResetToken(matchingUser.userId);

    // Return success response
    const response: ResetCompleteResponse = {
      message: 'Password reset successful',
    };

    return createResponse(200, response);
  } catch (error) {
    console.error('Error in handleResetComplete:', error);

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
