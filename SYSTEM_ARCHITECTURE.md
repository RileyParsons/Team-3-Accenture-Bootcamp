# SaveSmart System Architecture

**Last Updated:** February 11, 2026
**Status:** ✅ Verified and Working

---

## Overview

SaveSmart is a serverless AI-powered savings assistant for Australian university students. The system uses AWS Lambda, DynamoDB, and n8n for AI agent orchestration.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (Next.js 14 Frontend)                        │
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Signup  │→ │  Onboarding  │→ │   Chat   │  │ Profile  │  │
│  │  /auth   │  │ (6 steps)    │  │  /chat   │  │ /profile │  │
│  └──────────┘  └──────────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    HTTPS (REST API)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       API GATEWAY                               │
│         https://lmj3rtgsbe.execute-api.ap-southeast-2          │
│                    .amazonaws.com/prod                          │
│                                                                 │
│  POST   /test_users          → Create user profile             │
│  GET    /test_users/{userId} → Get user profile                │
│  PUT    /test_users/{userId} → Update user profile             │
│  POST   /chat                → Send message to AI agent         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    AWS Lambda Functions
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      LAMBDA FUNCTIONS                           │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ savesmart-       │  │ savesmart-       │                   │
│  │ saveUser         │  │ getUser          │                   │
│  │ (JavaScript)     │  │ (Python)         │                   │
│  └──────────────────┘  └──────────────────┘                   │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ savesmart-       │  │ savesmart-       │                   │
│  │ updateUser       │  │ chat             │                   │
│  │ (Python)         │  │ (JavaScript)     │                   │
│  └──────────────────┘  └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    DynamoDB & n8n
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  DynamoDB: savesmart-users                               │  │
│  │  - Partition Key: userId (String)                        │  │
│  │  - GSI: email-index (for auth lookups)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  DynamoDB: savesmart-plans                               │  │
│  │  - Partition Key: userId (String)                        │  │
│  │  - Sort Key: planId (String)                             │  │
│  │  - GSI: userId-index                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  n8n Workflow (AI Agent)                                 │  │
│  │  - Receives user message + profile                       │  │
│  │  - Generates savings recommendations                     │  │
│  │  - Returns personalized advice                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. User Signup & Onboarding

```
User → Signup Page → Onboarding (6 steps) → API Gateway → Lambda → DynamoDB
```

**Step-by-Step:**

1. **Signup** (`/auth/signup`):
   - Captures: firstName, lastName, email, password
   - Stores in localStorage: `savesmart_user`
   - Redirects to onboarding

2. **Onboarding** (`/onboarding`):
   - **Step 1:** Welcome + Optional location (city/suburb OR postcode)
   - **Step 2:** Living situation + rent (if applicable)
   - **Step 3:** Income (amount + frequency)
   - **Step 4:** Grocery budget (weekly)
   - **Step 5:** Current savings
   - **Step 6:** Recurring costs (phone, internet, fuel, custom)

3. **Submit**:
   - Sends to: `POST /test_users`
   - Lambda validates and stores in DynamoDB
   - Redirects to `/chat`

### 2. Chat with AI Agent

```
User → Chat Interface → API Gateway → Lambda → n8n → Lambda → User
```

**Step-by-Step:**

1. User sends message in chat interface
2. Frontend calls: `POST /chat` with `{userId, message}`
3. Lambda fetches user profile from DynamoDB
4. Lambda sends to n8n webhook with user context
5. n8n AI agent generates personalized response
6. Lambda returns response to frontend
7. Chat displays AI recommendations

---

## Data Schema

### User Profile (savesmart-users table)

```json
{
  "userId": "user-email-com",
  "email": "user@email.com",
  "name": "First Last",
  "income": 1200,
  "incomeFrequency": "monthly",
  "savings": 500,
  "location": "Parramatta",
  "postcode": "2150",
  "recurringExpenses": [
    {
      "name": "Rent",
      "amount": 150,
      "frequency": "weekly",
      "isFixed": true
    },
    {
      "name": "Groceries",
      "amount": 80,
      "frequency": "weekly",
      "isFixed": false
    },
    {
      "name": "Phone Bill",
      "amount": 50,
      "frequency": "monthly",
      "isFixed": true
    }
  ],
  "createdAt": "2026-02-11T22:02:15.819Z",
  "hashedPassword": "$2b$10$...",
  "resetToken": null,
  "resetTokenExpiry": null
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | String | Yes | Unique identifier (email with @ and . replaced by -) |
| email | String | Yes | User's email address |
| name | String | Yes | User's full name (from signup) |
| income | Number | Yes | Income amount |
| incomeFrequency | String | Yes | "weekly", "fortnightly", or "monthly" |
| savings | Number | Yes | Current savings amount |
| location | String | No | City/suburb (optional, for local deals) |
| postcode | String | No | Australian postcode (optional) |
| recurringExpenses | Array | Yes | List of all recurring expenses |
| createdAt | String | Yes | ISO 8601 timestamp |
| hashedPassword | String | No | Bcrypt hash (for auth) |
| resetToken | String | No | Password reset token hash |
| resetTokenExpiry | String | No | Reset token expiration |

### Recurring Expense Object

```json
{
  "name": "Rent",
  "amount": 150,
  "frequency": "weekly",
  "isFixed": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | String | Yes | Expense name (e.g., "Rent", "Groceries") |
| amount | Number | Yes | Expense amount |
| frequency | String | Yes | "weekly", "monthly", or "yearly" |
| isFixed | Boolean | Yes | true = fixed cost, false = variable cost |

---

## API Endpoints

### Base URL
```
https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod
```

### Endpoints

#### 1. Create User Profile
```
POST /test_users
```

**Request Body:**
```json
{
  "userId": "user-email-com",
  "email": "user@email.com",
  "name": "First Last",
  "income": 1200,
  "incomeFrequency": "monthly",
  "savings": 500,
  "location": "Sydney",
  "postcode": "2000",
  "recurringExpenses": [...]
}
```

**Response:**
```json
{
  "statusCode": 200,
  "body": {
    "message": "User saved successfully",
    "userId": "user-email-com"
  }
}
```

#### 2. Get User Profile
```
GET /test_users/{userId}
```

**Response:**
```json
{
  "statusCode": 200,
  "body": {
    "userId": "user-email-com",
    "email": "user@email.com",
    "name": "First Last",
    ...
  }
}
```

**Note:** Sensitive fields (hashedPassword, resetToken) are excluded from response.

#### 3. Update User Profile
```
PUT /test_users/{userId}
```

**Request Body:**
```json
{
  "savings": 600,
  "location": "Melbourne"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "body": {
    "message": "User updated successfully",
    "user": {...}
  }
}
```

#### 4. Chat with AI Agent
```
POST /chat
```

**Request Body:**
```json
{
  "userId": "user-email-com",
  "message": "Help me save money on groceries"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "body": {
    "reply": "Based on your profile...",
    "savings": 150,
    "plan": {...}
  }
}
```

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Hooks + localStorage
- **Deployment:** Vercel (or similar)

### Backend
- **API Gateway:** AWS API Gateway (REST API)
- **Compute:** AWS Lambda
  - saveUser: Node.js 20.x (JavaScript)
  - getUser: Python 3.12
  - updateUser: Python 3.12
  - chat: Node.js 20.x (JavaScript)
- **Database:** AWS DynamoDB (On-demand billing)
- **Region:** ap-southeast-2 (Sydney)

### AI Agent
- **Platform:** n8n (self-hosted or cloud)
- **Integration:** Webhook-based
- **Purpose:** Generate personalized savings recommendations

---

## Security

### Authentication
- JWT-based authentication (planned)
- Passwords hashed with bcrypt (salt rounds: 10)
- Access tokens: 1 hour expiration
- Refresh tokens: 7 days expiration

### Data Protection
- DynamoDB encryption at rest (AWS managed keys)
- HTTPS/TLS for all API communication
- CORS enabled for frontend domain
- Sensitive fields excluded from API responses

### IAM Permissions
Each Lambda function has minimal required permissions:
- saveUser: `dynamodb:PutItem` on savesmart-users
- getUser: `dynamodb:GetItem` on savesmart-users
- updateUser: `dynamodb:UpdateItem` on savesmart-users
- chat: `dynamodb:GetItem` on savesmart-users, `dynamodb:PutItem` on savesmart-plans

---

## Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod
NEXT_PUBLIC_USE_MOCK=false
```

### Lambda Functions
```bash
# All functions
AWS_REGION=ap-southeast-2

# saveUser, getUser, updateUser
USERS_TABLE_NAME=savesmart-users

# chat
USERS_TABLE_NAME=savesmart-users
PLANS_TABLE_NAME=savesmart-plans
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/...
```

---

## Deployment

### Frontend
```bash
cd savesmart-frontend
npm install
npm run build
npm run start
```

### Backend
Lambda functions are deployed via AWS Console:
1. Build TypeScript: `npm run build`
2. Package each function with dependencies
3. Upload to Lambda
4. Configure environment variables
5. Deploy API Gateway to `prod` stage

See `savesmart-backend/DEPLOYMENT.md` for detailed instructions.

---

## Monitoring & Logging

### CloudWatch Logs
Each Lambda function logs to CloudWatch:
- Request/response details
- Errors and stack traces
- DynamoDB operations
- n8n webhook calls

### Metrics
- API Gateway: Request count, latency, errors
- Lambda: Invocations, duration, errors
- DynamoDB: Read/write capacity, throttles

---

## Testing

### Manual Testing
See `TESTING_INSTRUCTIONS.md` for complete testing guide.

### API Testing
```bash
# Test user creation
curl -X POST https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod/test_users \
  -H "Content-Type: application/json" \
  -d @test-user.json

# Test user retrieval
curl https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod/test_users/test-123

# Test user update
curl -X PUT https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod/test_users/test-123 \
  -H "Content-Type: application/json" \
  -d '{"savings": 600}'
```

---

## Known Limitations

1. **Location:** Currently free-text input (no validation or autocomplete)
2. **Authentication:** Not yet implemented (planned)
3. **n8n Integration:** Webhook URL must be manually configured
4. **Error Handling:** Basic error messages (can be improved)
5. **Validation:** Minimal client-side validation

---

## Future Enhancements

1. **Authentication:** JWT-based auth with login/logout
2. **Location:** Google Maps autocomplete for location/postcode
3. **Profile Page:** View and edit user profile
4. **Savings Plans:** View saved plans from AI agent
5. **Analytics:** Track savings progress over time
6. **Notifications:** Email/SMS for savings tips
7. **Mobile App:** React Native mobile application

---

## Support & Documentation

- **Frontend Code:** `savesmart-frontend/`
- **Backend Code:** `savesmart-backend/`
- **API Documentation:** `savesmart-backend/README.md`
- **Testing Guide:** `TESTING_INSTRUCTIONS.md`
- **Onboarding Data Mapping:** `savesmart-frontend/src/app/onboarding/ONBOARDING_DATA_MAPPING.md`

---

## Version History

- **v1.0** (Feb 11, 2026): Initial working version with user onboarding and data capture
- Schema updated to use `recurringExpenses` array
- Location fields added (optional)
- All 4 Lambda functions verified and working
