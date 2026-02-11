# Design Document: Budgeting Profile Page

## Overview

The budgeting profile page is a React-based single-page application that guides users through a multi-step form to create their budgeting profile. The application uses a wizard-style interface with progressive disclosure, presenting questions in logical sections while maintaining state throughout the user journey.

The design emphasizes user experience through clear visual feedback, real-time validation, and persistent state management. The application is built using modern React patterns including hooks for state management and component composition for reusability.

## Architecture

### Component Hierarchy

```
App
├── ProfilePage
    ├── ProgressIndicator
    ├── QuestionFlow
    │   ├── IncomeSection
    │   │   ├── IncomeSourceInput
    │   │   └── ValidationMessage
    │   ├── ExpenseSection
    │   │   ├── CategorySelector
    │   │   ├── CustomCategoryInput
    │   │   └── ValidationMessage
    │   ├── GoalsSection
    │   │   ├── GoalInput
    │   │   └── ValidationMessage
    │   └── ReviewSection
    ├── NavigationControls
    └── SubmitButton
```

### State Management

The application uses React Context API for global state management, with the following state structure:

- **FormContext**: Manages all form data and provides methods to update individual fields
- **ValidationContext**: Handles validation rules and error states
- **NavigationContext**: Tracks current section and navigation history

### Data Flow

1. User interacts with input components
2. Input components dispatch updates to FormContext
3. ValidationContext validates input against rules
4. ValidationMessage components display errors if validation fails
5. NavigationControls enable/disable based on validation state
6. On submission, FormContext serializes data and triggers save operation

## Components and Interfaces

### ProfilePage Component

Main container component that orchestrates the entire profile creation flow.

**Props:**
```typescript
interface ProfilePageProps {
  onSubmit: (profile: BudgetProfile) => Promise<void>;
  initialData?: Partial<BudgetProfile>;
}
```

**Responsibilities:**
- Initialize form state from local storage or props
- Render child components in correct order
- Handle submission workflow
- Manage loading and success states

### IncomeSection Component

Collects user income information including sources, amounts, and frequency.

**State:**
```typescript
interface IncomeData {
  sources: IncomeSource[];
}

interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'annual';
}
```

**Methods:**
- `addIncomeSource()`: Adds a new income source entry
- `removeIncomeSource(id: string)`: Removes an income source
- `updateIncomeSource(id: string, data: Partial<IncomeSource>)`: Updates income source data

### ExpenseSection Component

Allows users to select predefined expense categories and add custom ones.

**State:**
```typescript
interface ExpenseData {
  selectedCategories: string[];
  customCategories: string[];
}
```

**Predefined Categories:**
- Housing
- Transportation
- Food & Dining
- Utilities
- Healthcare
- Entertainment
- Savings
- Debt Payments
- Insurance
- Personal Care

**Methods:**
- `toggleCategory(category: string)`: Selects or deselects a category
- `addCustomCategory(name: string)`: Adds a custom expense category
- `removeCustomCategory(name: string)`: Removes a custom category

### GoalsSection Component

Enables users to define financial goals with descriptions, target amounts, and timelines.

**State:**
```typescript
interface GoalsData {
  goals: BudgetGoal[];
}

interface BudgetGoal {
  id: string;
  description: string;
  targetAmount: number;
  targetDate?: Date;
  timeframe?: string;
}
```

**Methods:**
- `addGoal()`: Creates a new goal entry
- `removeGoal(id: string)`: Removes a goal
- `updateGoal(id: string, data: Partial<BudgetGoal>)`: Updates goal data

### ValidationEngine

Centralized validation logic for all form inputs.

**Validation Rules:**

```typescript
interface ValidationRule {
  field: string;
  validator: (value: any) => boolean;
  message: string;
}

const validationRules: ValidationRule[] = [
  {
    field: 'income.amount',
    validator: (value) => typeof value === 'number' && value > 0,
    message: 'Income amount must be a positive number'
  },
  {
    field: 'income.frequency',
    validator: (value) => ['weekly', 'bi-weekly', 'monthly', 'annual'].includes(value),
    message: 'Please select a valid frequency'
  },
  {
    field: 'customCategory',
    validator: (value) => typeof value === 'string' && value.trim().length > 0,
    message: 'Category name cannot be empty'
  },
  {
    field: 'goal.targetAmount',
    validator: (value) => typeof value === 'number' && value > 0,
    message: 'Target amount must be a positive number'
  }
];
```

**Methods:**
- `validate(field: string, value: any): ValidationResult`: Validates a single field
- `validateSection(section: string): ValidationResult[]`: Validates all fields in a section
- `isValid(): boolean`: Returns true if all fields pass validation

### LocalStorageManager

Handles persistence of form data to browser local storage.

**Methods:**
```typescript
interface StorageManager {
  save(key: string, data: any): void;
  load(key: string): any | null;
  clear(key: string): void;
  isAvailable(): boolean;
}
```

**Implementation:**
- Serializes data to JSON before storing
- Handles storage quota exceeded errors
- Provides fallback when local storage is unavailable
- Uses key prefix to avoid conflicts: `budgeting-profile-`

## Data Models

### BudgetProfile

Complete user profile data structure:

```typescript
interface BudgetProfile {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  income: {
    sources: IncomeSource[];
    totalMonthly: number; // Calculated field
  };
  expenses: {
    selectedCategories: string[];
    customCategories: string[];
  };
  goals: BudgetGoal[];
  metadata: {
    completionPercentage: number;
    lastSection: string;
  };
}
```

### FormState

Runtime form state:

```typescript
interface FormState {
  currentSection: number;
  sections: Section[];
  data: Partial<BudgetProfile>;
  errors: Record<string, string[]>;
  isDirty: boolean;
  isSubmitting: boolean;
}

interface Section {
  id: string;
  title: string;
  isComplete: boolean;
  isValid: boolean;
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Progress indicator accuracy

*For any* form state, the displayed progress percentage should equal the ratio of completed required fields to total required fields.

**Validates: Requirements 1.3**

### Property 2: Positive numeric validation

*For any* numeric input field (income amount, goal target amount), the validation engine should reject non-positive numbers and accept positive numbers.

**Validates: Requirements 2.3, 4.3**

### Property 3: Multiple items preservation

*For any* collection field (income sources, budget goals, expense categories), adding multiple items should result in all items being present in the form state.

**Validates: Requirements 2.4, 3.3, 4.4**

### Property 4: Category selection state consistency

*For any* set of selected expense categories, the form state should contain exactly those categories that were selected, with no duplicates or omissions.

**Validates: Requirements 3.2**

### Property 5: Non-empty string validation

*For any* text input requiring non-empty values (custom category names, goal descriptions), the validation engine should reject empty strings and whitespace-only strings, and accept any non-empty trimmed string.

**Validates: Requirements 3.4**

### Property 6: Goal data acceptance

*For any* valid budget goal containing a description and target amount, the form state should accept and store the complete goal data.

**Validates: Requirements 4.1, 4.2**

### Property 7: Invalid input error detection

*For any* input that violates validation rules, the validation engine should identify and return an appropriate error for that specific rule violation.

**Validates: Requirements 5.1**

### Property 8: Error message lifecycle

*For any* field with a validation error, an error message should be displayed in the UI, and when the field becomes valid, the error message should be removed.

**Validates: Requirements 5.2, 5.3**

### Property 9: Required field validation

*For any* required field that is empty, the validation engine should prevent form progression and return a "required field" error message.

**Validates: Requirements 5.4**

### Property 10: Navigation state preservation

*For any* form data entered in a section, navigating to a different section and then returning should preserve all the original data without loss or modification.

**Validates: Requirements 6.3**

### Property 11: Navigation control based on validation

*For any* section with incomplete required fields, forward navigation should be disabled, and when all required fields are complete, forward navigation should be enabled.

**Validates: Requirements 6.4**

### Property 12: Submit button state

*For any* form state where all required fields across all sections are complete and valid, the submit button should be enabled, otherwise it should be disabled.

**Validates: Requirements 7.1**

### Property 13: Profile compilation completeness

*For any* complete form state, clicking submit should produce a BudgetProfile object that contains all entered data from all sections.

**Validates: Requirements 7.2**

### Property 14: Submission feedback visibility

*For any* submission in progress, a loading indicator should be present in the rendered UI.

**Validates: Requirements 7.3**

### Property 15: Local storage round-trip

*For any* form data entered and saved to local storage, reloading the page should restore exactly the same form state with all data preserved.

**Validates: Requirements 8.1, 8.2**

### Property 16: Post-submission cleanup

*For any* successful form submission, the local storage should be cleared of temporary form data.

**Validates: Requirements 8.3**

## Error Handling

### Validation Errors

The application handles validation errors through a centralized ValidationEngine that provides consistent error messages:

**Error Types:**
- **Type Errors**: "Expected a number, received text"
- **Range Errors**: "Amount must be greater than zero"
- **Required Errors**: "This field is required"
- **Format Errors**: "Invalid date format"

**Error Display Strategy:**
- Errors appear inline below the relevant input field
- Errors use a consistent visual style (red text, icon)
- Errors are announced to screen readers for accessibility
- Multiple errors on a single field are displayed as a list

### Storage Errors

**Local Storage Unavailable:**
- Detect availability on app initialization
- Display a warning banner if unavailable
- Continue operation without persistence
- Provide manual save option (download JSON)

**Storage Quota Exceeded:**
- Catch quota exceeded exceptions
- Clear old data if possible
- Notify user of storage limitation
- Offer to continue without auto-save

### Network Errors

**Submission Failures:**
- Retry logic with exponential backoff (3 attempts)
- Display clear error message to user
- Preserve form data for retry
- Offer manual download of profile data as backup

**Timeout Handling:**
- Set 30-second timeout for submission
- Show timeout error with retry option
- Maintain form state during retry

## Testing Strategy

### Dual Testing Approach

The application requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of valid inputs (e.g., a user with $5000 monthly income)
- Edge cases (e.g., empty form state, single income source)
- Error conditions (e.g., network failure during submission)
- Integration between components (e.g., form submission flow)
- Specific UI states (e.g., welcome message display, responsive breakpoints)

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Validation rules across random input generation
- State preservation across random navigation sequences
- Data integrity across random form data

### Property-Based Testing Configuration

**Framework**: fast-check (for TypeScript/JavaScript)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with format: **Feature: budgeting-profile-page, Property {N}: {property description}**
- Random seed logging for reproducibility
- Shrinking enabled to find minimal failing cases

**Example Test Structure:**
```typescript
import fc from 'fast-check';

// Feature: budgeting-profile-page, Property 2: Positive numeric validation
test('validation rejects non-positive numbers and accepts positive numbers', () => {
  fc.assert(
    fc.property(fc.float(), (amount) => {
      const result = validateAmount(amount);
      if (amount > 0) {
        expect(result.isValid).toBe(true);
      } else {
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('positive');
      }
    }),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Component Tests:**
- Test each component in isolation using React Testing Library
- Mock child components and external dependencies
- Focus on user interactions and rendered output
- Test accessibility attributes and ARIA labels

**Integration Tests:**
- Test complete user flows (e.g., filling out entire form)
- Test navigation between sections
- Test submission workflow
- Test local storage integration

**Coverage Goals:**
- Minimum 80% code coverage
- 100% coverage of validation logic
- 100% coverage of error handling paths

### Test Organization

```
src/
├── components/
│   ├── ProfilePage/
│   │   ├── ProfilePage.tsx
│   │   ├── ProfilePage.test.tsx
│   │   └── ProfilePage.properties.test.tsx
│   ├── IncomeSection/
│   │   ├── IncomeSection.tsx
│   │   ├── IncomeSection.test.tsx
│   │   └── IncomeSection.properties.test.tsx
│   └── ...
├── utils/
│   ├── validation/
│   │   ├── validation.ts
│   │   ├── validation.test.ts
│   │   └── validation.properties.test.ts
│   └── storage/
│       ├── storage.ts
│       ├── storage.test.ts
│       └── storage.properties.test.ts
```

Each module has:
- `.test.tsx/.test.ts`: Unit tests and integration tests
- `.properties.test.tsx/.properties.test.ts`: Property-based tests

This separation makes it clear which tests verify specific examples versus universal properties.
