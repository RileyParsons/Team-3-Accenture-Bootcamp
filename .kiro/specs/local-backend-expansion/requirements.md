# Requirements Document

## Introduction

The SaveSmart application is transitioning from a serverless AWS Lambda/API Gateway architecture to a local Node.js/Express backend to eliminate timeout issues and accelerate development velocity. The backend will maintain AWS DynamoDB for data persistence and integrate with n8n webhooks for AI agent functionality. This expansion introduces four major user-facing features: a profile page with savings statistics, local events discovery with deals, a fuel prices map, and a recipe browser with real-time pricing.

## Glossary

- **Backend_Server**: The local Express.js server running on localhost:3001
- **Chat_Agent**: The n8n webhook-based AI agent providing quick conversational responses
- **Savings_Plan_Generator**: The n8n webhook-based AI agent generating detailed financial reports
- **DynamoDB**: AWS NoSQL database service used for data persistence
- **Frontend**: The React application running on localhost:3000
- **FAB**: Floating Action Button for accessing chat interface
- **FuelCheck_API**: NSW Government API providing real-time fuel price data
- **Eventbrite_API**: Third-party API for event discovery
- **Grocery_API**: Coles/Woolworths API for product pricing (or mock data)
- **User**: A person using the SaveSmart application
- **Savings_Plan**: A generated financial report with recommendations
- **Event**: A local activity with associated deals or discounts
- **Fuel_Station**: A location selling fuel with current price information
- **Recipe**: A meal preparation guide with ingredient list and pricing

## Requirements

### Requirement 1: Local Backend Infrastructure

**User Story:** As a developer, I want to run the backend locally on Express.js, so that I can avoid Lambda timeout issues and iterate faster during development.

#### Acceptance Criteria

1. THE Backend_Server SHALL run on localhost port 3001
2. WHEN the Backend_Server starts, THE Backend_Server SHALL connect to DynamoDB using AWS SDK credentials
3. THE Backend_Server SHALL enable CORS for requests from localhost:3000
4. WHEN environment variables are missing, THE Backend_Server SHALL log descriptive errors and fail to start
5. THE Backend_Server SHALL load configuration from environment variables for AWS credentials and n8n webhook URLs
6. WHEN the Backend_Server receives a request, THE Backend_Server SHALL respond within 5 seconds

### Requirement 2: DynamoDB Data Layer

**User Story:** As a developer, I want to maintain existing DynamoDB tables and create new ones as needed, so that data persists reliably across sessions.

#### Acceptance Criteria

1. THE Backend_Server SHALL connect to the existing savesmart-users table
2. THE Backend_Server SHALL connect to the existing savesmart-plans table
3. WHERE new features require data storage, THE Backend_Server SHALL create tables for events, recipes, and fuel-stations
4. WHEN a DynamoDB operation fails, THE Backend_Server SHALL return an error response with status code 500
5. THE Backend_Server SHALL use consistent data models for all DynamoDB operations

### Requirement 3: AI Agent Integration

**User Story:** As a user, I want to interact with AI agents for chat and savings plan generation, so that I can get personalized financial advice.

#### Acceptance Criteria

1. WHEN a user sends a chat message, THE Backend_Server SHALL forward the message to the Chat_Agent webhook
2. WHEN a user requests a savings plan, THE Backend_Server SHALL forward the request to the Savings_Plan_Generator webhook
3. THE Backend_Server SHALL wait for webhook responses without timeout limits
4. WHEN a webhook returns a response, THE Backend_Server SHALL forward it to the Frontend
5. IF a webhook fails to respond within 30 seconds, THEN THE Backend_Server SHALL return a timeout error to the Frontend

### Requirement 4: Chat Interface

**User Story:** As a user, I want to access a chat interface from any page via a floating button, so that I can quickly ask financial questions without navigating away.

#### Acceptance Criteria

1. THE Frontend SHALL display a FAB on all pages
2. WHEN a user clicks the FAB, THE Frontend SHALL open a chat interface overlay
3. WHEN a user types a message and submits it, THE Frontend SHALL send the message to the Backend_Server chat endpoint with minimal page context
4. WHERE page context is relevant, THE Frontend SHALL include only the current page type and key data identifiers (not full page content)
5. WHEN viewing a recipe, THE Frontend SHALL include recipe ID and name in chat context
6. WHEN viewing a fuel station, THE Frontend SHALL include station ID and location in chat context
7. WHEN viewing an event, THE Frontend SHALL include event ID and name in chat context
8. WHEN viewing the profile page, THE Frontend SHALL include user ID in chat context
9. THE Backend_Server SHALL fetch full details from DynamoDB using provided identifiers only when needed by the Chat_Agent
10. WHEN the Chat_Agent responds, THE Frontend SHALL display the response in the chat interface
11. THE Frontend SHALL maintain chat history during the current session
12. WHEN a user closes the chat interface, THE Frontend SHALL preserve the chat history

### Requirement 5: Navigation Header

**User Story:** As a user, I want a clear navigation header on all pages, so that I can easily move between different sections of the application.

#### Acceptance Criteria

1. THE Frontend SHALL display a navigation header on all pages
2. THE Frontend SHALL include navigation links for Dashboard, Events, Fuel Prices, Recipes, and Profile
3. WHEN a user clicks a navigation link, THE Frontend SHALL navigate to the corresponding page
4. THE Frontend SHALL highlight the current page in the navigation header
5. THE Frontend SHALL display the SaveSmart logo or application name in the header
6. THE Frontend SHALL be responsive and adapt to mobile screen sizes

### Requirement 6: User Profile Management

**User Story:** As a user, I want to view and edit my profile information, so that I can keep my account details current.

#### Acceptance Criteria

1. WHEN a user navigates to the profile page, THE Frontend SHALL display user profile information including name, email, location, and savings goal
2. THE Frontend SHALL provide an edit profile button
3. WHEN a user clicks edit profile, THE Frontend SHALL display a form with current profile data pre-filled
4. THE Frontend SHALL allow users to modify name, email, location, and savings goal
5. WHEN a user submits profile changes, THE Frontend SHALL send the updated data to the Backend_Server
6. THE Backend_Server SHALL validate profile data before updating the savesmart-users table
7. WHEN profile update succeeds, THE Backend_Server SHALL return the updated profile data
8. WHEN profile update fails validation, THE Backend_Server SHALL return specific error messages for each invalid field

### Requirement 7: Savings Dashboard

**User Story:** As a user, I want to view a dashboard with my savings statistics and progress over time, so that I can track my financial improvement.

#### Acceptance Criteria

1. WHEN a user navigates to the dashboard page, THE Frontend SHALL display total savings amount
2. THE Frontend SHALL display savings goal and progress percentage toward that goal
3. THE Frontend SHALL display number of completed savings plans
4. THE Frontend SHALL display a chart showing savings over time (weekly or monthly)
5. THE Frontend SHALL display recent savings activities or transactions
6. WHEN a user clicks on a savings plan in the dashboard, THE Frontend SHALL navigate to the full plan details
7. THE Backend_Server SHALL calculate savings statistics from the savesmart-plans table
8. THE Backend_Server SHALL aggregate savings data by time period for chart display
9. THE Frontend SHALL provide a date range selector for viewing historical savings data

### Requirement 8: Events Discovery

**User Story:** As a user, I want to discover local events with deals and discounts, so that I can save money on entertainment and activities.

#### Acceptance Criteria

1. WHEN a user navigates to the events page, THE Frontend SHALL display a list of local events
2. THE Frontend SHALL allow users to filter events by location using suburb or postcode
3. WHERE the Eventbrite_API is available, THE Backend_Server SHALL fetch real event data
4. WHERE the Eventbrite_API is unavailable, THE Backend_Server SHALL return mock event data for demonstration
5. WHEN displaying an event, THE Frontend SHALL show event name, date, location, and discount information
6. WHEN a user clicks on an event, THE Frontend SHALL open the event details page or external link
7. THE Backend_Server SHALL cache event data for 1 hour to reduce API calls

### Requirement 9: Fuel Prices Map

**User Story:** As a user, I want to view fuel prices on an interactive map, so that I can find the cheapest fuel near my location.

#### Acceptance Criteria

1. WHEN a user navigates to the fuel prices page, THE Frontend SHALL display an interactive map
2. THE Frontend SHALL show fuel stations as markers on the map
3. WHEN a user clicks a fuel station marker, THE Frontend SHALL display current fuel prices for that station
4. THE Frontend SHALL allow users to filter by fuel type (E10, U91, U95, U98, Diesel)
5. WHERE the FuelCheck_API is available, THE Backend_Server SHALL fetch real fuel price data
6. WHERE the FuelCheck_API is unavailable, THE Backend_Server SHALL return mock fuel price data
7. THE Frontend SHALL calculate and display distance from the user's location to each fuel station
8. THE Backend_Server SHALL refresh fuel price data every 30 minutes

### Requirement 10: Recipe Browser with Pricing

**User Story:** As a user, I want to browse recipes with real-time ingredient pricing, so that I can plan affordable meals.

#### Acceptance Criteria

1. WHEN a user navigates to the recipes page, THE Frontend SHALL display a list of recipes with photos
2. WHEN a user clicks on a recipe, THE Frontend SHALL display the full recipe with ingredient list
3. THE Frontend SHALL display current prices for each ingredient
4. THE Frontend SHALL calculate and display the total meal cost
5. THE Frontend SHALL allow users to filter recipes by dietary preferences (vegetarian, vegan, gluten-free)
6. WHERE the Grocery_API is available, THE Backend_Server SHALL fetch real-time pricing from Coles/Woolworths
7. WHERE the Grocery_API is unavailable, THE Backend_Server SHALL return mock pricing data
8. THE Backend_Server SHALL cache grocery prices for 24 hours

### Requirement 11: Meal Planning Integration

**User Story:** As a user, I want to integrate recipes with my meal planning template, so that I can organize my weekly meals efficiently.

#### Acceptance Criteria

1. WHEN a user views a recipe, THE Frontend SHALL provide an "Add to Meal Plan" button
2. WHEN a user clicks "Add to Meal Plan", THE Frontend SHALL add the recipe to the existing meal planning template
3. THE Backend_Server SHALL connect to the teammate's meal planning agent webhook
4. WHEN a user requests meal plan optimization, THE Backend_Server SHALL send the meal plan to the meal planning agent
5. WHEN the meal planning agent responds, THE Backend_Server SHALL update the user's meal plan in DynamoDB

### Requirement 12: RESTful API Design

**User Story:** As a frontend developer, I want well-structured RESTful API endpoints, so that I can easily integrate backend functionality.

#### Acceptance Criteria

1. THE Backend_Server SHALL provide GET /api/profile/:userId for retrieving user profiles
2. THE Backend_Server SHALL provide PUT /api/profile/:userId for updating user profiles
3. THE Backend_Server SHALL provide GET /api/dashboard/:userId for retrieving dashboard statistics
4. THE Backend_Server SHALL provide POST /api/chat for sending chat messages
5. THE Backend_Server SHALL provide POST /api/savings-plan for generating savings plans
6. THE Backend_Server SHALL provide GET /api/events for retrieving local events
7. THE Backend_Server SHALL provide GET /api/fuel-prices for retrieving fuel station data
8. THE Backend_Server SHALL provide GET /api/recipes for retrieving recipe list
9. THE Backend_Server SHALL provide GET /api/recipes/:recipeId for retrieving recipe details
10. THE Backend_Server SHALL provide POST /api/meal-plan for meal planning operations
11. WHEN an API endpoint receives invalid data, THE Backend_Server SHALL return status code 400 with error details
12. WHEN an API endpoint succeeds, THE Backend_Server SHALL return status code 200 with response data

### Requirement 13: Development Environment Setup

**User Story:** As a team member, I want easy setup instructions and configuration, so that I can run the application locally without friction.

#### Acceptance Criteria

1. THE Backend_Server SHALL include a README with setup instructions
2. THE Backend_Server SHALL provide an example .env file with all required variables
3. WHEN a developer runs npm install, THE Backend_Server SHALL install all dependencies
4. WHEN a developer runs npm start, THE Backend_Server SHALL start on localhost:3001
5. THE Backend_Server SHALL log startup messages indicating successful initialization
6. WHERE AWS credentials are not configured, THE Backend_Server SHALL provide clear error messages with resolution steps

### Requirement 14: Error Handling and Logging

**User Story:** As a developer, I want comprehensive error handling and logging, so that I can quickly diagnose and fix issues.

#### Acceptance Criteria

1. WHEN an error occurs, THE Backend_Server SHALL log the error with timestamp and stack trace
2. WHEN an API request fails, THE Backend_Server SHALL return a JSON error response with a descriptive message
3. THE Backend_Server SHALL log all incoming requests with method, path, and timestamp
4. THE Backend_Server SHALL log all outgoing webhook calls with URL and payload
5. WHERE an external API fails, THE Backend_Server SHALL fall back to mock data and log the failure
