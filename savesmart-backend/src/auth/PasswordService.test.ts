/**
 * Unit tests for PasswordService
 *
 * Tests password hashing, verification, and validation functionality
 * Requirements: 1.4, 2.2, 7.3
 */

import { PasswordService } from './PasswordService';

describe('PasswordService', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe('hashPassword', () => {
    it('should hash a password using bcrypt', async () => {
      const plainPassword = 'TestPass123';
      const hash = await passwordService.hashPassword(plainPassword);

      // Bcrypt hashes start with $2b$ (bcryptjs format)
      expect(hash).toMatch(/^\$2[aby]\$/);
      expect(hash).not.toBe(plainPassword);
    });

    it('should generate different hashes for the same password', async () => {
      const plainPassword = 'TestPass123';
      const hash1 = await passwordService.hashPassword(plainPassword);
      const hash2 = await passwordService.hashPassword(plainPassword);

      // Due to random salt, hashes should be different
      expect(hash1).not.toBe(hash2);
    });

    it('should hash empty string', async () => {
      const hash = await passwordService.hashPassword('');
      expect(hash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const plainPassword = 'TestPass123';
      const hash = await passwordService.hashPassword(plainPassword);
      const result = await passwordService.verifyPassword(plainPassword, hash);

      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const plainPassword = 'TestPass123';
      const wrongPassword = 'WrongPass456';
      const hash = await passwordService.hashPassword(plainPassword);
      const result = await passwordService.verifyPassword(wrongPassword, hash);

      expect(result).toBe(false);
    });

    it('should return false for empty password against valid hash', async () => {
      const plainPassword = 'TestPass123';
      const hash = await passwordService.hashPassword(plainPassword);
      const result = await passwordService.verifyPassword('', hash);

      expect(result).toBe(false);
    });

    it('should handle case-sensitive password verification', async () => {
      const plainPassword = 'TestPass123';
      const hash = await passwordService.hashPassword(plainPassword);
      const result = await passwordService.verifyPassword('testpass123', hash);

      expect(result).toBe(false);
    });
  });

  describe('validatePasswordRequirements', () => {
    it('should accept valid password with all requirements', () => {
      const result = passwordService.validatePasswordRequirements('ValidPass123');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = passwordService.validatePasswordRequirements('Pass1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should reject password without uppercase letter', () => {
      const result = passwordService.validatePasswordRequirements('password123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least 1 uppercase letter');
    });

    it('should reject password without lowercase letter', () => {
      const result = passwordService.validatePasswordRequirements('PASSWORD123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least 1 lowercase letter');
    });

    it('should reject password without number', () => {
      const result = passwordService.validatePasswordRequirements('PasswordOnly');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least 1 number');
    });

    it('should reject empty password', () => {
      const result = passwordService.validatePasswordRequirements('');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should reject null password', () => {
      const result = passwordService.validatePasswordRequirements(null as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should reject undefined password', () => {
      const result = passwordService.validatePasswordRequirements(undefined as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should return multiple errors for password with multiple issues', () => {
      const result = passwordService.validatePasswordRequirements('short');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Password must be at least 8 characters');
      expect(result.errors).toContain('Password must contain at least 1 uppercase letter');
      expect(result.errors).toContain('Password must contain at least 1 number');
    });

    it('should accept password with special characters', () => {
      const result = passwordService.validatePasswordRequirements('Valid@Pass123!');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept password exactly 8 characters', () => {
      const result = passwordService.validatePasswordRequirements('Pass1234');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
