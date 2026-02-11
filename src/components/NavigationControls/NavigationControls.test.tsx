import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NavigationControls } from './NavigationControls';
import { FormProvider, useFormContext } from '../../context/FormContext';
import { BudgetProfile } from '../../types';

// Clear localStorage before each test
beforeEach(() => {
    localStorage.clear();
});

// Helper component to manipulate form state for testing
const FormStateManipulator: React.FC<{
    currentSection?: number;
    data?: Partial<BudgetProfile>;
}> = ({ currentSection, data }) => {
    const { goToSection, addIncomeSource, toggleExpenseCategory, addCustomCategory, addGoal } = useFormContext();

    React.useEffect(() => {
        // Set current section
        if (currentSection !== undefined) {
            goToSection(currentSection);
        }

        // Add income sources
        if (data?.income?.sources) {
            data.income.sources.forEach(source => {
                addIncomeSource({
                    name: source.name,
                    amount: source.amount,
                    frequency: source.frequency
                });
            });
        }

        // Add expense categories
        if (data?.expenses?.selectedCategories) {
            data.expenses.selectedCategories.forEach(category => {
                toggleExpenseCategory(category);
            });
        }

        // Add custom categories
        if (data?.expenses?.customCategories) {
            data.expenses.customCategories.forEach(category => {
                addCustomCategory(category);
            });
        }

        // Add goals
        if (data?.goals) {
            data.goals.forEach(goal => {
                addGoal({
                    description: goal.description,
                    targetAmount: goal.targetAmount,
                    targetDate: goal.targetDate,
                    timeframe: goal.timeframe
                });
            });
        }
    }, []);

    return null;
};

// Helper to render NavigationControls with FormProvider
const renderWithFormProvider = (options?: {
    currentSection?: number;
    data?: Partial<BudgetProfile>;
    initialData?: Partial<BudgetProfile>;
}) => {
    const { currentSection, data, initialData } = options || {};

    return render(
        <FormProvider initialData={initialData}>
            {data || currentSection !== undefined ? (
                <FormStateManipulator currentSection={currentSection} data={data} />
            ) : null}
            <NavigationControls />
        </FormProvider>
    );
};

describe('NavigationControls', () => {
    describe('Button rendering', () => {
        it('should render Previous and Next buttons', () => {
            renderWithFormProvider();

            expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
        });

        it('should have navigation role and label', () => {
            renderWithFormProvider();

            const nav = screen.getByRole('navigation', { name: /form navigation/i });
            expect(nav).toBeInTheDocument();
        });
    });

    describe('Previous button state', () => {
        it('should disable Previous button on first section', async () => {
            renderWithFormProvider();

            const previousButton = screen.getByRole('button', { name: /previous/i });
            expect(previousButton).toBeDisabled();
        });

        it('should enable Previous button on second section', async () => {
            renderWithFormProvider({ currentSection: 1 });

            await waitFor(() => {
                const previousButton = screen.getByRole('button', { name: /previous/i });
                expect(previousButton).not.toBeDisabled();
            });
        });

        it('should enable Previous button on last section', async () => {
            renderWithFormProvider({ currentSection: 3 });

            await waitFor(() => {
                const previousButton = screen.getByRole('button', { name: /previous/i });
                expect(previousButton).not.toBeDisabled();
            });
        });
    });

    describe('Next button state - Income section', () => {
        it('should disable Next button when income section is empty', () => {
            renderWithFormProvider();

            const nextButton = screen.getByRole('button', { name: /next/i });
            expect(nextButton).toBeDisabled();
        });

        it('should enable Next button when income section has valid data', async () => {
            renderWithFormProvider({
                data: {
                    income: {
                        sources: [
                            { id: '1', name: 'Salary', amount: 5000, frequency: 'monthly' }
                        ],
                        totalMonthly: 5000
                    }
                }
            });

            await waitFor(() => {
                const nextButton = screen.getByRole('button', { name: /next/i });
                expect(nextButton).not.toBeDisabled();
            });
        });

        it('should disable Next button when income has zero amount', async () => {
            renderWithFormProvider({
                data: {
                    income: {
                        sources: [
                            { id: '1', name: 'Salary', amount: 0, frequency: 'monthly' }
                        ],
                        totalMonthly: 0
                    }
                }
            });

            await waitFor(() => {
                const nextButton = screen.getByRole('button', { name: /next/i });
                expect(nextButton).toBeDisabled();
            });
        });

        it('should disable Next button when income has empty name', async () => {
            renderWithFormProvider({
                data: {
                    income: {
                        sources: [
                            { id: '1', name: '  ', amount: 5000, frequency: 'monthly' }
                        ],
                        totalMonthly: 5000
                    }
                }
            });

            await waitFor(() => {
                const nextButton = screen.getByRole('button', { name: /next/i });
                expect(nextButton).toBeDisabled();
            });
        });
    });

    describe('Next button state - Expenses section', () => {
        it('should disable Next button when expenses section is empty', async () => {
            renderWithFormProvider({ currentSection: 1 });

            await waitFor(() => {
                const nextButton = screen.getByRole('button', { name: /next/i });
                expect(nextButton).toBeDisabled();
            });
        });

        it('should enable Next button when at least one predefined category is selected', async () => {
            renderWithFormProvider({
                currentSection: 1,
                data: {
                    expenses: { selectedCategories: ['Housing'], customCategories: [] }
                }
            });

            await waitFor(() => {
                const nextButton = screen.getByRole('button', { name: /next/i });
                expect(nextButton).not.toBeDisabled();
            });
        });

        it('should enable Next button when at least one custom category exists', async () => {
            renderWithFormProvider({
                currentSection: 1,
                data: {
                    expenses: { selectedCategories: [], customCategories: ['Pet Care'] }
                }
            });

            await waitFor(() => {
                const nextButton = screen.getByRole('button', { name: /next/i });
                expect(nextButton).not.toBeDisabled();
            });
        });
    });

    describe('Next button state - Goals section', () => {
        it('should disable Next button when goals section is empty', async () => {
            renderWithFormProvider({ currentSection: 2 });

            await waitFor(() => {
                const nextButton = screen.getByRole('button', { name: /next/i });
                expect(nextButton).toBeDisabled();
            });
        });

        it('should enable Next button when goals section has valid data', async () => {
            renderWithFormProvider({
                currentSection: 2,
                data: {
                    goals: [
                        { id: '1', description: 'Emergency Fund', targetAmount: 10000 }
                    ]
                }
            });

            await waitFor(() => {
                const nextButton = screen.getByRole('button', { name: /next/i });
                expect(nextButton).not.toBeDisabled();
            });
        });

        it('should disable Next button when goal has zero amount', async () => {
            renderWithFormProvider({
                currentSection: 2,
                data: {
                    goals: [
                        { id: '1', description: 'Emergency Fund', targetAmount: 0 }
                    ]
                }
            });

            await waitFor(() => {
                const nextButton = screen.getByRole('button', { name: /next/i });
                expect(nextButton).toBeDisabled();
            });
        });

        it('should disable Next button when goal has empty description', async () => {
            renderWithFormProvider({
                currentSection: 2,
                data: {
                    goals: [
                        { id: '1', description: '  ', targetAmount: 10000 }
                    ]
                }
            });

            await waitFor(() => {
                const nextButton = screen.getByRole('button', { name: /next/i });
                expect(nextButton).toBeDisabled();
            });
        });
    });

    describe('Next button state - Review section', () => {
        it('should disable Next button on last section', async () => {
            renderWithFormProvider({ currentSection: 3 });

            await waitFor(() => {
                const nextButton = screen.getByRole('button', { name: /next/i });
                expect(nextButton).toBeDisabled();
            });
        });
    });

    describe('Navigation callbacks', () => {
        it('should call onNavigate with "next" when Next button is clicked', async () => {
            const onNavigate = jest.fn();

            render(
                <FormProvider
                    initialData={{
                        income: {
                            sources: [
                                { id: '1', name: 'Salary', amount: 5000, frequency: 'monthly' }
                            ],
                            totalMonthly: 5000
                        }
                    }}
                >
                    <NavigationControls onNavigate={onNavigate} />
                </FormProvider>
            );

            await waitFor(() => {
                const nextButton = screen.getByRole('button', { name: /next/i });
                expect(nextButton).not.toBeDisabled();
            });

            const nextButton = screen.getByRole('button', { name: /next/i });
            fireEvent.click(nextButton);

            expect(onNavigate).toHaveBeenCalledWith('next');
        });

        it('should call onNavigate with "previous" when Previous button is clicked', async () => {
            const onNavigate = jest.fn();

            render(
                <FormProvider
                    initialData={{
                        income: {
                            sources: [
                                { id: '1', name: 'Salary', amount: 5000, frequency: 'monthly' }
                            ],
                            totalMonthly: 5000
                        }
                    }}
                >
                    <NavigationControls onNavigate={onNavigate} />
                </FormProvider>
            );

            // Wait for component to be ready
            await waitFor(() => {
                const nextButton = screen.getByRole('button', { name: /next/i });
                expect(nextButton).not.toBeDisabled();
            });

            // First navigate to second section
            const nextButton = screen.getByRole('button', { name: /next/i });
            fireEvent.click(nextButton);

            // Wait for navigation to complete
            await waitFor(() => {
                const previousButton = screen.getByRole('button', { name: /previous/i });
                expect(previousButton).not.toBeDisabled();
            });

            // Then click previous
            const previousButton = screen.getByRole('button', { name: /previous/i });
            fireEvent.click(previousButton);

            expect(onNavigate).toHaveBeenCalledWith('previous');
        });
    });

    describe('Edge cases', () => {
        it('should handle multiple income sources correctly', async () => {
            renderWithFormProvider({
                data: {
                    income: {
                        sources: [
                            { id: '1', name: 'Salary', amount: 5000, frequency: 'monthly' },
                            { id: '2', name: 'Freelance', amount: 1000, frequency: 'monthly' }
                        ],
                        totalMonthly: 6000
                    }
                }
            });

            await waitFor(() => {
                const nextButton = screen.getByRole('button', { name: /next/i });
                expect(nextButton).not.toBeDisabled();
            });
        });

        it('should handle multiple goals correctly', async () => {
            renderWithFormProvider({
                currentSection: 2,
                data: {
                    goals: [
                        { id: '1', description: 'Emergency Fund', targetAmount: 10000 },
                        { id: '2', description: 'Vacation', targetAmount: 5000 }
                    ]
                }
            });

            await waitFor(() => {
                const nextButton = screen.getByRole('button', { name: /next/i });
                expect(nextButton).not.toBeDisabled();
            });
        });

        it('should enable Next if at least one valid income source exists among multiple', async () => {
            renderWithFormProvider({
                data: {
                    income: {
                        sources: [
                            { id: '1', name: '', amount: 0, frequency: 'monthly' },
                            { id: '2', name: 'Salary', amount: 5000, frequency: 'monthly' }
                        ],
                        totalMonthly: 5000
                    }
                }
            });

            await waitFor(() => {
                const nextButton = screen.getByRole('button', { name: /next/i });
                expect(nextButton).not.toBeDisabled();
            });
        });
    });
});
