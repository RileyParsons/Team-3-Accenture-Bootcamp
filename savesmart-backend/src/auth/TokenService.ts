import jwt from 'jsonwebtoken';

/**
 * TokenService handles JWT token generation and validation for authentication.
 * Uses HS256 algorithm for signing tokens.
 */
export class TokenService {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  /**
   * Generates an access token with 1 hour expiration.
   * @param userId - The user's unique identifier
   * @param email - The user's email address
   * @returns JWT access token string
   */
  generateAccessToken(userId: string, email: string): string {
    const payload = {
      userId,
      email,
      type: 'access',
    };

    return jwt.sign(payload, this.secret, {
      algorithm: 'HS256',
      expiresIn: '1h',
    });
  }

  /**
   * Generates a refresh token with 7 day expiration.
   * @param userId - The user's unique identifier
   * @returns JWT refresh token string
   */
  generateRefreshToken(userId: string): string {
    const payload = {
      userId,
      type: 'refresh',
    };

    return jwt.sign(payload, this.secret, {
      algorithm: 'HS256',
      expiresIn: '7d',
    });
  }

  /**
   * Validates a JWT token by verifying signature and expiration.
   * @param token - The JWT token to validate
   * @returns Decoded token payload
   * @throws Error if token is invalid or expired
   */
  validateToken(token: string): jwt.JwtPayload {
    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
      });

      if (typeof decoded === 'string') {
        throw new Error('Invalid token format');
      }

      return decoded as jwt.JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Extracts the userId from a JWT token.
   * @param token - The JWT token
   * @returns The userId from the token payload
   * @throws Error if token is invalid or userId is missing
   */
  extractUserId(token: string): string {
    const decoded = this.validateToken(token);

    if (!decoded.userId || typeof decoded.userId !== 'string') {
      throw new Error('Token does not contain valid userId');
    }

    return decoded.userId;
  }
}
