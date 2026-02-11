import React from 'react';
import './ValidationMessage.css';

export interface ValidationMessageProps {
    /**
     * The error message(s) to display
     */
    message?: string | string[];
    /**
     * Optional ID for the message container (useful for aria-describedby)
     */
    id?: string;
    /**
     * Whether to show the message (defaults to true if message is provided)
     */
    visible?: boolean;
}

/**
 * ValidationMessage component displays error messages with consistent styling
 * and accessibility support.
 * 
 * Requirements: 5.2, 5.3
 */
export const ValidationMessage: React.FC<ValidationMessageProps> = ({
    message,
    id,
    visible = true,
}) => {
    // Don't render if no message or not visible
    if (!message || !visible) {
        return null;
    }

    // Normalize message to array for consistent handling
    const messages = Array.isArray(message) ? message : [message];

    // Filter out empty messages
    const validMessages = messages.filter(msg => msg && msg.trim().length > 0);

    if (validMessages.length === 0) {
        return null;
    }

    return (
        <div
            id={id}
            className="validation-message"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
        >
            {validMessages.length === 1 ? (
                <span className="validation-message__text">{validMessages[0]}</span>
            ) : (
                <ul className="validation-message__list">
                    {validMessages.map((msg, index) => (
                        <li key={index} className="validation-message__item">
                            {msg}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
