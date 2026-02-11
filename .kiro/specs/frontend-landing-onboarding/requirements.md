# Frontend: Landing Page & Onboarding - Requirements

## 1. Overview

Create the user-facing entry point for SaveSmart, including the landing page and multi-step onboarding questionnaire that collects financial profile data from Australian university students.

## 2. User Stories

### 2.1 Landing Page
**As a** prospective user
**I want to** understand what SaveSmart does and how it can help me save money
**So that** I can decide if I want to sign up

### 2.2 Signup Flow
**As a** new user
**I want to** quickly create an account with minimal friction
**So that** I can start using the savings agent

### 2.3 Onboarding Questionnaire
**As a** new user
**I want to** provide my financial information through a guided questionnaire
**So that** the AI agent can give me personalized savings recommendations

### 2.4 Profile Management
**As a** returning user
**I want to** view and update my financial profile
**So that** I can keep my information current for accurate recommendations

## 3. Acceptance Criteria

### 3.1 Landing Page Display
- Landing page displays hero section with value proposition
- "Get Started" CTA button is prominently displayed
- Example savings scenarios are shown ($2,760/year per student)
- Page is responsive on mobile and desktop
- Navigation includes links to signup/login

### 3.2 Signup Functionality
- User can create account with email and name
- Form validates email format
- User receives confirmation after successful signup
- User is redirected to onboarding after signup
- Signup takes less than 1 minute

### 3.3 Onboarding Questionnaire Completion
- Multi-step form with 3-4 steps and progress indicator
- Collects all required fields:
  - Living situation (out of home: yes/no)
  - Monthly income ($)
  - Monthly rent ($)
  - Weekly grocery budget ($)
  - Current savings ($)
  - Car ownership (yes/no)
  - Fuel type (if has car: E10, U91, U95, U98, Diesel)
  - Location (suburb or postcode)
  - Dietary preferences (vegetarian, vegan, halal, kosher, none)
  - Active subscriptions (Netflix, Spotify, Disney+, etc.)
- Form validates numeric inputs
- User can navigate back/forward between steps
- Data is temporarily saved to localStorage during completion
- On submit, data is sent to backend API (POST /users)
- User is redirected to chat interface after completion
- Onboarding takes 2-3 minutes to complete

### 3.4 Profile Page Display
- Displays all onboarding answers in editable format
- User can update any field
- Changes are saved to backend (PUT /users/{userId})
- Shows saved meal plans and fuel recommendations
- Profile updates are confirmed with success message

### 3.5 Error Handling
- Form displays validation errors inline
- API errors are shown with user-friendly messages
- Loading states are displayed during API calls
- User can retry failed operations

## 4. Technical Requirements

### 4.1 Framework & Styling
- Built with Next.js 14+ (App Router)
- TypeScript for type safety
- Tailwind CSS for styling
- Responsive design (mobile-first)

### 4.2 Pages Structure
```
app/
├── page.tsx              # Landing page
├── signup/page.tsx       # Signup form
├── onboarding/page.tsx   # Multi-step questionnaire
├── profile/page.tsx      # User profile & settings
└── chat/page.tsx         # Chat interface (separate spec)
```

### 4.3 API Integration
- Environment variable: `NEXT_PUBLIC_API_URL`
- POST /users - Create user profile
- GET /users/{userId} - Retrieve user profile
- PUT /users/{userId} - Update user profile
- Store userId in localStorage after signup

### 4.4 Data Model
```typescript
interface UserProfile {
  userId: string;
  email: string;
  name: string;
  income: number;
  rent: number;
  groceryBudget: number;
  savings: number;
  hasCar: boolean;
  fuelType?: 'E10' | 'U91' | 'U95' | 'U98' | 'Diesel';
  location: string;
  postcode?: string;
  dietaryPreferences: string[];
  subscriptions: string[];
  createdAt: string;
}
```

### 4.5 Performance
- Landing page loads in < 2 seconds
- Form interactions feel instant (< 100ms)
- API calls complete in < 3 seconds
- Images are optimized (WebP format)

## 5. Demo Requirements

### 5.1 Demo Account
- Pre-configured demo account: sarah@student.com
- Sarah's profile data:
  - Name: Sarah
  - Income: $1,200/month
  - Rent: $600/month
  - Grocery budget: $80/week
  - Savings: $500
  - Has car: Yes, E10 fuel
  - Location: Parramatta, 2150
  - Dietary: Vegetarian
  - Subscriptions: Netflix, Spotify

### 5.2 Demo Flow
- Landing page → Signup → Onboarding → Chat
- Total time: < 2 minutes for demo
- No crashes or errors during demo
- Smooth transitions between pages

## 6. Out of Scope (MVP)

- Password reset functionality
- Email verification
- Social login (Google, Facebook)
- Multi-language support
- Advanced profile analytics
- Profile photo upload
- Two-factor authentication

## 7. Dependencies

- Backend API Gateway URL (from Backend squad)
- DynamoDB tables created (savesmart-users)
- CORS enabled on API Gateway

## 8. Success Metrics

- User can complete signup in < 1 minute
- User can complete onboarding in 2-3 minutes
- 0 critical bugs during demo
- Form validation catches all invalid inputs
- Profile updates save successfully 100% of the time
