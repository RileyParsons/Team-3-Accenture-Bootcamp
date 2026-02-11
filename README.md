# Budgeting Profile Page

A React TypeScript application for creating budgeting profiles. This application guides users through a multi-step form to gather information about their income, expenses, and financial goals.

## Project Structure

```
src/
├── components/          # React components
│   ├── ProfilePage/    # Main profile page container
│   ├── IncomeSection/  # Income information collection
│   ├── ExpenseSection/ # Expense category selection
│   └── GoalsSection/   # Financial goals definition
├── context/            # React Context for state management
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
    ├── validation/     # Validation engine
    └── storage/        # Local storage manager
```

## Setup

Install dependencies:
```bash
npm install
```

## Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test:watch
```

Run tests with coverage:
```bash
npm test:coverage
```

Type checking:
```bash
npm run type-check
```

## Testing Strategy

This project uses a dual testing approach:

- **Unit Tests** (`.test.ts`, `.test.tsx`): Test specific examples, edge cases, and component behavior
- **Property-Based Tests** (`.properties.test.ts`, `.properties.test.tsx`): Test universal properties using fast-check

## Technology Stack

- React 18
- TypeScript (strict mode)
- Jest & React Testing Library
- fast-check (property-based testing)

## Implementation Status

See `.kiro/specs/budgeting-profile-page/tasks.md` for detailed implementation progress.