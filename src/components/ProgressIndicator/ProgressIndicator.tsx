import React from 'react';
import { FormState } from '../../types';
import './ProgressIndicator.css';

export interface ProgressIndicatorProps {
    /**
     * The current form state to calculate progress from
     */
    formState: FormState;
}

/**
 * Calculates the completion percentage based on required fields
 * 
 * Required fields:
 * - At least one income source with name, amount > 0, and frequency
 * - At least one expense category selected (predefined or custom)
 * - At least one goal with description and targetAmount > 0
 * 
 * @param formState - The current form state
 * @returns Completion percentage (0-100)
 */
export const calculateCompletionPercentage = (formState: FormState): number => {
    let completedFields = 0;
    let totalRequiredFields = 3; // Income, Expenses, Goals

    // Check income: at least one valid income source
    const hasValidIncome = formState.data.income?.sources?.some(
        source => source.name.trim().length > 0 && source.amount > 0 && source.frequency
    );
    if (hasValidIncome) {
        completedFields++;
    }

    // Check expenses: at least one category selected
    const hasExpenses =
        (formState.data.expenses?.selectedCategories?.length ?? 0) > 0 ||
        (formState.data.expenses?.customCategories?.length ?? 0) > 0;
    if (hasExpenses) {
        completedFields++;
    }

    // Check goals: at least one valid goal
    const hasValidGoal = formState.data.goals?.some(
        goal => goal.description.trim().length > 0 && goal.targetAmount > 0
    );
    if (hasValidGoal) {
        completedFields++;
    }

    // Calculate percentage
    const percentage = (completedFields / totalRequiredFields) * 100;
    return Math.round(percentage);
};

/**
 * ProgressIndicator component displays completion percentage and visual progress bar
 * 
 * Requirements: 1.3
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ formState }) => {
    const percentage = calculateCompletionPercentage(formState);

    return (
        <div className="progress-indicator" role="region" aria-label="Form completion progress">
            <div className="progress-indicator__header">
                <span className="progress-indicator__label">Profile Completion</span>
                <span className="progress-indicator__percentage" aria-live="polite">
                    {percentage}%
                </span>
            </div>
            <div
                className="progress-indicator__bar-container"
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${percentage}% complete`}
            >
                <div
                    className="progress-indicator__bar-fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};
