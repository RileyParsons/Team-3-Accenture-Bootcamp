import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressIndicator, calculateCompletionPercentage } from './ProgressIndicator';
import { FormState } from '../../types';

describe('ProgressIndicator', () => {
    const createMockFormState = (overrides?: Partial<FormState>): FormState => ({
        currentSection: 0,
        sections: [],
        data: {
            income: { sources: [], totalMonthly: 0 },
            expenses: { selectedCategories: [], customCategories: [] },
            goals: []
        },
        errors: {},
        isDirty: false,
        isSubmitting: false,
        ...overrides
    });

    describe('calculateCompletionPercentage', () => {
        it('should return 0% for empty form', () => {
            const formState = createMockFormState();
            expect(calculateCompletionPercentage(formState)).toBe(0);
        });

        it('should return 33% with only valid income', () => {
            const formState = createMockFormState({
                data: {
                    income: {
                        sources: [
                            { id: '1', name: 'Salary', amount: 5000, frequency: 'monthly' }
                        ],
                        totalMonthly: 5000
                    },
                    expenses: { selectedCategories: [], customCategories: [] },
                    goals: []
                }
            });
            expect(calculateCompletionPercentage(formState)).toBe(33);
        });

        it('should return 33% with only expense categories', () => {
            const formState = createMockFormState({
                data: {
                    income: { sources: [], totalMonthly: 0 },
                    expenses: { selectedCategories: ['Housing'], customCategories: [] },
                    goals: []
                }
            });
            expect(calculateCompletionPercentage(formState)).toBe(33);
        });

        it('should return 33% with only valid goal', () => {
            const formState = createMockFormState({
                data: {
                    income: { sources: [], totalMonthly: 0 },
                    expenses: { selectedCategories: [], customCategories: [] },
                    goals: [
                        { id: '1', description: 'Emergency Fund', targetAmount: 10000 }
                    ]
                }
            });
            expect(calculateCompletionPercentage(formState)).toBe(33);
        });

        it('should return 67% with income and expenses', () => {
            const formState = createMockFormState({
                data: {
                    income: {
                        sources: [
                            { id: '1', name: 'Salary', amount: 5000, frequency: 'monthly' }
                        ],
                        totalMonthly: 5000
                    },
                    expenses: { selectedCategories: ['Housing', 'Food'], customCategories: [] },
                    goals: []
                }
            });
            expect(calculateCompletionPercentage(formState)).toBe(67);
        });

        it('should return 100% with all required fields completed', () => {
            const formState = createMockFormState({
                data: {
                    income: {
                        sources: [
                            { id: '1', name: 'Salary', amount: 5000, frequency: 'monthly' }
                        ],
                        totalMonthly: 5000
                    },
                    expenses: { selectedCategories: ['Housing'], customCategories: [] },
                    goals: [
                        { id: '1', description: 'Emergency Fund', targetAmount: 10000 }
                    ]
                }
            });
            expect(calculateCompletionPercentage(formState)).toBe(100);
        });

        it('should not count income source with zero amount', () => {
            const formState = createMockFormState({
                data: {
                    income: {
                        sources: [
                            { id: '1', name: 'Salary', amount: 0, frequency: 'monthly' }
                        ],
                        totalMonthly: 0
                    },
                    expenses: { selectedCategories: [], customCategories: [] },
                    goals: []
                }
            });
            expect(calculateCompletionPercentage(formState)).toBe(0);
        });

        it('should not count income source with empty name', () => {
            const formState = createMockFormState({
                data: {
                    income: {
                        sources: [
                            { id: '1', name: '  ', amount: 5000, frequency: 'monthly' }
                        ],
                        totalMonthly: 5000
                    },
                    expenses: { selectedCategories: [], customCategories: [] },
                    goals: []
                }
            });
            expect(calculateCompletionPercentage(formState)).toBe(0);
        });

        it('should not count goal with zero target amount', () => {
            const formState = createMockFormState({
                data: {
                    income: { sources: [], totalMonthly: 0 },
                    expenses: { selectedCategories: [], customCategories: [] },
                    goals: [
                        { id: '1', description: 'Emergency Fund', targetAmount: 0 }
                    ]
                }
            });
            expect(calculateCompletionPercentage(formState)).toBe(0);
        });

        it('should not count goal with empty description', () => {
            const formState = createMockFormState({
                data: {
                    income: { sources: [], totalMonthly: 0 },
                    expenses: { selectedCategories: [], customCategories: [] },
                    goals: [
                        { id: '1', description: '   ', targetAmount: 10000 }
                    ]
                }
            });
            expect(calculateCompletionPercentage(formState)).toBe(0);
        });

        it('should count custom categories as valid expenses', () => {
            const formState = createMockFormState({
                data: {
                    income: { sources: [], totalMonthly: 0 },
                    expenses: { selectedCategories: [], customCategories: ['Pet Care'] },
                    goals: []
                }
            });
            expect(calculateCompletionPercentage(formState)).toBe(33);
        });

        it('should handle multiple income sources and count if at least one is valid', () => {
            const formState = createMockFormState({
                data: {
                    income: {
                        sources: [
                            { id: '1', name: '', amount: 0, frequency: 'monthly' },
                            { id: '2', name: 'Salary', amount: 5000, frequency: 'monthly' }
                        ],
                        totalMonthly: 5000
                    },
                    expenses: { selectedCategories: [], customCategories: [] },
                    goals: []
                }
            });
            expect(calculateCompletionPercentage(formState)).toBe(33);
        });
    });

    describe('ProgressIndicator component', () => {
        it('should render with 0% progress for empty form', () => {
            const formState = createMockFormState();
            render(<ProgressIndicator formState={formState} />);

            expect(screen.getByText('Profile Completion')).toBeInTheDocument();
            expect(screen.getByText('0%')).toBeInTheDocument();
        });

        it('should render with correct percentage', () => {
            const formState = createMockFormState({
                data: {
                    income: {
                        sources: [
                            { id: '1', name: 'Salary', amount: 5000, frequency: 'monthly' }
                        ],
                        totalMonthly: 5000
                    },
                    expenses: { selectedCategories: ['Housing'], customCategories: [] },
                    goals: []
                }
            });
            render(<ProgressIndicator formState={formState} />);

            expect(screen.getByText('67%')).toBeInTheDocument();
        });

        it('should render with 100% progress when all fields completed', () => {
            const formState = createMockFormState({
                data: {
                    income: {
                        sources: [
                            { id: '1', name: 'Salary', amount: 5000, frequency: 'monthly' }
                        ],
                        totalMonthly: 5000
                    },
                    expenses: { selectedCategories: ['Housing'], customCategories: [] },
                    goals: [
                        { id: '1', description: 'Emergency Fund', targetAmount: 10000 }
                    ]
                }
            });
            render(<ProgressIndicator formState={formState} />);

            expect(screen.getByText('100%')).toBeInTheDocument();
        });

        it('should have proper accessibility attributes', () => {
            const formState = createMockFormState({
                data: {
                    income: {
                        sources: [
                            { id: '1', name: 'Salary', amount: 5000, frequency: 'monthly' }
                        ],
                        totalMonthly: 5000
                    },
                    expenses: { selectedCategories: [], customCategories: [] },
                    goals: []
                }
            });
            render(<ProgressIndicator formState={formState} />);

            const progressBar = screen.getByRole('progressbar');
            expect(progressBar).toHaveAttribute('aria-valuenow', '33');
            expect(progressBar).toHaveAttribute('aria-valuemin', '0');
            expect(progressBar).toHaveAttribute('aria-valuemax', '100');
            expect(progressBar).toHaveAttribute('aria-label', '33% complete');
        });

        it('should have aria-live region for percentage updates', () => {
            const formState = createMockFormState();
            render(<ProgressIndicator formState={formState} />);

            const percentage = screen.getByText('0%');
            expect(percentage).toHaveAttribute('aria-live', 'polite');
        });

        it('should render progress bar with correct width', () => {
            const formState = createMockFormState({
                data: {
                    income: {
                        sources: [
                            { id: '1', name: 'Salary', amount: 5000, frequency: 'monthly' }
                        ],
                        totalMonthly: 5000
                    },
                    expenses: { selectedCategories: ['Housing'], customCategories: [] },
                    goals: []
                }
            });
            const { container } = render(<ProgressIndicator formState={formState} />);

            const progressFill = container.querySelector('.progress-indicator__bar-fill');
            expect(progressFill).toHaveStyle({ width: '67%' });
        });
    });
});
