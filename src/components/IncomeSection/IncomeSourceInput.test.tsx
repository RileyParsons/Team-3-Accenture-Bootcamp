import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IncomeSourceInput } from './IncomeSourceInput';
import { IncomeSource } from '../../types';

describe('IncomeSourceInput', () => {
    const mockOnChange = jest.fn();
    const mockOnRemove = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render all input fields', () => {
            render(
                <IncomeSourceInput
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                />
            );

            expect(screen.getByLabelText(/income source name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();
        });

        it('should render with initial source data', () => {
            const source: IncomeSource = {
                id: '1',
                name: 'Salary',
                amount: 5000,
                frequency: 'monthly'
            };

            render(
                <IncomeSourceInput
                    source={source}
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                />
            );

            expect(screen.getByDisplayValue('Salary')).toBeInTheDocument();
            expect(screen.getByDisplayValue('5000')).toBeInTheDocument();
            const frequencySelect = screen.getByLabelText(/frequency/i) as HTMLSelectElement;
            expect(frequencySelect.value).toBe('monthly');
        });

        it('should show remove button by default', () => {
            render(
                <IncomeSourceInput
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                />
            );

            expect(screen.getByRole('button', { name: /remove income source/i })).toBeInTheDocument();
        });

        it('should hide remove button when isOnly is true', () => {
            render(
                <IncomeSourceInput
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                    isOnly={true}
                />
            );

            expect(screen.queryByRole('button', { name: /remove income source/i })).not.toBeInTheDocument();
        });
    });

    describe('User Interactions', () => {
        it('should call onChange when name is entered', async () => {
            render(
                <IncomeSourceInput
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                    showValidation={false}
                />
            );

            const nameInput = screen.getByLabelText(/income source name/i);
            fireEvent.change(nameInput, { target: { value: 'Freelance' } });

            await waitFor(() => {
                expect(mockOnChange).toHaveBeenCalled();
            });
        });

        it('should call onChange when amount is entered', async () => {
            render(
                <IncomeSourceInput
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                    showValidation={false}
                />
            );

            const amountInput = screen.getByLabelText(/amount/i);
            fireEvent.change(amountInput, { target: { value: '3000' } });

            await waitFor(() => {
                expect(mockOnChange).toHaveBeenCalled();
            });
        });

        it('should call onChange when frequency is changed', async () => {
            render(
                <IncomeSourceInput
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                    showValidation={false}
                />
            );

            const frequencySelect = screen.getByLabelText(/frequency/i);
            fireEvent.change(frequencySelect, { target: { value: 'bi-weekly' } });

            await waitFor(() => {
                expect(mockOnChange).toHaveBeenCalled();
            });
        });

        it('should call onRemove when remove button is clicked', () => {
            render(
                <IncomeSourceInput
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                />
            );

            const removeButton = screen.getByRole('button', { name: /remove income source/i });
            fireEvent.click(removeButton);

            expect(mockOnRemove).toHaveBeenCalledTimes(1);
        });
    });

    describe('Validation', () => {
        it('should show validation error for empty name', async () => {
            render(
                <IncomeSourceInput
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                    showValidation={true}
                />
            );

            const nameInput = screen.getByLabelText(/income source name/i);
            fireEvent.change(nameInput, { target: { value: '' } });

            await waitFor(() => {
                expect(screen.getByText(/income source name cannot be empty/i)).toBeInTheDocument();
            });
        });

        it('should show validation error for invalid amount', async () => {
            render(
                <IncomeSourceInput
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                    showValidation={true}
                />
            );

            const amountInput = screen.getByLabelText(/amount/i);
            fireEvent.change(amountInput, { target: { value: '-100' } });

            await waitFor(() => {
                expect(screen.getByText(/income amount must be a positive number/i)).toBeInTheDocument();
            });
        });

        it('should show validation error for zero amount', async () => {
            render(
                <IncomeSourceInput
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                    showValidation={true}
                />
            );

            const amountInput = screen.getByLabelText(/amount/i);
            fireEvent.change(amountInput, { target: { value: '0' } });

            await waitFor(() => {
                expect(screen.getByText(/income amount must be a positive number/i)).toBeInTheDocument();
            });
        });

        it('should not show validation errors when showValidation is false', async () => {
            render(
                <IncomeSourceInput
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                    showValidation={false}
                />
            );

            const nameInput = screen.getByLabelText(/income source name/i);
            fireEvent.change(nameInput, { target: { value: '' } });

            await waitFor(() => {
                expect(screen.queryByText(/income source name cannot be empty/i)).not.toBeInTheDocument();
            });
        });

        it('should clear validation error when valid input is provided', async () => {
            render(
                <IncomeSourceInput
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                    showValidation={true}
                />
            );

            const nameInput = screen.getByLabelText(/income source name/i);

            // First enter invalid input
            fireEvent.change(nameInput, { target: { value: '' } });
            await waitFor(() => {
                expect(screen.getByText(/income source name cannot be empty/i)).toBeInTheDocument();
            });

            // Then enter valid input
            fireEvent.change(nameInput, { target: { value: 'Salary' } });
            await waitFor(() => {
                expect(screen.queryByText(/income source name cannot be empty/i)).not.toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('should have proper labels for all inputs', () => {
            render(
                <IncomeSourceInput
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                />
            );

            expect(screen.getByLabelText(/income source name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();
        });

        it('should set aria-invalid when validation fails', async () => {
            render(
                <IncomeSourceInput
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                    showValidation={true}
                />
            );

            const amountInput = screen.getByLabelText(/amount/i);
            fireEvent.change(amountInput, { target: { value: '-100' } });

            await waitFor(() => {
                expect(amountInput).toHaveAttribute('aria-invalid', 'true');
            });
        });

        it('should link error messages with aria-describedby', async () => {
            const source: IncomeSource = {
                id: 'test-id',
                name: '',
                amount: 0,
                frequency: 'monthly'
            };

            render(
                <IncomeSourceInput
                    source={source}
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                    showValidation={true}
                />
            );

            const nameInput = screen.getByLabelText(/income source name/i);
            fireEvent.change(nameInput, { target: { value: '' } });

            await waitFor(() => {
                expect(nameInput).toHaveAttribute('aria-describedby', 'income-name-error-test-id');
            });
        });
    });

    describe('Frequency Options', () => {
        it('should have all frequency options available', () => {
            render(
                <IncomeSourceInput
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                />
            );

            const frequencySelect = screen.getByLabelText(/frequency/i);
            const options = Array.from(frequencySelect.querySelectorAll('option')).map(
                (option) => option.value
            );

            expect(options).toEqual(['weekly', 'bi-weekly', 'monthly', 'annual']);
        });

        it('should default to monthly frequency', () => {
            render(
                <IncomeSourceInput
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                    showValidation={false}
                />
            );

            const frequencySelect = screen.getByLabelText(/frequency/i) as HTMLSelectElement;
            expect(frequencySelect.value).toBe('monthly');
        });
    });

    describe('Data Integration', () => {
        it('should call onChange with complete data when all fields are valid', async () => {
            render(
                <IncomeSourceInput
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                    showValidation={false}
                />
            );

            const nameInput = screen.getByLabelText(/income source name/i);
            const amountInput = screen.getByLabelText(/amount/i);
            const frequencySelect = screen.getByLabelText(/frequency/i);

            fireEvent.change(nameInput, { target: { value: 'Salary' } });
            fireEvent.change(amountInput, { target: { value: '5000' } });
            fireEvent.change(frequencySelect, { target: { value: 'monthly' } });

            await waitFor(() => {
                expect(mockOnChange).toHaveBeenCalledWith(
                    expect.objectContaining({
                        name: 'Salary',
                        amount: 5000,
                        frequency: 'monthly'
                    })
                );
            });
        });

        it('should trim whitespace from name', async () => {
            render(
                <IncomeSourceInput
                    onChange={mockOnChange}
                    onRemove={mockOnRemove}
                    showValidation={false}
                />
            );

            const nameInput = screen.getByLabelText(/income source name/i);
            fireEvent.change(nameInput, { target: { value: '  Salary  ' } });

            await waitFor(() => {
                expect(mockOnChange).toHaveBeenCalledWith(
                    expect.objectContaining({
                        name: 'Salary'
                    })
                );
            });
        });
    });
});
