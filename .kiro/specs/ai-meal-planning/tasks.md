# Implementation Plan: AI-Powered Meal Planning

## Overview

This implementation plan breaks down the AI-powered meal planning feature into discrete coding tasks. The approach follows an incremental development strategy: first extending backend services and API endpoints, then building frontend components, and finally integrating everything with comprehensive testing.

## Tasks

- [x] 1. Extend backend data models and types
  - Create TypeScript interfaces for MealPlanPreferences, MealPlan, MealPlanDay, Meal, MealType, NutritionSummary, ShoppingList, ShoppingListStore, ShoppingListItem, and AIMealPlanResponse
  - Add these types to a new file: `savesmart-backend/src/models/MealPlan.ts`
  - Export all types for use in routes and services
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.2, 3.8, 4.4, 11.1, 11.2_

- [x] 2. Extend WebhookService with AI meal plan generation
  - [x] 2.1 Add generateMealPlan method to WebhookService
    - Accept MealPlanPreferences as parameter
    - Fetch available recipes from DynamoDB
    - Construct detailed prompt with preferences, recipes, and requirements
    - Call OpenAI API with GPT-4 model
    - Parse and validate JSON response
    - Return AIMealPlanResponse
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7, 3.8_

  - [ ]* 2.2 Write property test for meal plan structure
    - **Property 4: Meal Plan Structure**
    - **Validates: Requirements 3.2**

  - [ ]* 2.3 Write property test for dietary restrictions compliance
    - **Property 5: Dietary Restrictions Compliance**
    - **Validates: Requirements 3.3**

  - [ ]* 2.4 Write property test for calorie goal targeting
    - **Property 6: Calorie Goal Targeting**
    - **Validates: Requirements 3.4**

  - [ ]* 2.5 Write property test for recipe database prioritization
    - **Property 7: Recipe Database Prioritization**
    - **Validates: Requirements 3.7**

- [x] 3. Create shopping list generation utility
  - [x] 3.1 Create ShoppingListGenerator utility class
    - Implement generateShoppingList(mealPlan: MealPlan, recipes: Recipe[]): ShoppingList
    - Extract ingredients from all recipes in meal plan
    - Group ingredients by store (Coles, Woolworths, Aldi)
    - Aggregate duplicate ingredients with quantity summation
    - Calculate subtotals per store and total cost
    - Create new file: `savesmart-backend/src/utils/ShoppingListGenerator.ts`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 3.2 Write property test for ingredient aggregation
    - **Property 38: Ingredient Aggregation**
    - **Validates: Requirements 11.3**

  - [ ]* 3.3 Write property test for store grouping
    - **Property 37: Store Grouping in Shopping List**
    - **Validates: Requirements 11.2**

  - [ ]* 3.4 Write unit tests for shopping list generation
    - Test with specific recipe combinations
    - Test with duplicate ingredients across recipes
    - Test with recipes from different stores
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 4. Implement meal plan generation API endpoint
  - [x] 4.1 Create POST /api/meal-plan/generate route
    - Validate request body (userId, preferences)
    - Call WebhookService.generateMealPlan(preferences)
    - Fetch recipe details for returned recipe IDs
    - Generate shopping list using ShoppingListGenerator
    - Calculate total weekly cost
    - Save complete meal plan to DynamoDB user profile
    - Return meal plan with 201 status
    - Handle errors with appropriate status codes
    - Add route to `savesmart-backend/src/routes/mealPlan.ts`
    - _Requirements: 3.1, 3.2, 3.8, 10.1, 10.2, 12.1_

  - [ ]* 4.2 Write unit tests for generation endpoint
    - Test with valid preferences
    - Test with invalid preferences (missing fields)
    - Test with OpenAI API errors
    - Test with database errors
    - _Requirements: 3.1, 3.8, 12.1, 12.6_

- [x] 5. Implement meal plan retrieval API endpoint
  - [x] 5.1 Update GET /api/meal-plan/:userId route
    - Validate userId parameter
    - Fetch user from DynamoDB
    - Return mealPlan field from user profile
    - Return null if no meal plan exists
    - Handle errors with appropriate status codes
    - Update existing route in `savesmart-backend/src/routes/mealPlan.ts`
    - _Requirements: 10.4, 12.2_

  - [ ]* 5.2 Write property test for round-trip persistence
    - **Property 35: Meal Plan Round-Trip**
    - **Validates: Requirements 10.4**

- [x] 6. Implement meal plan update API endpoint
  - [x] 6.1 Create PUT /api/meal-plan/:userId route
    - Validate request body (mealPlan)
    - Fetch recipe details for all recipe IDs in plan
    - Regenerate shopping list using ShoppingListGenerator
    - Recalculate total weekly cost
    - Update user profile in DynamoDB
    - Return updated meal plan with 200 status
    - Handle errors with appropriate status codes
    - Add route to `savesmart-backend/src/routes/mealPlan.ts`
    - _Requirements: 10.3, 12.3_

  - [ ]* 6.2 Write unit tests for update endpoint
    - Test with valid meal plan
    - Test with invalid meal plan structure
    - Test with non-existent userId
    - Test with database errors
    - _Requirements: 10.3, 12.3, 12.6_

- [x] 7. Implement add meal API endpoint
  - [x] 7.1 Create POST /api/meal-plan/:userId/meal route
    - Validate request body (day, mealType, recipeId)
    - Fetch current meal plan from DynamoDB
    - Fetch recipe details for the new recipe
    - Add meal to specified slot in meal plan
    - Regenerate shopping list
    - Recalculate total weekly cost
    - Save updated plan to DynamoDB
    - Return updated meal plan with 200 status
    - Handle errors with appropriate status codes
    - Add route to `savesmart-backend/src/routes/mealPlan.ts`
    - _Requirements: 5.3, 5.5, 5.6, 10.3, 12.5_

  - [ ]* 7.2 Write property test for meal addition
    - **Property 15: Meal Addition to Slot**
    - **Validates: Requirements 5.3**

  - [ ]* 7.3 Write property test for cost recalculation
    - **Property 17: Cost Recalculation on Modification**
    - **Validates: Requirements 5.5, 6.5, 7.5**

- [x] 8. Implement remove meal API endpoint
  - [x] 8.1 Create DELETE /api/meal-plan/:userId/meal route
    - Validate request body (day, mealType)
    - Fetch current meal plan from DynamoDB
    - Remove meal from specified slot
    - Regenerate shopping list (excluding ingredients only in removed meal)
    - Recalculate total weekly cost
    - Save updated plan to DynamoDB
    - Return updated meal plan with 200 status
    - Handle errors with appropriate status codes
    - Add route to `savesmart-backend/src/routes/mealPlan.ts`
    - _Requirements: 6.3, 6.5, 6.6, 10.3, 12.4_

  - [ ]* 8.2 Write property test for ingredient cleanup
    - **Property 22: Ingredient Cleanup on Removal**
    - **Validates: Requirements 6.6**

  - [ ]* 8.3 Write unit tests for remove endpoint
    - Test removing meal with unique ingredients
    - Test removing meal with shared ingredients
    - Test removing from empty slot
    - _Requirements: 6.3, 6.5, 6.6, 12.4_

- [x] 9. Register new meal plan routes
  - Update `savesmart-backend/src/index.ts` to register all new routes
  - Ensure proper middleware (CORS, JSON parsing) is applied
  - Test that all endpoints are accessible
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 10. Checkpoint - Backend API complete
  - Ensure all backend tests pass
  - Test API endpoints manually with Postman or curl
  - Verify DynamoDB integration works correctly
  - Ask the user if questions arise

- [ ] 11. Create frontend API functions
  - [-] 11.1 Add meal plan API functions to api.ts
    - Add generateMealPlan(userId: string, preferences: MealPlanPreferences): Promise<MealPlan>
    - Add getMealPlan(userId: string): Promise<MealPlan | null>
    - Add updateMealPlan(userId: string, mealPlan: MealPlan): Promise<MealPlan>
    - Add addMealToSlot(userId: string, day: string, mealType: MealType, recipeId: string): Promise<MealPlan>
    - Add removeMealFromSlot(userId: string, day: string, mealType: MealType): Promise<MealPlan>
    - Update `savesmart-frontend/src/lib/api.ts`
    - _Requirements: 3.1, 5.3, 6.3, 10.4, 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 11.2 Write unit tests for API functions
    - Test successful API calls
    - Test error handling
    - Test request/response formatting
    - _Requirements: 3.1, 5.3, 6.3, 10.4_

- [ ] 12. Create PreferencesForm component
  - [~] 12.1 Implement PreferencesForm component
    - Create multi-select checkboxes for allergies (Dairy, Gluten, Nuts, Shellfish, Eggs, Soy)
    - Create dropdown for calorie goal (1500, 2000, 2500, 3000)
    - Create dropdown for cultural preference (Mediterranean, Asian, Mexican, Indian, Italian, Australian)
    - Create dropdown for diet type (Vegetarian, Vegan, Pescatarian, Keto, Paleo)
    - Create textarea for free-text notes
    - Implement form validation
    - Handle form submission
    - Create new file: `savesmart-frontend/src/components/PreferencesForm.tsx`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 12.2 Write property test for valid preferences acceptance
    - **Property 1: Valid Preferences Acceptance**
    - **Validates: Requirements 2.6**

  - [ ]* 12.3 Write property test for invalid preferences rejection
    - **Property 2: Invalid Preferences Rejection**
    - **Validates: Requirements 2.7**

  - [ ]* 12.4 Write unit tests for PreferencesForm
    - Test form rendering with all fields
    - Test form validation
    - Test form submission
    - Test pre-fill with existing preferences
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ] 13. Create MealSlot component
  - [~] 13.1 Implement MealSlot component
    - Display empty state with "Add Meal" button when no meal
    - Display meal name, description when meal exists
    - Display "Remove" and "Replace" buttons for existing meals
    - Handle click events for add, remove, replace actions
    - Display recipe link if recipeId exists
    - Create new file: `savesmart-frontend/src/components/MealSlot.tsx`
    - _Requirements: 4.5, 5.1, 6.1, 7.1_

  - [ ]* 13.2 Write unit tests for MealSlot
    - Test empty state rendering
    - Test filled state rendering
    - Test button click handlers
    - Test recipe link rendering
    - _Requirements: 4.5, 5.1, 6.1, 7.1_

- [ ] 14. Create ShoppingList component
  - [~] 14.1 Implement ShoppingList component
    - Display shopping list grouped by store
    - Show ingredient name, quantity, price for each item
    - Calculate and display subtotal per store
    - Calculate and display total weekly cost
    - Create new file: `savesmart-frontend/src/components/ShoppingList.tsx`
    - _Requirements: 4.4, 11.4, 11.5_

  - [ ]* 14.2 Write property test for shopping list item completeness
    - **Property 39: Shopping List Item Completeness**
    - **Validates: Requirements 11.4**

  - [ ]* 14.3 Write unit tests for ShoppingList
    - Test rendering with multiple stores
    - Test subtotal calculations
    - Test total cost calculation
    - _Requirements: 4.4, 11.4, 11.5_

- [ ] 15. Create MealPlanDisplay component
  - [~] 15.1 Implement MealPlanDisplay component
    - Display 7-day grid with 4 meals per day
    - Use MealSlot component for each meal slot
    - Display total weekly cost prominently
    - Include ShoppingList component
    - Add "Browse Recipes" button
    - Add "Regenerate Plan" button
    - Handle meal add, remove, replace actions
    - Handle regenerate action
    - Create new file: `savesmart-frontend/src/components/MealPlanDisplay.tsx`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.4, 6.4, 7.4, 8.1, 9.1_

  - [ ]* 15.2 Write property test for meal plan reactivity
    - **Property 16: Meal Plan Reactivity**
    - **Validates: Requirements 5.4, 6.4, 7.4**

  - [ ]* 15.3 Write unit tests for MealPlanDisplay
    - Test rendering with complete meal plan
    - Test rendering with partial meal plan
    - Test button click handlers
    - Test meal modification callbacks
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.1, 9.1_

- [ ] 16. Update meal plan page with new components
  - [~] 16.1 Refactor meal plan page to use new components
    - Implement state management for empty, preferences, loading, display states
    - Integrate PreferencesForm component
    - Integrate MealPlanDisplay component
    - Implement meal plan generation flow
    - Implement meal add/remove/replace flows
    - Implement regenerate flow
    - Add loading indicators with progress messages
    - Add success/error message toasts
    - Update `savesmart-frontend/src/app/(app)/meal-plan/page.tsx`
    - _Requirements: 1.1, 1.2, 3.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.2, 6.3, 6.4, 6.5, 6.6, 7.2, 7.3, 7.4, 7.5, 7.6, 8.2, 8.3, 8.4, 8.5, 9.2, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [ ]* 16.2 Write property test for success feedback
    - **Property 43: Success Feedback on Meal Operations**
    - **Validates: Requirements 13.2, 13.3, 13.4**

  - [ ]* 16.3 Write property test for error message display
    - **Property 44: Error Message Display**
    - **Validates: Requirements 13.5**

  - [ ]* 16.4 Write unit tests for meal plan page
    - Test empty state rendering
    - Test preferences form display
    - Test loading state during generation
    - Test meal plan display after generation
    - Test error handling
    - _Requirements: 1.1, 1.2, 3.1, 13.1, 13.5_

- [~] 17. Add "View Meal Plan" button to recipes page
  - Update recipes page to include "View Meal Plan" button at the top
  - Implement navigation to meal plan page on click
  - Update `savesmart-frontend/src/app/(app)/recipes/page.tsx`
  - _Requirements: 1.3, 1.4_

- [~] 18. Update recipe detail page with meal plan integration
  - Ensure "Add to Meal Plan" button is present
  - Implement modal/dialog for selecting day and meal type
  - Call addMealToSlot API function on selection
  - Display success message after adding
  - Update `savesmart-frontend/src/app/(app)/recipes/[recipeId]/page.tsx`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 13.2_

- [ ] 19. Implement recipe browser modal for meal replacement
  - [~] 19.1 Create RecipeBrowserModal component
    - Display recipe list filtered by meal type
    - Allow user to select a recipe
    - Handle recipe selection callback
    - Create new file: `savesmart-frontend/src/components/RecipeBrowserModal.tsx`
    - _Requirements: 7.2, 7.3_

  - [ ]* 19.2 Write unit tests for RecipeBrowserModal
    - Test rendering with filtered recipes
    - Test recipe selection
    - Test modal close behavior
    - _Requirements: 7.2, 7.3_

- [ ] 20. Implement confirmation dialog for meal removal
  - [~] 20.1 Create ConfirmationDialog component
    - Display confirmation message
    - Provide "Confirm" and "Cancel" buttons
    - Handle confirmation callback
    - Create new file: `savesmart-frontend/src/components/ConfirmationDialog.tsx`
    - _Requirements: 6.2_

  - [ ]* 20.2 Write unit tests for ConfirmationDialog
    - Test rendering with message
    - Test confirm button click
    - Test cancel button click
    - _Requirements: 6.2_

- [~] 21. Checkpoint - Frontend components complete
  - Ensure all frontend tests pass
  - Test components in isolation with Storybook (if available)
  - Verify component styling and responsiveness
  - Ask the user if questions arise

- [ ] 22. Integration testing
  - [ ]* 22.1 Write integration tests for meal plan generation flow
    - Test complete flow from preferences submission to meal plan display
    - Test API integration with backend
    - Test DynamoDB persistence
    - _Requirements: 3.1, 3.2, 3.8, 10.1, 10.2_

  - [ ]* 22.2 Write integration tests for meal management flows
    - Test add meal flow
    - Test remove meal flow
    - Test replace meal flow
    - Test shopping list regeneration
    - _Requirements: 5.3, 5.5, 5.6, 6.3, 6.5, 6.6, 7.3, 7.5, 7.6_

  - [ ]* 22.3 Write integration tests for regenerate flow
    - Test regenerate with updated preferences
    - Test plan replacement
    - Test preferences persistence
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ] 23. End-to-end testing
  - [ ]* 23.1 Write E2E test for complete meal planning flow
    - Navigate to meal plan page
    - Fill preferences form
    - Submit and wait for generation
    - Verify meal plan display
    - Add a meal from recipe browser
    - Remove a meal
    - Replace a meal
    - Verify shopping list updates
    - Regenerate plan with new preferences
    - _Requirements: 1.1, 1.2, 2.6, 3.1, 4.1, 4.2, 4.3, 4.4, 5.3, 6.3, 7.3, 8.3_

  - [ ]* 23.2 Write E2E test for navigation flows
    - Navigate from recipes page to meal plan
    - Navigate from meal plan to recipe browser
    - Add recipe from browser and return to meal plan
    - _Requirements: 1.3, 1.4, 9.2, 9.4_

- [~] 24. Final checkpoint - Complete feature testing
  - Run all unit tests and ensure they pass
  - Run all property tests and ensure they pass
  - Run all integration tests and ensure they pass
  - Run all E2E tests and ensure they pass
  - Test the feature manually end-to-end
  - Verify all requirements are met
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional test-related sub-tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Integration and E2E tests validate complete user flows
- The implementation follows a backend-first approach to enable frontend development against working APIs
