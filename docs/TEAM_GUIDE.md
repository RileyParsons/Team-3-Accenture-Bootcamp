# SaveSmart - Quick Team Guide

## 🚀 Quick Start (5 Minutes)

### Your Squad
1. **Frontend Team** → Work on `.kiro/specs/frontend-landing-onboarding/` & `.kiro/specs/frontend-chat-interface/`
2. **Backend Team** → Work on `.kiro/specs/backend-aws-infrastructure/`
3. **AI/Agent Team** → Work on `.kiro/specs/ai-agent-orchestration/`
4. **Integration Lead** → Coordinate all teams, test end-to-end

### Your First Steps
1. Read your squad's spec in `.kiro/specs/[your-squad]/requirements.md`
2. Check today's tasks in `docs/Day 2 (Wednesday).md`
3. Set up your development environment
4. Start building!

---

## 📋 Spec Sheets Overview

### Frontend: Landing Page & Onboarding
**Location:** `.kiro/specs/frontend-landing-onboarding/requirements.md`

**What You're Building:**
- Landing page with hero section
- Signup form (email + name)
- Multi-step onboarding questionnaire (3-4 steps)
- User profile page (view/edit)

**Key Deliverables:**
- Deployed to Vercel with public URL
- Onboarding collects: income, rent, grocery budget, savings, car details, location, dietary preferences, subscriptions
- Data sent to backend API (POST /users)
- Redirect to chat after completion

**Critical Success:**
- Demo account (sarah@student.com) works perfectly
- Onboarding takes 2-3 minutes
- No crashes during demo

---

### Frontend: Chat Interface
**Location:** `.kiro/specs/frontend-chat-interface/requirements.md`

**What You're Building:**
- Chat interface (like ChatGPT)
- Message bubbles (user right, AI left)
- Suggested prompts on page load
- Typing indicator during AI processing
- Savings plan display component

**Key Deliverables:**
- POST /chat sends message to backend
- AI responses display with formatting (markdown, emojis, dollar amounts)
- Loading states during API calls
- Error handling for timeouts/failures

**Critical Success:**
- 3 demo prompts work perfectly
- Response time < 5 seconds
- Savings plan displays clearly

---

### Backend: AWS Infrastructure
**Location:** `.kiro/specs/backend-aws-infrastructure/requirements.md`

**What You're Building:**
- 2 DynamoDB tables (savesmart-users, savesmart-plans)
- API Gateway with 5 endpoints
- 5 Lambda functions (Node.js 20.x)
- IAM permissions for DynamoDB access

**Key Deliverables:**
- API Gateway URL shared with Frontend team
- POST /users - Create user profile
- GET /users/{userId} - Retrieve profile
- PUT /users/{userId} - Update profile
- POST /chat - Forward to n8n, return AI response
- GET /plans/{userId} - Retrieve saved plans

**Critical Success:**
- All endpoints return 200 for valid requests
- CORS enabled on all resources
- POST /chat successfully integrates with n8n
- CloudWatch Logs show no errors

---

### AI/Agent: Orchestration & Sub-Agents
**Location:** `.kiro/specs/ai-agent-orchestration/requirements.md`

**What You're Building:**
- n8n instance (cloud or local Docker)
- Main orchestrator agent workflow
- 4 specialized sub-agents:
  - Grocery Agent (Pulse MCP / Coles/Woolworths)
  - Fuel Agent (FuelCheck NSW API)
  - Bills Agent (subscription analysis)
  - Financial Planner Agent (savings calculations)

**Key Deliverables:**
- n8n webhook URL shared with Backend team
- Main agent routes to appropriate sub-agent
- Responses include specific dollar amounts
- Friendly, encouraging tone with emojis

**Critical Success:**
- At least 1 agent works (Grocery preferred)
- All 3 demo prompts return helpful responses
- Response time < 5 seconds
- No execution errors in n8n history

---

## 🔗 Critical Handoffs

### Frontend → Backend
**What:** API Gateway URL
**When:** Day 2 morning (by 12:30 PM)
**Format:** `https://{id}.execute-api.ap-southeast-2.amazonaws.com/prod`
**Used For:** Frontend environment variable `NEXT_PUBLIC_API_URL`

### AI/Agent → Backend
**What:** n8n webhook URL
**When:** Day 2 morning (by 12:30 PM)
**Format:** `https://your-instance.app.n8n.cloud/webhook/savesmart-chat`
**Used For:** Lambda environment variable `N8N_WEBHOOK_URL`

### Backend → Frontend
**What:** Postman collection with example requests
**When:** Day 2 afternoon (by 4:30 PM)
**Format:** JSON file or shared Postman workspace
**Used For:** Frontend testing and integration

### All Teams → Integration Lead
**What:** Bug reports, test results, demo feedback
**When:** Continuously throughout Days 2-3
**Format:** Shared document or Slack/Teams channel
**Used For:** Prioritizing fixes and coordinating testing

---

## 🎯 Demo Requirements

### Demo Account (Pre-configured)
```json
{
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

### Demo Prompts (Must Work)
1. **"I want to save $3,000 in 6 months for a Japan trip"**
   - Expected: $500/month target, breakdown by category, comprehensive plan

2. **"Help me save money on groceries"**
   - Expected: 5 vegetarian meal suggestions, shopping list, Coles/Woolworths prices

3. **"Where can I find cheap fuel near me?"**
   - Expected: Top 5 cheapest E10 stations in Parramatta with prices

### Demo Flow (4 minutes total)
1. Show landing page (30 seconds)
2. Quick signup/onboarding (1 minute)
3. Ask first prompt (2 minutes)
4. Show savings plan (30 seconds)

---

## ✅ Daily Checklists

### Day 2 (Wednesday) - End of Day
- [ ] Frontend deployed to Vercel
- [ ] Onboarding saves data to DynamoDB
- [ ] Chat interface sends/receives messages
- [ ] At least 1 agent returns responses
- [ ] Demo account created and tested
- [ ] No critical bugs

### Day 3 (Thursday) - End of Day
- [ ] All UI bugs fixed
- [ ] All Lambda functions operational
- [ ] All 4 agents working (or at least 2)
- [ ] Demo account tested 5+ times
- [ ] Backup demo video recorded
- [ ] Presentation slides complete
- [ ] Speaker roles assigned

### Day 4 (Friday) - Before Presentations
- [ ] Demo works perfectly (tested 3+ times)
- [ ] Backup video on laptop
- [ ] Presentation slides uploaded
- [ ] All team members know their parts
- [ ] Screenshots ready as backup

---

## 🚨 Common Issues & Solutions

### Frontend Can't Reach API
**Problem:** CORS errors in browser console
**Solution:** Check API Gateway CORS settings, ensure `Access-Control-Allow-Origin: *` in Lambda responses

### API Returns 500 Error
**Problem:** Lambda function crashing
**Solution:** Check CloudWatch Logs for error details, verify DynamoDB permissions

### n8n Doesn't Trigger
**Problem:** Webhook not receiving requests
**Solution:** Verify webhook URL is correct in Lambda, check n8n workflow is "Active"

### No Data from Grocery API
**Problem:** Pulse MCP connection failing
**Solution:** Use fallback static JSON data with realistic prices

### Chat Response Too Slow
**Problem:** Response time > 10 seconds
**Solution:** Optimize n8n workflow, reduce API calls, increase Lambda timeout

---

## 📞 Who to Ask

### Frontend Questions
- UI/UX design → Frontend Lead
- API integration → Backend Lead
- Component structure → Frontend Dev 2

### Backend Questions
- AWS setup → Backend Lead
- Lambda errors → Check CloudWatch Logs first
- DynamoDB issues → Backend Dev

### AI/Agent Questions
- n8n workflows → AI/Agent Lead
- Prompt engineering → AI/Agent Lead
- API integrations → AI/Agent Dev

### Integration Questions
- End-to-end testing → Integration Lead
- Demo preparation → Integration Lead
- Bug prioritization → Integration Lead

---

## 🎓 Key Resources

### Documentation
- **Your Spec:** `.kiro/specs/[your-squad]/requirements.md`
- **Daily Tasks:** `docs/Day 2 (Wednesday).md`
- **Execution Plan:** `docs/Execution Plan.md`
- **MVP Plan:** `docs/MVP Plan.md`

### External Services
- **AWS Console:** https://aws.amazon.com/console
- **n8n Cloud:** https://n8n.io
- **Vercel:** https://vercel.com
- **FuelCheck API:** https://api.nsw.gov.au
- **Pulse MCP:** https://pulsemcp.com

### Testing Tools
- **Postman:** For API testing
- **Browser DevTools:** For frontend debugging
- **CloudWatch Logs:** For Lambda debugging
- **n8n Execution History:** For workflow debugging

---

## 💡 Pro Tips

1. **Test Early, Test Often:** Don't wait until Day 3 to test integration
2. **Share URLs Immediately:** Frontend needs API URL, Backend needs webhook URL
3. **Use Demo Account:** Test with Sarah's profile for consistency
4. **Document Everything:** Share API formats, error codes, test results
5. **Have Fallbacks:** Static data for APIs, screenshots for demo, backup video
6. **Communicate Constantly:** Slack/Teams updates every 2 hours minimum
7. **Prioritize Ruthlessly:** Focus on core demo flow, cut nice-to-haves
8. **Practice Demo:** Run through it 5+ times before Friday

---

## 🎉 Success Criteria

### Must Have (Core Demo)
✅ User can signup and complete onboarding
✅ Chat interface sends/receives messages
✅ At least 1 agent works (Grocery Agent priority)
✅ Savings calculations are accurate
✅ Demo runs without crashes

### Should Have (Enhanced Demo)
⭐ 3+ agents working (Grocery + Fuel + Bills)
⭐ Personalized responses based on user profile
⭐ Beautiful, polished UI
⭐ Fast response times (<3 seconds)

### Nice to Have (Bonus Points)
🎁 Savings plan visualization (charts/graphs)
🎁 Conversation history saved
🎁 Mobile responsive design
🎁 Export savings plan as PDF

---

**Remember:** You're building an MVP in 3 days. Focus on the core demo flow. Cut features aggressively. Make it work, then make it pretty. Good luck! 🚀
