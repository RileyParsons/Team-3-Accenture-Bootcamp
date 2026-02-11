import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { BudgetProfile, FormState, IncomeSource, BudgetGoal, ExpenseData, Section } from '../types';
import { storageManager } from '../utils/storage/storage';

const STORAGE_KEY = 'form-data';

/**
 * FormContext interface defining all methods and state available to consumers
 */
interface FormContextType {
    // State
    formState: FormState;

    // Income methods
    addIncomeSource: (source: Omit<IncomeSource, 'id'>) => void;
    updateIncomeSource: (id: string, data: Partial<IncomeSource>) => void;
    removeIncomeSource: (id: string) => void;

    // Expense methods
    toggleExpenseCategory: (category: string) => void;
    addCustomCategory: (category: string) => void;
    removeCustomCategory: (category: string) => void;

    // Goal methods
    addGoal: (goal: Omit<BudgetGoal, 'id'>) => void;
    updateGoal: (id: string, data: Partial<BudgetGoal>) => void;
    removeGoal: (id: string) => void;

    // Navigation methods
    goToSection: (sectionIndex: number) => void;
    nextSection: () => void;
    previousSection: () => void;

    // Form control methods
    setError: (field: string, error: string) => void;
    clearError: (field: string) => void;
    setSubmitting: (isSubmitting: boolean) => void;
    resetForm: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

/**
 * Hook to access FormContext
 * Throws error if used outside of FormProvider
 */
export const useFormContext = (): FormContextType => {
    const context = useContext(FormContext);
    if (!context) {
        throw new Error('useFormContext must be used within a FormProvider');
    }
    return context;
};

interface FormProviderProps {
    children: ReactNode;
    initialData?: Partial<BudgetProfile>;
}

/**
 * FormProvider component that manages all form state and provides methods to update it
 * Integrates with LocalStorageManager for auto-save functionality
 */
export const FormProvider: React.FC<FormProviderProps> = ({ children, initialData }) => {
    // Initialize sections
    const initialSections: Section[] = [
        { id: 'income', title: 'Income Information', isComplete: false, isValid: false },
        { id: 'expenses', title: 'Expense Categories', isComplete: false, isValid: false },
        { id: 'goals', title: 'Financial Goals', isComplete: false, isValid: false },
        { id: 'review', title: 'Review & Submit', isComplete: false, isValid: false }
    ];

    // Initialize form state
    const [formState, setFormState] = useState<FormState>(() => {
        // Try to load from localStorage first
        const savedData = storageManager.load(STORAGE_KEY);

        if (savedData) {
            return {
                ...savedData,
                isSubmitting: false // Always reset submitting state on load
            };
        }

        // Otherwise use initial data or defaults
        return {
            currentSection: 0,
            sections: initialSections,
            data: initialData || {
                income: { sources: [], totalMonthly: 0 },
                expenses: { selectedCategories: [], customCategories: [] },
                goals: []
            },
            errors: {},
            isDirty: false,
            isSubmitting: false
        };
    });

    // Auto-save to localStorage whenever form state changes
    useEffect(() => {
        if (formState.isDirty && !formState.isSubmitting) {
            storageManager.save(STORAGE_KEY, formState);
        }
    }, [formState]);

    // Helper to generate unique IDs
    const generateId = (): string => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    // Helper to calculate total monthly income
    const calculateTotalMonthly = (sources: IncomeSource[]): number => {
        return sources.reduce((total, source) => {
            let monthlyAmount = source.amount;

            switch (source.frequency) {
                case 'weekly':
                    monthlyAmount = source.amount * 52 / 12;
                    break;
                case 'bi-weekly':
                    monthlyAmount = source.amount * 26 / 12;
                    break;
                case 'annual':
                    monthlyAmount = source.amount / 12;
                    break;
                case 'monthly':
                default:
                    monthlyAmount = source.amount;
            }

            return total + monthlyAmount;
        }, 0);
    };

    // Income methods
    const addIncomeSource = useCallback((source: Omit<IncomeSource, 'id'>) => {
        setFormState(prev => {
            const newSource: IncomeSource = {
                ...source,
                id: generateId()
            };

            const sources = [...(prev.data.income?.sources || []), newSource];
            const totalMonthly = calculateTotalMonthly(sources);

            return {
                ...prev,
                data: {
                    ...prev.data,
                    income: {
                        sources,
                        totalMonthly
                    }
                },
                isDirty: true
            };
        });
    }, []);

    const updateIncomeSource = useCallback((id: string, data: Partial<IncomeSource>) => {
        setFormState(prev => {
            const sources = (prev.data.income?.sources || []).map(source =>
                source.id === id ? { ...source, ...data } : source
            );
            const totalMonthly = calculateTotalMonthly(sources);

            return {
                ...prev,
                data: {
                    ...prev.data,
                    income: {
                        sources,
                        totalMonthly
                    }
                },
                isDirty: true
            };
        });
    }, []);

    const removeIncomeSource = useCallback((id: string) => {
        setFormState(prev => {
            const sources = (prev.data.income?.sources || []).filter(source => source.id !== id);
            const totalMonthly = calculateTotalMonthly(sources);

            return {
                ...prev,
                data: {
                    ...prev.data,
                    income: {
                        sources,
                        totalMonthly
                    }
                },
                isDirty: true
            };
        });
    }, []);

    // Expense methods
    const toggleExpenseCategory = useCallback((category: string) => {
        setFormState(prev => {
            const currentCategories = prev.data.expenses?.selectedCategories || [];
            const isSelected = currentCategories.includes(category);

            const selectedCategories = isSelected
                ? currentCategories.filter(c => c !== category)
                : [...currentCategories, category];

            return {
                ...prev,
                data: {
                    ...prev.data,
                    expenses: {
                        ...prev.data.expenses,
                        selectedCategories,
                        customCategories: prev.data.expenses?.customCategories || []
                    }
                },
                isDirty: true
            };
        });
    }, []);

    const addCustomCategory = useCallback((category: string) => {
        setFormState(prev => {
            const customCategories = prev.data.expenses?.customCategories || [];

            // Avoid duplicates
            if (customCategories.includes(category)) {
                return prev;
            }

            return {
                ...prev,
                data: {
                    ...prev.data,
                    expenses: {
                        selectedCategories: prev.data.expenses?.selectedCategories || [],
                        customCategories: [...customCategories, category]
                    }
                },
                isDirty: true
            };
        });
    }, []);

    const removeCustomCategory = useCallback((category: string) => {
        setFormState(prev => {
            const customCategories = (prev.data.expenses?.customCategories || [])
                .filter(c => c !== category);

            return {
                ...prev,
                data: {
                    ...prev.data,
                    expenses: {
                        selectedCategories: prev.data.expenses?.selectedCategories || [],
                        customCategories
                    }
                },
                isDirty: true
            };
        });
    }, []);

    // Goal methods
    const addGoal = useCallback((goal: Omit<BudgetGoal, 'id'>) => {
        setFormState(prev => {
            const newGoal: BudgetGoal = {
                ...goal,
                id: generateId()
            };

            return {
                ...prev,
                data: {
                    ...prev.data,
                    goals: [...(prev.data.goals || []), newGoal]
                },
                isDirty: true
            };
        });
    }, []);

    const updateGoal = useCallback((id: string, data: Partial<BudgetGoal>) => {
        setFormState(prev => {
            const goals = (prev.data.goals || []).map(goal =>
                goal.id === id ? { ...goal, ...data } : goal
            );

            return {
                ...prev,
                data: {
                    ...prev.data,
                    goals
                },
                isDirty: true
            };
        });
    }, []);

    const removeGoal = useCallback((id: string) => {
        setFormState(prev => {
            const goals = (prev.data.goals || []).filter(goal => goal.id !== id);

            return {
                ...prev,
                data: {
                    ...prev.data,
                    goals
                },
                isDirty: true
            };
        });
    }, []);

    // Navigation methods
    const goToSection = useCallback((sectionIndex: number) => {
        setFormState(prev => {
            if (sectionIndex < 0 || sectionIndex >= prev.sections.length) {
                return prev;
            }

            return {
                ...prev,
                currentSection: sectionIndex,
                isDirty: true
            };
        });
    }, []);

    const nextSection = useCallback(() => {
        setFormState(prev => {
            const nextIndex = prev.currentSection + 1;
            if (nextIndex >= prev.sections.length) {
                return prev;
            }

            return {
                ...prev,
                currentSection: nextIndex,
                isDirty: true
            };
        });
    }, []);

    const previousSection = useCallback(() => {
        setFormState(prev => {
            const prevIndex = prev.currentSection - 1;
            if (prevIndex < 0) {
                return prev;
            }

            return {
                ...prev,
                currentSection: prevIndex,
                isDirty: true
            };
        });
    }, []);

    // Form control methods
    const setError = useCallback((field: string, error: string) => {
        setFormState(prev => {
            const fieldErrors = prev.errors[field] || [];

            // Avoid duplicate errors
            if (fieldErrors.includes(error)) {
                return prev;
            }

            return {
                ...prev,
                errors: {
                    ...prev.errors,
                    [field]: [...fieldErrors, error]
                }
            };
        });
    }, []);

    const clearError = useCallback((field: string) => {
        setFormState(prev => {
            const { [field]: _, ...remainingErrors } = prev.errors;

            return {
                ...prev,
                errors: remainingErrors
            };
        });
    }, []);

    const setSubmitting = useCallback((isSubmitting: boolean) => {
        setFormState(prev => ({
            ...prev,
            isSubmitting
        }));

        // Clear localStorage on successful submission
        if (!isSubmitting && formState.isSubmitting) {
            storageManager.clear(STORAGE_KEY);
        }
    }, [formState.isSubmitting]);

    const resetForm = useCallback(() => {
        setFormState({
            currentSection: 0,
            sections: initialSections,
            data: {
                income: { sources: [], totalMonthly: 0 },
                expenses: { selectedCategories: [], customCategories: [] },
                goals: []
            },
            errors: {},
            isDirty: false,
            isSubmitting: false
        });
        storageManager.clear(STORAGE_KEY);
    }, []);

    const contextValue: FormContextType = {
        formState,
        addIncomeSource,
        updateIncomeSource,
        removeIncomeSource,
        toggleExpenseCategory,
        addCustomCategory,
        removeCustomCategory,
        addGoal,
        updateGoal,
        removeGoal,
        goToSection,
        nextSection,
        previousSection,
        setError,
        clearError,
        setSubmitting,
        resetForm
    };

    return (
        <FormContext.Provider value={contextValue}>
            {children}
        </FormContext.Provider>
    );
};
