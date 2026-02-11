# SaveSmart Integration Testing

## Integration Lead Responsibilities

### 1. Test Coordination
- Coordinate testing between all squads
- Track bugs and issues
- Prioritize fixes
- Prepare demo

### 2. Test Personas

#### Persona 1: Budget Sarah (Primary Demo)
```json
{
  "userId": "demo-sarah-123",
  "email": "sarah@student.com",
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

#### Persona 2: High-Income Student
```json
{
  "userId": "demo-alex-456",
  "email": "alex@student.com",
  "name": "Alex",
  "income": 2000,
  "rent": 800,
  "groceryBudget": 120,
  "savings": 2000,
  "hasCar": true,
  "fuelType": "U91",
  "location": "Sydney CBD",
  "postcode": "2000",
  "dietaryPreferences": [],
  "subscriptions": ["Netflix", "Spotify", "Disney+", "Amazon Prime"]
}
```

#### Persona 3: Low-Income Student
```json
{
  "userId": "demo-jamie-789",
  "email": "jamie@student.com",
  "name": "Jamie",
  "income": 800,
  "rent": 400,
  "groceryBudget": 50,
  "savings": 100,
  "hasCar": false,
  "fuelType": "",
  "location": "Campbelltown",
  "postcode": "2560",
  "dietaryPreferences": ["halal"],
  "subscriptions": ["Spotify"]
}
```

### 3. Test Scenarios

#### End-to-End Test Flow
1. Open landing page
2. Click "Get Started"
3. Fill signup form
4. Complete onboarding (all fields)
5. Redirect to chat
6. Send demo prompt 1
7. Verify AI response
8. Send demo prompt 2
9. Verify AI response
10. Send demo prompt 3
11. Verify AI response
12. Check profile page
13. Update profile
14. Verify changes saved

#### Integration Points to Test

**Frontend → Backend:**
- [ ] POST /users creates user successfully
- [ ] GET /users/{userId} retrieves user
- [ ] PUT /users/{userId} updates user
- [ ] POST /chat sends message and receives response
- [ ] CORS headers present in all responses
- [ ] Error handling works (404, 500)

**Backend → DynamoDB:**
- [ ] User data saved correctly
- [ ] User data retrieved correctly
- [ ] User data updated correctly
- [ ] Plans saved correctly
- [ ] No permission errors

**Backend → n8n:**
- [ ] Webhook receives requests
- [ ] User profile passed correctly
- [ ] Response returned correctly
- [ ] Timeout handling (>30s)

**n8n → External APIs:**
- [ ] Pulse MCP connection (or fallback)
- [ ] FuelCheck API connection
- [ ] LLM API connection (Claude/GPT)
- [ ] Error handling for API failures

### 4. Bug Tracking

Create a shared document with this structure:

#### Bug Template
```
Bug ID: BUG-001
Severity: Critical / Major / Minor
Component: Frontend / Backend / AI/Agent
Description: [What's broken]
Steps to Reproduce:
1. [Step 1]
2. [Step 2]
Expected: [What should happen]
Actual: [What actually happens]
Assigned To: [Squad/Person]
Status: Open / In Progress / Fixed / Won't Fix
```

#### Severity Definitions
- **Critical:** Breaks demo, blocks other work
- **Major:** Looks bad but works, impacts user experience
- **Minor:** Polish issues, nice-to-have fixes

### 5. Demo Preparation

#### Demo Script (4 minutes)

**Minute 0:00-0:30 - Landing Page**
- Show landing page
- Highlight value proposition
- Point out example savings ($2,760/year)
- Click "Get Started"

**Minute 0:30-1:30 - Onboarding**
- Quick signup (pre-filled for speed)
- Show onboarding questionnaire
- Highlight key questions (income, rent, dietary)
- Submit and redirect to chat

**Minute 1:30-3:30 - Chat Interaction**
- Show suggested prompts
- Type: "I want to save $3,000 in 6 months for a Japan trip"
- Wait for AI response (should be <5 seconds)
- Highlight savings breakdown:
  - Grocery: $120/month
  - Fuel: $60/month
  - Bills: $50/month
  - Coffee: $70/month
- Show total: $300/month savings found

**Minute 3:30-4:00 - Savings Plan**
- Navigate to profile page
- Show saved plan
- Highlight personalization (vegetarian, Parramatta, E10)
- Conclude with impact statement

#### Backup Plans

**If Internet Fails:**
- Play pre-recorded demo video

**If Demo Crashes:**
- Use screenshots to walk through flow

**If Chat Breaks:**
- Describe what would happen
- Show example response

**If API Timeout:**
- Explain AI is processing
- Show cached response

### 6. Presentation Slides

#### Slide Outline

1. **Title Slide**
   - SaveSmart logo
   - Team names
   - "AI-Powered Personal Savings Agent"

2. **Problem Slide**
   - Cost of living crisis for students
   - Groceries up 15%, fuel 14%, bills 28%
   - Budgeting apps just show where money went
   - Need proactive savings advice

3. **Solution Slide**
   - SaveSmart: Personal AI financial advisor
   - Real Australian pricing data
   - Personalized recommendations
   - 4 specialized AI agents

4. **Demo Intro Slide**
   - Meet Sarah: $1,200/month student
   - Goal: Save $3,000 for Japan trip
   - Let's see how SaveSmart helps

5. **[LIVE DEMO]**

6. **Architecture Slide**
   - Next.js frontend (Vercel)
   - AWS serverless backend
   - n8n AI orchestration
   - 4 specialized agents
   - Real data sources (Pulse MCP, FuelCheck)

7. **Impact Slide**
   - For Sarah: $2,760/year saved
   - For 1.5M students: $4.1B/year
   - Built in 3 days
   - Technologies: Claude AI, AWS, n8n

8. **Thank You Slide**
   - Team photo
   - Contact info
   - "Questions?"

### 7. Testing Checklist

#### Day 2 End (6:00 PM)
- [ ] Signup/login works
- [ ] Onboarding saves to DynamoDB
- [ ] Chat sends/receives messages
- [ ] At least 1 agent responds
- [ ] Demo account created
- [ ] No critical bugs

#### Day 3 End (6:00 PM)
- [ ] All UI bugs fixed
- [ ] All Lambda functions work
- [ ] All agents operational (or at least 2)
- [ ] Demo tested 5+ times
- [ ] Backup video recorded
- [ ] Presentation slides complete
- [ ] Speaker roles assigned

#### Day 4 Before Demo (1:30 PM)
- [ ] Demo works perfectly
- [ ] Backup video ready
- [ ] Slides uploaded
- [ ] Team knows their parts
- [ ] Screenshots ready

### 8. Communication Protocol

#### Status Updates (Every 2 Hours)
Post in shared channel:
```
Squad: [Frontend/Backend/AI/Integration]
Status: [On Track / Blocked / Behind]
Completed: [What's done]
In Progress: [What you're working on]
Blockers: [What's blocking you]
Needs: [What you need from other squads]
```

#### Blocker Escalation
If blocked for >30 minutes:
1. Post in channel with @all
2. Tag Integration Lead
3. Schedule quick sync if needed

### 9. Resources

- **All Specs:** `.kiro/specs/`
- **Setup Guide:** `SETUP_CHECKLIST.md`
- **Team Guide:** `TEAM_GUIDE.md`
- **Architecture:** `ARCHITECTURE.md`
- **Daily Plans:** `docs/Day 2-4 (Day).md`

## Testing Tools

- **Postman:** API testing
- **Browser DevTools:** Frontend debugging
- **CloudWatch Logs:** Lambda debugging
- **n8n Execution History:** Workflow debugging
- **Screen Recorder:** Demo video backup
