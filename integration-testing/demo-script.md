# SaveSmart Demo Script

**Duration:** 4 minutes
**Presenter:** [Assign speakers]
**Demo Account:** sarah@student.com
**Date:** February 14, 2026 (Friday afternoon)

---

## 🎬 Pre-Demo Checklist (30 minutes before)

### Technical Setup
- [ ] Laptop connected to projector
- [ ] Slides display correctly
- [ ] Demo URL bookmarked and tested
- [ ] Demo account (sarah@student.com) works
- [ ] All 3 demo prompts tested
- [ ] Backup video on desktop
- [ ] Screenshots in backup folder
- [ ] Browser cache cleared
- [ ] Notifications turned off
- [ ] Close all unnecessary tabs/apps
- [ ] Full battery or plugged in
- [ ] Water bottles ready

### Team Prep
- [ ] Everyone knows their speaking part
- [ ] Speaker order confirmed
- [ ] Backup plans reviewed
- [ ] Quick team huddle: "We've got this!"
- [ ] Positive energy! 🚀

---

## 🎤 Demo Script (4 minutes)

### Minute 0:00-0:30 - The Problem (Speaker 1)

**Script:**
> "Australian students are facing a cost of living crisis. Groceries are up 15%, fuel 14%, bills 28%. We have budgeting apps, but they just show us where our money went. What if AI could tell us where to save BEFORE we spend?"

**Actions:**
- Make eye contact with judges
- Show passion about the problem
- Pause for effect after the question

**Backup Plan:**
- If projector fails, describe the problem verbally

---

### Minute 0:30-1:00 - The Solution (Speaker 2)

**Script:**
> "Meet SaveSmart - your personal AI financial advisor. Built specifically for Australian students. Real grocery prices from Coles and Woolworths. Real-time fuel prices. Bill analysis. All powered by AI. Let me show you how it works..."

**Actions:**
- Transition smoothly to demo
- Hand off to Speaker 3

**Backup Plan:**
- Show architecture slide if demo isn't ready

---

### Minute 1:00-3:30 - Live Demo (Speaker 3)

#### Part 1: Landing Page (15 seconds)
**Script:**
> "This is Sarah. She's a 21-year-old student earning $1,200 a month, paying $600 in rent. She wants to save for a trip to Japan."

**Actions:**
- Show landing page
- Highlight value proposition
- Click "Get Started"

**Backup Plan:**
- Use screenshot if site is down

---

#### Part 2: Quick Onboarding (30 seconds)
**Script:**
> "Sarah signs up in seconds and tells us about her financial situation - her income, expenses, that she's vegetarian, drives a car, lives in Parramatta."

**Actions:**
- Show onboarding form (pre-filled for speed)
- Highlight key questions
- Submit and redirect to chat

**Backup Plan:**
- Skip to chat if onboarding breaks
- Say "Sarah has already set up her profile"

---

#### Part 3: Chat Interaction (1 minute 45 seconds)
**Script:**
> "Now Sarah asks: 'I want to save $3,000 in 6 months for a Japan trip.'"

**Actions:**
1. Type the prompt (or click suggested prompt)
2. Wait for AI response (should be < 5 seconds)
3. While waiting, say: "SaveSmart analyzes her profile and finds savings opportunities..."

**Script (when response appears):**
> "SaveSmart tells her she needs $500 a month. But here's the magic - it found $300 in savings:
> - $120 from meal planning with Coles specials - vegetarian options
> - $60 from filling up at the cheapest E10 station in Parramatta
> - $50 from canceling unused Netflix
> - $70 from making coffee at home
>
> That's $300 a month! Sarah can reach her goal!"

**Actions:**
- Highlight each savings category
- Point out personalization (vegetarian, Parramatta, E10)
- Show enthusiasm about the results

**Backup Plans:**
- **If API timeout (>10s):** Say "The AI is processing..." then switch to backup video
- **If chat breaks:** Use screenshot of expected response
- **If wrong response:** Say "Let me show you what Sarah would see" and use screenshot
- **If internet fails:** Play backup video immediately

---

### Minute 3:30-4:00 - Impact & Close (Speaker 4)

**Script:**
> "For Sarah, that's $2,760 saved per year. Multiply that by 1.5 million Australian students - that's $4.1 billion in collective savings.
>
> We built this in 3 days using Claude AI, real Australian data sources, n8n workflows, and AWS serverless architecture.
>
> Imagine the future: bank integration, automatic transfers, group savings goals, carbon footprint tracking.
>
> SaveSmart makes saving effortless. Personal, proactive, built for Australians."

**Actions:**
- Show impact slide
- Make eye contact with judges
- End with confidence

**All Team (5 seconds):**
> "Questions?"

---

## 🎯 Key Messages to Emphasize

1. **Real Data** - Not fake prices, actual Coles/Woolworths and FuelCheck data
2. **Personalized** - Uses Sarah's profile (vegetarian, Parramatta, E10)
3. **Actionable** - Specific dollar amounts and recommendations
4. **Australian-Focused** - Built for Australian students with Australian data
5. **AI-Powered** - 4 specialized agents working together
6. **Fast** - Built in 3 days, responses in < 5 seconds

---

## 🚨 Backup Plans

### If Internet Fails
1. Immediately switch to backup video
2. Say: "Let me show you a recording of SaveSmart in action"
3. Play video with audio
4. Continue with impact slide

### If Demo Crashes
1. Use screenshots to walk through flow
2. Say: "Here's what Sarah would see..."
3. Show each screenshot
4. Describe the experience

### If Chat Breaks
1. Show the prompt
2. Say: "When Sarah asks this, SaveSmart analyzes her profile..."
3. Use screenshot of expected response
4. Explain what the AI found

### If API Timeout
1. Say: "The AI is processing Sarah's complex financial situation..."
2. Wait 5 more seconds
3. If still nothing, switch to screenshot
4. Say: "Here's what SaveSmart found for her"

### If Wrong Response
1. Don't panic or apologize
2. Say: "Let me show you what Sarah typically sees"
3. Use screenshot
4. Continue confidently

---

## 📊 Timing Breakdown

| Section | Duration | Speaker | Backup |
|---------|----------|---------|--------|
| Problem | 0:30 | Speaker 1 | Verbal only |
| Solution | 0:30 | Speaker 2 | Architecture slide |
| Landing | 0:15 | Speaker 3 | Screenshot |
| Onboarding | 0:30 | Speaker 3 | Skip to chat |
| Chat | 1:45 | Speaker 3 | Video/Screenshots |
| Impact | 0:30 | Speaker 4 | Impact slide |
| **Total** | **4:00** | | |

---

## 🎓 Q&A Preparation

### Technical Questions

**Q: How does the AI know what to recommend?**
A: We use Claude Sonnet 4 with 4 specialized agents - Grocery, Fuel, Bills, and Financial Planner. Each agent has access to real data sources and the user's profile.

**Q: Where does the grocery data come from?**
A: We use Pulse MCP which provides real-time prices from Coles and Woolworths, including current specials and discounts.

**Q: How accurate are the fuel prices?**
A: We use the FuelCheck NSW API which provides real-time fuel prices from all stations in NSW, updated multiple times per day.

**Q: What if the user doesn't live in NSW?**
A: For this MVP, we focused on NSW data. In production, we'd expand to other states using their respective APIs.

### Business Questions

**Q: How would you monetize this?**
A: Freemium model - basic features free, premium features like bank integration, automatic transfers, and advanced analytics for $4.99/month.

**Q: What's your competitive advantage?**
A: We're the only solution combining real Australian pricing data with AI-powered personalized recommendations. We're proactive, not reactive.

**Q: How would you scale this?**
A: AWS serverless architecture scales automatically. We'd add caching, CDN, and optimize API calls. The architecture is already production-ready.

### Demo Questions

**Q: Can it handle different dietary requirements?**
A: Yes! We support vegetarian, vegan, halal, kosher, and other dietary preferences. The AI respects these when suggesting meals.

**Q: What if someone doesn't have a car?**
A: The system adapts - it won't suggest fuel savings but will focus on public transport costs, grocery delivery options, and other relevant savings.

**Q: Can users set multiple savings goals?**
A: In the MVP, one goal at a time. In production, we'd support multiple goals with priority ranking and timeline management.

---

## 💡 Presentation Tips

### Do's
- Make eye contact with judges
- Speak clearly and at moderate pace
- Show enthusiasm and passion
- Smile!
- Support teammates
- Engage with energy
- Use hand gestures naturally
- Pause for effect after key points

### Don'ts
- Read directly from slides
- Turn back to audience
- Apologize for what you didn't build
- Use too much jargon
- Go over time limit
- Panic if something breaks
- Speak too fast
- Block the screen

---

## 📝 Post-Demo Actions

### Immediate (Right After)
- [ ] Thank judges and mentors
- [ ] Team high-five! 🙌
- [ ] Take a deep breath
- [ ] Watch other teams (learn and support)

### Within 1 Hour
- [ ] Debrief as team
- [ ] Note what went well
- [ ] Note what could improve
- [ ] Gather informal feedback

### Within 24 Hours
- [ ] Post team photo on LinkedIn
- [ ] Thank Accenture on social media
- [ ] Update portfolios with project
- [ ] Share slides/demo video
- [ ] Document lessons learned
- [ ] Exchange contact info with connections

---

## 🎉 Remember

- **You've built something amazing in 3 days**
- **Judges care more about your thinking than perfect execution**
- **If something breaks, stay calm and use backups**
- **Show passion and enthusiasm**
- **Have fun!**

**Good luck, Team 3! You've got this! 🚀**
