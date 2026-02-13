/**
 * handleRegister
 *
 * Handles user registration requests including:
 * - Request payload validation
 * - Email uniqueness check
 * - Password hashing
 * - User record creation
 * - Token generation
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

import { v4 as uuidv4 } from 'uuid';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ValidationService } from './ValidationService';
import { PasswordService } from './PasswordService';
import { TokenService } from './TokenService';
import { UserRepository } from './UserRepository';

interface RegisterRequest {
  email: string;
  password: string;
}

interface RegisterResponse {
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
 * Handles user registration
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */
export async function handleRegister(
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

    const body: RegisterRequest = JSON.parse(event.body);

    // Validate request payload (email, password)
    // Requirements: 1.1, 1.2
    const validation = validationService.validateRegistrationPayload(body);
    if (!validation.valid) {
      return createResponse(400, {
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    // Check if email already exists
    // Requirements: 1.3
    const existingUser = await userRepository.getUserByEmail(body.email);
    if (existingUser) {
      return createResponse(409, {
        error: 'Email already registered',
      });
    }

    // Hash password using PasswordService
    // Requirements: 1.4
    const hashedPassword = await passwordService.hashPassword(body.password);

    // Generate userId (UUID v4)
    const userId = uuidv4();

    // Create user record via UserRepository
    // Requirements: 1.5
    const createdAt = new Date().toISOString();
    await userRepository.createUser(userId, body.email, hashedPassword, createdAt);

    // Generate access and refresh tokens
    // Requirements: 1.6
    const accessToken = tokenService.generateAccessToken(userId, body.email);
    const refreshToken = tokenService.generateRefreshToken(userId);

    // Return response with userId, email, and tokens
    const response: RegisterResponse = {
      userId,
      email: body.email,
      accessToken,
      refreshToken,
    };

    return createResponse(200, response);
  } catch (error) {
    console.error('Error in handleRegister:', error);

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
