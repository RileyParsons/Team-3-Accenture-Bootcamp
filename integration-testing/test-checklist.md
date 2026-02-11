# SaveSmart Testing Checklist

**Date:** February 11-14, 2026
**Integration Lead:** [Your Name]

---

## Day 2 (Wednesday) - End of Day Checklist

### Critical Must-Haves (6:00 PM)
- [ ] Signup/login works
- [ ] Onboarding saves user data to DynamoDB
- [ ] Chat interface sends/receives messages
- [ ] At least 1 agent returns meaningful responses (Grocery preferred)
- [ ] Savings plan displays with numbers
- [ ] Demo account created: sarah@student.com
- [ ] No critical bugs that crash the demo

### Team Coordination
- [ ] Frontend team shared Vercel URL
- [ ] Backend team shared API Gateway URL
- [ ] AI/Agent team shared n8n webhook URL
- [ ] All teams tested their components individually

---

## Day 3 (Thursday) - End of Day Checklist

### MVP Complete Requirements (6:00 PM)
- [ ] Signup/login works
- [ ] Onboarding saves data to DynamoDB
- [ ] Chat sends/receives messages
- [ ] At least 1 agent gives realistic responses
- [ ] Savings plan displays correctly
- [ ] Demo account tested 5+ times
- [ ] Backup demo video recorded
- [ ] Presentation slides complete
- [ ] Speaker roles assigned
- [ ] No critical bugs that crash demo

### Polish Items
- [ ] All UI bugs fixed
- [ ] Consistent styling throughout app
- [ ] Loading states work
- [ ] Error messages are user-friendly
- [ ] Mobile responsive (if time permits)

---

## Day 4 (Friday) - Pre-Demo Checklist

### Before Code Freeze (1:30 PM)
- [ ] Demo works perfectly (tested 3+ times)
- [ ] Backup video on laptop desktop
- [ ] Presentation slides uploaded to cloud
- [ ] All team members have slides
- [ ] Demo URL bookmarked
- [ ] Screenshots in backup folder
- [ ] Browser cache cleared
- [ ] Notifications turned off
- [ ] Full battery or plugged in

### 30 Minutes Before Demo
- [ ] Laptop connected to projector
- [ ] Slides display correctly
- [ ] Demo URL loads
- [ ] Demo account works
- [ ] All 3 prompts tested
- [ ] Backup video plays
- [ ] Team knows their parts
- [ ] Water bottles ready
- [ ] Deep breaths! 💪

---

## Integration Testing Matrix

### Frontend → Backend
- [ ] POST /users creates user successfully
- [ ] GET /users/{userId} retrieves user profile
- [ ] PUT /users/{userId} updates user profile
- [ ] POST /chat sends message and receives response
- [ ] CORS headers present in all responses
- [ ] Error handling works (404, 500)
- [ ] Loading states display during API calls

### Backend → DynamoDB
- [ ] User data saved correctly to savesmart-users
- [ ] User data retrieved correctly
- [ ] User data updated correctly
- [ ] Plans saved correctly to savesmart-plans
- [ ] No permission errors in CloudWatch Logs

### Backend → n8n
- [ ] Webhook receives requests from Lambda
- [ ] User profile passed correctly (DynamoDB format)
- [ ] Response returned correctly
- [ ] Timeout handling works (>30s)
- [ ] Error handling for n8n failures

### n8n → External APIs
- [ ] Pulse MCP connection works (or fallback data)
- [ ] FuelCheck API connection works
- [ ] LLM API connection works (Claude/GPT)
- [ ] Error handling for API failures
- [ ] Response time < 5 seconds

---

## Demo Prompts Testing

Test with Sarah's account (demo-sarah-123):

### Prompt 1: Savings Goal
**Input:** "I want to save $3,000 in 6 months for a Japan trip"

**Expected Response:**
- [ ] Calculates $500/month needed
- [ ] Shows current surplus (~$200/month)
- [ ] Provides savings breakdown by category
- [ ] Total savings opportunities ~$300/month
- [ ] Encouraging tone
- [ ] Specific dollar amounts

### Prompt 2: Grocery Savings
**Input:** "Help me save money on groceries"

**Expected Response:**
- [ ] Returns 5 meal suggestions
- [ ] Respects vegetarian preference
- [ ] Shows Coles/Woolworths prices
- [ ] Provides shopping list
- [ ] Estimates weekly cost < $80
- [ ] Shows savings amount

### Prompt 3: Fuel Optimization
**Input:** "Where can I find cheap fuel near me?"

**Expected Response:**
- [ ] Returns E10 fuel type (Sarah's car)
- [ ] Shows stations in Parramatta area
- [ ] Lists top 5 cheapest stations
- [ ] Includes prices per liter
- [ ] Shows savings vs average
- [ ] Recommends best days to fill up

---

## End-to-End Test Flow

Run this complete flow 5+ times before demo:

1. [ ] Open landing page
2. [ ] Click "Get Started"
3. [ ] Fill signup form (sarah@student.com)
4. [ ] Complete onboarding (all fields)
5. [ ] Redirect to chat page
6. [ ] See suggested prompts
7. [ ] Send prompt 1 (savings goal)
8. [ ] Verify AI response (< 5 seconds)
9. [ ] Send prompt 2 (grocery)
10. [ ] Verify AI response
11. [ ] Send prompt 3 (fuel)
12. [ ] Verify AI response
13. [ ] Navigate to profile page
14. [ ] Verify data displays correctly
15. [ ] Update a field
16. [ ] Verify update saves
17. [ ] No errors or crashes

**Time to Complete:** ~5 minutes
**Success Rate Target:** 100% (5/5 successful runs)

---

## Browser Compatibility

Test on these browsers (if time permits):

- [ ] Chrome (primary)
- [ ] Safari
- [ ] Firefox
- [ ] Edge
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## Performance Testing

- [ ] Landing page loads in < 2 seconds
- [ ] Onboarding form responds instantly (< 100ms)
- [ ] Chat messages send instantly
- [ ] AI responses return in < 5 seconds (target: 3s)
- [ ] Profile page loads in < 1 second
- [ ] No UI lag during interactions

---

## Accessibility Testing (Nice to Have)

- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] Form labels are present
- [ ] Error messages are clear
- [ ] Color contrast is sufficient
- [ ] Alt text on images

---

## Notes Section

Use this space to track issues, observations, and feedback:

### Day 2 Notes:
[Add notes here]

### Day 3 Notes:
[Add notes here]

### Day 4 Notes:
[Add notes here]
