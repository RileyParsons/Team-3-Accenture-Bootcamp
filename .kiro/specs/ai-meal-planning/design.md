# Design Document: AI-Powered Meal Planning

## Overview

This design extends the existing meal planning functionality to provide AI-powered meal plan generation based on user preferences. The system will collect dietary preferences through a form, send them to OpenAI for intelligent meal plan generation, and provide comprehensive meal management capabilities including adding, removing, and replacing meals.

The design leverages the existing WebhookService for OpenAI integration and extends the DynamoDB user schema to store meal plans and preferences. The frontend will be enhanced with a preferences form, improved meal plan display, and meal management controls.

### Key Features

- Preferences form with dietary restrictions, calorie goals, cultural preferences, and free-text notes
- AI-powered meal plan generation using OpenAI
- Weekly meal plan display with breakfast, lunch, dinner, and snack for each day
- Shopping list generation grouped by store (Coles, Woolworths, Aldi)
- Meal management: add, remove, and replace individual meals
- Regenerate entire plan with updated preferences
- Persistent storage in DynamoDB

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────────┤
│  - Meal Plan Page (Empty State / Display)                   │
│  - Preferences Form Component                                │
│  - Meal Plan Display Component                               │
│  - Shopping List Component                                   │
│  - Meal Management Controls (Add/Remove/Replace)             │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP/REST
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   Backend API (Express)                      │
├─────────────────────────────────────────────────────────────┤
│  Routes:                                                     │
│  - POST /api/meal-plan/generate                              │
│  - GET /api/meal-plan/:userId                                │
│  - PUT /api/meal-plan/:userId                                │
│  - POST /api/meal-plan/:userId/meal                          │
│  - DELETE /api/meal-plan/:userId/meal                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼──────────┐
│ WebhookService │  │ DynamoDBService │
│  (OpenAI API)  │  │  (User Profiles)│
└────────────────┘  └─────────────────┘
```

### Data Flow

1. **Meal Plan Generation Flow**:
   - User fills preferences form → Frontend validates input
   - Frontend sends POST to /api/meal-plan/generate
   - Backend calls WebhookService.generateMealPlan() with preferences
   - WebhookService sends structured prompt to OpenAI
   - OpenAI returns meal plan JSON
   - Backend saves meal plan to DynamoDB user profile
   - Backend returns meal plan to frontend
   - Frontend displays meal plan with shopping list

2. **Meal Management Flow**:
   - User clicks Add/Remove/Replace → Frontend sends request
   - Backend retrieves current meal plan from DynamoDB
   - Backend modifies meal plan based on operation
   - Backend recalculates shopping list and total cost
   - Backend saves updated meal plan to DynamoDB
   - Backend returns updated meal plan to frontend
   - Frontend updates display

## Components and Interfaces

### Frontend Components

#### MealPlanPage Component
- **Responsibility**: Main page component managing meal plan state
- **States**:
  - `empty`: No meal plan exists, show "Create Meal Plan" button
  - `preferences`: Show preferences form
  - `loading`: AI is generating plan
  - `display`: Show generated meal plan
- **Props**: None (uses userId from auth context)
- **State Management**: React useState for local state, API calls for persistence

#### PreferencesForm Component
- **Responsibility**: Collect user dietary preferences
- **Props**:
  - `initialPreferences?: MealPlanPreferences` - Pre-fill form for regeneration
  - `onSubmit: (preferences: MealPlanPreferences) => void`
  - `onCancel?: () => void`
- **Fields**:
  - Allergies: Multi-select checkboxes (Dairy, Gluten, Nuts, Shellfish, Eggs, Soy)
  - Calorie Goal: Dropdown (1500, 2000, 2500, 3000)
  - Cultural Preference: Dropdown (Mediterranean, Asian, Mexican, Indian, Italian, Australian)
  - Diet Type: Dropdown (Vegetarian, Vegan, Pescatarian, Keto, Paleo)
  - Notes: Textarea for free-text preferences
- **Validation**: All fields optional except calorie goal (defaults to 2000)

#### MealPlanDisplay Component
- **Responsibility**: Display weekly meal plan
- **Props**:
  - `mealPlan: MealPlan`
  - `onAddMeal: (day: string, mealType: MealType) => void`
  - `onRemoveMeal: (day: string, mealType: MealType) => void`
  - `onReplaceMeal: (day: string, mealType: MealType) => void`
  - `onRegenerate: () => void`
  - `onBrowseRecipes: () => void`
- **Display**:
  - 7-day grid with 4 meals per day
  - Each meal shows name, description, and controls
  - Total weekly cost prominently displayed
  - Action buttons: Browse Recipes, Regenerate Plan

#### ShoppingList Component
- **Responsibility**: Display shopping list grouped by store
- **Props**:
  - `shoppingList: ShoppingList`
- **Display**:
  - Grouped by store (Coles, Woolworths, Aldi)
  - Each item shows name, quantity, price
  - Subtotal per store
  - Total weekly cost

#### MealSlot Component
- **Responsibility**: Display and manage a single meal slot
- **Props**:
  - `meal: Meal | null`
  - `day: string`
  - `mealType: MealType`
  - `onAdd: () => void`
  - `onRemove: () => void`
  - `onReplace: () => void`
- **Display**:
  - Empty state: "Add Meal" button
  - Filled state: Meal name, description, Remove/Replace buttons

### Backend Routes

#### POST /api/meal-plan/generate
- **Purpose**: Generate AI-powered meal plan from preferences
- **Request Body**:
  ```typescript
  {
    userId: string;
    preferences: MealPlanPreferences;
  }
  ```
- **Response**:
  ```typescript
  {
    mealPlan: MealPlan;
    message: string;
  }
  ```
- **Process**:
  1. Validate request body
  2. Call WebhookService.generateMealPlan(preferences)
  3. Fetch recipe details for any recipe IDs returned
  4. Generate shopping list from recipes
  5. Calculate total weekly cost
  6. Save to DynamoDB user profile
  7. Return complete meal plan

#### GET /api/meal-plan/:userId
- **Purpose**: Retrieve user's current meal plan
- **Response**:
  ```typescript
  {
    mealPlan: MealPlan | null;
  }
  ```
- **Process**:
  1. Validate userId
  2. Fetch user from DynamoDB
  3. Return mealPlan field from user profile

#### PUT /api/meal-plan/:userId
- **Purpose**: Update user's meal plan
- **Request Body**:
  ```typescript
  {
    mealPlan: MealPlan;
  }
  ```
- **Response**:
  ```typescript
  {
    mealPlan: MealPlan;
    message: string;
  }
  ```
- **Process**:
  1. Validate request body
  2. Recalculate shopping list and total cost
  3. Update user profile in DynamoDB
  4. Return updated meal plan

#### POST /api/meal-plan/:userId/meal
- **Purpose**: Add a meal to specific slot
- **Request Body**:
  ```typescript
  {
    day: string;
    mealType: MealType;
    recipeId: string;
  }
  ```
- **Response**:
  ```typescript
  {
    mealPlan: MealPlan;
    message: string;
  }
  ```
- **Process**:
  1. Validate request body
  2. Fetch current meal plan
  3. Fetch recipe details
  4. Add meal to specified slot
  5. Recalculate shopping list and cost
  6. Save updated plan to DynamoDB
  7. Return updated meal plan

#### DELETE /api/meal-plan/:userId/meal
- **Purpose**: Remove a meal from specific slot
- **Request Body**:
  ```typescript
  {
    day: string;
    mealType: MealType;
  }
  ```
- **Response**:
  ```typescript
  {
    mealPlan: MealPlan;
    message: string;
  }
  ```
- **Process**:
  1. Validate request body
  2. Fetch current meal plan
  3. Remove meal from specified slot
  4. Recalculate shopping list and cost
  5. Save updated plan to DynamoDB
  6. Return updated meal plan

### Backend Services

#### WebhookService Extension

Add new method to existing WebhookService:

```typescript
async generateMealPlan(preferences: MealPlanPreferences): Promise<AIMealPlanResponse>
```

**Implementation**:
- Construct detailed prompt including:
  - Dietary restrictions (allergies)
  - Calorie goal
  - Cultural preference
  - Diet type
  - User notes
  - Instruction to use recipes from database when possible
  - Instruction to provide 7 days × 4 meals
  - Instruction to return structured JSON
- Call OpenAI API with GPT-4 model
- Parse JSON response
- Validate response structure
- Return structured meal plan data

**Prompt Structure**:
```
You are a professional meal planning nutritionist. Generate a personalized weekly meal plan based on these preferences:

Dietary Restrictions: [allergies list]
Daily Calorie Goal: [calories]
Cultural Preference: [culture]
Diet Type: [diet]
Additional Notes: [user notes]

Requirements:
- Generate exactly 7 days of meals
- Each day should have: breakfast, lunch, dinner, and snack
- Prioritize recipes from the provided recipe database when available
- Consider the user's dietary restrictions strictly
- Aim for the specified calorie goal per day
- Incorporate the cultural preference where possible
- Pay attention to the user's likes and dislikes in the notes

Available Recipes: [recipe list with IDs, names, dietary tags]

Return a JSON object with this structure:
{
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "mealType": "breakfast",
          "name": "Meal Name",
          "description": "Brief description",
          "recipeId": "recipe-id or null if custom",
          "estimatedCalories": number,
          "estimatedCost": number
        },
        ...
      ]
    },
    ...
  ],
  "totalWeeklyCost": number,
  "nutritionSummary": {
    "averageDailyCalories": number,
    "proteinGrams": number,
    "carbsGrams": number,
    "fatGrams": number
  },
  "notes": "Any important notes about the meal plan"
}
```

#### DynamoDBService Extension

No new methods needed. Use existing `updateUser()` method to save meal plan to user profile.

**User Profile Schema Extension**:
```typescript
interface User {
  // ... existing fields
  mealPlan?: {
    preferences: MealPlanPreferences;
    plan: MealPlan;
    createdAt: string;
    updatedAt: string;
  };
}
```

## Data Models

### MealPlanPreferences
```typescript
interface MealPlanPreferences {
  allergies: string[];           // ['Dairy', 'Gluten', 'Nuts', 'Shellfish', 'Eggs', 'Soy']
  calorieGoal: number;           // 1500 | 2000 | 2500 | 3000
  culturalPreference: string;    // 'Mediterranean' | 'Asian' | 'Mexican' | 'Indian' | 'Italian' | 'Australian' | ''
  dietType: string;              // 'Vegetarian' | 'Vegan' | 'Pescatarian' | 'Keto' | 'Paleo' | ''
  notes: string;                 // Free-text user preferences
}
```

### MealPlan
```typescript
interface MealPlan {
  preferences: MealPlanPreferences;
  days: MealPlanDay[];
  totalWeeklyCost: number;
  nutritionSummary: NutritionSummary;
  shoppingList: ShoppingList;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
```

### MealPlanDay
```typescript
interface MealPlanDay {
  day: string;                   // 'Monday' | 'Tuesday' | ... | 'Sunday'
  meals: Meal[];
}
```

### Meal
```typescript
interface Meal {
  mealType: MealType;            // 'breakfast' | 'lunch' | 'dinner' | 'snack'
  name: string;
  description: string;
  recipeId: string | null;       // null if custom meal not from database
  estimatedCalories: number;
  estimatedCost: number;
}
```

### MealType
```typescript
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
```

### NutritionSummary
```typescript
interface NutritionSummary {
  averageDailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}
```

### ShoppingList
```typescript
interface ShoppingList {
  stores: ShoppingListStore[];
  totalCost: number;
}
```

### ShoppingListStore
```typescript
interface ShoppingListStore {
  storeName: string;             // 'Coles' | 'Woolworths' | 'Aldi'
  items: ShoppingListItem[];
  subtotal: number;
}
```

### ShoppingListItem
```typescript
interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  recipeIds: string[];           // Which recipes use this ingredient
}
```

### AIMealPlanResponse
```typescript
interface AIMealPlanResponse {
  days: {
    day: string;
    meals: {
      mealType: MealType;
      name: string;
      description: string;
      recipeId: string | null;
      estimatedCalories: number;
      estimatedCost: number;
    }[];
  }[];
  totalWeeklyCost: number;
  nutritionSummary: NutritionSummary;
  notes: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Valid Preferences Acceptance
*For any* preferences form submission with all required fields filled, the System should validate the input and proceed to meal plan generation.
**Validates: Requirements 2.6**

### Property 2: Invalid Preferences Rejection
*For any* preferences form submission with missing required fields, the System should display validation errors and prevent submission.
**Validates: Requirements 2.7**

### Property 3: AI Generation API Call
*For any* valid preferences submission, the System should send the preferences and notes to the AI_Generator via WebhookService.
**Validates: Requirements 3.1**

### Property 4: Meal Plan Structure
*For any* AI-generated meal plan, the plan should contain exactly 7 days with 3 to 4 meals per day.
**Validates: Requirements 3.2**

### Property 5: Dietary Restrictions Compliance
*For any* meal plan generated with dietary restrictions (allergies), none of the meals should contain ingredients that match the restricted allergens.
**Validates: Requirements 3.3**

### Property 6: Calorie Goal Targeting
*For any* meal plan generated with a calorie goal, the average daily calories across all days should be within 15% of the target calorie goal.
**Validates: Requirements 3.4**

### Property 7: Recipe Database Prioritization
*For any* AI-generated meal plan, at least 70% of meals should have valid recipeIds from the Recipe_Database.
**Validates: Requirements 3.7**

### Property 8: Meal Plan Response Structure
*For any* successful AI generation, the returned Meal_Plan should contain all required fields: days array, meal names, descriptions, recipe IDs, and total weekly cost estimate.
**Validates: Requirements 3.8**

### Property 9: Meal Plan Display Organization
*For any* meal plan display, the meals should be organized by day with all 7 days shown in order.
**Validates: Requirements 4.1**

### Property 10: Complete Meal Type Display
*For any* meal plan display, each day should show all four meal types: breakfast, lunch, dinner, and snack.
**Validates: Requirements 4.2**

### Property 11: Cost Display Presence
*For any* meal plan display, the total weekly cost should be prominently displayed.
**Validates: Requirements 4.3**

### Property 12: Shopping List Grouping
*For any* meal plan display, the shopping list should be grouped by store (Coles, Woolworths, Aldi).
**Validates: Requirements 4.4**

### Property 13: Recipe Link Rendering
*For any* meal in the plan with a non-null recipeId, the meal name should be displayed as a clickable link.
**Validates: Requirements 4.5**

### Property 14: Recipe Link Navigation
*For any* recipe link clicked in the meal plan, the System should navigate to the recipe detail page for that recipeId.
**Validates: Requirements 4.6**

### Property 15: Meal Addition to Slot
*For any* valid combination of day, mealType, and recipeId, adding the recipe should place it in the correct Meal_Slot in the plan.
**Validates: Requirements 5.3**

### Property 16: Meal Plan Reactivity
*For any* meal modification operation (add, remove, or replace), the meal plan display should update immediately to reflect the change.
**Validates: Requirements 5.4, 6.4, 7.4**

### Property 17: Cost Recalculation on Modification
*For any* meal modification operation (add, remove, or replace), the total weekly cost should be recalculated and updated.
**Validates: Requirements 5.5, 6.5, 7.5**

### Property 18: Shopping List Regeneration
*For any* meal modification operation (add, remove, or replace), the shopping list should be regenerated to reflect the current meals in the plan.
**Validates: Requirements 5.6, 7.6, 11.6**

### Property 19: Meal Plan Controls Presence
*For any* meal displayed in the plan, the System should show "Remove" and "Replace" buttons for that meal.
**Validates: Requirements 6.1, 7.1**

### Property 20: Removal Confirmation
*For any* meal removal action, the System should prompt for confirmation before removing the meal.
**Validates: Requirements 6.2**

### Property 21: Meal Removal Execution
*For any* confirmed meal removal, the meal should be removed from the specified Meal_Slot.
**Validates: Requirements 6.3**

### Property 22: Ingredient Cleanup on Removal
*For any* meal removal, ingredients that are only used in that meal should be removed from the shopping list.
**Validates: Requirements 6.6**

### Property 23: Filtered Recipe Browser
*For any* meal replacement action, the recipe browser should display only recipes filtered by the same meal type as the meal being replaced.
**Validates: Requirements 7.2**

### Property 24: Meal Replacement Execution
*For any* replacement recipe selection, the original meal should be replaced with the new recipe in the same Meal_Slot.
**Validates: Requirements 7.3**

### Property 25: Regenerate Button Presence
*For any* displayed meal plan, a "Regenerate Plan" button should be present.
**Validates: Requirements 8.1**

### Property 26: Preferences Pre-fill on Regenerate
*For any* regenerate action, the preferences form should be displayed pre-filled with the current preferences from the meal plan.
**Validates: Requirements 8.2**

### Property 27: New Plan Generation
*For any* updated preferences submission during regeneration, the System should generate a new meal plan using the AI_Generator.
**Validates: Requirements 8.3**

### Property 28: Plan Replacement on Regeneration
*For any* successful regeneration, the new meal plan should completely replace the existing plan.
**Validates: Requirements 8.4**

### Property 29: Preferences Persistence on Regeneration
*For any* successful regeneration, the updated preferences should be saved to the user's DynamoDB profile.
**Validates: Requirements 8.5**

### Property 30: Browse Recipes Button Presence
*For any* displayed meal plan, a "Browse Recipes" button should be present.
**Validates: Requirements 9.1**

### Property 31: Recipe Browser Navigation
*For any* "Browse Recipes" button click, the System should navigate to the recipe browser page.
**Validates: Requirements 9.2**

### Property 32: Navigation Context Preservation
*For any* navigation from meal plan to recipe browser, the System should maintain context to enable easy return to the meal plan.
**Validates: Requirements 9.3**

### Property 33: Meal Plan Persistence
*For any* generated or modified meal plan, the complete Meal_Plan should be saved to the user's DynamoDB profile.
**Validates: Requirements 10.1, 10.3**

### Property 34: Preferences Persistence
*For any* submitted preferences, they should be saved to the user's DynamoDB profile.
**Validates: Requirements 10.2**

### Property 35: Meal Plan Round-Trip
*For any* meal plan saved to DynamoDB, retrieving it should return an equivalent meal plan with all the same data.
**Validates: Requirements 10.4**

### Property 36: Shopping List Generation from Recipes
*For any* meal plan containing recipes from the Recipe_Database, a Shopping_List should be generated from the recipe ingredients.
**Validates: Requirements 11.1**

### Property 37: Store Grouping in Shopping List
*For any* generated shopping list, ingredients should be grouped by their source store (Coles, Woolworths, Aldi).
**Validates: Requirements 11.2**

### Property 38: Ingredient Aggregation
*For any* shopping list with duplicate ingredients across multiple recipes, the quantities should be aggregated into a single line item.
**Validates: Requirements 11.3**

### Property 39: Shopping List Item Completeness
*For any* item in the shopping list, it should display ingredient name, quantity, and price.
**Validates: Requirements 11.4**

### Property 40: Store Subtotal Calculation
*For any* shopping list, the total cost per store should be calculated and displayed.
**Validates: Requirements 11.5**

### Property 41: API Endpoint Validation
*For any* meal plan API endpoint call with an invalid userId, the System should return appropriate error codes (400 or 404).
**Validates: Requirements 12.6**

### Property 42: Loading Indicator During Generation
*For any* meal plan generation in progress, the System should display a loading indicator with a progress message.
**Validates: Requirements 13.1**

### Property 43: Success Feedback on Meal Operations
*For any* successful meal operation (add, remove, or replace), the System should display a success message.
**Validates: Requirements 13.2, 13.3, 13.4**

### Property 44: Error Message Display
*For any* failed operation, the System should display a clear error message explaining what went wrong.
**Validates: Requirements 13.5**

### Property 45: Long Operation Progress Message
*For any* AI generation operation that takes longer than 5 seconds, the System should display a message indicating the AI is working.
**Validates: Requirements 13.6**

## Error Handling

### Frontend Error Handling

1. **Network Errors**:
   - Catch all API call failures
   - Display user-friendly error messages
   - Provide retry options for transient failures
   - Log errors to console for debugging

2. **Validation Errors**:
   - Validate preferences form before submission
   - Display inline validation errors for each field
   - Prevent submission until all errors are resolved
   - Highlight invalid fields with red borders

3. **AI Generation Failures**:
   - Handle timeout errors (>30 seconds)
   - Handle OpenAI API errors
   - Display specific error messages based on failure type
   - Provide "Try Again" button to retry generation

4. **State Management Errors**:
   - Handle cases where meal plan data is corrupted
   - Gracefully degrade to empty state if data is invalid
   - Provide option to regenerate plan from scratch

### Backend Error Handling

1. **Request Validation**:
   - Validate all request bodies against expected schemas
   - Return 400 Bad Request with detailed error messages
   - Validate userId exists before operations
   - Return 404 Not Found for non-existent users

2. **OpenAI API Errors**:
   - Catch API timeout errors
   - Catch API rate limit errors
   - Catch API authentication errors
   - Return 503 Service Unavailable with retry-after header

3. **Database Errors**:
   - Catch DynamoDB connection errors
   - Catch DynamoDB throttling errors
   - Implement exponential backoff for retries
   - Return 500 Internal Server Error for unrecoverable errors

4. **Data Integrity Errors**:
   - Validate meal plan structure before saving
   - Validate recipe IDs exist in database
   - Handle missing recipe data gracefully
   - Log data integrity issues for investigation

### Error Response Format

All API errors should follow this format:
```typescript
{
  error: string;           // Error type (e.g., "ValidationError", "NotFoundError")
  message: string;         // Human-readable error message
  details?: any;           // Optional additional error details
  retryable?: boolean;     // Whether the operation can be retried
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Both are complementary and necessary for comprehensive coverage

### Unit Testing

Unit tests should focus on:

1. **Specific Examples**:
   - Test preferences form with specific allergy combinations
   - Test meal plan display with specific meal configurations
   - Test shopping list with specific recipe combinations
   - Test API endpoints with specific request payloads

2. **Edge Cases**:
   - Empty meal plan (no meals)
   - Meal plan with all custom meals (no recipe IDs)
   - Shopping list with zero-cost items
   - Preferences with all fields empty
   - AI generation timeout (>30 seconds)
   - Invalid recipe IDs in meal plan

3. **Integration Points**:
   - WebhookService integration with OpenAI
   - DynamoDB persistence and retrieval
   - Frontend-backend API communication
   - Recipe database lookups

4. **Error Conditions**:
   - Invalid preferences submission
   - Network failures during API calls
   - OpenAI API errors
   - Database connection errors
   - Missing recipe data

### Property-Based Testing

Property tests should verify universal properties using a property-based testing library (e.g., fast-check for TypeScript/JavaScript). Each test should run a minimum of 100 iterations.

**Property Test Configuration**:
- Library: fast-check (for TypeScript/JavaScript)
- Minimum iterations: 100 per property test
- Each test must reference its design document property
- Tag format: `// Feature: ai-meal-planning, Property {number}: {property_text}`

**Key Properties to Test**:

1. **Meal Plan Structure** (Property 4):
   - Generate random preferences
   - Verify generated plan has exactly 7 days
   - Verify each day has 3-4 meals

2. **Dietary Restrictions** (Property 5):
   - Generate random preferences with allergies
   - Verify no meals contain restricted ingredients

3. **Cost Recalculation** (Property 17):
   - Generate random meal modifications
   - Verify total cost equals sum of all meal costs

4. **Shopping List Aggregation** (Property 38):
   - Generate random meal plans with duplicate ingredients
   - Verify quantities are correctly aggregated

5. **Round-Trip Persistence** (Property 35):
   - Generate random meal plans
   - Save to DynamoDB and retrieve
   - Verify retrieved plan equals original

6. **Ingredient Cleanup** (Property 22):
   - Generate random meal plans
   - Remove random meals
   - Verify ingredients unique to removed meals are gone

**Example Property Test**:
```typescript
// Feature: ai-meal-planning, Property 4: Meal Plan Structure
describe('Meal Plan Structure Property', () => {
  it('should generate exactly 7 days with 3-4 meals each', () => {
    fc.assert(
      fc.property(
        fc.record({
          allergies: fc.array(fc.constantFrom('Dairy', 'Gluten', 'Nuts')),
          calorieGoal: fc.constantFrom(1500, 2000, 2500, 3000),
          culturalPreference: fc.constantFrom('Mediterranean', 'Asian'),
          dietType: fc.constantFrom('Vegetarian', 'Vegan'),
          notes: fc.string()
        }),
        async (preferences) => {
          const mealPlan = await generateMealPlan(preferences);

          expect(mealPlan.days).toHaveLength(7);
          mealPlan.days.forEach(day => {
            expect(day.meals.length).toBeGreaterThanOrEqual(3);
            expect(day.meals.length).toBeLessThanOrEqual(4);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage Goals

- **Unit test coverage**: Minimum 80% code coverage
- **Property test coverage**: All 45 properties implemented as tests
- **Integration test coverage**: All API endpoints tested end-to-end
- **E2E test coverage**: Complete user flows from preferences to meal plan display

### Testing Tools

- **Unit Testing**: Jest (JavaScript/TypeScript)
- **Property Testing**: fast-check (JavaScript/TypeScript)
- **Integration Testing**: Supertest (API testing)
- **E2E Testing**: Playwright or Cypress (browser automation)
- **Mocking**: Jest mocks for OpenAI API and DynamoDB

### Test Organization

```
tests/
├── unit/
│   ├── components/
│   │   ├── PreferencesForm.test.tsx
│   │   ├── MealPlanDisplay.test.tsx
│   │   └── ShoppingList.test.tsx
│   ├── services/
│   │   ├── WebhookService.test.ts
│   │   └── DynamoDBService.test.ts
│   └── routes/
│       └── mealPlan.test.ts
├── property/
│   ├── mealPlanStructure.property.test.ts
│   ├── dietaryRestrictions.property.test.ts
│   ├── costRecalculation.property.test.ts
│   ├── shoppingListAggregation.property.test.ts
│   └── roundTripPersistence.property.test.ts
├── integration/
│   └── mealPlanAPI.integration.test.ts
└── e2e/
    └── mealPlanFlow.e2e.test.ts
```
