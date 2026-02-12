# Implementation Plan: Local Backend Expansion

## Overview

This implementation plan transitions SaveSmart from AWS Lambda/API Gateway to a local Express.js backend while adding four major features: savings dashboard, events discovery, fuel price mapping, and recipe browsing. The plan follows an incremental approach, building core infrastructure first, then adding features one by one with testing at each step.

## Tasks

- [ ] 1. Set up Express.js backend infrastructure
  - [x] 1.1 Initialize Node.js project with TypeScript configuration
    - Create package.json with Express, AWS SDK v3, TypeScript dependencies
    - Configure tsconfig.json for Node.js target
    - Set up project structure: src/, routes/, services/, models/, middleware/
    - _Requirements: 1.1, 1.5, 13.1, 13.2_

  - [x] 1.2 Implement environment configuration and AWS DynamoDB connection
    - Create config/env.ts to load environment variables
    - Create config/aws.ts to initialize DynamoDB client
    - Add validation for required environment variables
    - _Requirements: 1.2, 1.4, 1.5, 13.5_

  - [ ]* 1.3 Write unit tests for configuration and startup
    - Test environment variable loading
    - Test DynamoDB connection establishment
    - Test error handling for missing configuration
    - _Requirements: 1.2, 1.4_

  - [x] 1.4 Implement CORS middleware and request logging
    - Create middleware/cors.ts to enable CORS for localhost:3000
    - Create middleware/logger.ts to log all incoming requests
    - _Requirements: 1.3, 14.3_

  - [ ]* 1.5 Write property test for request logging
    - **Property 37: Request Logging Completeness**
    - **Validates: Requirements 14.3**

  - [x] 1.6 Implement global error handler middleware
    - Create middleware/errorHandler.ts with error categorization
    - Handle ValidationError, ExternalAPIError, DatabaseError types
    - Return appropriate HTTP status codes and JSON responses
    - _Requirements: 2.4, 14.1, 14.2_

  - [ ]* 1.7 Write property tests for error handling
    - **Property 1: DynamoDB Error Handling**
    - **Property 35: Error Logging Completeness**
    - **Property 36: API Error Response Format**
    - **Validates: Requirements 2.4, 14.1, 14.2_

- [ ] 2. Implement DynamoDB data layer
  - [x] 2.1 Create data models for User and SavingsPlan
    - Create models/User.ts with User interface
    - Create models/SavingsPlan.ts with SavingsPlan interface
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 2.2 Implement DynamoDB service for user and savings plan operations
    - Create services/dynamodb.ts with DynamoDBService class
    - Implement getUser, updateUser, createUser methods
    - Implement getSavingsPlan, getUserSavingsPlans, createSavingsPlan methods
    - _Requirements: 2.1, 2.2, 6.6, 7.7_

  - [ ]* 2.3 Write property tests for DynamoDB operations
    - **Property 12: Profile Data Validation**
    - **Property 16: Savings Statistics Calculation**
    - **Validates: Requirements 6.6, 7.7**

  - [x] 2.4 Create data models for Event, Recipe, and FuelStation
    - Create models/Event.ts with Event interface
    - Create models/Recipe.ts with Recipe and Ingredient interfaces
    - Create models/FuelStation.ts with FuelStation and FuelPrice interfaces
    - _Requirements: 2.3_

  - [x] 2.5 Implement DynamoDB operations for events, recipes, and fuel stations
    - Add getEvents, cacheEvents methods to DynamoDBService
    - Add getRecipes, getRecipe, cacheRecipes methods
    - Add getFuelStations, cacheFuelStations methods
    - _Requirements: 2.3, 8.7, 9.8, 10.8_

- [ ] 3. Implement caching layer
  - [x] 3.1 Create cache service with TTL support
    - Create utils/cache.ts with CacheService class
    - Implement set, get, invalidate methods with TTL
    - _Requirements: 8.7, 9.8, 10.8_

  - [ ]* 3.2 Write property tests for caching behavior
    - **Property 21: Event Data Caching**
    - **Property 30: Grocery Price Caching**
    - **Validates: Requirements 8.7, 10.8**

- [ ] 4. Implement webhook integration for AI agents
  - [x] 4.1 Create webhook service for n8n integration
    - Create services/webhooks.ts with WebhookService class
    - Implement callChatAgent method with 30-second timeout
    - Implement callSavingsPlanGenerator method
    - Implement callMealPlanningAgent method
    - _Requirements: 3.1, 3.2, 3.5, 11.3_

  - [ ]* 4.2 Write property tests for webhook forwarding
    - **Property 2: Chat Message Forwarding**
    - **Property 3: Savings Plan Request Forwarding**
    - **Property 4: Webhook Response Forwarding**
    - **Property 38: Webhook Call Logging**
    - **Validates: Requirements 3.1, 3.2, 3.4, 14.4**

  - [ ]* 4.3 Write unit test for webhook timeout handling
    - Test 30-second timeout behavior
    - Test error response format
    - _Requirements: 3.5_

- [ ] 5. Checkpoint - Ensure core infrastructure tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement chat API endpoints
  - [ ] 6.1 Create chat routes with context-aware messaging
    - Create routes/chat.ts with POST /api/chat endpoint
    - Extract minimal context from request (pageType, dataId, dataName)
    - Forward message to Chat_Agent webhook
    - Return response to frontend
    - _Requirements: 3.1, 3.4, 4.3, 4.4, 12.4_

  - [ ]* 6.2 Write property tests for chat functionality
    - **Property 5: Chat Message Submission**
    - **Property 6: Minimal Context Inclusion**
    - **Property 7: Chat Response Display**
    - **Validates: Requirements 4.3, 4.4, 4.10**

- [ ] 7. Implement profile management API
  - [ ] 7.1 Create profile routes for CRUD operations
    - Create routes/profile.ts with GET /api/profile/:userId
    - Implement PUT /api/profile/:userId with validation
    - Validate name, email, location, savingsGoal fields
    - _Requirements: 6.5, 6.6, 6.7, 6.8, 12.1, 12.2_

  - [ ]* 7.2 Write property tests for profile operations
    - **Property 11: Profile Update Transmission**
    - **Property 13: Successful Profile Update Response**
    - **Property 14: Profile Validation Error Messages**
    - **Validates: Requirements 6.5, 6.7, 6.8**

  - [ ]* 7.3 Write unit tests for profile validation
    - Test invalid email format
    - Test missing required fields
    - Test negative savings goal
    - _Requirements: 6.6, 6.8_

- [ ] 8. Implement dashboard API with savings statistics
  - [ ] 8.1 Create dashboard routes with time-series aggregation
    - Create routes/dashboard.ts with GET /api/dashboard/:userId
    - Implement getSavingsStatistics in DynamoDBService
    - Calculate total savings, goal progress, completed plans count
    - Aggregate savings by time period (daily, weekly, monthly)
    - Support date range query parameters
    - _Requirements: 7.7, 7.8, 12.3_

  - [ ]* 8.2 Write property tests for dashboard statistics
    - **Property 17: Savings Data Aggregation**
    - **Validates: Requirements 7.8**

  - [ ]* 8.3 Write unit tests for dashboard calculations
    - Test total savings calculation
    - Test progress percentage calculation
    - Test completed plans count
    - _Requirements: 7.7_

- [ ] 9. Implement events discovery feature
  - [x] 9.1 Create Eventbrite API service with fallback
    - Create services/eventbrite.ts with EventbriteService class
    - Implement searchEvents method
    - Add fallback to mock data on API failure
    - _Requirements: 8.3, 8.4, 14.5_

  - [ ] 9.2 Create events routes with location filtering
    - Create routes/events.ts with GET /api/events
    - Support suburb and postcode query parameters
    - Integrate with EventbriteService and cache
    - Return events with source indicator (eventbrite/mock)
    - _Requirements: 8.2, 8.7, 12.5_

  - [ ]* 9.3 Write property tests for events functionality
    - **Property 18: Event Location Filtering**
    - **Property 39: External API Fallback**
    - **Validates: Requirements 8.2, 14.5**

  - [ ]* 9.4 Write unit tests for Eventbrite integration
    - Test API success scenario
    - Test API failure with mock fallback
    - Test cache behavior
    - _Requirements: 8.3, 8.4, 8.7_

- [ ] 10. Checkpoint - Ensure profile, dashboard, and events tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement fuel prices map feature
  - [x] 11.1 Create FuelCheck API service with fallback
    - Create services/fuelcheck.ts with FuelCheckService class
    - Implement getFuelPrices method
    - Add fallback to mock data on API failure
    - _Requirements: 9.5, 9.6, 14.5_

  - [ ] 11.2 Create fuel routes with filtering and distance calculation
    - Create routes/fuel.ts with GET /api/fuel-prices
    - Support suburb, postcode, fuelType query parameters
    - Integrate with FuelCheckService and cache
    - Return stations with source indicator (fuelcheck/mock)
    - _Requirements: 9.4, 9.8, 12.6_

  - [ ]* 11.3 Write property tests for fuel prices functionality
    - **Property 24: Fuel Type Filtering**
    - **Validates: Requirements 9.4**

  - [ ]* 11.4 Write unit tests for FuelCheck integration
    - Test API success scenario
    - Test API failure with mock fallback
    - Test cache refresh behavior
    - _Requirements: 9.5, 9.6, 9.8_

- [ ] 12. Implement recipe browsing feature
  - [x] 12.1 Create Grocery API service with fallback
    - Create services/grocery.ts with GroceryService class
    - Implement getProductPrice and searchProducts methods
    - Add fallback to mock data on API failure
    - _Requirements: 10.6, 10.7, 14.5_

  - [ ] 12.2 Create recipe routes with dietary filtering
    - Create routes/recipes.ts with GET /api/recipes
    - Implement GET /api/recipes/:recipeId
    - Support dietaryTags query parameter
    - Calculate total meal cost from ingredient prices
    - Integrate with GroceryService and cache
    - _Requirements: 10.5, 10.8, 12.7, 12.8_

  - [ ]* 12.3 Write property tests for recipe functionality
    - **Property 28: Total Meal Cost Calculation**
    - **Property 29: Recipe Dietary Filtering**
    - **Validates: Requirements 10.4, 10.5**

  - [ ]* 12.4 Write unit tests for grocery pricing
    - Test price fetching from API
    - Test fallback to mock prices
    - Test cache behavior
    - _Requirements: 10.6, 10.7, 10.8_

- [ ] 13. Implement meal planning integration
  - [ ] 13.1 Create meal plan routes
    - Create routes/mealPlan.ts with POST /api/meal-plan
    - Accept recipeIds and weekStartDate in request
    - Call meal planning agent webhook
    - Update user's meal plan in DynamoDB
    - _Requirements: 11.4, 11.5, 12.9_

  - [ ]* 13.2 Write property tests for meal planning
    - **Property 33: Meal Plan Optimization Request**
    - **Property 34: Meal Plan Update from Agent**
    - **Validates: Requirements 11.4, 11.5**

  - [ ]* 13.3 Write unit test for meal planning agent integration
    - Test webhook call with meal plan data
    - Test DynamoDB update after agent response
    - _Requirements: 11.3, 11.5_

- [ ] 14. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Implement frontend navigation header
  - [ ] 15.1 Create navigation header component
    - Create Header.tsx component with navigation links
    - Add links for Dashboard, Events, Fuel Prices, Recipes, Profile
    - Highlight current page based on route
    - Make responsive for mobile screens
    - _Requirements: 5.2, 5.3, 5.4, 5.6_

  - [ ]* 15.2 Write property tests for navigation
    - **Property 9: Navigation Link Functionality**
    - **Property 10: Current Page Highlighting**
    - **Validates: Requirements 5.3, 5.4**

  - [ ]* 15.3 Write unit tests for header component
    - Test navigation links presence
    - Test responsive behavior
    - _Requirements: 5.2, 5.6_

- [ ] 16. Implement FAB chat interface
  - [ ] 16.1 Create floating action button and chat overlay
    - Create ChatFAB.tsx component visible on all pages
    - Create ChatOverlay.tsx with message input and history display
    - Implement chat history persistence during session
    - _Requirements: 4.2, 4.11, 4.12_

  - [ ] 16.2 Implement context-aware chat messaging
    - Extract page context (pageType, dataId, dataName) from current route
    - Send minimal context with each message
    - Display responses in chat interface
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.10_

  - [ ]* 16.3 Write property tests for chat interface
    - **Property 8: Chat History Persistence**
    - **Validates: Requirements 4.11**

  - [ ]* 16.4 Write unit tests for chat context
    - Test context extraction for recipe page
    - Test context extraction for event page
    - Test context extraction for fuel page
    - Test context extraction for profile page
    - _Requirements: 4.5, 4.6, 4.7, 4.8_

- [ ] 17. Implement profile page
  - [ ] 17.1 Create profile display and edit components
    - Create ProfilePage.tsx to display user information
    - Create ProfileEditForm.tsx with pre-filled fields
    - Display name, email, location, savings goal
    - Handle form submission and validation errors
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 17.2 Write unit tests for profile page
    - Test profile information display
    - Test edit button functionality
    - Test form pre-filling
    - Test form submission
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 18. Implement savings dashboard
  - [ ] 18.1 Create dashboard page with statistics and charts
    - Create DashboardPage.tsx to display savings statistics
    - Display total savings, goal progress, completed plans count
    - Implement savings over time chart (using Chart.js or Recharts)
    - Display recent savings activities
    - Add date range selector for historical data
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.9_

  - [ ] 18.2 Implement savings plan navigation
    - Add click handlers to navigate to plan details
    - _Requirements: 7.6_

  - [ ]* 18.3 Write property tests for dashboard
    - **Property 15: Savings Plan Navigation**
    - **Validates: Requirements 7.6**

  - [ ]* 18.4 Write unit tests for dashboard display
    - Test statistics display
    - Test chart rendering
    - Test date range selector
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.9_

- [ ] 19. Implement events discovery page
  - [ ] 19.1 Create events page with location filtering
    - Create EventsPage.tsx to display event list
    - Add location filter inputs (suburb, postcode)
    - Display event name, date, location, discount for each event
    - Add click handlers to open event details or external links
    - _Requirements: 8.1, 8.2, 8.5, 8.6_

  - [ ]* 19.2 Write property tests for events page
    - **Property 19: Event Display Completeness**
    - **Property 20: Event Click Navigation**
    - **Validates: Requirements 8.5, 8.6**

  - [ ]* 19.3 Write unit tests for events display
    - Test event list rendering
    - Test location filtering
    - _Requirements: 8.1, 8.2_

- [ ] 20. Checkpoint - Ensure frontend core features tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Implement fuel prices map page
  - [ ] 21.1 Create fuel prices map with markers
    - Create FuelPricesPage.tsx with interactive map (Leaflet or Google Maps)
    - Display fuel stations as markers
    - Add fuel type filter dropdown
    - Calculate and display distance from user location
    - _Requirements: 9.1, 9.2, 9.4, 9.7_

  - [ ] 21.2 Implement fuel station marker click handler
    - Display fuel prices popup on marker click
    - Show all available fuel types and prices
    - _Requirements: 9.3_

  - [ ]* 21.3 Write property tests for fuel map
    - **Property 22: Fuel Station Map Markers**
    - **Property 23: Fuel Station Price Display**
    - **Property 25: Fuel Station Distance Calculation**
    - **Validates: Requirements 9.2, 9.3, 9.7**

  - [ ]* 21.4 Write unit tests for fuel map
    - Test map rendering
    - Test marker display
    - Test filter functionality
    - _Requirements: 9.2, 9.4_

- [ ] 22. Implement recipe browsing page
  - [ ] 22.1 Create recipes page with dietary filtering
    - Create RecipesPage.tsx to display recipe list with photos
    - Add dietary preference filters (vegetarian, vegan, gluten-free)
    - Display recipe name and photo for each recipe
    - _Requirements: 10.1, 10.5_

  - [ ] 22.2 Create recipe detail page
    - Create RecipeDetailPage.tsx to display full recipe
    - Display ingredient list with prices
    - Calculate and display total meal cost
    - Add "Add to Meal Plan" button
    - _Requirements: 10.2, 10.3, 10.4, 11.1_

  - [ ]* 22.3 Write property tests for recipe pages
    - **Property 26: Recipe Detail Display**
    - **Property 27: Ingredient Price Display**
    - **Property 31: Add to Meal Plan Button Presence**
    - **Validates: Requirements 10.2, 10.3, 11.1**

  - [ ]* 22.4 Write unit tests for recipe display
    - Test recipe list rendering
    - Test dietary filtering
    - Test recipe detail display
    - _Requirements: 10.1, 10.5, 10.2_

- [ ] 23. Implement meal planning integration in frontend
  - [ ] 23.1 Connect "Add to Meal Plan" button to backend
    - Implement click handler to call POST /api/meal-plan
    - Update meal planning template with added recipe
    - Display success/error feedback
    - _Requirements: 11.2, 11.4_

  - [ ]* 23.2 Write property tests for meal planning
    - **Property 32: Recipe Meal Plan Addition**
    - **Validates: Requirements 11.2**

  - [ ]* 23.3 Write unit tests for meal plan integration
    - Test button click handler
    - Test API call
    - Test success feedback
    - _Requirements: 11.2_

- [ ] 24. Create mock data generators for demo
  - [x] 24.1 Implement mock data utilities
    - Create utils/mockData.ts with generators for events, fuel stations, recipes
    - Generate realistic mock data for demonstration
    - _Requirements: 8.4, 9.6, 10.7_

  - [ ]* 24.2 Write unit tests for mock data
    - Test mock event generation
    - Test mock fuel station generation
    - Test mock recipe generation
    - _Requirements: 8.4, 9.6, 10.7_

- [ ] 25. Create setup documentation
  - [ ] 25.1 Write README with setup instructions
    - Document installation steps (npm install)
    - Document environment variable configuration
    - Create .env.example file with all required variables
    - Document startup commands (npm start)
    - Include troubleshooting section
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.6_

- [ ] 26. Final checkpoint - Ensure all tests pass and application runs
  - Ensure all tests pass, ask the user if questions arise.
  - Verify backend starts on localhost:3001
  - Verify frontend connects to backend successfully
  - Test all features end-to-end with mock data

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples, edge cases, and integration points
- Mock data enables full feature demonstration without external API dependencies
- The implementation follows a backend-first approach, then frontend integration
