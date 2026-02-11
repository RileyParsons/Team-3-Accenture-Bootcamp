import React, { useState, useEffect } from 'react';
import { IncomeSource } from '../../types';
import { ValidationMessage } from '../ValidationMessage';
import { validationEngine } from '../../utils/validation/validation';
import './IncomeSourceInput.css';

export interface IncomeSourceInputProps {
    /**
     * The income source data to display/edit
     */
    source?: IncomeSource;
    /**
     * Callback when the income source is updated
     */
    onChange: (data: Partial<IncomeSource>) => void;
    /**
     * Callback when the remove button is clicked
     */
    onRemove: () => void;
    /**
     * Whether this is the only income source (affects remove button visibility)
     */
    isOnly?: boolean;
    /**
     * Whether to show validation errors
     */
    showValidation?: boolean;
}

/**
 * IncomeSourceInput component for entering income source details
 * Provides input fields for name, amount, and frequency with real-time validation
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export const IncomeSourceInput: React.FC<IncomeSourceInputProps> = ({
    source,
    onChange,
    onRemove,
    isOnly = false,
    showValidation = true
}) => {
    const [name, setName] = useState(source?.name || '');
    const [amount, setAmount] = useState(source?.amount?.toString() || '');
    const [frequency, setFrequency] = useState<IncomeSource['frequency']>(source?.frequency || 'monthly');

    const [nameError, setNameError] = useState<string | undefined>();
    const [amountError, setAmountError] = useState<string | undefined>();

    // Validate and update parent when values change
    useEffect(() => {
        // Validate name
        const nameValidation = validationEngine.validate('income.name', name);
        setNameError(showValidation && !nameValidation.isValid ? nameValidation.error : undefined);

        // Validate amount
        const amountNum = parseFloat(amount);
        const amountValidation = validationEngine.validate('income.amount', amountNum);
        setAmountError(showValidation && !amountValidation.isValid ? amountValidation.error : undefined);

        // Call onChange with current data (parent can decide what to do with it)
        // Only include valid numeric amount if it's actually a number
        const dataToSend: Partial<IncomeSource> = {
            name: name.trim(),
            frequency
        };

        if (!isNaN(amountNum)) {
            dataToSend.amount = amountNum;
        }

        onChange(dataToSend);
    }, [name, amount, frequency, onChange, showValidation]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value);
    };

    const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFrequency(e.target.value as IncomeSource['frequency']);
    };

    return (
        <div className="income-source-input">
            <div className="income-source-input__fields">
                <div className="income-source-input__field">
                    <label htmlFor={`income-name-${source?.id}`} className="income-source-input__label">
                        Income Source Name
                    </label>
                    <input
                        id={`income-name-${source?.id}`}
                        type="text"
                        className="income-source-input__input"
                        value={name}
                        onChange={handleNameChange}
                        placeholder="e.g., Salary, Freelance"
                        aria-describedby={nameError ? `income-name-error-${source?.id}` : undefined}
                        aria-invalid={!!nameError}
                    />
                    {nameError && (
                        <ValidationMessage
                            id={`income-name-error-${source?.id}`}
                            message={nameError}
                        />
                    )}
                </div>

                <div className="income-source-input__field">
                    <label htmlFor={`income-amount-${source?.id}`} className="income-source-input__label">
                        Amount
                    </label>
                    <input
                        id={`income-amount-${source?.id}`}
                        type="number"
                        className="income-source-input__input"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        aria-describedby={amountError ? `income-amount-error-${source?.id}` : undefined}
                        aria-invalid={!!amountError}
                    />
                    {amountError && (
                        <ValidationMessage
                            id={`income-amount-error-${source?.id}`}
                            message={amountError}
                        />
                    )}
                </div>

                <div className="income-source-input__field">
                    <label htmlFor={`income-frequency-${source?.id}`} className="income-source-input__label">
                        Frequency
                    </label>
                    <select
                        id={`income-frequency-${source?.id}`}
                        className="income-source-input__select"
                        value={frequency}
                        onChange={handleFrequencyChange}
                        aria-label="Frequency"
                    >
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                    </select>
                </div>
            </div>

            {!isOnly && (
                <button
                    type="button"
                    className="income-source-input__remove-btn"
                    onClick={onRemove}
                    aria-label="Remove income source"
                >
                    Remove
                </button>
            )}
        </div>
    );
};
