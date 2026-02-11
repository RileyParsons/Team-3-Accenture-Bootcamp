# Frontend: Chat Interface - Requirements

## 1. Overview

Create an intuitive chat interface where users can interact with the SaveSmart AI agent to get personalized financial advice, meal plans, fuel recommendations, and savings strategies.

## 2. User Stories

### 2.1 Chat Interaction
**As a** user
**I want to** ask questions about my finances in natural language
**So that** I can get personalized savings advice

### 2.2 Suggested Prompts
**As a** new user
**I want to** see example questions I can ask
**So that** I know how to interact with the agent

### 2.3 Response Display
**As a** user
**I want to** see AI responses formatted clearly with dollar amounts and recommendations
**So that** I can easily understand and act on the advice

### 2.4 Savings Plan Visualization
**As a** user
**I want to** see my personalized savings plan with breakdowns
**So that** I can track my progress toward financial goals

## 3. Acceptance Criteria

### 3.1 Chat Interface Display
- Chat page displays message history area
- Text input field at bottom (like ChatGPT)
- Send button next to input field
- Messages are displayed in conversation format:
  - User messages: right-aligned, blue background
  - AI messages: left-aligned, gray background
- Page is responsive on mobile and desktop
- Auto-scrolls to latest message

### 3.2 Suggested Prompts Display
- On page load, shows 3 suggested prompts:
  - "I want to save $3,000 in 6 months for a Japan trip"
  - "Help me save money on groceries"
  - "Where can I find cheap fuel near me?"
- Prompts are clickable and populate input field
- Prompts disappear after first message sent

### 3.3 Message Sending
- User can type message in input field
- User can send message by clicking button or pressing Enter
- Input field clears after sending
- Message appears immediately in chat
- Loading indicator shows while waiting for AI response
- Typing indicator displays during AI processing

### 3.4 AI Response Display
- AI responses display with proper formatting:
  - Markdown support (bold, italic, lists)
  - Dollar amounts highlighted
  - Emojis for visual appeal (🛒, ⛽, 💰, 📊)
  - Line breaks preserved
- Responses include specific, actionable recommendations
- Responses reference user's profile data (income, location, etc.)

### 3.5 Savings Plan Display
- When AI provides savings plan, display structured breakdown:
  - Monthly savings target
  - Breakdown by category (Grocery, Fuel, Bills, etc.)
  - Dollar amount for each category
  - Total monthly savings
  - Progress toward goal (if applicable)
- Plan is visually distinct from regular messages
- Plan can be saved to profile

### 3.6 Error Handling
- Network errors show user-friendly message
- API timeouts (>30s) show retry option
- Invalid responses are handled gracefully
- User can retry failed messages
- Error messages don't crash the interface

### 3.7 Loading States
- Typing indicator shows "SaveSmart is thinking..."
- Loading spinner during API calls
- Disabled send button while processing
- User cannot send multiple messages simultaneously

## 4. Technical Requirements

### 4.1 Framework & Styling
- Built with Next.js 14+ (App Router)
- TypeScript for type safety
- Tailwind CSS for styling
- React hooks for state management

### 4.2 Component Structure
```
app/chat/
├── page.tsx                    # Main chat page
├── components/
│   ├── MessageList.tsx         # Message history display
│   ├── MessageBubble.tsx       # Individual message
│   ├── ChatInput.tsx           # Input field + send button
│   ├── SuggestedPrompts.tsx    # Example prompts
│   ├── TypingIndicator.tsx     # Loading animation
│   └── SavingsPlan.tsx         # Savings plan display
```

### 4.3 API Integration
- POST /chat - Send message to AI agent
- Request payload:
```typescript
{
  userId: string;
  message: string;
}
```
- Response payload:
```typescript
{
  reply: string;
  savings?: {
    monthly: number;
    breakdown: {
      category: string;
      amount: number;
      description: string;
    }[];
  };
  plan?: {
    goal: string;
    timeline: string;
    required: number;
    recommendations: string[];
  };
}
```

### 4.4 State Management
- Message history stored in React state
- userId retrieved from localStorage
- Messages persist during session (not across page reloads for MVP)
- Loading state managed per message

### 4.5 Performance
- Messages render instantly (< 100ms)
- API responses in < 5 seconds (target: 3 seconds)
- Smooth scrolling animations
- No UI lag during typing

## 5. Demo Requirements

### 5.1 Demo Prompts
Test these 3 prompts with Sarah's account:
1. "I want to save $3,000 in 6 months for a Japan trip"
   - Expected: Savings plan with $500/month target, breakdown by category
2. "Help me save money on groceries"
   - Expected: Meal plan with vegetarian options, Coles/Woolworths specials
3. "Where can I find cheap fuel near me?"
   - Expected: Cheapest E10 stations in Parramatta with prices

### 5.2 Demo Flow
- User logs in → Chat page
- Sees suggested prompts
- Clicks first prompt
- AI responds in < 5 seconds
- Savings plan displays clearly
- No errors or crashes

## 6. Example AI Response Format

```
To save $3,000 in 6 months, you need $500/month.

I found $300/month in savings opportunities:

🛒 Grocery savings: $120/month
   - Meal planning with Coles specials
   - Focus on vegetarian options

⛽ Fuel optimization: $60/month
   - Fill up at Metro Petroleum Parramatta (E10)
   - Tuesdays are cheapest

📺 Subscription audit: $50/month
   - Cancel unused Netflix

☕ Coffee savings: $70/month
   - Brew at home instead of 3 café visits/week

Total: $300/month → You'll reach your goal! 🎉
```

## 7. Out of Scope (MVP)

- Conversation history persistence (across sessions)
- Message editing or deletion
- Voice input
- File attachments
- Multi-user conversations
- Message search
- Export conversation as PDF
- Real-time typing indicators (WebSocket)

## 8. Dependencies

- Backend API Gateway URL (from Backend squad)
- n8n webhook operational (from AI/Agent squad)
- User profile data in DynamoDB
- At least 1 AI agent working (Grocery preferred)

## 9. Success Metrics

- User can send message and receive response
- Response time < 5 seconds (target: 3 seconds)
- 0 critical bugs during demo
- AI responses are helpful and actionable
- Savings plan displays correctly
- Demo prompts work 100% of the time
