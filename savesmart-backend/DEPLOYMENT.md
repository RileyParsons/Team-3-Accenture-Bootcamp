# Lambda Functions Deployment Guide

## Structure

```
savesmart-backend/
├── src/
│   ├── saveUser/       # POST /users - Create user profile
│   ├── getUser/        # GET /users/{userId} - Retrieve user profile
│   ├── updateUser/     # PUT /users/{userId} - Update user profile
│   ├── chat/           # POST /chat - Send message to AI agent
│   └── getPlans/       # GET /plans/{userId} - Retrieve saved plans
├── package.json
└── tsconfig.json
```

## Local Setup

1. Install dependencies:
```bash
cd savesmart-backend
npm install
```

2. Build TypeScript:
```bash
npx tsc
```

This will create a `dist/` folder with compiled JavaScript.

## Lambda Functions Overview

### 1. saveUser
- **Endpoint**: POST /users
- **Purpose**: Create new user profile
- **Timeout**: 10 seconds
- **Memory**: 128 MB
- **Environment Variables**:
  - `USERS_TABLE_NAME` (default: savesmart-users)
  - `AWS_REGION` (default: ap-southeast-2)

### 2. getUser
- **Endpoint**: GET /users/{userId}
- **Purpose**: Retrieve user profile
- **Timeout**: 10 seconds
- **Memory**: 128 MB
- **Environment Variables**:
  - `USERS_TABLE_NAME` (default: savesmart-users)
  - `AWS_REGION` (default: ap-southeast-2)

### 3. updateUser
- **Endpoint**: PUT /users/{userId}
- **Purpose**: Update user profile
- **Timeout**: 10 seconds
- **Memory**: 128 MB
- **Environment Variables**:
  - `USERS_TABLE_NAME` (default: savesmart-users)
  - `AWS_REGION` (default: ap-southeast-2)

### 4. chat (CRITICAL)
- **Endpoint**: POST /chat
- **Purpose**: Send message to AI agent with user context
- **Timeout**: 60 seconds
- **Memory**: 256 MB
- **Environment Variables**:
  - `USERS_TABLE_NAME` (default: savesmart-users)
  - `PLANS_TABLE_NAME` (default: savesmart-plans)
  - `N8N_WEBHOOK_URL` (REQUIRED - get from AI/Agent team)
  - `AWS_REGION` (default: ap-southeast-2)

### 5. getPlans
- **Endpoint**: GET /plans/{userId}
- **Purpose**: Retrieve saved plans for user
- **Timeout**: 10 seconds
- **Memory**: 128 MB
- **Environment Variables**:
  - `PLANS_TABLE_NAME` (default: savesmart-plans)
  - `AWS_REGION` (default: ap-southeast-2)

## Deployment Steps

### Step 1: Build the Code

```bash
cd savesmart-backend
npm install
npx tsc
```

### Step 2: Package Each Function

For each function, create a deployment package:

```bash
# saveUser
cd dist/saveUser
npm init -y
npm install @aws-sdk/client-dynamodb @aws-sdk/util-dynamodb
zip -r ../../saveUser.zip .
cd ../..

# getUser
cd dist/getUser
npm init -y
npm install @aws-sdk/client-dynamodb @aws-sdk/util-dynamodb
zip -r ../../getUser.zip .
cd ../..

# updateUser
cd dist/updateUser
npm init -y
npm install @aws-sdk/client-dynamodb
zip -r ../../updateUser.zip .
cd ../..

# chat
cd dist/chat
npm init -y
npm install @aws-sdk/client-dynamodb @aws-sdk/util-dynamodb
zip -r ../../chat.zip .
cd ../..

# getPlans
cd dist/getPlans
npm init -y
npm install @aws-sdk/client-dynamodb @aws-sdk/util-dynamodb
zip -r ../../getPlans.zip .
cd ../..
```

### Step 3: Upload to AWS Lambda

Once your team member has created the Lambda functions in AWS:

1. Go to AWS Lambda Console
2. Select the function (e.g., `savesmart-saveUser`)
3. Click "Upload from" → ".zip file"
4. Upload the corresponding zip file
5. Click "Save"
6. Repeat for all 5 functions

### Step 4: Configure Environment Variables

For the `chat` function specifically:
1. Go to Configuration → Environment variables
2. Add `N8N_WEBHOOK_URL` with the value from AI/Agent team

## IAM Permissions Required

Each Lambda function needs:
- `AWSLambdaBasicExecutionRole` (CloudWatch Logs)
- DynamoDB permissions:
  - saveUser: `dynamodb:PutItem` on savesmart-users
  - getUser: `dynamodb:GetItem` on savesmart-users
  - updateUser: `dynamodb:UpdateItem` on savesmart-users
  - chat: `dynamodb:GetItem` on savesmart-users, `dynamodb:PutItem` on savesmart-plans
  - getPlans: `dynamodb:Query`, `dynamodb:Scan` on savesmart-plans

## Testing

### Test Events

Create test events in AWS Lambda Console:

**saveUser test event:**
```json
{
  "body": "{\"userId\":\"test-123\",\"email\":\"test@example.com\",\"name\":\"Test User\",\"income\":1200,\"rent\":600,\"groceryBudget\":80,\"savings\":500,\"hasCar\":true,\"fuelType\":\"E10\",\"location\":\"Parramatta\",\"postcode\":\"2150\",\"dietaryPreferences\":[\"vegetarian\"],\"subscriptions\":[\"Netflix\"]}"
}
```

**getUser test event:**
```json
{
  "pathParameters": {
    "userId": "test-123"
  }
}
```

**chat test event:**
```json
{
  "body": "{\"userId\":\"test-123\",\"message\":\"Help me save money\"}"
}
```

## Notes

- All functions include CORS headers (`Access-Control-Allow-Origin: *`)
- All functions return standardized error format
- chat function has 55-second timeout for n8n webhook
- getPlans function falls back to scan if GSI doesn't exist
- Functions use AWS SDK v3 for better performance
