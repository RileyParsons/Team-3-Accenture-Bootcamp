/**
 * Unit tests for ValidationService
 *
 * Tests email validation, password validation, and request payload validation
 * Requirements: 1.1, 1.2
 */

import { ValidationService } from './ValidationService';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(validationService.validateEmail('user@example.com')).toBe(true);
      expect(validationService.validateEmail('test.user@domain.co.uk')).toBe(true);
      expect(validationService.validateEmail('user_name@test-domain.com')).toBe(true);
      expect(validationService.validateEmail('user123@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validationService.validateEmail('invalid')).toBe(false);
      expect(validationService.validateEmail('invalid@')).toBe(false);
      expect(validationService.validateEmail('@example.com')).toBe(false);
      expect(validationService.validateEmail('user@')).toBe(false);
      expect(validationService.validateEmail('user@domain')).toBe(false);
      expect(validationService.validateEmail('user domain@example.com')).toBe(false);
    });

    it('should reject empty or null values', () => {
      expect(validationService.validateEmail('')).toBe(false);
      expect(validationService.validateEmail(null as any)).toBe(false);
      expect(validationService.validateEmail(undefined as any)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept passwords meeting all requirements', () => {
      const result = validationService.validatePassword('Password123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept passwords with exactly 8 characters', () => {
      const result = validationService.validatePassword('Pass123a');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = validationService.validatePassword('Pass12');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should reject passwords without uppercase letters', () => {
      const result = validationService.validatePassword('password123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least 1 uppercase letter');
    });

    it('should reject passwords without lowercase letters', () => {
      const result = validationService.validatePassword('PASSWORD123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least 1 lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = validationService.validatePassword('PasswordABC');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least 1 number');
    });

    it('should return multiple errors for passwords failing multiple requirements', () => {
      const result = validationService.validatePassword('pass');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Password must be at least 8 characters');
      expect(result.errors).toContain('Password must contain at least 1 uppercase letter');
      expect(result.errors).toContain('Password must contain at least 1 number');
    });

    it('should reject empty or null passwords', () => {
      const emptyResult = validationService.validatePassword('');
      expect(emptyResult.valid).toBe(false);
      expect(emptyResult.errors).toContain('Password is required');

      const nullResult = validationService.validatePassword(null as any);
      expect(nullResult.valid).toBe(false);
      expect(nullResult.errors).toContain('Password is required');
    });
  });

  describe('validateRegistrationPayload', () => {
    it('should accept valid registration payloads', () => {
      const result = validationService.validateRegistrationPayload({
        email: 'user@example.com',
        password: 'Password123'
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject payloads with missing email', () => {
      const result = validationService.validateRegistrationPayload({
        password: 'Password123'
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should reject payloads with invalid email format', () => {
      const result = validationService.validateRegistrationPayload({
        email: 'invalid-email',
        password: 'Password123'
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should reject payloads with missing password', () => {
      const result = validationService.validateRegistrationPayload({
        email: 'user@example.com'
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should reject payloads with weak passwords', () => {
      const result = validationService.validateRegistrationPayload({
        email: 'user@example.com',
        password: 'weak'
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid request bodies', () => {
      const result = validationService.validateRegistrationPayload(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid request body');
    });

    it('should return multiple errors for multiple validation failures', () => {
      const result = validationService.validateRegistrationPayload({
        email: 'invalid',
        password: 'weak'
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateLoginPayload', () => {
    it('should accept valid login payloads', () => {
      const result = validationService.validateLoginPayload({
        email: 'user@example.com',
        password: 'anypassword'
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject payloads with missing email', () => {
      const result = validationService.validateLoginPayload({
        password: 'anypassword'
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should reject payloads with invalid email format', () => {
      const result = validationService.validateLoginPayload({
        email: 'invalid-email',
        password: 'anypassword'
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should reject payloads with missing password', () => {
      const result = validationService.validateLoginPayload({
        email: 'user@example.com'
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should not validate password requirements for login', () => {
      // Login should accept any password string, validation happens during comparison
      const result = validationService.validateLoginPayload({
        email: 'user@example.com',
        password: 'weak'
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid request bodies', () => {
      const result = validationService.validateLoginPayload(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid request body');
    });
  });
});
