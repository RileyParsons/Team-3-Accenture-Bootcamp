import { TokenService } from './TokenService';
import jwt from 'jsonwebtoken';

describe('TokenService', () => {
  const testSecret = 'test-secret-key-for-jwt-signing';
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService(testSecret);
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      const token = tokenService.generateAccessToken(userId, email);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include userId, email, and type in token payload', () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      const token = tokenService.generateAccessToken(userId, email);
      const decoded = jwt.decode(token) as jwt.JwtPayload;

      expect(decoded.userId).toBe(userId);
      expect(decoded.email).toBe(email);
      expect(decoded.type).toBe('access');
    });

    it('should set expiration to 1 hour', () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      const token = tokenService.generateAccessToken(userId, email);
      const decoded = jwt.decode(token) as jwt.JwtPayload;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();

      const expirationTime = decoded.exp! - decoded.iat!;
      expect(expirationTime).toBe(3600); // 1 hour in seconds
    });

    it('should use HS256 algorithm', () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      const token = tokenService.generateAccessToken(userId, email);
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded?.header.alg).toBe('HS256');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const userId = 'user-123';

      const token = tokenService.generateRefreshToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include userId and type in token payload', () => {
      const userId = 'user-123';

      const token = tokenService.generateRefreshToken(userId);
      const decoded = jwt.decode(token) as jwt.JwtPayload;

      expect(decoded.userId).toBe(userId);
      expect(decoded.type).toBe('refresh');
    });

    it('should NOT include email in refresh token', () => {
      const userId = 'user-123';

      const token = tokenService.generateRefreshToken(userId);
      const decoded = jwt.decode(token) as jwt.JwtPayload;

      expect(decoded.email).toBeUndefined();
    });

    it('should set expiration to 7 days', () => {
      const userId = 'user-123';

      const token = tokenService.generateRefreshToken(userId);
      const decoded = jwt.decode(token) as jwt.JwtPayload;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();

      const expirationTime = decoded.exp! - decoded.iat!;
      expect(expirationTime).toBe(604800); // 7 days in seconds
    });

    it('should use HS256 algorithm', () => {
      const userId = 'user-123';

      const token = tokenService.generateRefreshToken(userId);
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded?.header.alg).toBe('HS256');
    });
  });

  describe('validateToken', () => {
    it('should validate a valid access token', () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const token = tokenService.generateAccessToken(userId, email);

      const decoded = tokenService.validateToken(token);

      expect(decoded.userId).toBe(userId);
      expect(decoded.email).toBe(email);
      expect(decoded.type).toBe('access');
    });

    it('should validate a valid refresh token', () => {
      const userId = 'user-123';
      const token = tokenService.generateRefreshToken(userId);

      const decoded = tokenService.validateToken(token);

      expect(decoded.userId).toBe(userId);
      expect(decoded.type).toBe('refresh');
    });

    it('should throw error for token with invalid signature', () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const token = tokenService.generateAccessToken(userId, email);

      // Create a service with different secret
      const differentService = new TokenService('different-secret');

      expect(() => differentService.validateToken(token)).toThrow('Invalid token');
    });

    it('should throw error for expired token', () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      // Create an expired token (expired 1 hour ago)
      const expiredToken = jwt.sign(
        { userId, email, type: 'access' },
        testSecret,
        { algorithm: 'HS256', expiresIn: '-1h' }
      );

      expect(() => tokenService.validateToken(expiredToken)).toThrow('Token expired');
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not.a.valid.jwt.token';

      expect(() => tokenService.validateToken(malformedToken)).toThrow('Invalid token');
    });

    it('should throw error for token with wrong algorithm', () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      // Create token with different algorithm (this would fail validation)
      const token = jwt.sign(
        { userId, email, type: 'access' },
        testSecret,
        { algorithm: 'HS512' }
      );

      expect(() => tokenService.validateToken(token)).toThrow('Invalid token');
    });
  });

  describe('extractUserId', () => {
    it('should extract userId from valid access token', () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const token = tokenService.generateAccessToken(userId, email);

      const extractedUserId = tokenService.extractUserId(token);

      expect(extractedUserId).toBe(userId);
    });

    it('should extract userId from valid refresh token', () => {
      const userId = 'user-456';
      const token = tokenService.generateRefreshToken(userId);

      const extractedUserId = tokenService.extractUserId(token);

      expect(extractedUserId).toBe(userId);
    });

    it('should throw error for invalid token', () => {
      const malformedToken = 'invalid.token.here';

      expect(() => tokenService.extractUserId(malformedToken)).toThrow();
    });

    it('should throw error for token without userId', () => {
      // Create a token without userId
      const tokenWithoutUserId = jwt.sign(
        { email: 'test@example.com', type: 'access' },
        testSecret,
        { algorithm: 'HS256', expiresIn: '1h' }
      );

      expect(() => tokenService.extractUserId(tokenWithoutUserId)).toThrow(
        'Token does not contain valid userId'
      );
    });

    it('should throw error for expired token', () => {
      const userId = 'user-123';
      const expiredToken = jwt.sign(
        { userId, type: 'access' },
        testSecret,
        { algorithm: 'HS256', expiresIn: '-1h' }
      );

      expect(() => tokenService.extractUserId(expiredToken)).toThrow('Token expired');
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in userId', () => {
      const userId = 'user-123-abc_def@domain';
      const email = 'test@example.com';

      const token = tokenService.generateAccessToken(userId, email);
      const extractedUserId = tokenService.extractUserId(token);

      expect(extractedUserId).toBe(userId);
    });

    it('should handle special characters in email', () => {
      const userId = 'user-123';
      const email = 'test+tag@sub.example.com';

      const token = tokenService.generateAccessToken(userId, email);
      const decoded = tokenService.validateToken(token);

      expect(decoded.email).toBe(email);
    });

    it('should handle very long userId', () => {
      const userId = 'a'.repeat(500);
      const email = 'test@example.com';

      const token = tokenService.generateAccessToken(userId, email);
      const extractedUserId = tokenService.extractUserId(token);

      expect(extractedUserId).toBe(userId);
    });
  });
});
