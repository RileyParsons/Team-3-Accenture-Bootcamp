/**
 * PasswordService
 *
 * Handles password-related operations including:
 * - Password hashing using bcrypt
 * - Password verification against hashes
 * - Password requirements validation
 *
 * Requirements: 1.4, 2.2, 7.3
 */

import bcrypt from 'bcryptjs';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class PasswordService {
  private readonly saltRounds = 10;

  /**
   * Hashes a plain text password using bcrypt with 10 salt rounds
   * Requirements: 1.4, 7.3
   *
   * @param plainPassword - The plain text password to hash
   * @returns Promise resolving to the bcrypt hash
   */
  async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.saltRounds);
  }

  /**
   * Verifies a plain text password against a bcrypt hash
   * Requirements: 2.2
   *
   * @param plainPassword - The plain text password to verify
   * @param hashedPassword - The bcrypt hash to compare against
   * @returns Promise resolving to true if password matches, false otherwise
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Validates password meets requirements:
   * - At least 8 characters
   * - At least 1 uppercase letter
   * - At least 1 lowercase letter
   * - At least 1 number
   *
   * Requirements: 1.4
   *
   * @param password - The password to validate
   * @returns ValidationResult with valid flag and error messages
   */
  validatePasswordRequirements(password: string): ValidationResult {
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
}
