# SaveSmart Frontend

## Setup Instructions

### 1. Initialize Next.js Project

```bash
cd savesmart-frontend
npx create-next-app@latest . --typescript --tailwind --app
```

When prompted, choose:
- ✅ TypeScript: Yes
- ✅ ESLint: Yes
- ✅ Tailwind CSS: Yes
- ✅ `src/` directory: No
- ✅ App Router: Yes
- ✅ Import alias: Yes (@/*)

### 2. Install Additional Dependencies (if needed)

```bash
npm install @heroicons/react
npm install react-markdown
```

### 3. Set Up Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
# Will be updated with real API Gateway URL from Backend team
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel dashboard for automatic deployments.

## Project Structure

```
app/
├── page.tsx              # Landing page
├── signup/
│   └── page.tsx          # Signup form
├── onboarding/
│   └── page.tsx          # Onboarding questionnaire
├── chat/
│   └── page.tsx          # Chat interface
└── profile/
    └── page.tsx          # User profile

components/               # Reusable components
├── MessageBubble.tsx
├── ChatInput.tsx
├── SuggestedPrompts.tsx
└── SavingsPlan.tsx

lib/                      # Utilities
├── api.ts               # API client
└── types.ts             # TypeScript types
```

## Key Files to Create

### 1. Landing Page (`app/page.tsx`)
- Hero section with value proposition
- "Get Started" CTA button
- Example savings scenarios

### 2. Onboarding (`app/onboarding/page.tsx`)
- Multi-step form (3-4 steps)
- Progress indicator
- Form validation
- POST to /users endpoint

### 3. Chat Interface (`app/chat/page.tsx`)
- Message list display
- Input field with send button
- Suggested prompts
- Typing indicator
- POST to /chat endpoint

### 4. Profile Page (`app/profile/page.tsx`)
- Display user data
- Edit functionality
- PUT to /users/{userId} endpoint

## API Integration

### API Client (`lib/api.ts`)

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function createUser(userData: UserProfile) {
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return response.json();
}

export async function sendChatMessage(userId: string, message: string) {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, message }),
  });
  return response.json();
}
```

## Demo Account

Pre-configure for demo:
- Email: sarah@student.com
- Name: Sarah
- Income: $1,200/month
- Rent: $600/month
- Grocery Budget: $80/week
- Location: Parramatta, NSW 2150
- Dietary: Vegetarian

## Resources

- **Spec:** `.kiro/specs/frontend-landing-onboarding/requirements.md`
- **Spec:** `.kiro/specs/frontend-chat-interface/requirements.md`
- **Setup Guide:** `SETUP_CHECKLIST.md` (Squad A section)
- **Team Guide:** `TEAM_GUIDE.md`
