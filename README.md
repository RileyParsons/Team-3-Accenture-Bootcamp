# SaveSmart - AI-Powered Personal Savings Agent

**Team 3 - Accenture Bootcamp**
**Timeline:** February 11-14, 2026 (4 days)
**Target Users:** Australian University Students & Young People

---

## 🎯 Project Overview

SaveSmart is a conversational AI agent that helps Australian students save money by providing personalized financial planning, grocery savings, fuel optimization, and bill reduction recommendations.

**Key Value Proposition:**
> "Ask questions about your finances and get real, actionable savings advice powered by live Australian pricing data."

**Impact:**
- Average savings: **$230/month** per student
- Annual impact: **$2,760/year** per student
- Potential collective savings: **$4.1 billion/year** across 1.5M Australian students

---

## 🏗️ Architecture

### Frontend
- **Framework:** Next.js 14+ (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Pages:** Landing, Signup, Onboarding, Chat, Profile

### Backend
- **Infrastructure:** AWS Serverless (API Gateway + Lambda + DynamoDB)
- **Runtime:** Node.js 20.x
- **Database:** DynamoDB (2 tables: users, plans)
- **Region:** ap-southeast-2 (Sydney)

### AI/Agent Layer
- **Orchestration:** n8n (workflow automation)
- **LLM:** Claude Sonnet 4 (Anthropic) or GPT-4o (OpenAI)
- **Agents:** Main Orchestrator + 4 specialized sub-agents
  - 🛒 Grocery Agent (Pulse MCP - Coles/Woolworths prices)
  - ⛽ Fuel Agent (FuelCheck NSW API)
  - 💰 Bills Agent (subscription analysis)
  - 📊 Financial Planner Agent (savings calculations)

### Data Flow
```
User → Frontend (Next.js)
  ↓
API Gateway (REST API)
  ↓
Lambda Functions (Node.js)
  ↓
n8n Main Orchestrator Agent
  ↓
Specialized Sub-Agents → External APIs
  ↓
Formatted Response → User
```

---

## 📁 Repository Structure

```
Team-3-Accenture-Bootcamp/
├── docs/                           # All documentation
│   ├── MVP Plan.md                 # Product vision & features
│   ├── Execution Plan.md           # Step-by-step build guide
│   ├── Day 2 (Wednesday).md        # Foundation build tasks
│   ├── Day 3 (Thursday).md         # Integration & polish tasks
│   ├── Day 4 (Friday).md           # Final polish & presentations
│   ├── TEAM_GUIDE.md               # Quick reference for teams
│   ├── SETUP_CHECKLIST.md          # Setup steps for each squad
│   ├── ARCHITECTURE.md             # System architecture
│   ├── PROJECT_STRUCTURE.md        # Detailed project structure
│   └── SETUP_COMPLETE.md           # Setup summary
│
├── .kiro/specs/                    # Feature specifications
│   ├── budgeting-profile-page/     # Budgeting profile page spec
│   ├── frontend-landing-onboarding/
│   ├── frontend-chat-interface/
│   ├── backend-aws-infrastructure/
│   └── ai-agent-orchestration/
│
├── src/                            # Frontend source code
│   ├── components/                 # React components
│   ├── context/                    # React Context
│   ├── types/                      # TypeScript types
│   └── utils/                      # Utility functions
├── savesmart-frontend/             # Frontend workspace
├── savesmart-backend/              # Backend workspace
├── n8n-workflows/                  # AI agent workflows
├── integration-testing/            # Testing workspace
└── README.md                       # This file
```

---

## 🧪 Budgeting Profile Page

A React TypeScript application for creating budgeting profiles. This application guides users through a multi-step form to gather information about their income, expenses, and financial goals.

### Running the Application Locally

#### Prerequisites
- Node.js (v18.16.0 or higher)
- npm (v9.x or higher)

#### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   - Navigate to `http://localhost:5173/`
   - The app will automatically reload when you make changes

#### Available Commands

**Development:**
```bash
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build locally
```

**Testing:**
```bash
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

**Type Checking:**
```bash
npm run type-check   # Check TypeScript types without building
```

### Testing Strategy

This project uses a dual testing approach:

- **Unit Tests** (`.test.ts`, `.test.tsx`): Test specific examples, edge cases, and component behavior
- **Property-Based Tests** (`.properties.test.ts`, `.properties.test.tsx`): Test universal properties using fast-check

### Troubleshooting

**Port already in use:**
If port 5173 is already in use, Vite will automatically try the next available port (5174, 5175, etc.)

**Module not found errors:**
Run `npm install` to ensure all dependencies are installed

**TypeScript errors:**
Run `npm run type-check` to see detailed type errors

---

## 👥 Team Structure

### Squad A: Frontend Team
- Landing page & onboarding flow
- Chat interface & message components
- Profile page & settings
- **Specs:** `frontend-landing-onboarding/` & `frontend-chat-interface/`

### Squad B: Backend Team (AWS)
- DynamoDB tables setup
- API Gateway configuration
- Lambda functions (5 total)
- **Spec:** `backend-aws-infrastructure/`

### Squad C: AI/Agent Team
- n8n workflow setup
- Main orchestrator agent
- 4 specialized sub-agents
- **Spec:** `ai-agent-orchestration/`

### Squad D: Integration Lead
- End-to-end testing
- Demo preparation
- Presentation coordination
- Bug tracking & prioritization

---

## 🚀 Getting Started

### For Team Members

1. **Read Your Spec**
   - Navigate to `.kiro/specs/[your-squad]/requirements.md`
   - Understand acceptance criteria and technical requirements

2. **Check Daily Tasks**
   - Review `docs/Day 2 (Wednesday).md` for today's tasks
   - Follow the timeline and deliverables

3. **Quick Reference**
   - Read `TEAM_GUIDE.md` for quick answers
   - Check `PROJECT_STRUCTURE.md` for detailed structure

4. **Set Up Environment**
   - Follow setup instructions in `docs/Execution Plan.md`
   - Coordinate with your squad for API keys and URLs

5. **Start Building**
   - Focus on core demo flow first
   - Test frequently with other squads
   - Document and share progress

---

## 🎬 Demo Scenario

**Setup:** "Sarah" wants to save for a Japan trip

**Demo Flow (4 minutes):**
1. Show landing page (30 seconds)
2. Quick signup/onboarding (1 minute)
3. Ask: "I want to save $3,000 in 6 months for a Japan trip" (2 minutes)
4. Show savings plan with breakdown (30 seconds)

**Demo Account:**
- Email: sarah@student.com
- Income: $1,200/month
- Rent: $600/month
- Grocery Budget: $80/week
- Location: Parramatta, NSW
- Dietary: Vegetarian

**Demo Prompts:**
1. "I want to save $3,000 in 6 months for a Japan trip"
2. "Help me save money on groceries"
3. "Where can I find cheap fuel near me?"

---

## ✅ Success Criteria

### Must Have (Core Demo)
- ✅ User can signup and complete onboarding
- ✅ Chat interface sends/receives messages
- ✅ At least 1 agent works (Grocery Agent priority)
- ✅ Savings calculations are accurate
- ✅ Demo runs without crashes

### Should Have (Enhanced Demo)
- ⭐ 3+ agents working (Grocery + Fuel + Bills)
- ⭐ Personalized responses based on user profile
- ⭐ Beautiful, polished UI
- ⭐ Fast response times (<3 seconds)

### Nice to Have (Bonus Points)
- 🎁 Savings plan visualization (charts/graphs)
- 🎁 Conversation history saved
- 🎁 Mobile responsive design
- 🎁 Export savings plan as PDF

---

## 📅 Timeline

### Day 2 (Wednesday) - Foundation Build
**Goal:** Core infrastructure operational by 6:00 PM
- Frontend deployed to Vercel
- AWS infrastructure operational
- n8n workflows created
- At least 1 agent working

### Day 3 (Thursday) - Integration & Polish
**Goal:** Complete MVP ready for demo by 6:00 PM
- Full user flow working end-to-end
- All agents operational
- Demo account tested 5+ times
- Presentation slides complete

### Day 4 (Friday) - Final Polish & Presentations
**Goal:** Flawless demo delivery
- Code freeze at 1:30 PM
- Critical fixes only (9:30 AM - 11:30 AM)
- Demo rehearsal (11:30 AM - 12:00 PM)
- Presentations after lunch (~2:00 PM)

---

## 🔗 Key Resources

### Documentation
- **Specs:** `.kiro/specs/[your-squad]/requirements.md`
- **Daily Plans:** `docs/Day 2-4 (Day).md`
- **Execution Guide:** `docs/Execution Plan.md`
- **Team Guide:** `docs/TEAM_GUIDE.md`
- **Setup Guide:** `docs/SETUP_CHECKLIST.md`
- **Architecture:** `docs/ARCHITECTURE.md`

### External Services
- **AWS Console:** https://aws.amazon.com/console
- **n8n Cloud:** https://n8n.io
- **Vercel:** https://vercel.com
- **FuelCheck API:** https://api.nsw.gov.au
- **Pulse MCP:** https://pulsemcp.com

---

## 🎓 Technologies Used

- **Frontend:** Next.js, TypeScript, Tailwind CSS, React 18
- **Backend:** AWS Lambda, API Gateway, DynamoDB
- **AI/ML:** Claude Sonnet 4 / GPT-4o, n8n
- **APIs:** Pulse MCP, FuelCheck NSW
- **Deployment:** Vercel (frontend), AWS (backend)
- **Testing:** Jest, React Testing Library, fast-check
- **Tools:** Postman, CloudWatch, Git

---

## 📊 Project Metrics

- **Build Time:** 3 days (Feb 11-13)
- **Team Size:** 6-8 members (4 squads)
- **Lines of Code:** TBD
- **API Endpoints:** 5
- **Lambda Functions:** 5
- **AI Agents:** 4 specialized sub-agents
- **Demo Duration:** 4 minutes

---

## 🏆 Hackathon Goals

1. **Build a working MVP** in 3 days
2. **Learn AWS serverless architecture**
3. **Implement agentic AI** with n8n
4. **Present to industry professionals**
5. **Create portfolio content**
6. **Network and collaborate**

---

## 📝 License

This project was created for the Accenture Bootcamp (February 2026).

---

## 🙏 Acknowledgments

- **Accenture** for hosting the bootcamp
- **Mentors** for guidance and support
- **Team 3** for collaboration and hard work

---

**Let's build something amazing! 🚀**
