# SaveSmart n8n Workflows

## Setup Instructions

### Option A: n8n Cloud (Recommended)

1. Sign up at [n8n.io](https://n8n.io)
2. Create new workflow: "SaveSmart Main Agent"
3. Copy webhook URL
4. Share with Backend team

### Option B: n8n Local Docker

```bash
# Run n8n container
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Open http://localhost:5678
# Create new workflow: "SaveSmart Main Agent"

# For public webhook URL, use ngrok:
ngrok http 5678
# Copy ngrok URL + webhook path
# Share with Backend team
```

## Workflow Structure

### Main Orchestrator Agent

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

## System Prompt Template

```
You are SaveSmart, a personal savings agent for Australian university students.

User Profile:
- Name: {{$json.userProfile.name.S}}
- Monthly Income: ${{$json.userProfile.income.N}}
- Monthly Rent: ${{$json.userProfile.rent.N}}
- Grocery Budget: ${{$json.userProfile.groceryBudget.N}}/week
- Location: {{$json.userProfile.location.S}}
- Dietary Preferences: {{$json.userProfile.dietaryPreferences.S}}
- Has Car: {{$json.userProfile.hasCar.BOOL}}
- Fuel Type: {{$json.userProfile.fuelType.S}}
- Subscriptions: {{$json.userProfile.subscriptions.S}}

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

## Sub-Agent Tools

### 1. Grocery Agent 🛒

**Tool Description:**
"Looks up Coles and Woolworths prices. Use this for grocery questions, meal plans, shopping lists, and recipe recommendations."

**Implementation:**
- Connect to Pulse MCP API (if available)
- OR use static JSON with realistic prices (fallback)
- Generate 5 meal suggestions based on budget
- Respect dietary preferences
- Return shopping list with prices

**Fallback Data Structure:**
```json
{
  "meals": [
    {
      "name": "Vegetarian Pasta",
      "ingredients": [
        { "item": "Pasta", "price": 2.50, "store": "Coles" },
        { "item": "Tomato Sauce", "price": 3.00, "store": "Woolworths" }
      ],
      "totalCost": 5.50
    }
  ],
  "weeklyCost": 65.00,
  "savings": 15.00
}
```

### 2. Fuel Agent ⛽

**Tool Description:**
"Finds cheapest fuel prices near user. Use this for fuel questions."

**Implementation:**
- Connect to FuelCheck NSW API
- API endpoint: `https://api.nsw.gov.au/v1/fuel/prices/nearby`
- Headers: `apikey: YOUR_API_KEY`
- Query params: latitude, longitude, fueltype, radius (5km)
- Return top 5 cheapest stations

**API Key Setup:**
1. Go to [api.nsw.gov.au](https://api.nsw.gov.au)
2. Create account
3. Subscribe to "Fuel" product
4. Copy API key
5. Add to n8n credentials

### 3. Bills Agent 💰

**Tool Description:**
"Analyzes subscriptions and recurring costs. Use this for bill reduction."

**Implementation:**
- No external API needed
- Pattern analysis based on user's subscriptions
- Suggest cancellations for unused services
- Recommend cheaper alternatives
- Calculate monthly savings

**Logic:**
```javascript
const subscriptionCosts = {
  "Netflix": 17.99,
  "Spotify": 12.99,
  "Disney+": 13.99,
  "Amazon Prime": 9.99
};

// Analyze and suggest savings
```

### 4. Financial Planner Agent 📊

**Tool Description:**
"Creates savings plans and budgets. Use this when users mention savings goals."

**Implementation:**
- Calculate required monthly savings
- Analyze income vs expenses
- Call other agents for savings opportunities
- Generate comprehensive plan
- Return formatted breakdown

**Calculation Logic:**
```javascript
const monthlyIncome = userProfile.income;
const monthlyExpenses = userProfile.rent + (userProfile.groceryBudget * 4);
const surplus = monthlyIncome - monthlyExpenses;
const requiredSavings = goalAmount / timelineMonths;
const gap = requiredSavings - surplus;

// Find savings to fill gap
```

## Response Format

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

## Testing

### Test Webhook with Postman

```bash
POST {your-webhook-url}
Content-Type: application/json

{
  "userId": "test-user",
  "message": "Help me save money on groceries",
  "userProfile": {
    "name": { "S": "Sarah" },
    "income": { "N": "1200" },
    "rent": { "N": "600" },
    "groceryBudget": { "N": "80" },
    "location": { "S": "Parramatta" },
    "dietaryPreferences": { "S": "[\"vegetarian\"]" },
    "hasCar": { "BOOL": true },
    "fuelType": { "S": "E10" },
    "subscriptions": { "S": "[\"Netflix\",\"Spotify\"]" }
  }
}
```

## Demo Prompts

Test with these 3 prompts:

1. **"I want to save $3,000 in 6 months for a Japan trip"**
   - Should call Financial Planner
   - Should calculate $500/month needed
   - Should call other agents for savings opportunities

2. **"Help me save money on groceries"**
   - Should call Grocery Agent
   - Should return vegetarian meal suggestions
   - Should show Coles/Woolworths prices

3. **"Where can I find cheap fuel near me?"**
   - Should call Fuel Agent
   - Should return E10 stations in Parramatta
   - Should show top 5 cheapest with prices

## Workflow Export

After creating workflows, export them:
1. Click workflow menu (3 dots)
2. Select "Download"
3. Save to this directory
4. Commit to Git for backup

## Handoffs

### To Backend Team
- [ ] n8n webhook URL
- [ ] Webhook request format documentation
- [ ] Expected response format documentation

### From Backend Team
- [ ] Test user profile data format
- [ ] Lambda integration testing

## Resources

- **Spec:** `.kiro/specs/ai-agent-orchestration/requirements.md`
- **Setup Guide:** `SETUP_CHECKLIST.md` (Squad C section)
- **Team Guide:** `TEAM_GUIDE.md`
- **Architecture:** `ARCHITECTURE.md`
