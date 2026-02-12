/**
 * ValidationService
 *
 * Handles validation for authentication-related inputs including:
 * - Email format validation
 * - Password requirements validation
 * - Request payload validation
 *
 * Requirements: 1.1, 1.2
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class ValidationService {
  /**
   * Validates email format using standard email regex
   * Requirements: 1.1
   */
  validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    // Standard email format: local@domain
    // Allows alphanumeric, dots, hyphens, underscores in local part
    // Requires @ symbol
    // Requires domain with at least one dot
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Validates password meets requirements:
   * - At least 8 characters
   * - At least 1 uppercase letter
   * - At least 1 lowercase letter
   * - At least 1 number
   *
   * Requirements: 1.2
   */
  validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
      return { valid: false, errors };
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least 1 uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least 1 lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least 1 number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates registration request payload
   * Requirements: 1.1, 1.2
   */
  validateRegistrationPayload(body: any): ValidationResult {
    const errors: string[] = [];

    if (!body || typeof body !== 'object') {
      errors.push('Invalid request body');
      return { valid: false, errors };
    }

    // Validate email
    if (!body.email) {
      errors.push('Email is required');
    } else if (!this.validateEmail(body.email)) {
      errors.push('Invalid email format');
    }

    // Validate password
    if (!body.password) {
      errors.push('Password is required');
    } else {
      const passwordValidation = this.validatePassword(body.password);
      if (!passwordValidation.valid) {
        errors.push(...passwordValidation.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates login request payload
   * Requirements: 1.1
   */
  validateLoginPayload(body: any): ValidationResult {
    const errors: string[] = [];

    if (!body || typeof body !== 'object') {
      errors.push('Invalid request body');
      return { valid: false, errors };
    }

    // Validate email
    if (!body.email) {
      errors.push('Email is required');
    } else if (!this.validateEmail(body.email)) {
      errors.push('Invalid email format');
    }

    // Validate password presence (don't validate requirements for login)
    if (!body.password) {
      errors.push('Password is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
