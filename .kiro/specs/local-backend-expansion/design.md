# Design Document: Local Backend Expansion

## Overview

The SaveSmart application transitions from AWS Lambda/API Gateway to a local Express.js backend to eliminate timeout constraints and accelerate development. The architecture maintains AWS DynamoDB for persistence while introducing direct n8n webhook integration for AI agents. The system expands with four major features: a savings dashboard with time-series tracking, local events discovery, fuel price mapping, and recipe browsing with real-time pricing.

The design prioritizes token efficiency in AI agent communication, graceful fallback to mock data for external APIs, and a clean separation between backend services and frontend presentation.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│                      localhost:3000                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │ Events   │  │  Fuel    │  │ Recipes  │   │
│  │          │  │          │  │  Prices  │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         FAB Chat (Available on all pages)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend Server (Express.js)                     │
│                   localhost:3001                             │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Chat    │  │ Profile  │  │  Events  │  │  Fuel    │   │
│  │ Routes   │  │ Routes   │  │ Routes   │  │ Routes   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Recipe   │  │Dashboard │  │  Meal    │                  │
│  │ Routes   │  │ Routes   │  │  Plan    │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
         │                │                │
         │                │                │
         ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   n8n Chat   │  │  n8n Savings │  │  n8n Meal    │
│   Webhook    │  │  Plan Gen    │  │  Planning    │
└──────────────┘  └──────────────┘  └──────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS DynamoDB                              │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ savesmart-   │  │ savesmart-   │  │ savesmart-   │     │
│  │   users      │  │   plans      │  │   events     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ savesmart-   │  │ savesmart-   │                        │
│  │  recipes     │  │fuel-stations │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              External APIs (with fallback)                   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Eventbrite   │  │  FuelCheck   │  │ Coles/Woolies│     │
│  │     API      │  │   NSW API    │  │     API      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: AWS DynamoDB (via AWS SDK v3)
- **AI Integration**: n8n webhooks (HTTP POST)
- **Frontend**: React (existing)
- **External APIs**: Eventbrite, FuelCheck NSW, Coles/Woolworths (with mock fallbacks)
- **Maps**: Leaflet or Google Maps API for fuel station visualization

## Components and Interfaces

### Backend Server Structure

```
savesmart-backend/
├── src/
│   ├── index.ts                 # Express app initialization
│   ├── config/
│   │   ├── env.ts              # Environment variable loading
│   │   └── aws.ts              # DynamoDB client configuration
│   ├── routes/
│   │   ├── chat.ts             # Chat endpoint
│   │   ├── profile.ts          # Profile CRUD
│   │   ├── dashboard.ts        # Dashboard statistics
│   │   ├── events.ts           # Events discovery
│   │   ├── fuel.ts             # Fuel prices
│   │   ├── recipes.ts          # Recipe browsing
│   │   └── mealPlan.ts         # Meal planning
│   ├── services/
│   │   ├── dynamodb.ts         # DynamoDB operations
│   │   ├── webhooks.ts         # n8n webhook calls
│   │   ├── eventbrite.ts       # Eventbrite API integration
│   │   ├── fuelcheck.ts        # FuelCheck API integration
│   │   └── grocery.ts          # Grocery pricing API
│   ├── models/
│   │   ├── User.ts             # User data model
│   │   ├── SavingsPlan.ts      # Savings plan model
│   │   ├── Event.ts            # Event model
│   │   ├── Recipe.ts           # Recipe model
│   │   └── FuelStation.ts      # Fuel station model
│   ├── middleware/
│   │   ├── cors.ts             # CORS configuration
│   │   ├── errorHandler.ts    # Global error handling
│   │   └── logger.ts           # Request logging
│   └── utils/
│       ├── mockData.ts         # Mock data generators
│       └── cache.ts            # Simple in-memory cache
├── .env.example
├── package.json
└── tsconfig.json
```

### Data Models

#### User Model
```typescript
interface User {
  userId: string;              // Partition key
  email: string;
  name: string;
  location: {
    suburb: string;
    postcode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  savingsGoal: number;
  createdAt: string;           // ISO 8601 timestamp
  updatedAt: string;
}
```

#### Savings Plan Model
```typescript
interface SavingsPlan {
  planId: string;              // Partition key
  userId: string;              // GSI partition key
  title: string;
  description: string;
  totalSavings: number;
  recommendations: string[];
  createdAt: string;
  status: 'active' | 'completed' | 'archived';
}
```

#### Event Model
```typescript
interface Event {
  eventId: string;             // Partition key
  name: string;
  description: string;
  date: string;                // ISO 8601 timestamp
  location: {
    venue: string;
    suburb: string;
    postcode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  discount: {
    description: string;
    amount?: number;
    percentage?: number;
  };
  externalUrl: string;
  source: 'eventbrite' | 'mock';
  cachedAt: string;
}
```

#### Recipe Model
```typescript
interface Recipe {
  recipeId: string;            // Partition key
  name: string;
  description: string;
  imageUrl: string;
  prepTime: number;            // minutes
  servings: number;
  dietaryTags: string[];       // ['vegetarian', 'vegan', 'gluten-free']
  ingredients: Ingredient[];
  instructions: string[];
  totalCost: number;           // calculated from ingredients
  cachedAt: string;
}

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  source: 'coles' | 'woolworths' | 'mock';
}
```

#### Fuel Station Model
```typescript
interface FuelStation {
  stationId: string;           // Partition key
  name: string;
  brand: string;
  location: {
    address: string;
    suburb: string;
    postcode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  prices: FuelPrice[];
  source: 'fuelcheck' | 'mock';
  updatedAt: string;
}

interface FuelPrice {
  fuelType: 'E10' | 'U91' | 'U95' | 'U98' | 'Diesel';
  price: number;              // cents per liter
  lastUpdated: string;
}
```

### API Endpoints

#### Chat Endpoints
```
POST /api/chat
Request: {
  userId: string;
  message: string;
  context?: {
    pageType: 'dashboard' | 'recipe' | 'event' | 'fuel' | 'profile';
    dataId?: string;
    dataName?: string;
  };
}
Response: {
  response: string;
  timestamp: string;
}
```

#### Profile Endpoints
```
GET /api/profile/:userId
Response: User

PUT /api/profile/:userId
Request: Partial<User>
Response: User
```

#### Dashboard Endpoints
```
GET /api/dashboard/:userId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
Response: {
  totalSavings: number;
  savingsGoal: number;
  progressPercentage: number;
  completedPlans: number;
  savingsOverTime: {
    date: string;
    amount: number;
  }[];
  recentActivities: {
    planId: string;
    title: string;
    savings: number;
    date: string;
  }[];
}
```

#### Events Endpoints
```
GET /api/events?suburb=string&postcode=string
Response: {
  events: Event[];
  source: 'eventbrite' | 'mock';
}
```

#### Fuel Endpoints
```
GET /api/fuel-prices?suburb=string&postcode=string&fuelType=string
Response: {
  stations: FuelStation[];
  source: 'fuelcheck' | 'mock';
}
```

#### Recipe Endpoints
```
GET /api/recipes?dietaryTags=string[]
Response: {
  recipes: Recipe[];
}

GET /api/recipes/:recipeId
Response: Recipe
```

#### Meal Plan Endpoints
```
POST /api/meal-plan
Request: {
  userId: string;
  recipeIds: string[];
  weekStartDate: string;
}
Response: {
  mealPlan: {
    day: string;
    recipeId: string;
    recipeName: string;
  }[];
  totalWeeklyCost: number;
  optimizationSuggestions: string[];
}
```

#### Savings Plan Endpoints
```
POST /api/savings-plan
Request: {
  userId: string;
  financialData: {
    income: number;
    expenses: Record<string, number>;
    goals: string[];
  };
}
Response: SavingsPlan
```

### Service Layer

#### DynamoDB Service
```typescript
class DynamoDBService {
  // User operations
  async getUser(userId: string): Promise<User | null>;
  async updateUser(userId: string, updates: Partial<User>): Promise<User>;
  async createUser(user: User): Promise<User>;

  // Savings plan operations
  async getSavingsPlan(planId: string): Promise<SavingsPlan | null>;
  async getUserSavingsPlans(userId: string): Promise<SavingsPlan[]>;
  async createSavingsPlan(plan: SavingsPlan): Promise<SavingsPlan>;
  async getSavingsStatistics(userId: string, startDate: Date, endDate: Date): Promise<DashboardStats>;

  // Event operations
  async getEvents(filters: EventFilters): Promise<Event[]>;
  async cacheEvents(events: Event[]): Promise<void>;

  // Recipe operations
  async getRecipes(filters: RecipeFilters): Promise<Recipe[]>;
  async getRecipe(recipeId: string): Promise<Recipe | null>;
  async cacheRecipes(recipes: Recipe[]): Promise<void>;

  // Fuel station operations
  async getFuelStations(filters: FuelFilters): Promise<FuelStation[]>;
  async cacheFuelStations(stations: FuelStation[]): Promise<void>;
}
```

#### Webhook Service
```typescript
class WebhookService {
  async callChatAgent(message: string, context?: ChatContext): Promise<string>;
  async callSavingsPlanGenerator(userId: string, financialData: FinancialData): Promise<SavingsPlan>;
  async callMealPlanningAgent(userId: string, recipeIds: string[], weekStartDate: string): Promise<MealPlan>;
}
```

#### External API Services
```typescript
class EventbriteService {
  async searchEvents(location: string): Promise<Event[]>;
  async getEventDetails(eventId: string): Promise<Event>;
}

class FuelCheckService {
  async getFuelPrices(suburb: string, postcode: string): Promise<FuelStation[]>;
}

class GroceryService {
  async getProductPrice(productName: string): Promise<number>;
  async searchProducts(query: string): Promise<Product[]>;
}
```

### Caching Strategy

```typescript
class CacheService {
  private cache: Map<string, CacheEntry>;

  set(key: string, value: any, ttl: number): void;
  get(key: string): any | null;
  invalidate(key: string): void;

  // Cache keys
  // events:{suburb}:{postcode} - TTL: 1 hour
  // fuel:{suburb}:{postcode} - TTL: 30 minutes
  // recipes:all - TTL: 24 hours
  // grocery:{productName} - TTL: 24 hours
}
```

### Context-Aware Chat Integration

The chat system minimizes token usage by sending only essential context:

```typescript
interface ChatContext {
  pageType: 'dashboard' | 'recipe' | 'event' | 'fuel' | 'profile';
  dataId?: string;
  dataName?: string;
}

// Example: User on recipe page asks "Can I substitute ingredients?"
// Frontend sends:
{
  message: "Can I substitute ingredients?",
  context: {
    pageType: "recipe",
    dataId: "recipe-123",
    dataName: "Pasta Carbonara"
  }
}

// Backend enriches only if needed:
// 1. Check if Chat_Agent needs full recipe details
// 2. If yes, fetch from DynamoDB using dataId
// 3. Send minimal enriched context to webhook
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: DynamoDB Error Handling
*For any* DynamoDB operation that fails, the Backend_Server should return an HTTP response with status code 500 and a JSON error message.
**Validates: Requirements 2.4**

### Property 2: Chat Message Forwarding
*For any* chat message received from a user, the Backend_Server should forward the message to the Chat_Agent webhook.
**Validates: Requirements 3.1**

### Property 3: Savings Plan Request Forwarding
*For any* savings plan generation request, the Backend_Server should forward the request to the Savings_Plan_Generator webhook.
**Validates: Requirements 3.2**

### Property 4: Webhook Response Forwarding
*For any* webhook response received, the Backend_Server should forward it to the Frontend without modification.
**Validates: Requirements 3.4**

### Property 5: Chat Message Submission
*For any* message typed and submitted in the chat interface, the Frontend should send it to the Backend_Server chat endpoint with page context.
**Validates: Requirements 4.3**

### Property 6: Minimal Context Inclusion
*For any* page with relevant context, the Frontend should include only the page type and data identifiers (ID and name), not full page content.
**Validates: Requirements 4.4**

### Property 7: Chat Response Display
*For any* response received from the Chat_Agent, the Frontend should display it in the chat interface.
**Validates: Requirements 4.10**

### Property 8: Chat History Persistence
*For any* message sent or received during a session, it should remain in the chat history until the session ends.
**Validates: Requirements 4.11**

### Property 9: Navigation Link Functionality
*For any* navigation link clicked, the Frontend should navigate to the corresponding page.
**Validates: Requirements 5.3**

### Property 10: Current Page Highlighting
*For any* page currently displayed, the corresponding navigation link should be visually highlighted in the header.
**Validates: Requirements 5.4**

### Property 11: Profile Update Transmission
*For any* profile changes submitted by a user, the Frontend should send the updated data to the Backend_Server.
**Validates: Requirements 6.5**

### Property 12: Profile Data Validation
*For any* profile update request received, the Backend_Server should validate all fields before updating the savesmart-users table.
**Validates: Requirements 6.6**

### Property 13: Successful Profile Update Response
*For any* profile update that passes validation, the Backend_Server should return the updated profile data in the response.
**Validates: Requirements 6.7**

### Property 14: Profile Validation Error Messages
*For any* invalid field in a profile update request, the Backend_Server should return a specific error message identifying that field.
**Validates: Requirements 6.8**

### Property 15: Savings Plan Navigation
*For any* savings plan clicked in the dashboard, the Frontend should navigate to the full plan details page.
**Validates: Requirements 7.6**

### Property 16: Savings Statistics Calculation
*For any* user with savings plans, the Backend_Server should calculate total savings, goal progress, and completed plans count from the savesmart-plans table.
**Validates: Requirements 7.7**

### Property 17: Savings Data Aggregation
*For any* time period requested, the Backend_Server should aggregate savings data by that period (daily, weekly, or monthly) for chart display.
**Validates: Requirements 7.8**

### Property 18: Event Location Filtering
*For any* location filter (suburb or postcode) applied, the Frontend should display only events matching that location.
**Validates: Requirements 8.2**

### Property 19: Event Display Completeness
*For any* event displayed, the Frontend should show event name, date, location, and discount information.
**Validates: Requirements 8.5**

### Property 20: Event Click Navigation
*For any* event clicked, the Frontend should open either the event details page or external link.
**Validates: Requirements 8.6**

### Property 21: Event Data Caching
*For any* event data fetched from external APIs, the Backend_Server should cache it for 1 hour before making another API call for the same location.
**Validates: Requirements 8.7**

### Property 22: Fuel Station Map Markers
*For any* fuel station in the dataset, the Frontend should display it as a marker on the map.
**Validates: Requirements 9.2**

### Property 23: Fuel Station Price Display
*For any* fuel station marker clicked, the Frontend should display current fuel prices for all available fuel types at that station.
**Validates: Requirements 9.3**

### Property 24: Fuel Type Filtering
*For any* fuel type filter selected, the Frontend should display only stations that sell that fuel type.
**Validates: Requirements 9.4**

### Property 25: Fuel Station Distance Calculation
*For any* fuel station displayed, the Frontend should calculate and show the distance from the user's current location.
**Validates: Requirements 9.7**

### Property 26: Recipe Detail Display
*For any* recipe clicked, the Frontend should display the full recipe including ingredient list, instructions, and photos.
**Validates: Requirements 10.2**

### Property 27: Ingredient Price Display
*For any* ingredient in a recipe, the Frontend should display its current price.
**Validates: Requirements 10.3**

### Property 28: Total Meal Cost Calculation
*For any* recipe displayed, the total meal cost should equal the sum of all ingredient prices.
**Validates: Requirements 10.4**

### Property 29: Recipe Dietary Filtering
*For any* dietary preference filter applied (vegetarian, vegan, gluten-free), the Frontend should display only recipes matching that preference.
**Validates: Requirements 10.5**

### Property 30: Grocery Price Caching
*For any* grocery price fetched from external APIs, the Backend_Server should cache it for 24 hours before making another API call for the same product.
**Validates: Requirements 10.8**

### Property 31: Add to Meal Plan Button Presence
*For any* recipe detail view, the Frontend should display an "Add to Meal Plan" button.
**Validates: Requirements 11.1**

### Property 32: Recipe Meal Plan Addition
*For any* recipe where "Add to Meal Plan" is clicked, that recipe should appear in the user's meal planning template.
**Validates: Requirements 11.2**

### Property 33: Meal Plan Optimization Request
*For any* meal plan optimization request, the Backend_Server should send the current meal plan data to the meal planning agent webhook.
**Validates: Requirements 11.4**

### Property 34: Meal Plan Update from Agent
*For any* response received from the meal planning agent, the Backend_Server should update the user's meal plan in the savesmart-plans table.
**Validates: Requirements 11.5**

### Property 35: Error Logging Completeness
*For any* error that occurs in the Backend_Server, it should be logged with timestamp, error message, and stack trace.
**Validates: Requirements 14.1**

### Property 36: API Error Response Format
*For any* API request that fails, the Backend_Server should return a JSON response with a descriptive error message.
**Validates: Requirements 14.2**

### Property 37: Request Logging Completeness
*For any* incoming HTTP request, the Backend_Server should log the HTTP method, path, and timestamp.
**Validates: Requirements 14.3**

### Property 38: Webhook Call Logging
*For any* outgoing webhook call, the Backend_Server should log the webhook URL and payload.
**Validates: Requirements 14.4**

### Property 39: External API Fallback
*For any* external API call that fails, the Backend_Server should return mock data and log the failure.
**Validates: Requirements 14.5**

## Error Handling

### Error Categories

1. **Validation Errors (400)**
   - Invalid user input (empty required fields, malformed data)
   - Invalid query parameters
   - Response: `{ error: "Validation failed", details: { field: "error message" } }`

2. **Authentication Errors (401)**
   - Missing or invalid user ID
   - Response: `{ error: "Authentication required" }`

3. **Not Found Errors (404)**
   - Resource doesn't exist (user, recipe, event, etc.)
   - Response: `{ error: "Resource not found", resource: "User", id: "123" }`

4. **External API Errors (502)**
   - Eventbrite, FuelCheck, or Grocery API failures
   - Automatic fallback to mock data
   - Response: `{ data: [...], source: "mock", warning: "External API unavailable" }`

5. **Database Errors (500)**
   - DynamoDB connection failures
   - Query/update failures
   - Response: `{ error: "Database operation failed", message: "..." }`

6. **Webhook Errors (504)**
   - n8n webhook timeout (>30 seconds)
   - Webhook unreachable
   - Response: `{ error: "AI agent timeout", message: "Please try again" }`

### Error Handling Strategy

```typescript
// Global error handler middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error with full context
  logger.error({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
  });

  // Determine error type and response
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.details,
    });
  }

  if (err instanceof ExternalAPIError) {
    // Fall back to mock data
    const mockData = getMockData(err.apiName, req.query);
    return res.status(200).json({
      data: mockData,
      source: "mock",
      warning: `${err.apiName} API unavailable`,
    });
  }

  // Default 500 error
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});
```

### Graceful Degradation

The system prioritizes availability over real-time data accuracy:

1. **External API Failures**: Automatically serve cached or mock data
2. **Webhook Timeouts**: Return user-friendly error with retry option
3. **Database Failures**: Log error and return 500, but keep server running
4. **Partial Data**: Display available data even if some components fail

## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests for specific examples and edge cases with property-based tests for universal correctness guarantees.

**Unit Tests**:
- Focus on specific examples that demonstrate correct behavior
- Test integration points between components
- Validate edge cases and error conditions
- Test API endpoint contracts and response formats
- Examples: startup behavior, CORS configuration, specific API responses

**Property-Based Tests**:
- Verify universal properties across all inputs
- Use randomized input generation for comprehensive coverage
- Minimum 100 iterations per property test
- Each test references its design document property
- Examples: data validation, caching behavior, error handling

### Property-Based Testing Configuration

**Library**: fast-check (for TypeScript/Node.js)

**Test Structure**:
```typescript
import fc from 'fast-check';

// Feature: local-backend-expansion, Property 28: Total Meal Cost Calculation
test('total meal cost equals sum of ingredient prices', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        name: fc.string(),
        quantity: fc.nat(),
        unit: fc.string(),
        price: fc.float({ min: 0, max: 100 }),
      })),
      (ingredients) => {
        const recipe = { ingredients, totalCost: 0 };
        recipe.totalCost = calculateTotalCost(ingredients);

        const expectedTotal = ingredients.reduce((sum, ing) => sum + ing.price, 0);
        expect(recipe.totalCost).toBeCloseTo(expectedTotal, 2);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage by Component

**Backend Routes** (Unit + Property Tests):
- API endpoint existence and response codes (unit)
- Request validation for all endpoints (property)
- Error response format consistency (property)
- CORS header presence (unit)

**DynamoDB Service** (Unit + Property Tests):
- Connection establishment (unit)
- CRUD operations for each model (unit)
- Error handling for failed operations (property)
- Data model consistency (property)

**Webhook Service** (Unit + Property Tests):
- Webhook URL configuration (unit)
- Message forwarding to agents (property)
- Timeout handling (unit)
- Response forwarding (property)

**External API Services** (Unit + Property Tests):
- API integration with real endpoints (unit)
- Fallback to mock data on failure (property)
- Cache behavior and TTL (property)
- Data transformation correctness (property)

**Frontend Components** (Unit + Property Tests):
- Component rendering (unit)
- User interaction handling (unit)
- Navigation behavior (property)
- Data display completeness (property)
- Form validation (property)

### Integration Testing

**End-to-End Scenarios**:
1. User profile creation and update flow
2. Chat interaction with context from different pages
3. Savings plan generation and dashboard display
4. Event discovery with location filtering
5. Fuel price map with distance calculation
6. Recipe browsing and meal plan addition

**Mock External Dependencies**:
- Mock n8n webhooks for predictable AI responses
- Mock AWS DynamoDB for isolated testing
- Mock external APIs (Eventbrite, FuelCheck, Grocery)

### Performance Testing

**Load Testing**:
- Concurrent requests to API endpoints
- Database query performance under load
- Cache effectiveness measurement
- Webhook response time monitoring

**Benchmarks**:
- API response time: < 200ms for cached data
- API response time: < 2s for external API calls
- Webhook response time: < 5s for chat, < 30s for savings plans
- Database query time: < 100ms for single record retrieval

### Test Execution

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run property tests only
npm run test:property

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

### Continuous Integration

- All tests run on every commit
- Property tests run with 100 iterations in CI
- Integration tests run against mock services
- Coverage threshold: 80% for critical paths
