import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
    it('renders the application', () => {
        render(<App />);
        const heading = screen.getByText(/Budgeting Profile Page/i);
        expect(heading).toBeInTheDocument();
    });
});
