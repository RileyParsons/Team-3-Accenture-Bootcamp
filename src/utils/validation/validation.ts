import { ValidationResult } from '../../types';

/**
 * Represents a validation rule with field identifier, validator function, and error message
 */
export interface ValidationRule {
    field: string;
    validator: (value: any) => boolean;
    message: string;
}

/**
 * ValidationEngine - Centralized validation logic for all form inputs
 * 
 * Provides methods to validate individual fields, entire sections, and check overall form validity.
 * Implements validation rules for positive numbers, non-empty strings, and required fields.
 */
export class ValidationEngine {
    private rules: ValidationRule[];
    private fieldValues: Record<string, any>;

    constructor() {
        this.rules = this.initializeRules();
        this.fieldValues = {};
    }

    /**
     * Initialize validation rules for all form fields
     */
    private initializeRules(): ValidationRule[] {
        return [
            // Income validation rules
            {
                field: 'income.amount',
                validator: (value) => typeof value === 'number' && value > 0,
                message: 'Income amount must be a positive number'
            },
            {
                field: 'income.frequency',
                validator: (value) => ['weekly', 'bi-weekly', 'monthly', 'annual'].includes(value),
                message: 'Please select a valid frequency'
            },
            {
                field: 'income.name',
                validator: (value) => typeof value === 'string' && value.trim().length > 0,
                message: 'Income source name cannot be empty'
            },
            // Expense validation rules
            {
                field: 'customCategory',
                validator: (value) => typeof value === 'string' && value.trim().length > 0,
                message: 'Category name cannot be empty'
            },
            // Goal validation rules
            {
                field: 'goal.targetAmount',
                validator: (value) => typeof value === 'number' && value > 0,
                message: 'Target amount must be a positive number'
            },
            {
                field: 'goal.description',
                validator: (value) => typeof value === 'string' && value.trim().length > 0,
                message: 'Goal description cannot be empty'
            }
        ];
    }

    /**
     * Set field values for validation
     * @param values - Object containing field values to validate
     */
    setFieldValues(values: Record<string, any>): void {
        this.fieldValues = values;
    }

    /**
     * Validate a single field against its validation rules
     * @param field - Field identifier (e.g., 'income.amount', 'customCategory')
     * @param value - Value to validate
     * @returns ValidationResult with isValid flag and optional error message
     */
    validate(field: string, value: any): ValidationResult {
        // Find the rule for this field
        const rule = this.rules.find(r => r.field === field);

        if (!rule) {
            // No rule found, consider it valid
            return { isValid: true };
        }

        // Apply the validator
        const isValid = rule.validator(value);

        return {
            isValid,
            error: isValid ? undefined : rule.message
        };
    }

    /**
     * Validate all fields in a specific section
     * @param section - Section identifier ('income', 'expenses', 'goals')
     * @returns Array of ValidationResult objects for all fields in the section
     */
    validateSection(section: string): ValidationResult[] {
        const results: ValidationResult[] = [];

        // Filter rules that belong to this section
        const sectionRules = this.rules.filter(rule => {
            if (section === 'income') {
                return rule.field.startsWith('income.');
            } else if (section === 'expenses') {
                return rule.field === 'customCategory';
            } else if (section === 'goals') {
                return rule.field.startsWith('goal.');
            }
            return false;
        });

        // Validate each field in the section
        for (const rule of sectionRules) {
            const value = this.getFieldValue(rule.field);
            const result = this.validate(rule.field, value);
            results.push(result);
        }

        return results;
    }

    /**
     * Check if all fields pass validation
     * @returns true if all fields are valid, false otherwise
     */
    isValid(): boolean {
        // Validate all fields
        for (const rule of this.rules) {
            const value = this.getFieldValue(rule.field);
            const result = this.validate(rule.field, value);
            if (!result.isValid) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get field value from stored field values
     * @param field - Field identifier with dot notation
     * @returns Field value or undefined
     */
    private getFieldValue(field: string): any {
        const parts = field.split('.');
        let value: any = this.fieldValues;

        for (const part of parts) {
            if (value && typeof value === 'object') {
                value = value[part];
            } else {
                return undefined;
            }
        }

        return value;
    }

    /**
     * Validate required fields
     * @param field - Field identifier
     * @param value - Value to check
     * @returns ValidationResult indicating if required field is present
     */
    validateRequired(field: string, value: any): ValidationResult {
        const isEmpty = value === undefined ||
            value === null ||
            value === '' ||
            (typeof value === 'string' && value.trim().length === 0);

        return {
            isValid: !isEmpty,
            error: isEmpty ? 'This field is required' : undefined
        };
    }

    /**
     * Validate positive number
     * @param value - Value to validate
     * @returns ValidationResult for positive number validation
     */
    validatePositiveNumber(value: any): ValidationResult {
        const isValid = typeof value === 'number' && value > 0;
        return {
            isValid,
            error: isValid ? undefined : 'Value must be a positive number'
        };
    }

    /**
     * Validate non-empty string
     * @param value - Value to validate
     * @returns ValidationResult for non-empty string validation
     */
    validateNonEmptyString(value: any): ValidationResult {
        const isValid = typeof value === 'string' && value.trim().length > 0;
        return {
            isValid,
            error: isValid ? undefined : 'Value cannot be empty'
        };
    }
}

// Export a singleton instance for convenience
export const validationEngine = new ValidationEngine();
