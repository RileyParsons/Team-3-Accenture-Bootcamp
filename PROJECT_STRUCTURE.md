# SaveSmart - Project Structure

## Overview

SaveSmart is an AI-powered personal savings agent for Australian university students, built during a 4-day Accenture bootcamp (Feb 11-14, 2026).

## Repository Structure

```
Team-3-Accenture-Bootcamp/
├── docs/                           # Planning documents
│   ├── MVP Plan.md                 # Product vision & features
│   ├── Execution Plan.md           # Step-by-step build guide
│   ├── Day 2 (Wednesday).md        # Foundation build tasks
│   ├── Day 3 (Thursday).md         # Integration & polish tasks
│   └── Day 4 (Friday).md           # Final polish & presentations
│
├── .kiro/specs/                    # Feature specifications
│   ├── frontend-landing-onboarding/
│   │   └── requirements.md         # Landing page & onboarding spec
│   ├── frontend-chat-interface/
│   │   └── requirements.md         # Chat interface spec
│   ├── backend-aws-infrastructure/
│   │   └── requirements.md         # AWS backend spec
│   └── ai-agent-orchestration/
│       └── requirements.md         # n8n AI agents spec
│
├── savesmart-frontend/             # Frontend application (to be created)
│   ├── app/
│   │   ├── page.tsx                # Landing page
│   │   ├── signup/page.tsx         # Signup form
│   │   ├── onboarding/page.tsx     # Onboarding questionnaire
│   │   ├── chat/page.tsx           # Chat interface
│   │   └── profile/page.tsx        # User profile
│   ├── components/                 # Reusable components
│   ├── lib/                        # Utilities & API clients
│   └── public/                     # Static assets
│
├── savesmart-backend/              # Backend Lambda functions (to be created)
│   ├── saveUser/                   # POST /users
│   ├── getUser/                    # GET /users/{userId}
│   ├── updateUser/                 # PUT /users/{userId}
│   ├── chat/                       # POST /chat
│   └── getPlans/                   # GET /plans/{userId}
│
├── n8n-workflows/                  # n8n workflow exports (to be created)
│   ├── main-orchestrator.json      # Main agent workflow
│   ├── grocery-agent.json          # Grocery sub-agent
│   ├── fuel-agent.json             # Fuel sub-agent
│   ├── bills-agent.json            # Bills sub-agent
│   └── financial-planner.json      # Financial planner sub-agent
│
├── PROJECT_STRUCTURE.md            # This file
├── TEAM_GUIDE.md                   # Quick reference for teams
└── README.md                       # Project overview
```

## Technology Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **State Management:** React hooks

### Backend
- **Infrastructure:** AWS Serverless
- **API Gateway:** REST API
- **Compute:** Lambda Functions (Node.js 20.x)
- **Database:** DynamoDB (2 tables)
- **Region:** ap-southeast-2 (Sydney)

### AI/Agent Layer
- **Orchestration:** n8n (workflow automation)
- **LLM:** Claude Sonnet 4 (Anthropic) or GPT-4o (OpenAI)
- **Architecture:** Main orchestrator + 4 specialized sub-agents

### Data Sources
- **Pulse MCP:** Coles/Woolworths grocery prices
- **FuelCheck NSW API:** Real-time fuel prices
- **Pattern Analysis:** Subscription optimization

## Team Structure

### Squad A: Frontend Team
- **Lead:** Landing page, deployment, API integration
- **Dev 1:** Onboarding flow, profile page
- **Dev 2:** Chat interface, message components
- **Spec:** `.kiro/specs/frontend-landing-onboarding/` & `.kiro/specs/frontend-chat-interface/`

### Squad B: Backend Team (AWS)
- **Lead:** DynamoDB, API Gateway, Lambda orchestration
- **Dev:** Additional Lambda functions, testing, documentation
- **Spec:** `.kiro/specs/backend-aws-infrastructure/`

### Squad C: AI/Agent Team
- **Lead:** n8n setup, main orchestrator, prompt engineering
- **Dev:** Sub-agents (Grocery, Fuel, Bills, Financial Planner)
- **Spec:** `.kiro/specs/ai-agent-orchestration/`

### Squad D: Integration Lead
- **Role:** Testing, demo preparation, presentation, coordination
- **Responsibilities:** End-to-end testing, bug tracking, demo script

## Key Deliverables by Day

### Day 2 (Wednesday) - Foundation
- Frontend deployed to Vercel
- AWS infrastructure operational
- n8n workflows created
- At least 1 agent working

### Day 3 (Thursday) - Integration
- Full user flow working end-to-end
- All agents operational
- Demo account tested
- Presentation slides created

### Day 4 (Friday) - Polish
- Critical bugs fixed
- Demo rehearsed
- Backup video recorded
- Presentations delivered

## Critical Integration Points

### Frontend ↔ Backend
- **Handoff:** API Gateway URL
- **Format:** REST API endpoints
- **Auth:** userId in localStorage (no JWT for MVP)

### Backend ↔ AI/Agent
- **Handoff:** n8n webhook URL
- **Format:** JSON payload with userId, message, userProfile
- **Timeout:** 60 seconds

### All Teams ↔ Integration Lead
- **Handoff:** Bug reports, test results, demo feedback
- **Format:** Shared documentation, Postman collections

## Demo Account

**Email:** sarah@student.com
**Profile:**
- Name: Sarah
- Income: $1,200/month
- Rent: $600/month
- Grocery Budget: $80/week
- Savings: $500
- Has Car: Yes (E10 fuel)
- Location: Parramatta, NSW 2150
- Dietary: Vegetarian
- Subscriptions: Netflix, Spotify

## Demo Prompts

1. "I want to save $3,000 in 6 months for a Japan trip"
2. "Help me save money on groceries"
3. "Where can I find cheap fuel near me?"

## Success Metrics

- User completes signup in < 1 minute
- User completes onboarding in 2-3 minutes
- Chat responds in < 5 seconds
- At least 1 agent provides realistic advice
- 0 critical bugs during demo
- Demo runs smoothly in < 5 minutes

## Getting Started

1. **Read the specs:** Start with `.kiro/specs/[your-squad]/requirements.md`
2. **Review daily plan:** Check `docs/Day 2 (Wednesday).md` for today's tasks
3. **Set up environment:** Follow setup instructions in Execution Plan
4. **Coordinate with team:** Share URLs, API keys, and test data
5. **Test frequently:** Integration testing is critical

## Resources

- **AWS Console:** aws.amazon.com/console
- **n8n Cloud:** n8n.io
- **Vercel:** vercel.com
- **FuelCheck API:** api.nsw.gov.au
- **Pulse MCP:** pulsemcp.com

## Questions?

- Check the relevant spec in `.kiro/specs/`
- Review the Execution Plan in `docs/Execution Plan.md`
- Ask your squad lead or Integration Lead
- Document decisions and share with team
