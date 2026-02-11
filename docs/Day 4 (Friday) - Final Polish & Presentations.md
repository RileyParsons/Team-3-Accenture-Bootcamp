# Day 4 (Friday) - Final Polish & Presentations

⚠️ **CRITICAL DEADLINES:**

- **Code Freeze: 1:30 PM** - All code must be committed and deployed
- **Presentations: After Lunch (~2:00 PM)** - Live demos to judges

🎯 **Today's Focus:** Demo rehearsal, presentation prep, minor fixes ONLY

**NO NEW FEATURES. NO MAJOR CHANGES. NO RISKY DEPLOYS.**

---

## Morning Session: 9:00 AM - 1:30 PM

### Standup + Status Check (9:00 AM - 9:30 AM)

⚠️ **Remember: Code freeze at 1:30 PM - no major changes after this!**

**Critical Questions:**

- Is the core demo working?
- Any critical bugs that would break the demo?
- Is demo account ready and tested?
- Are presentation slides complete?

**Priority Matrix:**

```
CRITICAL (Fix immediately if broken):
- [ ] Demo account works (sarah@student.com)
- [ ] Chat sends/receives messages
- [ ] At least 1 agent gives a response
- [ ] Savings plan displays
- [ ] No crashes during demo flow

NICE TO HAVE (Only if time permits):
- [ ] Polish error messages
- [ ] Add loading animations
- [ ] Fix minor UI inconsistencies

DO NOT ATTEMPT:
- [ ] New features
- [ ] Major refactoring
- [ ] Risky changes that could break working code
```

---

## Critical Fixes Only: 9:30 AM - 11:30 AM

⚠️ **NO NEW FEATURES - Only fix what's broken!**

### SQUAD A: FRONTEND

**Goal:** Demo works perfectly

**Critical Fixes Only:**

- [ ]  Fix any bugs that crash the demo
- [ ]  Ensure demo account loads correctly
- [ ]  Test demo flow 3 times
- [ ]  Fix any broken links/buttons

**Demo Prep (PRIORITY):**

- [ ]  Verify demo account works: [sarah@student.com](mailto:sarah@student.com)
- [ ]  Pre-fill onboarding data with Sarah's profile
- [ ]  Test these 3 prompts:
    1. "I want to save $3,000 in 6 months for a Japan trip"
    2. "Help me save money on groceries"
    3. "Where can I find cheap fuel?"
- [ ]  Screenshot backup images (in case demo fails)
- [ ]  Clear browser cache, test fresh

**Nice to Have (Only if everything works):**

- [ ]  Polish error messages
- [ ]  Add simple loading indicator
- [ ]  Fix obvious UI inconsistencies

---

### SQUAD B: BACKEND (AWS)

**Goal:** System stable, demo works

**Critical Fixes Only:**

- [ ]  Test demo with [sarah@student.com](mailto:sarah@student.com) account
- [ ]  Verify savesmart-chat Lambda responds
- [ ]  Check CloudWatch Logs for errors
- [ ]  Test API Gateway from frontend
- [ ]  Verify DynamoDB has Sarah's data

**If Everything Works:**

- [ ]  Monitor CloudWatch Logs during team testing
- [ ]  Have AWS Console open and ready
- [ ]  Document any known issues for team
- [ ]  Prepare backup plan if AWS fails

**DO NOT:**

- [ ]  Change Lambda code unless critical bug
- [ ]  Modify DynamoDB schema
- [ ]  Update API Gateway routes
- [ ]  Deploy new versions (too risky!)

---

### SQUAD C: AI/AGENT TEAM

**Goal:** Agents give consistent, helpful responses

**Critical Testing:**

- [ ]  Test n8n webhook receives requests
- [ ]  Test Main Agent routes correctly
- [ ]  Verify at least 1 sub-agent works (Grocery preferred)
- [ ]  Test with demo prompts:
    1. "I want to save $3,000 in 6 months for a Japan trip"
    2. "Help me save money on groceries"
    3. "Where can I find cheap fuel?"
- [ ]  Verify responses are helpful and realistic
- [ ]  Check n8n workflow is "Active" (not paused)

**If Agents Working:**

- [ ]  Minor prompt tweaks for better responses
- [ ]  Test fallback responses
- [ ]  Monitor n8n execution history
- [ ]  Have n8n dashboard open during demo

**DO NOT:**

- [ ]  Rebuild workflows from scratch
- [ ]  Change major logic
- [ ]  Add new agents (too risky!)
- [ ]  Modify webhook URLs

---

### SQUAD D: INTEGRATION + PRESENTATION

**Goal:** Presentation ready, demo rehearsed

**Critical Tasks:**

- [ ]  Finalize presentation slides (should be 90% done already!)
- [ ]  Practice full demo 3-5 times
- [ ]  Record backup demo video (CRITICAL)
- [ ]  Test demo on presentation laptop
- [ ]  Prepare screenshots as backup
- [ ]  Assign speaker roles
- [ ]  Write Q&A talking points

**Demo Script (Finalize):**

```
1. Show landing page (30 seconds)
2. Quick signup/onboarding (1 minute)
3. Ask: "I want to save $3,000 in 6 months for a Japan trip" (2 minutes)
4. Show savings plan (30 seconds)
5. Explain impact (30 seconds)

Total: 4.5 minutes
```

**Presentation Checklist:**

- [ ]  Slides complete (see [Presentation Guide](https://www.notion.so/Presentation-3034bfc7d69481e9a0f6c8537c5ae621?pvs=21) for details)
- [ ]  Demo script printed/memorized
- [ ]  Backup video on laptop desktop
- [ ]  All team members know their roles
- [ ]  Q&A answers reviewed

---

## Full Team Demo Rehearsal: 11:30 AM - 12:00 PM

### Practice Run

- [ ]  Run through complete pitch + demo
- [ ]  Time it with stopwatch (MUST be under 5 minutes)
- [ ]  Everyone watches and gives feedback
- [ ]  Test on presentation laptop
- [ ]  Practice speaker transitions
- [ ]  Note any issues
- [ ]  Make final adjustments

---

## Lunch Break: 12:00 PM - 1:00 PM

- Relax and recharge
- Keep laptop handy for last-minute checks
- Stay near workspace
- Light meal (don't want to be sleepy!)

---

## Final Checks & Code Freeze: 1:00 PM - 1:30 PM

⚠️ **ABSOLUTE CODE FREEZE AT 1:30 PM - NO MORE COMMITS!**

### Final Verification

**Technical:**

- [ ]  Demo account works (test one last time)
- [ ]  Backup video on laptop desktop
- [ ]  Presentation slides uploaded to cloud
- [ ]  All team members have slides
- [ ]  Demo URL bookmarked
- [ ]  Screenshots in backup folder
- [ ]  Close all unnecessary tabs/apps
- [ ]  Turn off notifications
- [ ]  Full battery or plugged in
- [ ]  Adapters/cables ready
- [ ]  Mouse ready (optional)

### Team Huddle

- [ ]  Quick confidence boost
- [ ]  Review speaker order
- [ ]  Confirm backup plans
- [ ]  Deep breaths
- [ ]  "We've got this!" 💪

---

## Presentations: ~2:00 PM Onwards

🎬 **SHOWTIME!**

### Pre-Presentation (30 minutes before your slot)

**Tech Setup:**

- [ ]  Connect laptop to projector
- [ ]  Test slides display correctly
- [ ]  Test demo URL loads
- [ ]  Test audio (if using backup video)
- [ ]  Close all other apps/tabs
- [ ]  Turn off notifications
- [ ]  Have water bottles ready

**Team Prep:**

- [ ]  Everyone knows their speaking part
- [ ]  Speaker order confirmed
- [ ]  Backup plans reviewed
- [ ]  Quick team huddle: "We've got this!"
- [ ]  Positive energy! 🚀

---

### During Your Presentation (4-5 minutes)

**The Demo Script:**

**Speaker 1 (30s): The Problem**

> "Australian students face a cost of living crisis. Groceries up 15%, fuel 14%, bills 28%. We have budgeting apps, but they just show where money went. What if AI could tell you where to save BEFORE you spend?"
> 

**Speaker 2 (30s): The Solution**

> "Meet SaveSmart - your personal AI financial advisor. Built for Australian students. Real grocery prices, fuel prices, bill analysis. Let me show you..."
> 

**Speaker 3 (2min): Live Demo**

1. Show landing page - "This is Sarah, $1,200/month student"
2. Quick signup/onboarding - "She signs up in 30 seconds"
3. Type: "I want to save $3,000 in 6 months for a Japan trip"
4. Show AI response with breakdown:
    - Grocery $120/month
    - Fuel $60/month
    - Bills $50/month
    - Coffee $70/month
5. Navigate to profile - show savings plan

**Speaker 4 (1min): The Impact**

> "For Sarah, that's $2,760/year. Multiply by 1.5M students = $4.1B saved. Built in 3 days using Claude AI, real Australian data, n8n workflows, AWS serverless. Imagine: bank integration, automatic transfers, group goals, carbon tracking."
> 

**All Team (30s): Close**

> "SaveSmart makes saving effortless. Personal, proactive, built for Australians. Questions?"
> 

---

### If Something Goes Wrong

**Stay Calm & Execute Backup:**

- Internet fails → Play backup video
- Demo crashes → Use screenshots
- Chat breaks → Describe experience
- API timeout → Explain what would happen

**Remember:** Judges care more about your thinking than perfect execution!

---

### Q&A Session

**Listen fully, then answer:**

- Technical questions → Backend/AI team
- Business questions → Team lead
- Demo questions → Frontend team
- If unsure → Be honest: "Great question. My thinking is... we'd need to research that more."

**Keep answers to 30-60 seconds!**

📖 **Detailed Q&A Prep:** See [Presentation Guide](https://www.notion.so/Presentation-3034bfc7d69481e9a0f6c8537c5ae621?pvs=21)

---

### After Your Presentation

**Immediate:**

- [ ]  Thank judges and mentors
- [ ]  Team high-five! 🙌
- [ ]  Watch other teams (learn and support)
- [ ]  Network with teams and mentors
- [ ]  Gather feedback informally

**Within 24 Hours:**

- [ ]  Post team photo on LinkedIn
- [ ]  Thank Accenture on social media
- [ ]  Update portfolios with project
- [ ]  Share slides/demo video
- [ ]  Document lessons learned
- [ ]  Exchange contact info with new connections

---

## 🎉 YOU DID IT!

Regardless of judging results, you:

- Built a working AI product in 3 days
- Learned AWS, n8n, and agentic AI
- Worked as a team through challenges
- Presented to industry professionals
- Created portfolio content
- Made connections and memories

**That's a huge win!** 🏆

---

## Final Reminders

✅ **Do's:**

- Make eye contact with judges
- Speak clearly and at moderate pace
- Show enthusiasm and passion
- Smile!
- Support teammates
- Engage with energy

❌ **Don'ts:**

- Read directly from slides
- Turn back to audience
- Apologize for what you didn't build
- Use too much jargon
- Go over time limit
- Panic if something breaks

---

**Good luck! You've got this! 🚀**