import React from 'react';
import { render, screen } from '@testing-library/react';
import { ValidationMessage } from './ValidationMessage';

describe('ValidationMessage', () => {
    describe('Rendering', () => {
        it('should render a single error message', () => {
            render(<ValidationMessage message="This field is required" />);
            expect(screen.getByText('This field is required')).toBeInTheDocument();
        });

        it('should render multiple error messages as a list', () => {
            const messages = [
                'This field is required',
                'Must be a positive number',
            ];
            render(<ValidationMessage message={messages} />);

            expect(screen.getByText('This field is required')).toBeInTheDocument();
            expect(screen.getByText('Must be a positive number')).toBeInTheDocument();

            // Should render as a list
            const list = screen.getByRole('alert').querySelector('ul');
            expect(list).toBeInTheDocument();
            expect(list?.children).toHaveLength(2);
        });

        it('should not render when message is undefined', () => {
            const { container } = render(<ValidationMessage />);
            expect(container.firstChild).toBeNull();
        });

        it('should not render when message is empty string', () => {
            const { container } = render(<ValidationMessage message="" />);
            expect(container.firstChild).toBeNull();
        });

        it('should not render when message array is empty', () => {
            const { container } = render(<ValidationMessage message={[]} />);
            expect(container.firstChild).toBeNull();
        });

        it('should not render when visible is false', () => {
            const { container } = render(
                <ValidationMessage message="Error" visible={false} />
            );
            expect(container.firstChild).toBeNull();
        });

        it('should filter out empty strings from message array', () => {
            const messages = ['Valid error', '', '  ', 'Another error'];
            render(<ValidationMessage message={messages} />);

            expect(screen.getByText('Valid error')).toBeInTheDocument();
            expect(screen.getByText('Another error')).toBeInTheDocument();

            const list = screen.getByRole('alert').querySelector('ul');
            expect(list?.children).toHaveLength(2);
        });
    });

    describe('Accessibility', () => {
        it('should have role="alert" attribute', () => {
            render(<ValidationMessage message="Error message" />);
            const alert = screen.getByRole('alert');
            expect(alert).toBeInTheDocument();
        });

        it('should have aria-live="polite" attribute', () => {
            render(<ValidationMessage message="Error message" />);
            const alert = screen.getByRole('alert');
            expect(alert).toHaveAttribute('aria-live', 'polite');
        });

        it('should have aria-atomic="true" attribute', () => {
            render(<ValidationMessage message="Error message" />);
            const alert = screen.getByRole('alert');
            expect(alert).toHaveAttribute('aria-atomic', 'true');
        });

        it('should support custom id for aria-describedby', () => {
            render(<ValidationMessage message="Error" id="email-error" />);
            const alert = screen.getByRole('alert');
            expect(alert).toHaveAttribute('id', 'email-error');
        });
    });

    describe('Styling', () => {
        it('should apply validation-message class', () => {
            render(<ValidationMessage message="Error" />);
            const alert = screen.getByRole('alert');
            expect(alert).toHaveClass('validation-message');
        });

        it('should apply text class for single message', () => {
            render(<ValidationMessage message="Error" />);
            const text = screen.getByText('Error');
            expect(text).toHaveClass('validation-message__text');
        });

        it('should apply list classes for multiple messages', () => {
            const messages = ['Error 1', 'Error 2'];
            render(<ValidationMessage message={messages} />);

            const list = screen.getByRole('alert').querySelector('ul');
            expect(list).toHaveClass('validation-message__list');

            const items = screen.getByRole('alert').querySelectorAll('li');
            items.forEach(item => {
                expect(item).toHaveClass('validation-message__item');
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle whitespace-only messages', () => {
            const { container } = render(<ValidationMessage message="   " />);
            expect(container.firstChild).toBeNull();
        });

        it('should handle array with only whitespace messages', () => {
            const { container } = render(
                <ValidationMessage message={['  ', '\t', '\n']} />
            );
            expect(container.firstChild).toBeNull();
        });

        it('should render when visible is explicitly true', () => {
            render(<ValidationMessage message="Error" visible={true} />);
            expect(screen.getByText('Error')).toBeInTheDocument();
        });

        it('should handle very long error messages', () => {
            const longMessage = 'A'.repeat(500);
            render(<ValidationMessage message={longMessage} />);
            expect(screen.getByText(longMessage)).toBeInTheDocument();
        });

        it('should handle special characters in messages', () => {
            const message = 'Error: <script>alert("xss")</script>';
            render(<ValidationMessage message={message} />);
            expect(screen.getByText(message)).toBeInTheDocument();
        });
    });
});
