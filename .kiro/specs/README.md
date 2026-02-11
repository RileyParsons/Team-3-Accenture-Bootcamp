# SaveSmart - Feature Specifications

This directory contains detailed requirements specifications for each major feature/component of the SaveSmart application.

## 📋 Available Specs

### 1. Frontend: Landing Page & Onboarding
**Location:** `frontend-landing-onboarding/requirements.md`
**Squad:** Frontend Team (Lead + Dev 1)
**Priority:** High

**What's Included:**
- Landing page with hero section and value proposition
- Signup form (email + name)
- Multi-step onboarding questionnaire (3-4 steps)
- User profile page (view/edit functionality)

**Key Deliverables:**
- Deployed to Vercel with public URL
- Collects 10+ data points (income, rent, location, dietary preferences, etc.)
- Data sent to backend API (POST /users)
- Redirect to chat after completion

**Success Criteria:**
- Demo account (sarah@student.com) works perfectly
- Onboarding takes 2-3 minutes
- No crashes during demo

---

### 2. Frontend: Chat Interface
**Location:** `frontend-chat-interface/requirements.md`
**Squad:** Frontend Team (Dev 2)
**Priority:** High

**What's Included:**
- Chat interface (ChatGPT-style)
- Message bubbles (user right, AI left)
- Suggested prompts on page load
- Typing indicator during AI processing
- Savings plan display component

**Key Deliverables:**
- POST /chat sends message to backend
- AI responses display with formatting (markdown, emojis, dollar amounts)
- Loading states during API calls
- Error handling for timeouts/failures

**Success Criteria:**
- 3 demo prompts work perfectly
- Response time < 5 seconds
- Savings plan displays clearly

---

### 3. Backend: AWS Infrastructure
**Location:** `backend-aws-infrastructure/requirements.md`
**Squad:** Backend Team (Lead + Dev)
**Priority:** Critical

**What's Included:**
- 2 DynamoDB tables (savesmart-users, savesmart-plans)
- API Gateway with 5 REST endpoints
- 5 Lambda functions (Node.js 20.x)
- IAM permissions for DynamoDB access
- CORS configuration

**Key Deliverables:**
- API Gateway URL shared with Frontend team
- POST /users - Create user profile
- GET /users/{userId} - Retrieve profile
- PUT /users/{userId} - Update profile
- POST /chat - Forward to n8n, return AI response
- GET /plans/{userId} - Retrieve saved plans

**Success Criteria:**
- All endpoints return 200 for valid requests
- CORS enabled on all resources
- POST /chat successfully integrates with n8n
- CloudWatch Logs show no errors

---

### 4. AI/Agent: Orchestration & Sub-Agents
**Location:** `ai-agent-orchestration/requirements.md`
**Squad:** AI/Agent Team (Lead + Dev)
**Priority:** Critical

**What's Included:**
- n8n instance setup (cloud or local Docker)
- Main orchestrator agent workflow
- 4 specialized sub-agents:
  - 🛒 Grocery Agent (Pulse MCP / Coles/Woolworths)
  - ⛽ Fuel Agent (FuelCheck NSW API)
  - 💰 Bills Agent (subscription analysis)
  - 📊 Financial Planner Agent (savings calculations)

**Key Deliverables:**
- n8n webhook URL shared with Backend team
- Main agent routes to appropriate sub-agent
- Responses include specific dollar amounts
- Friendly, encouraging tone with emojis

**Success Criteria:**
- At least 1 agent works (Grocery preferred)
- All 3 demo prompts return helpful responses
- Response time < 5 seconds
- No execution errors in n8n history

---

## 🔗 How Specs Connect

```
┌─────────────────────────────────────────────────────────────┐
│                     User Journey                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend: Landing Page & Onboarding                         │
│  - User sees value proposition                               │
│  - Signs up with email                                       │
│  - Completes onboarding questionnaire                        │
│  - Data sent to Backend (POST /users)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend: AWS Infrastructure                                 │
│  - API Gateway receives request                              │
│  - Lambda function processes data                            │
│  - DynamoDB stores user profile                              │
│  - Returns success response                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend: Chat Interface                                    │
│  - User asks financial question                              │
│  - Message sent to Backend (POST /chat)                      │
│  - Loading indicator shows                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend: AWS Infrastructure                                 │
│  - Lambda retrieves user profile from DynamoDB               │
│  - Forwards message + profile to n8n webhook                 │
│  - Waits for AI response                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  AI/Agent: Orchestration & Sub-Agents                        │
│  - Main orchestrator analyzes user intent                    │
│  - Routes to appropriate sub-agent:                          │
│    • Grocery Agent → Pulse MCP                               │
│    • Fuel Agent → FuelCheck NSW API                          │
│    • Bills Agent → Pattern analysis                          │
│    • Financial Planner → Calculations                        │
│  - Formats response with dollar amounts                      │
│  - Returns to Backend                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend: AWS Infrastructure                                 │
│  - Lambda receives AI response                               │
│  - Optionally saves plan to DynamoDB                         │
│  - Returns formatted response to Frontend                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend: Chat Interface                                    │
│  - Displays AI response with formatting                      │
│  - Shows savings plan breakdown                              │
│  - User can ask follow-up questions                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Spec Status Tracking

### Day 2 (Wednesday) - Foundation
- [ ] Frontend: Landing & Onboarding - Basic UI deployed
- [ ] Frontend: Chat Interface - UI built (not connected)
- [ ] Backend: AWS Infrastructure - All resources created
- [ ] AI/Agent: Orchestration - Main agent operational

### Day 3 (Thursday) - Integration
- [ ] Frontend: Landing & Onboarding - Fully integrated with backend
- [ ] Frontend: Chat Interface - Fully integrated with backend
- [ ] Backend: AWS Infrastructure - All endpoints tested
- [ ] AI/Agent: Orchestration - All sub-agents operational

### Day 4 (Friday) - Polish
- [ ] All specs: Critical bugs fixed
- [ ] All specs: Demo tested 5+ times
- [ ] All specs: Documentation complete

---

## 🎯 Critical Success Metrics

### Must Have (All Specs)
✅ User can complete full flow (signup → onboarding → chat)
✅ At least 1 AI agent returns realistic responses
✅ Demo runs without crashes
✅ Response time < 5 seconds

### Should Have (Enhanced)
⭐ All 4 AI agents operational
⭐ Beautiful, polished UI
⭐ Fast response times (<3 seconds)
⭐ Personalized responses based on user profile

### Nice to Have (Bonus)
🎁 Savings plan visualization (charts)
🎁 Conversation history saved
🎁 Mobile responsive design
🎁 Export savings plan as PDF

---

## 📝 How to Use These Specs

### For Developers
1. **Read your spec thoroughly** - Understand all acceptance criteria
2. **Check dependencies** - Know what you need from other teams
3. **Follow technical requirements** - Use specified frameworks and patterns
4. **Test against acceptance criteria** - Ensure all criteria are met
5. **Document deviations** - If you can't meet a requirement, document why

### For Integration Lead
1. **Track progress** - Monitor which acceptance criteria are complete
2. **Identify blockers** - Help teams resolve dependencies
3. **Coordinate testing** - Ensure integration points are tested
4. **Prioritize fixes** - Focus on critical acceptance criteria first

### For Demo Preparation
1. **Demo requirements section** - Each spec has demo-specific requirements
2. **Test demo prompts** - Ensure all demo scenarios work
3. **Verify success criteria** - All critical criteria must be met
4. **Prepare fallbacks** - Have backup plans if something fails

---

## 🔄 Spec Updates

If requirements change during development:
1. **Document the change** - Update the relevant spec file
2. **Notify affected teams** - Post in shared channel
3. **Update acceptance criteria** - Ensure criteria reflect new requirements
4. **Re-test** - Verify changes don't break existing functionality

---

## 📞 Questions About Specs?

- **Clarification needed?** Ask your squad lead or Integration Lead
- **Technical questions?** Check the technical requirements section
- **Integration questions?** Review the dependencies section
- **Demo questions?** Check the demo requirements section

---

**Remember:** These specs are your source of truth. When in doubt, refer back to the acceptance criteria. Focus on meeting the "Must Have" criteria first, then enhance with "Should Have" and "Nice to Have" features if time permits.

Good luck! 🚀
