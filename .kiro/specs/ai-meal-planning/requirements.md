# Requirements Document: AI-Powered Meal Planning

## Introduction

This feature enhances the existing meal plan page to enable users to create personalized AI-generated weekly meal plans based on their dietary preferences, restrictions, and personal notes. The system will leverage OpenAI to generate intelligent meal plans that consider user preferences, available recipes from the database, and provide comprehensive shopping lists grouped by store.

## Glossary

- **System**: The SaveSmart AI-powered meal planning application
- **User**: A registered SaveSmart user creating or managing meal plans
- **Meal_Plan**: A structured weekly schedule of meals (7 days, 3-4 meals per day)
- **Preferences_Form**: The user interface for collecting dietary preferences and restrictions
- **AI_Generator**: The OpenAI-powered service that generates personalized meal plans
- **Recipe_Database**: The collection of available recipes stored in the system
- **Shopping_List**: A grouped list of ingredients needed for the meal plan, organized by store
- **Meal_Slot**: A specific meal position in the plan (e.g., Monday breakfast, Tuesday lunch)
- **DynamoDB**: The database service storing user profiles and meal plans
- **WebhookService**: The existing service for OpenAI API integration

## Requirements

### Requirement 1: Empty State and Entry Points

**User Story:** As a user, I want clear entry points to create and view my meal plan, so that I can easily access meal planning functionality from multiple locations in the app.

#### Acceptance Criteria

1. WHEN a user navigates to the meal plan page and no meal plan exists, THEN the System SHALL display an empty state with a "Create Meal Plan" button
2. WHEN a user clicks the "Create Meal Plan" button, THEN the System SHALL navigate to the preferences form
3. WHEN a user is on the recipes page, THEN the System SHALL display a "View Meal Plan" button at the top of the page
4. WHEN a user clicks the "View Meal Plan" button from the recipes page, THEN the System SHALL navigate to the meal plan page

### Requirement 2: Meal Plan Preferences Collection

**User Story:** As a user, I want to specify my dietary preferences and restrictions, so that the AI can generate a meal plan tailored to my needs.

#### Acceptance Criteria

1. WHEN the preferences form is displayed, THEN the System SHALL show selection options for food allergies including Dairy, Gluten, Nuts, Shellfish, Eggs, and Soy
2. WHEN the preferences form is displayed, THEN the System SHALL show selection options for daily calorie goals including 1500, 2000, 2500, and 3000 calories
3. WHEN the preferences form is displayed, THEN the System SHALL show selection options for cultural preferences including Mediterranean, Asian, Mexican, Indian, Italian, and Australian
4. WHEN the preferences form is displayed, THEN the System SHALL show selection options for diet types including Vegetarian, Vegan, Pescatarian, Keto, and Paleo
5. WHEN the preferences form is displayed, THEN the System SHALL provide a free-text notes field for additional preferences, likes, and dislikes
6. WHEN a user submits the preferences form with all required fields, THEN the System SHALL validate the input and proceed to meal plan generation
7. WHEN a user submits the preferences form with missing required fields, THEN the System SHALL display validation errors and prevent submission

### Requirement 3: AI Meal Plan Generation

**User Story:** As a user, I want the AI to generate a personalized weekly meal plan based on my preferences, so that I have a complete meal schedule that fits my dietary needs.

#### Acceptance Criteria

1. WHEN a user submits valid preferences, THEN the System SHALL send the preferences and notes to the AI_Generator via WebhookService
2. WHEN the AI_Generator receives preferences, THEN the System SHALL generate a meal plan containing 7 days with 3 to 4 meals per day
3. WHEN generating a meal plan, THEN the AI_Generator SHALL consider the user's dietary restrictions from the preferences
4. WHEN generating a meal plan, THEN the AI_Generator SHALL consider the user's calorie goals from the preferences
5. WHEN generating a meal plan, THEN the AI_Generator SHALL consider the user's cultural preferences from the preferences
6. WHEN generating a meal plan, THEN the AI_Generator SHALL consider the user's personal likes and dislikes from the notes field
7. WHEN generating a meal plan, THEN the AI_Generator SHALL prioritize recipes from the Recipe_Database when available
8. WHEN the AI_Generator completes generation, THEN the System SHALL return a structured Meal_Plan with day-by-day breakdown, meal names, descriptions, recipe IDs, and total weekly cost estimate
9. WHEN the AI_Generator fails to generate a plan, THEN the System SHALL display an error message and allow the user to retry

### Requirement 4: Meal Plan Display

**User Story:** As a user, I want to view my generated weekly meal plan in an organized format, so that I can see all my meals and understand the total cost.

#### Acceptance Criteria

1. WHEN a generated meal plan is available, THEN the System SHALL display the plan organized by day
2. WHEN displaying a meal plan, THEN the System SHALL show breakfast, lunch, dinner, and snack for each day
3. WHEN displaying a meal plan, THEN the System SHALL show the total weekly cost prominently
4. WHEN displaying a meal plan, THEN the System SHALL show a shopping list grouped by store
5. WHEN a meal in the plan is linked to a recipe from the Recipe_Database, THEN the System SHALL display the recipe name as a clickable link
6. WHEN a user clicks a recipe link in the meal plan, THEN the System SHALL navigate to the recipe detail page

### Requirement 5: Add Meals to Plan

**User Story:** As a user, I want to add specific recipes from the recipe browser to my meal plan, so that I can customize my plan with recipes I like.

#### Acceptance Criteria

1. WHEN a user is viewing a recipe detail page, THEN the System SHALL display an "Add to Meal Plan" button
2. WHEN a user clicks "Add to Meal Plan" on a recipe, THEN the System SHALL prompt the user to select a day and meal type
3. WHEN a user selects a day and meal type for a recipe, THEN the System SHALL add the recipe to that Meal_Slot in the plan
4. WHEN a recipe is successfully added to the plan, THEN the System SHALL update the meal plan display immediately
5. WHEN a recipe is successfully added to the plan, THEN the System SHALL update the total weekly cost
6. WHEN a recipe is successfully added to the plan, THEN the System SHALL update the shopping list with the recipe's ingredients

### Requirement 6: Remove Meals from Plan

**User Story:** As a user, I want to remove individual meals from my plan, so that I can eliminate meals I don't want.

#### Acceptance Criteria

1. WHEN a meal is displayed in the plan, THEN the System SHALL show a "Remove" button for that meal
2. WHEN a user clicks "Remove" on a meal, THEN the System SHALL prompt for confirmation
3. WHEN a user confirms removal, THEN the System SHALL remove the meal from that Meal_Slot
4. WHEN a meal is removed, THEN the System SHALL update the meal plan display immediately
5. WHEN a meal is removed, THEN the System SHALL update the total weekly cost
6. WHEN a meal is removed, THEN the System SHALL update the shopping list to exclude ingredients only used in that meal

### Requirement 7: Replace Meals in Plan

**User Story:** As a user, I want to swap out meals with other recipes from the database, so that I can adjust my plan without starting over.

#### Acceptance Criteria

1. WHEN a meal is displayed in the plan, THEN the System SHALL show a "Replace" button for that meal
2. WHEN a user clicks "Replace" on a meal, THEN the System SHALL display a recipe browser filtered by the same meal type
3. WHEN a user selects a replacement recipe, THEN the System SHALL replace the original meal with the new recipe in that Meal_Slot
4. WHEN a meal is replaced, THEN the System SHALL update the meal plan display immediately
5. WHEN a meal is replaced, THEN the System SHALL update the total weekly cost
6. WHEN a meal is replaced, THEN the System SHALL update the shopping list with the new recipe's ingredients

### Requirement 8: Regenerate Meal Plan

**User Story:** As a user, I want to regenerate my entire meal plan with updated preferences, so that I can get a fresh plan when my needs change.

#### Acceptance Criteria

1. WHEN a meal plan is displayed, THEN the System SHALL show a "Regenerate Plan" button
2. WHEN a user clicks "Regenerate Plan", THEN the System SHALL display the preferences form pre-filled with current preferences
3. WHEN a user submits updated preferences, THEN the System SHALL generate a new meal plan using the AI_Generator
4. WHEN a new plan is generated, THEN the System SHALL replace the existing plan completely
5. WHEN a new plan is generated, THEN the System SHALL save the updated preferences to the user's profile

### Requirement 9: Browse Recipes from Meal Plan

**User Story:** As a user, I want to browse available recipes while viewing my meal plan, so that I can find meals to add or use as replacements.

#### Acceptance Criteria

1. WHEN a meal plan is displayed, THEN the System SHALL show a "Browse Recipes" button
2. WHEN a user clicks "Browse Recipes", THEN the System SHALL navigate to the recipe browser page
3. WHEN a user is on the recipe browser from the meal plan, THEN the System SHALL maintain context for easy return to the meal plan
4. WHEN a user adds a recipe from the browser, THEN the System SHALL return to the meal plan with the recipe added

### Requirement 10: Data Persistence

**User Story:** As a system administrator, I want meal plans and preferences stored persistently, so that users can access their plans across sessions.

#### Acceptance Criteria

1. WHEN a meal plan is generated, THEN the System SHALL save the complete Meal_Plan to the user's DynamoDB profile
2. WHEN preferences are submitted, THEN the System SHALL save the preferences to the user's DynamoDB profile
3. WHEN a user modifies their meal plan, THEN the System SHALL update the stored Meal_Plan in DynamoDB immediately
4. WHEN a user returns to the meal plan page, THEN the System SHALL retrieve and display their saved Meal_Plan from DynamoDB
5. WHEN a user has no saved meal plan, THEN the System SHALL display the empty state

### Requirement 11: Shopping List Generation

**User Story:** As a user, I want an automatically generated shopping list grouped by store, so that I can efficiently purchase ingredients for my meal plan.

#### Acceptance Criteria

1. WHEN a meal plan contains recipes from the Recipe_Database, THEN the System SHALL generate a Shopping_List from the recipe ingredients
2. WHEN generating a shopping list, THEN the System SHALL group ingredients by store (Coles, Woolworths, Aldi)
3. WHEN generating a shopping list, THEN the System SHALL aggregate duplicate ingredients across recipes
4. WHEN displaying the shopping list, THEN the System SHALL show ingredient name, quantity, and price for each item
5. WHEN displaying the shopping list, THEN the System SHALL show the total cost per store
6. WHEN a meal is added or removed from the plan, THEN the System SHALL regenerate the shopping list automatically

### Requirement 12: API Integration

**User Story:** As a developer, I want well-defined API endpoints for meal plan operations, so that the frontend can interact with meal planning functionality.

#### Acceptance Criteria

1. THE System SHALL provide a POST endpoint at /api/meal-plan/generate for AI meal plan generation
2. THE System SHALL provide a GET endpoint at /api/meal-plan/:userId for retrieving a user's meal plan
3. THE System SHALL provide a PUT endpoint at /api/meal-plan/:userId for updating a user's meal plan
4. THE System SHALL provide a DELETE endpoint at /api/meal-plan/:userId/meal for removing individual meals
5. THE System SHALL provide a POST endpoint at /api/meal-plan/:userId/meal for adding meals to the plan
6. WHEN any meal plan endpoint is called, THEN the System SHALL validate the userId and return appropriate error codes for invalid requests
7. WHEN the AI generation endpoint is called, THEN the System SHALL use the existing WebhookService for OpenAI integration

### Requirement 13: User Experience and Feedback

**User Story:** As a user, I want clear feedback during meal plan operations, so that I understand what the system is doing and when operations complete.

#### Acceptance Criteria

1. WHEN a meal plan is being generated, THEN the System SHALL display a loading indicator with progress message
2. WHEN a meal is added to the plan, THEN the System SHALL display a success message
3. WHEN a meal is removed from the plan, THEN the System SHALL display a success message
4. WHEN a meal is replaced in the plan, THEN the System SHALL display a success message
5. WHEN an operation fails, THEN the System SHALL display a clear error message explaining what went wrong
6. WHEN the AI generation takes longer than 5 seconds, THEN the System SHALL display a message indicating the AI is working
