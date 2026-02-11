# ValidationMessage Component

A reusable component for displaying validation error messages with consistent styling and accessibility support.

## Features

- ✅ Displays single or multiple error messages
- ✅ Full accessibility support (ARIA attributes)
- ✅ Consistent error styling
- ✅ Responsive to user preferences (dark mode, high contrast)
- ✅ Filters out empty/whitespace messages
- ✅ Supports custom IDs for `aria-describedby` linking

## Usage

### Single Error Message

```tsx
import { ValidationMessage } from '@/components/ValidationMessage';

<ValidationMessage message="This field is required" />
```

### Multiple Error Messages

```tsx
<ValidationMessage 
  message={[
    "This field is required",
    "Must be a positive number"
  ]} 
/>
```

### With Custom ID (for aria-describedby)

```tsx
<input 
  type="text"
  aria-describedby="email-error"
/>
<ValidationMessage 
  id="email-error"
  message="Invalid email format" 
/>
```

### Conditional Display

```tsx
<ValidationMessage 
  message="Error occurred"
  visible={hasError} 
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string \| string[]` | - | Error message(s) to display |
| `id` | `string` | - | Optional ID for aria-describedby linking |
| `visible` | `boolean` | `true` | Whether to show the message |

## Accessibility

The component includes the following accessibility features:

- `role="alert"` - Announces errors to screen readers
- `aria-live="polite"` - Updates are announced without interrupting
- `aria-atomic="true"` - Entire message is read when updated
- Support for `aria-describedby` via custom ID

## Requirements

Validates Requirements 5.2 and 5.3 from the budgeting profile page specification.
