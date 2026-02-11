# SaveSmart - System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER DEVICE                              │
│                      (Browser / Mobile)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Next.js 14 + TypeScript + Tailwind CSS                    │ │
│  │                                                             │ │
│  │  Pages:                                                     │ │
│  │  • Landing Page (/)                                         │ │
│  │  • Signup (/signup)                                         │ │
│  │  • Onboarding (/onboarding)                                 │ │
│  │  • Chat Interface (/chat)                                   │ │
│  │  • Profile (/profile)                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (AWS Serverless)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  API Gateway (REST API)                                     │ │
│  │  • POST /users                                              │ │
│  │  • GET /users/{userId}                                      │ │
│  │  • PUT /users/{userId}                                      │ │
│  │  • POST /chat                                               │ │
│  │  • GET /plans/{userId}                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Lambda Functions (Node.js 20.x)                           │ │
│  │  • saveUser                                                 │ │
│  │  • getUser                                                  │ │
│  │  • updateUser                                               │ │
│  │  • chat (orchestrator)                                      │ │
│  │  • getPlans                                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  DynamoDB (NoSQL Database)                                 │ │
│  │  • savesmart-users (user profiles)                         │ │
│  │  • savesmart-plans (saved plans)                           │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Webhook (HTTPS)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AI/AGENT LAYER (n8n)                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Main Orchestrator Agent                                    │ │
│  │  • Receives user message + profile                          │ │
│  │  • Analyzes intent                                          │ │
│  │  • Routes to appropriate sub-agent                          │ │
│  │  • Formats response                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                    ┌─────────┴─────────┐                        │
│                    │                   │                         │
│         ┌──────────▼──────────┐  ┌────▼──────────┐             │
│         │  Grocery Agent 🛒   │  │  Fuel Agent ⛽ │             │
│         │  • Pulse MCP        │  │  • FuelCheck   │             │
│         │  • Coles/Woolworths │  │  • NSW API     │             │
│         │  • Meal plans       │  │  • Price comp  │             │
│         └─────────────────────┘  └────────────────┘             │
│                    │                   │                         │
│         ┌──────────▼──────────┐  ┌────▼──────────┐             │
│         │  Bills Agent 💰     │  │  Financial    │             │
│         │  • Subscription     │  │  Planner 📊   │             │
│         │  • Analysis         │  │  • Budgeting  │             │
│         │  • Savings calc     │  │  • Goal calc  │             │
│         └─────────────────────┘  └────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL DATA SOURCES                         │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  Pulse MCP     │  │  FuelCheck NSW │  │  LLM Provider    │  │
│  │  • Coles       │  │  • Real-time   │  │  • Claude Sonnet │  │
│  │  • Woolworths  │  │  • Fuel prices │  │  • GPT-4o        │  │
│  │  • Specials    │  │  • Stations    │  │  • Reasoning     │  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. User Onboarding Flow

```
User                Frontend              Backend              Database
 │                     │                     │                     │
 │  1. Visit landing   │                     │                     │
 │────────────────────>│                     │                     │
 │                     │                     │                     │
 │  2. Click signup    │                     │                     │
 │────────────────────>│                     │                     │
 │                     │                     │                     │
 │  3. Fill form       │                     │                     │
 │────────────────────>│                     │                     │
 │                     │                     │                     │
 │  4. Submit          │  POST /users        │                     │
 │────────────────────>│────────────────────>│  PutItem           │
 │                     │                     │───────────────────>│
 │                     │                     │                     │
 │                     │                     │  Success            │
 │                     │                     │<───────────────────│
 │                     │  200 OK             │                     │
 │                     │<────────────────────│                     │
 │  5. Redirect /chat  │                     │                     │
 │<────────────────────│                     │                     │
```

### 2. Chat Message Flow

```
User        Frontend        Backend         n8n          Sub-Agent      External API
 │             │               │              │               │               │
 │  1. Type    │               │              │               │               │
 │  message    │               │              │               │               │
 │────────────>│               │              │               │               │
 │             │               │              │               │               │
 │  2. Send    │  POST /chat   │              │               │               │
 │────────────>│──────────────>│              │               │               │
 │             │               │              │               │               │
 │             │               │  GetItem     │               │               │
 │             │               │  (user       │               │               │
 │             │               │  profile)    │               │               │
 │             │               │──────────┐   │               │               │
 │             │               │          │   │               │               │
 │             │               │<─────────┘   │               │               │
 │             │               │              │               │               │
 │             │               │  POST        │               │               │
 │             │               │  webhook     │               │               │
 │             │               │─────────────>│               │               │
 │             │               │              │               │               │
 │             │               │              │  Route to     │               │
 │             │               │              │  sub-agent    │               │
 │             │               │              │──────────────>│               │
 │             │               │              │               │               │
 │             │               │              │               │  API call     │
 │             │               │              │               │──────────────>│
 │             │               │              │               │               │
 │             │               │              │               │  Response     │
 │             │               │              │               │<──────────────│
 │             │               │              │               │               │
 │             │               │              │  Format       │               │
 │             │               │              │  response     │               │
 │             │               │              │<──────────────│               │
 │             │               │              │               │               │
 │             │               │  Response    │               │               │
 │             │               │<─────────────│               │               │
 │             │               │              │               │               │
 │             │               │  PutItem     │               │               │
 │             │               │  (save plan) │               │               │
 │             │               │──────────┐   │               │               │
 │             │               │          │   │               │               │
 │             │               │<─────────┘   │               │               │
 │             │               │              │               │               │
 │             │  200 OK       │              │               │               │
 │             │  + AI reply   │              │               │               │
 │             │<──────────────│              │               │               │
 │             │               │              │               │               │
 │  3. Display │               │              │               │               │
 │  response   │               │              │               │               │
 │<────────────│               │              │               │               │
```

---

## 🗄️ Database Schema

### DynamoDB Table: savesmart-users

```
Partition Key: userId (String)

Attributes:
{
  "userId": "user-abc-123",              // Unique user identifier
  "email": "sarah@uni.edu.au",           // User email
  "name": "Sarah",                       // User name
  "income": 1200,                        // Monthly income ($)
  "rent": 600,                           // Monthly rent ($)
  "groceryBudget": 80,                   // Weekly grocery budget ($)
  "savings": 500,                        // Current savings ($)
  "hasCar": true,                        // Car ownership (boolean)
  "fuelType": "E10",                     // Fuel type (if hasCar)
  "location": "Parramatta",              // Suburb/city
  "postcode": "2150",                    // Postcode
  "dietaryPreferences": ["vegetarian"],  // Array of preferences
  "subscriptions": ["Netflix", "Spotify"], // Array of subscriptions
  "createdAt": "2026-02-11T10:00:00Z"   // ISO timestamp
}
```

### DynamoDB Table: savesmart-plans

```
Partition Key: planId (String)
Sort Key: userId (String)

Attributes:
{
  "planId": "plan-1707649200000",        // Unique plan identifier
  "userId": "user-abc-123",              // User who owns this plan
  "plan": {                              // Savings plan object
    "goal": "Save $3000 for Japan trip",
    "timeline": "6 months",
    "monthly": 500,
    "breakdown": [
      {
        "category": "Grocery",
        "amount": 120,
        "description": "Meal planning with Coles specials"
      },
      {
        "category": "Fuel",
        "amount": 60,
        "description": "Fill up at Metro Petroleum"
      }
    ]
  },
  "createdAt": "2026-02-11T10:30:00Z"   // ISO timestamp
}
```

---

## 🔌 API Specifications

### REST API Endpoints

#### 1. POST /users
**Purpose:** Create new user profile
**Request:**
```json
{
  "userId": "user-abc-123",
  "email": "sarah@uni.edu.au",
  "name": "Sarah",
  "income": 1200,
  "rent": 600,
  "groceryBudget": 80,
  "savings": 500,
  "hasCar": true,
  "fuelType": "E10",
  "location": "Parramatta",
  "postcode": "2150",
  "dietaryPreferences": ["vegetarian"],
  "subscriptions": ["Netflix", "Spotify"]
}
```
**Response:**
```json
{
  "message": "User saved successfully"
}
```

#### 2. GET /users/{userId}
**Purpose:** Retrieve user profile
**Response:**
```json
{
  "userId": "user-abc-123",
  "email": "sarah@uni.edu.au",
  "name": "Sarah",
  ...
}
```

#### 3. PUT /users/{userId}
**Purpose:** Update user profile
**Request:** (same as POST /users)
**Response:**
```json
{
  "message": "User updated successfully"
}
```

#### 4. POST /chat
**Purpose:** Send message to AI agent
**Request:**
```json
{
  "userId": "user-abc-123",
  "message": "I want to save $3,000 in 6 months for a Japan trip"
}
```
**Response:**
```json
{
  "reply": "To save $3,000 in 6 months, you need $500/month...",
  "savings": {
    "monthly": 300,
    "breakdown": [
      {
        "category": "Grocery",
        "amount": 120,
        "description": "Meal planning with Coles specials"
      }
    ]
  },
  "plan": {
    "goal": "Save $3000 for Japan trip",
    "timeline": "6 months",
    "required": 500,
    "recommendations": [...]
  }
}
```

#### 5. GET /plans/{userId}
**Purpose:** Retrieve saved plans
**Response:**
```json
{
  "plans": [
    {
      "planId": "plan-1707649200000",
      "goal": "Save $3000 for Japan trip",
      "createdAt": "2026-02-11T10:30:00Z"
    }
  ]
}
```

---

## 🤖 AI Agent Architecture

### Main Orchestrator Prompt

```
You are SaveSmart, a personal savings agent for Australian university students.

User Profile:
- Name: {{userProfile.name}}
- Monthly Income: ${{userProfile.income}}
- Monthly Rent: ${{userProfile.rent}}
- Grocery Budget: ${{userProfile.groceryBudget}}/week
- Location: {{userProfile.location}}
- Dietary Preferences: {{userProfile.dietaryPreferences}}
- Has Car: {{userProfile.hasCar}}
- Fuel Type: {{userProfile.fuelType}}
- Subscriptions: {{userProfile.subscriptions}}

Available Tools:
1. Grocery Agent - For meal plans, recipes, shopping lists
2. Fuel Agent - For finding cheapest fuel stations
3. Bills Agent - For analyzing subscriptions and finding savings
4. Financial Planner - For creating savings plans and budgets

Instructions:
- Analyze the user's question
- Decide which tool(s) to use
- Provide specific, actionable advice with real numbers
- Format responses with bullet points and dollar amounts
- Be friendly, encouraging, and supportive
- Consider dietary, cultural, and religious preferences
- Consider location for all recommendations
```

### Sub-Agent Responsibilities

**Grocery Agent 🛒**
- Query Pulse MCP for Coles/Woolworths prices
- Generate 5 meal suggestions based on budget
- Respect dietary preferences (vegetarian, vegan, halal, kosher)
- Create shopping list with prices
- Calculate savings vs regular prices

**Fuel Agent ⛽**
- Query FuelCheck NSW API for real-time prices
- Find cheapest stations within 5km radius
- Filter by user's fuel type (E10, U91, U95, U98, Diesel)
- Calculate monthly savings based on typical usage
- Recommend best days to fill up

**Bills Agent 💰**
- Analyze user's subscriptions
- Identify unused or underutilized services
- Suggest cheaper alternatives
- Calculate monthly savings potential
- Provide specific recommendations

**Financial Planner 📊**
- Calculate required monthly savings for goals
- Analyze current income vs expenses
- Create budget breakdown by category
- Identify savings opportunities
- Call other agents for specific recommendations
- Generate comprehensive savings plan

---

## 🔒 Security Considerations

### Frontend
- Environment variables for API URLs (not hardcoded)
- Input validation on all forms
- XSS prevention (React's built-in protection)
- HTTPS only (enforced by Vercel)

### Backend
- CORS enabled (restricted in production)
- Input validation in Lambda functions
- Error messages don't expose sensitive data
- CloudWatch Logs for monitoring
- IAM roles with least privilege

### Database
- DynamoDB encryption at rest (default)
- No sensitive data stored (no passwords for MVP)
- Access controlled via IAM roles
- Backup enabled (optional for MVP)

### AI/Agent
- API keys stored in n8n credentials (encrypted)
- Webhook URL not exposed publicly (only to Lambda)
- No PII sent to external APIs (only necessary data)
- Rate limiting on external API calls (if needed)

---

## 📊 Performance Targets

### Frontend
- Landing page load: < 2 seconds
- Form interactions: < 100ms
- API calls: < 3 seconds (excluding AI processing)
- Images optimized (WebP format)

### Backend
- API Gateway response: < 1 second (excluding AI)
- DynamoDB read: < 100ms
- DynamoDB write: < 200ms
- Lambda cold start: < 3 seconds
- Lambda warm execution: < 500ms

### AI/Agent
- n8n workflow execution: < 5 seconds (target: 3 seconds)
- External API calls: < 2 seconds each
- Total chat response time: < 5 seconds

---

## 🚀 Deployment Architecture

### Frontend (Vercel)
- Automatic deployments from Git
- Edge network (global CDN)
- Serverless functions for API routes (if needed)
- Environment variables managed in dashboard

### Backend (AWS)
- API Gateway: Regional endpoint (ap-southeast-2)
- Lambda: Deployed via AWS Console (or CLI)
- DynamoDB: On-demand billing mode
- CloudWatch: Automatic logging enabled

### AI/Agent (n8n)
- Cloud: Managed hosting (n8n.io)
- OR Local: Docker container + ngrok for webhook

---

## 📈 Scalability Considerations

### Current MVP (Hackathon)
- Supports: ~100 concurrent users
- DynamoDB: On-demand (auto-scales)
- Lambda: 1000 concurrent executions (default)
- n8n: Free tier limits

### Future Production
- Add CloudFront CDN for frontend
- Implement API Gateway caching
- Add DynamoDB DAX for caching
- Increase Lambda concurrency limits
- Upgrade n8n to paid tier
- Add load balancing for n8n
- Implement rate limiting
- Add monitoring and alerting

---

This architecture is designed for rapid development during the hackathon while maintaining a clear path to production scalability.
