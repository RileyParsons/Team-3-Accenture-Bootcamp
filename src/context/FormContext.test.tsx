import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { FormProvider, useFormContext } from './FormContext';
import { storageManager } from '../utils/storage/storage';
import { IncomeSource, BudgetGoal } from '../types';

// Mock the storage manager
jest.mock('../utils/storage/storage', () => ({
    storageManager: {
        save: jest.fn(),
        load: jest.fn(() => null),
        clear: jest.fn(),
        isAvailable: jest.fn(() => true)
    }
}));

describe('FormContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FormProvider>{children}</FormProvider>
    );

    describe('useFormContext hook', () => {
        it('should throw error when used outside FormProvider', () => {
            // Suppress console.error for this test
            const originalError = console.error;
            console.error = jest.fn();

            expect(() => {
                renderHook(() => useFormContext());
            }).toThrow('useFormContext must be used within a FormProvider');

            console.error = originalError;
        });

        it('should return context when used inside FormProvider', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            expect(result.current).toBeDefined();
            expect(result.current.formState).toBeDefined();
            expect(result.current.addIncomeSource).toBeDefined();
        });
    });

    describe('Initial state', () => {
        it('should initialize with default form state', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            expect(result.current.formState.currentSection).toBe(0);
            expect(result.current.formState.sections).toHaveLength(4);
            expect(result.current.formState.data.income?.sources).toEqual([]);
            expect(result.current.formState.data.expenses?.selectedCategories).toEqual([]);
            expect(result.current.formState.data.goals).toEqual([]);
            expect(result.current.formState.isDirty).toBe(false);
            expect(result.current.formState.isSubmitting).toBe(false);
        });

        it('should load from localStorage if available', () => {
            const savedState = {
                currentSection: 1,
                sections: [
                    { id: 'income', title: 'Income Information', isComplete: true, isValid: true }
                ],
                data: {
                    income: {
                        sources: [{ id: '1', name: 'Salary', amount: 5000, frequency: 'monthly' as const }],
                        totalMonthly: 5000
                    }
                },
                errors: {},
                isDirty: true,
                isSubmitting: false
            };

            (storageManager.load as jest.Mock).mockReturnValueOnce(savedState);

            const { result } = renderHook(() => useFormContext(), { wrapper });

            expect(result.current.formState.currentSection).toBe(1);
            expect(result.current.formState.data.income?.sources).toHaveLength(1);
        });
    });

    describe('Income methods', () => {
        it('should add income source', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.addIncomeSource({
                    name: 'Salary',
                    amount: 5000,
                    frequency: 'monthly'
                });
            });

            expect(result.current.formState.data.income?.sources).toHaveLength(1);
            expect(result.current.formState.data.income?.sources[0].name).toBe('Salary');
            expect(result.current.formState.data.income?.sources[0].amount).toBe(5000);
            expect(result.current.formState.data.income?.totalMonthly).toBe(5000);
            expect(result.current.formState.isDirty).toBe(true);
        });

        it('should calculate total monthly income correctly for different frequencies', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.addIncomeSource({
                    name: 'Weekly Job',
                    amount: 500,
                    frequency: 'weekly'
                });
                result.current.addIncomeSource({
                    name: 'Bi-weekly Job',
                    amount: 1000,
                    frequency: 'bi-weekly'
                });
                result.current.addIncomeSource({
                    name: 'Annual Bonus',
                    amount: 12000,
                    frequency: 'annual'
                });
            });

            const totalMonthly = result.current.formState.data.income?.totalMonthly || 0;

            // Weekly: 500 * 52 / 12 = 2166.67
            // Bi-weekly: 1000 * 26 / 12 = 2166.67
            // Annual: 12000 / 12 = 1000
            // Total: ~5333.33
            expect(totalMonthly).toBeCloseTo(5333.33, 1);
        });

        it('should update income source', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            let sourceId: string;

            act(() => {
                result.current.addIncomeSource({
                    name: 'Salary',
                    amount: 5000,
                    frequency: 'monthly'
                });
            });

            sourceId = result.current.formState.data.income?.sources[0].id || '';

            act(() => {
                result.current.updateIncomeSource(sourceId, {
                    amount: 6000
                });
            });

            expect(result.current.formState.data.income?.sources[0].amount).toBe(6000);
            expect(result.current.formState.data.income?.totalMonthly).toBe(6000);
        });

        it('should remove income source', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            let sourceId: string;

            act(() => {
                result.current.addIncomeSource({
                    name: 'Salary',
                    amount: 5000,
                    frequency: 'monthly'
                });
            });

            sourceId = result.current.formState.data.income?.sources[0].id || '';

            act(() => {
                result.current.removeIncomeSource(sourceId);
            });

            expect(result.current.formState.data.income?.sources).toHaveLength(0);
            expect(result.current.formState.data.income?.totalMonthly).toBe(0);
        });
    });

    describe('Expense methods', () => {
        it('should toggle expense category', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.toggleExpenseCategory('Housing');
            });

            expect(result.current.formState.data.expenses?.selectedCategories).toContain('Housing');

            act(() => {
                result.current.toggleExpenseCategory('Housing');
            });

            expect(result.current.formState.data.expenses?.selectedCategories).not.toContain('Housing');
        });

        it('should add custom category', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.addCustomCategory('Pet Care');
            });

            expect(result.current.formState.data.expenses?.customCategories).toContain('Pet Care');
        });

        it('should not add duplicate custom categories', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.addCustomCategory('Pet Care');
                result.current.addCustomCategory('Pet Care');
            });

            expect(result.current.formState.data.expenses?.customCategories).toHaveLength(1);
        });

        it('should remove custom category', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.addCustomCategory('Pet Care');
                result.current.removeCustomCategory('Pet Care');
            });

            expect(result.current.formState.data.expenses?.customCategories).not.toContain('Pet Care');
        });
    });

    describe('Goal methods', () => {
        it('should add goal', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.addGoal({
                    description: 'Emergency Fund',
                    targetAmount: 10000
                });
            });

            expect(result.current.formState.data.goals).toHaveLength(1);
            expect(result.current.formState.data.goals?.[0].description).toBe('Emergency Fund');
            expect(result.current.formState.data.goals?.[0].targetAmount).toBe(10000);
        });

        it('should update goal', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            let goalId: string;

            act(() => {
                result.current.addGoal({
                    description: 'Emergency Fund',
                    targetAmount: 10000
                });
            });

            goalId = result.current.formState.data.goals?.[0].id || '';

            act(() => {
                result.current.updateGoal(goalId, {
                    targetAmount: 15000
                });
            });

            expect(result.current.formState.data.goals?.[0].targetAmount).toBe(15000);
        });

        it('should remove goal', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            let goalId: string;

            act(() => {
                result.current.addGoal({
                    description: 'Emergency Fund',
                    targetAmount: 10000
                });
            });

            goalId = result.current.formState.data.goals?.[0].id || '';

            act(() => {
                result.current.removeGoal(goalId);
            });

            expect(result.current.formState.data.goals).toHaveLength(0);
        });
    });

    describe('Navigation methods', () => {
        it('should navigate to specific section', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.goToSection(2);
            });

            expect(result.current.formState.currentSection).toBe(2);
        });

        it('should not navigate to invalid section index', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.goToSection(-1);
            });

            expect(result.current.formState.currentSection).toBe(0);

            act(() => {
                result.current.goToSection(10);
            });

            expect(result.current.formState.currentSection).toBe(0);
        });

        it('should navigate to next section', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.nextSection();
            });

            expect(result.current.formState.currentSection).toBe(1);
        });

        it('should not navigate beyond last section', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.goToSection(3);
                result.current.nextSection();
            });

            expect(result.current.formState.currentSection).toBe(3);
        });

        it('should navigate to previous section', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.goToSection(2);
                result.current.previousSection();
            });

            expect(result.current.formState.currentSection).toBe(1);
        });

        it('should not navigate before first section', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.previousSection();
            });

            expect(result.current.formState.currentSection).toBe(0);
        });
    });

    describe('Error handling', () => {
        it('should set error for field', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.setError('income.amount', 'Amount must be positive');
            });

            expect(result.current.formState.errors['income.amount']).toContain('Amount must be positive');
        });

        it('should not add duplicate errors', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.setError('income.amount', 'Amount must be positive');
                result.current.setError('income.amount', 'Amount must be positive');
            });

            expect(result.current.formState.errors['income.amount']).toHaveLength(1);
        });

        it('should clear error for field', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.setError('income.amount', 'Amount must be positive');
                result.current.clearError('income.amount');
            });

            expect(result.current.formState.errors['income.amount']).toBeUndefined();
        });
    });

    describe('Form control', () => {
        it('should set submitting state', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.setSubmitting(true);
            });

            expect(result.current.formState.isSubmitting).toBe(true);
        });

        it('should clear localStorage when submission completes', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.setSubmitting(true);
            });

            act(() => {
                result.current.setSubmitting(false);
            });

            expect(storageManager.clear).toHaveBeenCalledWith('form-data');
        });

        it('should reset form to initial state', () => {
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.addIncomeSource({
                    name: 'Salary',
                    amount: 5000,
                    frequency: 'monthly'
                });
                result.current.goToSection(2);
                result.current.resetForm();
            });

            expect(result.current.formState.currentSection).toBe(0);
            expect(result.current.formState.data.income?.sources).toHaveLength(0);
            expect(result.current.formState.isDirty).toBe(false);
            expect(storageManager.clear).toHaveBeenCalledWith('form-data');
        });
    });

    describe('Auto-save functionality', () => {
        it('should save to localStorage when form becomes dirty', () => {
            jest.useFakeTimers();
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.addIncomeSource({
                    name: 'Salary',
                    amount: 5000,
                    frequency: 'monthly'
                });
            });

            // Wait for useEffect to run
            act(() => {
                jest.runAllTimers();
            });

            expect(storageManager.save).toHaveBeenCalledWith(
                'form-data',
                expect.objectContaining({
                    isDirty: true
                })
            );

            jest.useRealTimers();
        });

        it('should not save when form is submitting', () => {
            jest.useFakeTimers();
            const { result } = renderHook(() => useFormContext(), { wrapper });

            act(() => {
                result.current.setSubmitting(true);
            });

            act(() => {
                jest.runAllTimers();
            });

            // Should not save when isSubmitting is true
            expect(storageManager.save).not.toHaveBeenCalled();

            jest.useRealTimers();
        });
    });
});
