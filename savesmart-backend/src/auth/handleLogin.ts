/**
 * handleLogin
 *
 * Handles user login requests including:
 * - Request payload validation
 * - User lookup by email
 * - Password verification
 * - Token generation
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ValidationService } from './ValidationService';
import { PasswordService } from './PasswordService';
import { TokenService } from './TokenService';
import { UserRepository } from './UserRepository';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  userId: string;
  email: string;
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
 * Handles user login
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
export async function handleLogin(
  event: APIGatewayProxyEvent,
  validationService: ValidationService,
  passwordService: PasswordService,
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

    const body: LoginRequest = JSON.parse(event.body);

    // Validate request payload (email, password)
    // Requirements: 2.1
    const validation = validationService.validateLoginPayload(body);
    if (!validation.valid) {
      return createResponse(400, {
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    // Get user by email via UserRepository
    // Requirements: 2.1
    const user = await userRepository.getUserByEmail(body.email);

    // Return generic error if user not found
    // Requirements: 2.3
    if (!user) {
      return createResponse(401, {
        error: 'Invalid credentials',
      });
    }

    // Verify password using PasswordService
    // Requirements: 2.2
    const isPasswordValid = await passwordService.verifyPassword(
      body.password,
      user.hashedPassword
    );

    // Return generic error if password incorrect
    // Requirements: 2.3
    if (!isPasswordValid) {
      return createResponse(401, {
        error: 'Invalid credentials',
      });
    }

    // Generate access and refresh tokens
    // Requirements: 2.4, 2.5
    const accessToken = tokenService.generateAccessToken(user.userId, user.email);
    const refreshToken = tokenService.generateRefreshToken(user.userId);

    // Return response with userId, email, and tokens
    // Requirements: 2.6
    const response: LoginResponse = {
      userId: user.userId,
      email: user.email,
      accessToken,
      refreshToken,
    };

    return createResponse(200, response);
  } catch (error) {
    console.error('Error in handleLogin:', error);

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
