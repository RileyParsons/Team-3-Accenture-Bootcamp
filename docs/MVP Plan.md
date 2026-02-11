# 📋 MVP Plan

**Product Name:** SaveSmart - AI-Powered Personal Savings Agent

**Target Users:** Australian University Students & Young People

**Timeline:** February 11-12, 2026 (Days 2-3)

---

## 🎯 Core Concept

A conversational AI agent that helps Australian students save money by providing personalized financial planning, grocery savings, fuel optimization, and bill reduction recommendations.

### Key Value Proposition

> "Ask questions about your finances and get real, actionable savings advice powered by live Australian pricing data."
> 

---

## 👤 User Persona: "Sarah"

**Demographics:**

- 21-year-old university student
- Part-time job: $1,200/month income
- Lives out of home: $600/month rent
- Budget-conscious but time-poor
- Tech-savvy, comfortable with AI

**Pain Points:**

- "I don't know where my money goes each week"
- "Budgeting apps just show me I'm broke, they don't help"
- "I want to save for a holiday but don't know how"
- "Groceries keep getting more expensive"

**Goals:**

- Save $3,000 for Japan trip in 6 months
- Reduce weekly grocery spending
- Stop wasting money on unused subscriptions
- Have a clear financial plan

---

## 💡 Product Features

### **1. Onboarding & Profile**

User answers 7-10 questions to establish financial baseline:

- Living situation (out of home?)
- Monthly income
- Monthly rent
- Weekly grocery budget
- Current savings
- Car ownership & fuel type
- Active subscriptions

### **2. AI Chat Interface**

Conversational agent that responds to natural language queries:

**Example Conversations:**

```
User: "Help me save money on groceries"
Agent: "I can create a weekly meal plan using current specials from Coles and Woolworths. What's your weekly budget?"

User: "I want to save $3000 in 6 months"
Agent: "That's $500/month. Based on your profile, I found $300/month in savings opportunities..."

User: "Where's the cheapest fuel near me?"
Agent: "The cheapest E10 is at Metro Petroleum on Pitt St - $1.78/L (saves you $7 vs nearest competitor)"
```

### **3. AI Sub-Agents (Specialized Functions)**

#### **Grocery Agent** 🛒

- Connects to Pulse MCP (Coles/Woolworths prices)
- Suggests 5 meal plan based on budget
- Creates optimized shopping list
- Shows savings vs regular prices

#### **Fuel Agent** ⛽

- Uses FuelCheck NSW API
- Finds cheapest fuel within 5km radius
- Recommends best days to fill up
- Calculates potential savings

#### **Bills Agent** 💰

- Analyzes subscriptions and recurring costs
- Identifies unused services
- Suggests cheaper alternatives
- Calculates monthly savings potential

#### **Financial Planner Agent** 📊

- Creates personalized savings plan
- Calculates required monthly savings for goals
- Breaks down budget recommendations
- Tracks progress toward goals

---

## 🏗️ Technical Architecture

### **Frontend:**

- **Framework:** React + Next.js
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Key Pages:**
    - Landing page
    - Signup/Login
    - Onboarding questionnaire
    - Chat interface
    - User profile/settings

### **Backend:**

- **API:** Express.js + Node.js
- **Database:** MongoDB Atlas
- **Auth:** JWT tokens
- **Hosting:** Railway / Render / Heroku

### **AI/Agent Layer:**

- **Orchestration:** n8n (workflow automation)
- **LLM:** Claude Sonnet 4 via Anthropic API
- **Agent Architecture:**
    - Main Orchestrator Agent (routes to sub-agents)
    - Grocery Sub-Agent (Pulse MCP)
    - Fuel Sub-Agent (FuelCheck API)
    - Bills Sub-Agent (pattern analysis)
    - Financial Planner Sub-Agent (calculations)

### **Data Sources:**

- Pulse MCP - Coles/Woolworths prices
- FuelCheck NSW API - Real-time fuel prices
- ABS CPI Data - Inflation context (static)

### **Architecture Flow:**

```
User → Frontend Chat UI
  ↓
Backend API Gateway
  ↓
n8n Main Orchestrator Agent
  ↓
[Routes to appropriate sub-agent]
  ↓
Sub-Agent calls external APIs
  ↓
Formatted response returns to user
```

---

## 📱 User Journey

### **First-Time User:**

1. **Landing Page** (30 seconds)
    - See value proposition
    - View example savings scenarios
    - Click "Get Started"
2. **Signup** (1 minute)
    - Email + password
    - Quick account creation
3. **Onboarding** (2-3 minutes)
    - Answer financial questions
    - Set savings goal (optional)
    - Complete profile
4. **Chat Interface** (5+ minutes)
    - See suggested prompts
    - Ask first question
    - Receive personalized plan
    - Get actionable recommendations

### **Returning User:**

1. Login → Chat interface
2. Agent remembers context
3. Can ask new questions or update goals
4. View updated savings recommendations

---

## 🎯 MVP Success Criteria

### **Must Have (Core Demo):**

- ✅ User can signup and complete onboarding
- ✅ Chat interface sends/receives messages
- ✅ At least 1 agent works (Grocery Agent priority)
- ✅ Savings calculations are accurate
- ✅ Demo runs without crashes

### **Should Have (Enhanced Demo):**

- ⭐ 3+ agents working (Grocery + Fuel + Bills)
- ⭐ Personalized responses based on user profile
- ⭐ Beautiful, polished UI
- ⭐ Fast response times (<3 seconds)

### **Nice to Have (Bonus Points):**

- 🎁 Savings plan visualization (charts/graphs)
- 🎁 Conversation history saved
- 🎁 Mobile responsive design
- 🎁 Export savings plan as PDF

---

## 📊 Demo Metrics

**Quantifiable Impact:**

- Average savings: **$230/month**
- Annual impact: **$2,760/year per student**
- Grocery savings: **15-20% reduction**
- Time saved: **5-10 minutes/week on budgeting**

**Scale Impact:**

- 1.5M Australian university students
- Potential collective savings: **$4.1 billion/year**

---

## 🎬 Demo Scenario

**Setup:** "Sarah" wants to save for a Japan trip

**Script:**

1. Show landing page
2. Quick signup (pre-filled for speed)
3. Complete onboarding (show budget situation)
4. Ask agent: "I want to save $3000 in 6 months for a Japan trip"
5. Agent analyzes and responds with:
    - Required monthly savings: $500
    - Current available: $200
    - Gap to fill: $300
6. Agent presents savings opportunities:
    - Grocery meal planning: $120/month
    - Fuel optimization: $60/month
    - Cancel unused Netflix: $50/month
    - Reduce café coffees: $70/month
7. Show: "You can reach your goal! Here's your personalized plan..."

**Time:** 4 minutes total

---

## 🚨 Known Risks & Mitigation

### **Risk 1: Pulse MCP Connection Fails**

**Mitigation:** Use static JSON file with realistic grocery prices

### **Risk 2: n8n Too Complex to Set Up**

**Mitigation:** Direct Claude API calls from backend (simpler)

### **Risk 3: Time Runs Out**

**Mitigation:** Cut features aggressively, focus on 1 working agent

### **Risk 4: Demo Day Technical Issues**

**Mitigation:** Pre-record backup demo video

---

## 📄 Sub-Pages

Detailed execution plans and specifications:

[Day 2 (Wednesday) - Foundation Build](Day%202%20(Wednesday)%20-%20Foundation%20Build%203034bfc7d69481d9a031f4f5ac72171c.md)

[Day 3 (Thursday) - Integration & Polish](Day%203%20(Thursday)%20-%20Integration%20&%20Polish%203034bfc7d69481909670f7b9985a3228.md)

[Day 4 (Friday) - Final Polish & Presentations](Day%204%20(Friday)%20-%20Final%20Polish%20&%20Presentations%203034bfc7d694816a86d1f7a181842289.md)

[Other](Other%203034bfc7d694805a86aedfb1d82aca83.md)