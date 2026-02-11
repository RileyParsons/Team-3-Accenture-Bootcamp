# API Integration

This directory contains API utility functions for the SaveSmart application.

## Files

### `api.ts`
Contains functions for interacting with the SaveSmart backend API.

#### Functions

- `saveUser(userData: UserData)`: Saves user data to the backend
  - Endpoint: `POST /test_users`
  - Returns: API response with saved user data
  - Throws: Error if the request fails

- `generateUserId()`: Generates a unique user ID
  - Format: `u_{timestamp}_{random}`

#### Usage Example

```typescript
import { saveUser, generateUserId } from '@/lib/api';

const userId = generateUserId();
const result = await saveUser({
  userId,
  email: 'user@example.com',
  name: 'John Doe',
  income: 5000,
  rent: 1800,
  groceryBudget: 150,
  location: 'Sydney',
  dietaryPreferences: ['vegetarian'],
  subscriptions: ['Netflix']
});
```

## API Endpoint

Base URL: `https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod`

### POST /test_users
Creates a new user in the system.

**Request Body:**
```json
{
  "userId": "string",
  "email": "string",
  "name": "string",
  "income": "number (optional)",
  "rent": "number (optional)",
  "groceryBudget": "number (optional)",
  "location": "string (optional)",
  "dietaryPreferences": "string[] (optional)",
  "subscriptions": "string[] (optional)"
}
```

**Response:**
```json
{
  "message": "User saved successfully",
  "userId": "string"
}
```
