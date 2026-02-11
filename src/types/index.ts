// Core data models for budgeting profile

/**
 * Represents a single income source with amount and frequency
 */
export interface IncomeSource {
    id: string;
    name: string;
    amount: number;
    frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'annual';
}

/**
 * Represents a financial goal with target amount and optional timeline
 */
export interface BudgetGoal {
    id: string;
    description: string;
    targetAmount: number;
    targetDate?: Date;
    timeframe?: string;
}

/**
 * Represents expense category data
 */
export interface ExpenseData {
    selectedCategories: string[];
    customCategories: string[];
}

/**
 * Complete budget profile data structure
 */
export interface BudgetProfile {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    income: {
        sources: IncomeSource[];
        totalMonthly: number; // Calculated field
    };
    expenses: ExpenseData;
    goals: BudgetGoal[];
    metadata: {
        completionPercentage: number;
        lastSection: string;
    };
}

/**
 * Represents a section in the form flow
 */
export interface Section {
    id: string;
    title: string;
    isComplete: boolean;
    isValid: boolean;
}

/**
 * Result of a validation operation
 */
export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Runtime form state
 */
export interface FormState {
    currentSection: number;
    sections: Section[];
    data: Partial<BudgetProfile>;
    errors: Record<string, string[]>;
    isDirty: boolean;
    isSubmitting: boolean;
}
