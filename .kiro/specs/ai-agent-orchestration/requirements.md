# AI Agent: Orchestration & Sub-Agents - Requirements

## 1. Overview

Build the AI agent system using n8n workflows that orchestrates multiple specialized sub-agents (Grocery, Fuel, Bills, Financial Planner) to provide personalized financial advice to Australian university students.

## 2. User Stories

### 2.1 Main Orchestrator
**As a** user
**I want to** ask any financial question in natural language
**So that** the system routes my question to the appropriate specialized agent

### 2.2 Grocery Agent
**As a** user
**I want to** get meal plans based on current Coles/Woolworths prices
**So that** I can save money on groceries while meeting my dietary needs

### 2.3 Fuel Agent
**As a** user
**I want to** find the cheapest fuel stations near me
**So that** I can save money on petrol

### 2.4 Bills Agent
**As a** user
**I want to** identify unused subscriptions and cheaper alternatives
**So that** I can reduce my monthly recurring costs

### 2.5 Financial Planner Agent
**As a** user
**I want to** create a personalized savings plan for my goals
**So that** I know exactly how much to save each month

## 3. Acceptance Criteria

### 3.1 n8n Instance Setup
- n8n instance running and accessible
- Cloud instance (n8n.io) OR local Docker instance
- Accessible at URL (cloud or http://localhost:5678)
- Can create and edit workflows
- Can activate/deactivate workflows

### 3.2 Main Orchestrator Agent Operational
- Workflow named "SaveSmart Main Agent" created
- Webhook trigger configured (POST method)
- Webhook URL generated and shared with Backend team
- Receives requests with format:
```json
{
  "userId": "user-123",
  "message": "Help me save money",
  "userProfile": {
    "income": 1200,
    "rent": 600,
    "location": "Parramatta",
    ...
  }
}
```
- AI Agent node configured with Claude Sonnet 4 or GPT-4o
- System prompt includes user context and tool descriptions
- Routes to appropriate sub-agent based on user intent
- Returns formatted response via "Respond to Webhook" node

### 3.3 Intent Recognition
- Recognizes "grocery" or "meal" keywords → Grocery Agent
- Recognizes "fuel" or "petrol" keywords → Fuel Agent
- Recognizes "bills" or "subscriptions" keywords → Bills Agent
- Recognizes "save" or "plan" or "goal" keywords → Financial Planner Agent
- Handles ambiguous queries by asking clarifying questionpects dietary preferences (vegetarian, vegan, halal, kosher)
- Focuses on current specials and discounts
- Fallback: Uses static JSON data if Pulse MCP unavailable

### 3.5 Fuel Agent Functional
- Tool node named "Fuel Agent" created
- Description: "Finds cheapest fuel prices near user. Use this for fuel questions."
- Connects to FuelCheck NSW API
- Accepts: location (lat/long or suburb), fuel type, radius (5km)
- Returns:
  - Top 5 cheapest stations
  - Station name, address, price
  - Savings vs average price
  - Best days to fill up
- Filters by user's fuel type (E10, U91, U95, U98, Diesel)
- Calculates monthly savings based on typical usage

### 3.6 Bills Agent Functional
- Tool node named "Bills Agent" created
- Description: "Analyzes subscriptions and recurring costs. Use this for bill reduction."
- Accepts: list of active subscriptions
- Returns:
  - Analysis of each subscription
  - Suggestions for cancellations (unused services)
  - Cheaper alternatives (e.g., Spotify Duo vs Premium)
  - Monthly savings potential
- Uses pattern analysis (no external API needed)
- Provides specific dollar amounts

### 3.7 Financial Planner Agent Functional
- Tool node named "Financial Planner" created
- Description: "Creates savings plans and budgets. Use this when users mention savings goals."
- Accepts: income, expenses, goal amount, timeline
- Returns:
  - Required monthly savings
  - Current surplus/deficit
  - Budget breakdown by category
  - Gap analysis
  - Recommendations to reach goal
- Calls other agents to find savings opportunities
- Provides realistic, achievable plans

### 3.8 Response Formatting
- Responses use markdown formatting
- Include emojis for visual appeal (🛒, ⛽, 💰, 📊)
- Dollar amounts clearly highlighted
- Bullet points for lists
- Friendly, encouraging tone
- Specific, actionable recommendations
- Include user's name when appropriate

### 3.9 Error Handling
- Handles missing user profile gracefully
- Handles API failures with fallback responses
- Handles timeout errors (>30 seconds)
- Returns user-friendly error messages
- Logs errors to n8n execution history

### 3.10 Workflow Activation
- All workflows set to "Active" status
- Workflows execute on webhook trigger
- Execution history visible in n8n dashboard
- No execution errors in history

## 4. Technical Requirements

### 4.1 n8n Setup Options

**Option A: Cloud (Recommended for Demo)**
- Sign up at n8n.io
- Free tier available
- No infrastructure management
- Accessible from anywhere
- Webhook URL: https://your-instance.app.n8n.cloud/webhook/...

**Option B: Local Docker**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```
- Full control
- Runs on localhost:5678
- Requires ngrok for public webhook URL

### 4.2 Main Orchestrator Workflow Structure

```
Webhook Trigger (POST)
  ↓
Extract user message and profile
  ↓
AI Agent Node (Claude/GPT)
  ├─ Tool: Grocery Agent
  ├─ Tool: Fuel Agent
  ├─ Tool: Bills Agent
  └─ Tool: Financial Planner
  ↓
Format response
  ↓
Respond to Webhook
```

### 4.3 System Prompt Template

```
You are SaveSmart, a personal savings agent for Australian university students.

User Profile:
- Name: {{$json.userProfile.name}}
- Monthly Income: ${{$json.userProfile.income}}
- Monthly Rent: ${{$json.userProfile.rent}}
- Grocery Budget: ${{$json.userProfile.groceryBudget}}/week
- Location: {{$json.userProfile.location}}
- Dietary Preferences: {{$json.userProfile.dietaryPreferences}}
- Has Car: {{$json.userProfile.hasCar}}
- Fuel Type: {{$json.userProfile.fuelType}}
- Subscriptions: {{$json.userProfile.subscriptions}}

You have access to these tools:
- Grocery Agent: For meal plans, recipes, shopping lists using Coles/Woolworths prices
- Fuel Agent: For finding cheapest fuel stations near the user
- Bills Agent: For analyzing subscriptions and finding savings
- Financial Planner: For creating savings plans and budgets

Based on the user's question, decide which tools to use.
Always give specific, actionable advice with real numbers.
Format responses clearly with bullet points and dollar amounts.
Be friendly, encouraging, and supportive.
Consider the user's dietary, cultural, and religious preferences.
Consider the user's location for all location-based recommendations.
```

### 4.4 API Integrations

**Pulse MCP (Grocery Prices):**
- Endpoint: TBD (from Pulse MCP documentation)
- Method: GET
- Query params: product, store (Coles/Woolworths)
- Response: Product prices, specials, availability

**FuelCheck NSW API:**
- Endpoint: https://api.nsw.gov.au/v1/fuel/prices/nearby
- Method: GET
- Headers: apikey (from api.nsw.gov.au)
- Query params: latitude, longitude, fueltype, radius
- Response: Station list with prices

**To get FuelCheck API key:**
1. Go to api.nsw.gov.au
2. Create account
3. Subscribe to "Fuel" product
4. Copy API key

### 4.5 Response Format

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
      },
      {
        "category": "Fuel",
        "amount": 60,
        "description": "Fill up at Metro Petroleum Parramatta"
      }
    ]
  },
  "plan": {
    "goal": "Save $3000 for Japan trip",
    "timeline": "6 months",
    "required": 500,
    "recommendations": [
      "Meal plan with vegetarian options",
      "Fill up on Tuesdays at cheapest station",
      "Cancel unused Netflix subscription"
    ]
  }
}
```

## 5. Demo Requirements

### 5.1 Demo Prompts Testing
Test with Sarah's profile (income: $1200, rent: $600, location: Parramatta, vegetarian):

**Prompt 1:** "I want to save $3,000 in 6 months for a Japan trip"
- Expected: Financial Planner calculates $500/month needed
- Calls other agents to find $300/month in savings
- Returns comprehensive plan with breakdown

**Prompt 2:** "Help me save money on groceries"
- Expected: Grocery Agent returns 5 vegetarian meal suggestions
- Uses Coles/Woolworths specials
- Shows shopping list with prices
- Estimates $120/month savings

**Prompt 3:** "Where can I find cheap fuel near me?"
- Expected: Fuel Agent returns cheapest E10 stations in Parramatta
- Shows top 5 with prices
- Calculates savings vs average
- Recommends best days to fill up

### 5.2 Demo Success Criteria
- All 3 prompts return helpful responses
- Response time < 5 seconds per prompt
- Responses include specific dollar amounts
- Responses reference user's profile (vegetarian, Parramatta, E10)
- No errors in n8n execution history
- Webhook receives and responds correctly

## 6. Fallback Strategies

### 6.1 If Pulse MCP Unavailable
- Use static JSON file with realistic grocery prices
- 20 sample recipes with ingredients and costs
- Coles/Woolworths typical prices
- Still provide meal plans and shopping lists

### 6.2 If FuelCheck API Unavailable
- Use average fuel prices for Sydney suburbs
- Provide general advice (fill up on Tuesdays)
- Estimate savings based on typical patterns

### 6.3 If n8n Too Complex
- Fallback: Direct Claude API calls from Lambda
- Simpler architecture, less powerful
- Single agent instead of specialized sub-agents

## 7. Out of Scope (MVP)

- Conversation history/context across messages
- Multi-turn conversations
- User feedback on recommendations
- Learning from user behavior
- Integration with bank accounts
- Automatic savings transfers
- Push notifications
- Mobile app integration

## 8. Dependencies

- Claude Sonnet 4 API key OR OpenAI GPT-4o API key
- FuelCheck NSW API key (from api.nsw.gov.au)
- Pulse MCP access (or fallback data)
- Backend Lambda needs n8n webhook URL

## 9. Handoff Requirements

### 9.1 To Backend Team
- [ ] n8n webhook URL shared
- [ ] Webhook request format documented
- [ ] Expected response format documented
- [ ] Timeout expectations set (30-60 seconds)

### 9.2 Testing with Backend
- [ ] Test webhook receives requests from Lambda
- [ ] Test response returns to Lambda correctly
- [ ] Test with Sarah's profile data
- [ ] Test all 3 demo prompts

## 10. Success Metrics

- n8n instance running and accessible
- Main orchestrator agent receives webhook requests
- At least 1 sub-agent returns realistic responses (Grocery preferred)
- All 4 sub-agents operational (stretch goal)
- Response time < 5 seconds (target: 3 seconds)
- Responses include specific dollar amounts
- Responses are helpful and actionable
- 0 execution errors during demo
- Demo prompts work 100% of the time
