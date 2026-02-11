# SaveSmart - Setup Checklist

Quick setup guide for each squad to get started immediately.

---

## 🎨 Squad A: Frontend Team

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Code editor (VS Code recommended)
- [ ] Vercel account created

### Initial Setup (30 minutes)

#### 1. Create Next.js Project
```bash
npx create-next-app@latest savesmart-frontend
# Choose: Yes to TypeScript, Yes to Tailwind CSS, Yes to App Router
cd savesmart-frontend
```

#### 2. Install Dependencies
```bash
npm install
# Additional packages (if needed):
# npm install @heroicons/react
# npm install react-markdown
```

#### 3. Set Up Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
# Will update with real API Gateway URL from Backend team
```

#### 4. Create Page Structure
```bash
# Create directories
mkdir -p app/signup app/onboarding app/chat app/profile
mkdir -p components lib

# Create page files
touch app/signup/page.tsx
touch app/onboarding/page.tsx
touch app/chat/page.tsx
touch app/profile/page.tsx
```

#### 5. Deploy to Vercel
```bash
# Push to GitHub first
git add .
git commit -m "Initial setup"
git push origin main

# Then deploy via Vercel dashboard or CLI:
npm install -g vercel
vercel
```

#### 6. Share Vercel URL
- [ ] Copy deployment URL
- [ ] Share with team in Slack/Teams
- [ ] Add to shared documentation

### What You Need from Other Teams
- [ ] **Backend Team:** API Gateway URL (by 12:30 PM Day 2)
- [ ] **Backend Team:** API endpoint documentation
- [ ] **Backend Team:** Example request/response payloads

### Your Deliverables to Other Teams
- [ ] **To All:** Vercel deployment URL
- [ ] **To Integration Lead:** Demo account credentials
- [ ] **To Integration Lead:** Test results and bug reports

---

## ⚙️ Squad B: Backend Team (AWS)

### Prerequisites
- [ ] AWS account with admin access
- [ ] AWS CLI installed and configured
- [ ] Node.js 18+ installed
- [ ] Postman installed (for testing)

### Initial Setup (60 minutes)

#### 1. Set Up DynamoDB Tables (15 minutes)
```bash
# Log into AWS Console
# Navigate to DynamoDB
# Create table: savesmart-users
#   - Partition key: userId (String)
#   - On-demand billing
# Create table: savesmart-plans
#   - Partition key: planId (String)
#   - Sort key: userId (String)
#   - On-demand billing
```

#### 2. Set Up API Gateway (20 minutes)
```bash
# Navigate to API Gateway in AWS Console
# Create REST API: savesmart-api
# Create resources and methods:
#   POST /users
#   GET /users/{userId}
#   PUT /users/{userId}
#   POST /chat
#   GET /plans/{userId}
# Enable CORS on all resources
# Deploy to stage: prod
# Copy API Gateway URL
```

#### 3. Create Lambda Functions (30 minutes)
```bash
# Navigate to Lambda in AWS Console
# Create 5 functions (Node.js 20.x):
#   1. savesmart-saveUser
#   2. savesmart-getUser
#   3. savesmart-updateUser
#   4. savesmart-chat (most important!)
#   5. savesmart-getPlans

# For each function:
#   - Set timeout (10s for most, 60s for chat)
#   - Set memory (128 MB for most, 256 MB for chat)
#   - Add DynamoDB permissions (attach AmazonDynamoDBFullAccess)
```

#### 4. Connect API Gateway to Lambda
```bash
# In API Gateway, for each method:
#   - Set integration type: Lambda Function
#   - Select corresponding Lambda function
#   - Deploy API to prod stage
```

#### 5. Set Environment Variables
```bash
# For savesmart-chat Lambda:
#   - Add environment variable: N8N_WEBHOOK_URL
#   - Value: (get from AI/Agent team)
```

#### 6. Create Postman Collection
- [ ] Create collection: SaveSmart API
- [ ] Add all 5 endpoints with example requests
- [ ] Test each endpoint
- [ ] Export collection as JSON
- [ ] Share with Frontend team

### What You Need from Other Teams
- [ ] **AI/Agent Team:** n8n webhook URL (by 12:30 PM Day 2)
- [ ] **AI/Agent Team:** Webhook request/response format

### Your Deliverables to Other Teams
- [ ] **To Frontend:** API Gateway URL (by 12:30 PM Day 2)
- [ ] **To Frontend:** Postman collection with examples
- [ ] **To Frontend:** API endpoint documentation
- [ ] **To All:** CloudWatch Logs access (for debugging)

---

## 🤖 Squad C: AI/Agent Team

### Prerequisites
- [ ] n8n account (cloud) OR Docker installed (local)
- [ ] Claude API key OR OpenAI API key
- [ ] FuelCheck NSW API key (from api.nsw.gov.au)
- [ ] Pulse MCP access (or fallback data prepared)

### Initial Setup (45 minutes)

#### Option A: n8n Cloud (Recommended)
```bash
# 1. Sign up at n8n.io
# 2. Create new workflow: "SaveSmart Main Agent"
# 3. Copy webhook URL
# 4. Share with Backend team
```

#### Option B: n8n Local Docker
```bash
# 1. Run n8n container
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# 2. Open http://localhost:5678
# 3. Create new workflow: "SaveSmart Main Agent"
# 4. Use ngrok for public webhook URL:
ngrok http 5678
# 5. Copy ngrok URL + webhook path
# 6. Share with Backend team
```

#### 1. Set Up API Keys
```bash
# In n8n, go to Credentials
# Add credentials:
#   - Anthropic (Claude) OR OpenAI (GPT-4o)
#   - HTTP Header Auth (for FuelCheck API)
```

#### 2. Create Main Orchestrator Workflow
```bash
# Add nodes in this order:
#   1. Webhook Trigger (POST)
#   2. AI Agent Node (Claude/GPT)
#   3. Tool Nodes (4 sub-agents)
#   4. Respond to Webhook

# Configure system prompt with user context
# Test webhook with Postman
```

#### 3. Build Sub-Agent Tools
```bash
# Create 4 tool nodes:
#   1. Grocery Agent (Pulse MCP integration)
#   2. Fuel Agent (FuelCheck NSW API)
#   3. Bills Agent (pattern analysis)
#   4. Financial Planner (calculations)

# For each tool:
#   - Add description
#   - Configure HTTP requests (if needed)
#   - Test with sample data
```

#### 4. Test Workflows
```bash
# Test with Postman:
POST {webhook-url}
{
  "userId": "test-user",
  "message": "Help me save money on groceries",
  "userProfile": {
    "income": 1200,
    "rent": 600,
    "location": "Parramatta",
    "dietaryPreferences": ["vegetarian"]
  }
}

# Verify response format
# Check execution history in n8n
```

#### 5. Activate Workflows
- [ ] Toggle workflow to "Active"
- [ ] Verify webhook is accessible
- [ ] Test with all 3 demo prompts

### What You Need from Other Teams
- [ ] **Backend Team:** Test user profile data format
- [ ] **Integration Lead:** Demo prompts and expected responses

### Your Deliverables to Other Teams
- [ ] **To Backend:** n8n webhook URL (by 12:30 PM Day 2)
- [ ] **To Backend:** Webhook request format documentation
- [ ] **To Backend:** Expected response format documentation
- [ ] **To All:** n8n dashboard access (for debugging)

---

## 🔗 Squad D: Integration Lead

### Prerequisites
- [ ] Access to all team communication channels
- [ ] Postman installed
- [ ] Access to AWS Console (read-only)
- [ ] Access to n8n dashboard (read-only)
- [ ] Access to Vercel dashboard (read-only)

### Initial Setup (30 minutes)

#### 1. Set Up Testing Environment
```bash
# Install Postman
# Create workspace: SaveSmart Testing
# Import collections from Backend team
```

#### 2. Create Test Personas
```bash
# Document 3-5 test personas:
#   1. Budget Sarah (primary demo)
#   2. High-income student
#   3. Low-income student
#   4. Student with car
#   5. Student without car

# For each persona, document:
#   - Income, rent, expenses
#   - Savings goals
#   - Dietary preferences
#   - Location
#   - Expected AI responses
```

#### 3. Set Up Bug Tracking
```bash
# Create shared document (Google Docs/Notion):
#   - Bug tracking sheet
#   - Test results log
#   - Demo script
#   - Presentation outline

# Share with all teams
```

#### 4. Create Demo Script
```bash
# Write detailed demo script:
#   1. Landing page (30s)
#   2. Signup/onboarding (1m)
#   3. Chat interaction (2m)
#   4. Savings plan display (30s)

# Include:
#   - Exact prompts to use
#   - Expected responses
#   - Backup plans if demo fails
```

#### 5. Prepare Presentation Outline
```bash
# Create slide outline:
#   1. Title + Team
#   2. Problem
#   3. Solution
#   4. Demo intro
#   5. Architecture
#   6. Impact
#   7. Thank you

# Assign speakers for each section
```

### What You Need from Other Teams
- [ ] **Frontend:** Vercel URL and demo account
- [ ] **Backend:** API Gateway URL and Postman collection
- [ ] **AI/Agent:** n8n webhook URL and dashboard access
- [ ] **All Teams:** Regular status updates (every 2 hours)

### Your Deliverables to Other Teams
- [ ] **To All:** Bug tracking document
- [ ] **To All:** Test results and feedback
- [ ] **To All:** Demo script and timing
- [ ] **To All:** Presentation slides and speaker assignments

---

## 🚨 Critical Handoffs Checklist

### By 12:30 PM Day 2 (Lunch)
- [ ] **Backend → Frontend:** API Gateway URL
- [ ] **AI/Agent → Backend:** n8n webhook URL
- [ ] **Backend → All:** Postman collection
- [ ] **Frontend → All:** Vercel deployment URL

### By 4:30 PM Day 2 (Afternoon)
- [ ] **All → Integration Lead:** Initial test results
- [ ] **Backend → Frontend:** API documentation complete
- [ ] **AI/Agent → Backend:** Webhook integration tested
- [ ] **Frontend → Backend:** API integration tested

### By 6:00 PM Day 2 (End of Day)
- [ ] **All → Integration Lead:** End-to-end test completed
- [ ] **All → Integration Lead:** Critical bugs documented
- [ ] **Integration Lead → All:** Priority fixes for Day 3

---

## 📞 Communication Protocol

### Status Updates (Every 2 Hours)
Each squad posts in shared channel:
- What's working?
- What's blocked?
- What do you need from other squads?

### Blocker Escalation (Immediate)
If blocked for > 30 minutes:
1. Post in shared channel with @all
2. Tag Integration Lead
3. Schedule quick sync call if needed

### Testing Requests (As Needed)
When ready for integration testing:
1. Post in shared channel
2. Tag relevant squads
3. Provide test instructions and expected results

---

## ✅ Daily Standup Questions

### Morning Standup (9:00 AM)
1. What did you accomplish yesterday?
2. What are you working on today?
3. Any blockers or dependencies?

### Lunch Checkpoint (12:30 PM)
1. What's working so far?
2. What's blocked?
3. What do you need from other squads?

### End of Day Review (6:00 PM)
1. What's working?
2. What's broken?
3. Who's fixing what tomorrow?
4. Backup plan if demo fails?

---

**Remember:** Communication is key! Over-communicate rather than under-communicate. Share URLs, test results, and blockers immediately. Good luck! 🚀
