# Day 2 (Wednesday) - Foundation Build

# Day 2 (Wednesday, February 11) - Foundation Build

**Today's Goal:** Core infrastructure operational by end of day

**Critical Deadline:** Everything below MUST work by 6:00 PM

---

## Morning Session: 9:00 AM - 12:30 PM

### Morning Kickoff (9:00 AM)

**Team Huddle:**

- Review today's goals
- Confirm squad assignments
- Exchange contact info
- Set up communication channels

---

### SQUAD A: FRONTEND TEAM

**Goal:** Basic UI deployed to Vercel

#### Frontend Lead Tasks

**Setup & Landing Page:**

- [ ]  Initialize Next.js project with TypeScript
- [ ]  Set up Tailwind CSS
- [ ]  Deploy to Vercel (get URL)
- [ ]  Create landing page:
    - Hero section with value proposition
    - "Get Started" CTA button
    - Simple navigation

**Project Structure:**

```
app/
├── page.tsx (landing)
├── signup/page.tsx
├── onboarding/page.tsx
├── chat/page.tsx
└── profile/page.tsx
```

#### Frontend Dev 1 Tasks

**Onboarding Flow:**

- [ ]  Create signup page (basic email/name form)
- [ ]  Build onboarding questionnaire
    - 📖 Reference: [User Onboarding Questions](https://www.notion.so/User-Onboarding-Question-3034bfc7d69480328125f503f965c364?pvs=21)
    - Multi-step form (3-4 steps)
    - Save data to localStorage temporarily
    - Progress indicator

**Key Questions to Include:**

- Income (weekly/monthly toggle)
- Rent
- Groceries budget
- Savings goal
- Has car? (if yes, fuel type)
- Location/postcode
- Dietary preferences
- Subscriptions

#### Frontend Dev 2 Tasks

**Chat Interface:**

- [ ]  Create chat page layout
- [ ]  Build message components:
    - User message bubble (right-aligned)
    - AI message bubble (left-aligned)
    - Typing indicator
- [ ]  Input field with send button
- [ ]  Example prompts section

**Example Prompts:**

- "I want to save $3,000 in 6 months for a Japan trip"
- "Help me save money on groceries"
- "Where can I find cheap fuel near me?"

#### Deliverables by 12:30 PM

✅ App deployed to Vercel with public URL

✅ Landing page live

✅ Onboarding form functional (saves to localStorage)

✅ Chat UI built (not connected to backend yet)

---

### SQUAD B: BACKEND (AWS)

**Goal:** AWS infrastructure operational (API Gateway + Lambda + DynamoDB)

📖 **Complete Reference:** [AWS Tech Stack Integration - PART 2](https://www.notion.so/AWS-Tech-Stack-Integration-3034bfc7d69480ed9e77c4a0d68cac64?pvs=21)

#### Backend Lead Tasks

**Step 1: DynamoDB Setup (15 minutes)**

- [ ]  Log into AWS Console
- [ ]  Navigate to DynamoDB
- [ ]  Create table: `savesmart-users`
    - Partition key: `userId` (String)
    - Leave defaults
    - Click "Create table"
- [ ]  Create table: `savesmart-plans`
    - Partition key: `planId` (String)
    - Sort key: `userId` (String)
    - Click "Create table"
- [ ]  Wait for both tables to show "Active" status

**Step 2: API Gateway Setup (20 minutes)**

- [ ]  Navigate to API Gateway in AWS Console
- [ ]  Create new **REST API** named `savesmart-api`
- [ ]  Create resources and methods:
    
    ```
    POST   /users
    GET    /users/{userId}
    PUT    /users/{userId}
    POST   /chat           ← PRIORITY
    GET    /plans/{userId}
    ```
    
- [ ]  Enable CORS on ALL resources:
    
    ```
    Allow origin: * (for hackathon)
    Allow headers: Content-Type, Authorization
    Allow methods: GET, POST, PUT, OPTIONS
    ```
    
- [ ]  Deploy API to stage: `prod`
- [ ]  **COPY API URL** (e.g., [`https://abc123.execute-api.ap-southeast-2.amazonaws.com/prod`](https://abc123.execute-api.ap-southeast-2.amazonaws.com/prod))
- [ ]  **SHARE with Frontend team** → they need this for `NEXT_PUBLIC_API_URL`

**Step 3: Create Lambda Functions (30 minutes)**

- [ ]  Create Lambda: `savesmart-saveUser`
    - Runtime: Node.js 20.x
    - Code: See AWS Tech Stack Integration doc (PART 2, Step 4)
    - Purpose: Save user profile from onboarding to DynamoDB
- [ ]  Create Lambda: `savesmart-chat` (MOST IMPORTANT)
    - Runtime: Node.js 20.x
    - Code: See AWS Tech Stack Integration doc
    - Purpose:
        1. Get user profile from DynamoDB (GetItemCommand)
        2. POST to n8n webhook with user context
        3. Return AI response
    - Timeout: 60 seconds
    - Memory: 256 MB
    - Environment variable: `N8N_WEBHOOK_URL` (get from AI/Agent squad)

**Step 4: IAM Permissions (10 minutes)**

- [ ]  For EACH Lambda function:
    - Go to Configuration → Permissions
    - Click the role name (opens IAM)
    - Attach policy: `AmazonDynamoDBFullAccess`

**Step 5: Connect API Gateway to Lambda (15 minutes)**

- [ ]  Go back to API Gateway → savesmart-api
- [ ]  For each method, set:
    
    ```
    Integration type: Lambda Function
    POST /users → savesmart-saveUser
    POST /chat → savesmart-chat
    etc.
    ```
    
- [ ]  Re-deploy API to `prod` stage

#### Backend Dev Tasks

**Additional Lambda Functions:**

- [ ]  Create Lambda: `savesmart-getUser`
    - Query DynamoDB savesmart-users table
    - Return user profile
- [ ]  Create Lambda: `savesmart-updateUser`
    - Update user profile in DynamoDB
    - Use UpdateItemCommand
- [ ]  Create Lambda: `savesmart-getPlans`
    - Query savesmart-plans table filtered by userId
    - Return user's saved plans
- [ ]  Connect all to API Gateway endpoints
- [ ]  Test each with AWS Console test events

**Testing & Documentation:**

- [ ]  Test POST /users with Postman (create test user)
- [ ]  Verify user appears in DynamoDB table
- [ ]  Test POST /chat (will fail until n8n is ready - expected)
- [ ]  Create Postman collection with example payloads
- [ ]  Document all endpoints for frontend team

#### Deliverables by 12:30 PM

✅ DynamoDB tables created and accessible

✅ API Gateway configured with all routes + CORS enabled

✅ API Gateway URL shared with frontend team

✅ At least 2 Lambda functions created (saveUser + chat)

✅ Lambda functions have DynamoDB permissions

✅ Ready to receive n8n webhook URL from AI team

✅ Postman collection with test requests documented

---

### SQUAD C: AI/AGENT TEAM

**Goal:** n8n workflows + Main agent operational

#### n8n Lead Tasks

**Setup n8n:**

- [ ]  Set up n8n instance (cloud or local Docker)
    
    ```bash
    # Option 1: n8n Cloud (free tier, easiest)
    # Sign up at n8n.io
    
    # Option 2: Local Docker (full control)
    docker run -it --rm \
      --name n8n \
      -p 5678:5678 \
      -v ~/.n8n:/home/node/.n8n \
      n8nio/n8n
    ```
    

**Create Main Orchestrator Agent:**

- [ ]  Create workflow:
    
    ```
    Webhook Trigger (receives user message)
    ↓
    Extract user intent (using Claude/ChatGPT)
    ↓
    Decision node: Which sub-agent to call?
    - "grocery" or "meal" → Grocery Agent
    - "fuel" or "petrol" → Fuel Agent
    - "bills" or "subscriptions" → Bills Agent
    - "save" or "plan" → Financial Planner Agent
    ↓
    Call appropriate sub-agent workflow
    ↓
    Format response
    ↓
    Return to API (webhook response)
    ```
    
- [ ]  Configure Claude/Anthropic API OR ChatGPT API for LLM calls
- [ ]  Test webhook trigger with Postman
- [ ]  **SHARE webhook URL with backend team**

#### n8n Dev Tasks

**Build Financial Planner Sub-Agent:**

- [ ]  Create workflow:
    
    ```
    Input: User profile + savings goal
    ↓
    Calculate required monthly savings
    ↓
    Generate initial budget breakdown
    ↓
    Call other agents to find savings opportunities
    ↓
    Create comprehensive savings plan
    ↓
    Return formatted plan
    ```
    

**Build Grocery Agent Sub-Agent (Priority 1):**

- [ ]  Create workflow:
    
    ```
    Input: Weekly budget, dietary preferences
    ↓
    Connect to Pulse MCP (Coles/Woolworths)
    ↓
    Query current specials
    ↓
    Generate 5 meal suggestions
    ↓
    Calculate total cost
    ↓
    Return shopping list + savings estimate
    ```
    
- [ ]  Set up Pulse MCP integration in n8n
- [ ]  Create sample meal database (20 recipes with ingredients)

#### Deliverables by 12:30 PM

✅ n8n instance running and accessible

✅ Main orchestrator agent receiving webhooks

✅ Financial planner logic working (basic calculations)

✅ Pulse MCP connection established

✅ Grocery agent returns sample meal plan

✅ Webhook URL shared with backend team

---

### SQUAD D: INTEGRATION LEAD

**Goal:** Test integration points, prepare demo data

#### Tasks

**Create Test User Profiles:**

- [ ]  Create 3-5 personas:
    
    ```
    Persona 1: "Budget Sarah" - $1200/month income, wants to save
    Persona 2: "Splurge Sam" - $2000/month income, no savings
    Persona 3: "Saver Steve" - $1500/month income, already frugal
    ```
    

**Testing & Documentation:**

- [ ]  Test frontend → backend → n8n flow with curl/Postman
- [ ]  Document API endpoints and payload examples
- [ ]  Create demo script for final presentation
- [ ]  Set up monitoring (basic logging, error tracking)
- [ ]  Prepare realistic grocery price data (if MCP not working)

#### Deliverables by 12:30 PM

✅ Test personas documented

✅ API endpoints documented

✅ Demo script outlined

---

## Lunch + Integration Checkpoint: 12:30 PM - 1:30 PM

### Standup Meeting

**Each squad reports:**

- What's working?
- What's blocked?
- What do you need from other squads?

**Critical Handoffs:**

- Backend → Frontend: API Gateway URL
- AI/Agent → Backend: n8n Webhook URL
- Backend → All: Postman collection for testing

**Adjust priorities if needed**

---

## Afternoon Session: 1:30 PM - 6:00 PM

### SQUAD A: FRONTEND

**Goal:** Connect frontend to backend APIs

#### Frontend Lead Tasks

**API Integration:**

- [ ]  Get **API Gateway URL** from backend team
- [ ]  Set environment variable in Vercel:
    
    ```bash
    NEXT_PUBLIC_API_URL=https://{id}.execute-api.ap-southeast-2.amazonaws.com/prod
    ```
    
- [ ]  Integrate authentication (signup/login)
    
    ```jsx
    // Call POST /users to create account
    // Store userId in localStorage (no JWT needed for MVP)
    ```
    
- [ ]  Protected route setup (redirect to /login if not authenticated)
- [ ]  Error handling and loading states

#### Frontend Dev 1 Tasks

**Connect Onboarding:**

- [ ]  Connect onboarding form to `POST /users`
- [ ]  Save user profile data to backend
- [ ]  Profile page GET/PUT integration
- [ ]  Form validation and error messages
- [ ]  Success redirect to chat page

#### Frontend Dev 2 Tasks

**Connect Chat:**

- [ ]  Integrate chat interface with `POST /chat`
- [ ]  Display AI responses (parse markdown/formatting)
- [ ]  Show typing indicators during API calls
- [ ]  Implement example prompts (clickable suggestions)
- [ ]  Build savings plan display from API data
- [ ]  Handle errors gracefully

#### Deliverables by 4:30 PM

✅ Full user flow working end-to-end (signup → onboarding → chat)

✅ Chat sends messages to backend

✅ AI responses display in chat

✅ Savings plan renders correctly

---

### SQUAD B: BACKEND (AWS)

**Goal:** Complete Lambda-n8n integration + test full data flow

#### Backend Lead Tasks

**Complete savesmart-chat Lambda:**

- [ ]  Get **N8N_WEBHOOK_URL** from AI/Agent team
- [ ]  Update savesmart-chat Lambda environment variable
- [ ]  Complete Lambda code (if not finished this morning):
    
    ```jsx
    import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
    
    const client = new DynamoDBClient({});
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    
    export const handler = async (event) => {
      const body = JSON.parse(event.body);
      const { userId, message } = body;
    
      // 1. Get user profile from DynamoDB
      const userResult = await client.send(new GetItemCommand({
        TableName: "savesmart-users",
        Key: { userId: { S: userId } }
      }));
    
      // 2. Send to n8n
      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          message: message,
          userProfile: userResult.Item
        })
      });
    
      const agentResponse = await n8nResponse.json();
    
      // 3. (Optional) Save plan to DynamoDB
      if (agentResponse.plan) {
        await client.send(new PutItemCommand({
          TableName: "savesmart-plans",
          Item: {
            planId: { S: `plan-${Date.now()}` },
            userId: { S: userId },
            plan: { S: JSON.stringify(agentResponse.plan) },
            createdAt: { S: new Date().toISOString() }
          }
        }));
      }
    
      // 4. Return to frontend
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          reply: agentResponse.reply,
          savings: agentResponse.savings,
          plan: agentResponse.plan
        })
      };
    };
    ```
    
- [ ]  Deploy Lambda
- [ ]  Test with Postman
- [ ]  Check CloudWatch Logs if errors occur
- [ ]  Add error handling for:
    - DynamoDB failures
    - n8n timeout (30+ seconds)
    - Invalid user ID
    - Network errors

#### Backend Dev Tasks

**Polish & Testing:**

- [ ]  Complete remaining Lambda functions (if not done)
- [ ]  Test ALL endpoints end-to-end:
    
    ```
    1. POST /users (create user) ✓
    2. GET /users/{userId} (retrieve user) ✓
    3. PUT /users/{userId} (update user) ✓
    4. POST /chat (chat with AI) ✓
    5. GET /plans/{userId} (get saved plans) ✓
    ```
    
- [ ]  Work with Integration Lead to test:
    
    **Frontend → API Gateway → Lambda → n8n → Lambda → Frontend**
    
- [ ]  Monitor CloudWatch Logs for all Lambdas
- [ ]  Document any issues in shared doc
- [ ]  Add basic request/response logging

**If Time Permits:**

- [ ]  Add input validation (check required fields)
- [ ]  Standardize error response format
- [ ]  Add health check Lambda for API monitoring
- [ ]  Test with invalid/malformed requests

#### Deliverables by 4:30 PM

✅ savesmart-chat Lambda fully integrated with n8n

✅ All 5 Lambda functions operational

✅ Full request cycle tested (Frontend → AWS → n8n → AWS → Frontend)

✅ Plans saved to DynamoDB successfully

✅ Error handling in place for common failures

✅ CloudWatch Logs accessible for debugging

---

### SQUAD C: AI/AGENT TEAM

**Goal:** Complete all sub-agents + realistic responses

#### n8n Lead Tasks

**Complete Main Orchestrator:**

- [ ]  Add all sub-agent routing
- [ ]  Add user context to all agent calls (profile data)
- [ ]  Implement prompt engineering for financial advice:
    
    ```
    System Prompt Template:
    "You are SaveSmart, an AI financial advisor for Australian university students.
    
    User Profile:
    - Monthly Income: ${income}
    - Monthly Expenses: ${expenses}
    - Savings Goal: ${goal}
    
    Provide practical, actionable advice. Be friendly and encouraging.
    Focus on realistic savings opportunities."
    ```
    
- [ ]  Add response formatting (markdown, bullet points, emojis)

#### n8n Dev Tasks

**Complete Fuel Agent:**

- [ ]  Create workflow:
    
    ```
    Input: User location, car details
    ↓
    Call FuelCheck NSW API
    ↓
    Find cheapest fuel within 5km
    ↓
    Calculate potential savings
    ↓
    Return recommendation
    ```
    

**Complete Bills Agent:**

- [ ]  Create workflow:
    
    ```
    Input: User subscriptions list
    ↓
    Analyze subscription costs
    ↓
    Suggest cancellations (unused services)
    ↓
    Calculate monthly savings
    ↓
    Return recommendations
    ```
    

**Polish:**

- [ ]  Improve Grocery Agent responses (formatting, details)
- [ ]  Add fallback responses for unsupported queries

#### Deliverables by 4:30 PM

✅ All 4 agents operational (Main + Grocery + Fuel + Bills)

✅ Realistic, helpful responses

✅ Agent routing works correctly

✅ User context properly injected

---

### SQUAD D: INTEGRATION LEAD

**Goal:** End-to-end testing + demo preparation

#### Tasks

- [ ]  Test complete user journey 5 times
- [ ]  Document bugs and edge cases
- [ ]  Create demo user accounts with pre-filled data
- [ ]  Prepare demo script with talking points
- [ ]  Record backup demo video (if time permits)
- [ ]  Start presentation slides (if time permits)

#### Deliverables by 4:30 PM

✅ Full system tested 5+ times

✅ Bug list documented and prioritized

✅ Demo account created

---

## Integration Testing: 4:30 PM - 5:00 PM

### All Hands

- [ ]  Full system test with all squads present
- [ ]  Each person tests the complete flow
- [ ]  Log all bugs in shared doc
- [ ]  Prioritize critical vs nice-to-have fixes

---

## Bug Fixes + Polish: 5:00 PM - 6:00 PM

### All Teams

**Focus:**

- Critical bugs only
- Improve error messages
- Add loading states
- Polish UI (consistent styling)

---

## End of Day 2 Status Check

✅ **CRITICAL: These MUST work before you leave tonight!**

- [ ]  Signup/login works
- [ ]  Onboarding saves user data to DynamoDB
- [ ]  Chat interface sends/receives messages
- [ ]  At least 1 agent returns meaningful responses (Grocery preferred)
- [ ]  Savings plan displays with numbers
- [ ]  Demo account created: [sarah@student.com](mailto:sarah@student.com)
- [ ]  No critical bugs that crash the demo

🎯 **If these don't work by end of Thursday, you'll struggle on Friday!**

Friday morning is ONLY for:

- Minor bug fixes
- Demo rehearsal
- Presentation prep
- NOT for building major features!

### Team Debrief Before Leaving

- What's working?
- What's broken?
- Who's fixing what tomorrow morning?
- Backup plan if demo fails?

👏 **Great work today! Rest up for tomorrow!**