# Design Document: Backend Chat n8n Integration

## Overview

This design document describes the architecture and implementation approach for the SaveSmart backend chat handler Lambda function. The system enables users to interact with an AI-powered financial advisor through a chat interface, with automatic persistence of generated financial plans to DynamoDB.

The chat handler acts as an orchestration layer between the frontend, DynamoDB user storage, and the n8n AI agent service. It retrieves user context, forwards chat messages to the AI agent, saves generated plans, and returns responses to the frontend with comprehensive error handling and timeout protection.

The existing implementation at `savesmart-backend/src/chat/chat.ts` already contains the core functionality. This design formalizes the architecture, adds deployment automation, and ensures proper testing coverage.

## Architecture

### System Components

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Frontend  │────────▶│  Chat Lambda     │────────▶│  DynamoDB   │
│             │         │  (API Gateway)   │         │  (Users)    │
└─────────────┘         └──────────────────┘         └─────────────┘
                                │
                                │ HTTP POST
                                │ (55s timeout)
                                ▼
                        ┌──────────────────┐
                        │  n8n AI Agent    │
                        │  (Webhook)       │
                        └──────────────────┘
                                │
                                │ Plan returned
                                ▼
                        ┌──────────────────┐
                        │  DynamoDB        │
                        │  (Plans)         │
                        └──────────────────┘
```

### Request Flow

1. **Request Reception**: API Gateway receives POST request with userId and message
2. **User Context Retrieval**: Lambda fetches user profile from savesmart-users table
3. **Data Sanitization**: Remove sensitive fields (hashedPassword, resetToken, resetTokenExpiry)
4. **AI Agent Communication**: Send message + user context to n8n webhook with 55s timeout
5. **Plan Persistence**: If response contains a plan, save to savesmart-plans table
6. **Response Return**: Return AI response to frontend with CORS headers

### Error Handling Strategy

The system implements defensive error handling at each stage:

- **Validation Errors (400)**: Missing or invalid request data
- **Not Found Errors (404)**: User profile doesn't exist
- **Configuration Errors (500)**: Missing environment variables
- **External Service Errors (502)**: n8n webhook failures or timeouts
- **Unexpected Errors (500)**: Catch-all for unhandled exceptions

All errors are logged to CloudWatch and return structured error responses with error codes for frontend handling.

### Timeout Protection

The Lambda function has a 60-second timeout configured in AWS. The n8n webhook call uses a 55-second timeout to ensure the Lambda can properly handle timeouts and return error responses before AWS terminates the function. This is implemented using AbortController to cancel in-flight requests.

## Components and Interfaces

### Lambda Handler

**Function Signature**:
```typescript
handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>
```

**Responsibilities**:
- Parse and validate incoming requests
- Orchestrate the request flow
- Handle errors and return appropriate responses

### Request/Response Types

**Request Body**:
```typescript
{
  userId: string;      // User identifier
  message: string;     // Chat message from user
}
```

**Success Response (200)**:
```typescript
{
  reply: string;       // AI agent's text response
  savings?: number;    // Optional savings amount
  plan?: {             // Optional financial plan
    goal: string;
    timeline: string;
    monthly: number;
    breakdown: Array<{
      category: string;
      amount: number;
      tip: string;
    }>;
  };
}
```

**Error Response (4xx/5xx)**:
```typescript
{
  error: string;       // Human-readable error message
  code: string;        // Machine-readable error code
  statusCode: number;  // HTTP status code
}
```

### DynamoDB Integration

**User Profile Retrieval**:
- Table: `savesmart-users` (configurable via USERS_TABLE_NAME)
- Key: `userId` (String)
- Operation: GetItemCommand
- Sanitization: Remove hashedPassword, resetToken, resetTokenExpiry

**Plan Persistence**:
- Table: `savesmart-plans` (configurable via PLANS_TABLE_NAME)
- Key: `planId` (String, format: "plan-{timestamp}")
- Attributes: planId, userId, plan, createdAt
- Operation: PutItemCommand
- Error Handling: Log failures but don't fail the request

### n8n Webhook Integration

**Endpoint**: Configured via N8N_WEBHOOK_URL environment variable

**Request Format**:
```typescript
{
  userId: string;
  message: string;
  userProfile: object;  // Sanitized user profile
}
```

**Response Format**:
```typescript
{
  reply: string;
  savings?: number;
  plan?: {
    goal: string;
    timeline: string;
    monthly: number;
    breakdown: Array<{
      category: string;
      amount: number;
      tip: string;
    }>;
  };
}
```

**Timeout Handling**:
- 55-second timeout using AbortController
- Cleanup timeout on success or failure
- Return 502 error on timeout

### Helper Functions

**createResponse**:
```typescript
createResponse(statusCode: number, body: object): APIGatewayProxyResult
```
Creates standardized API Gateway responses with CORS headers.

**createErrorResponse**:
```typescript
createErrorResponse(statusCode: number, error: string, code: string): APIGatewayProxyResult
```
Creates standardized error responses with error codes.

## Data Models

### User Profile (Input)

Retrieved from DynamoDB and sanitized before sending to n8n:

```typescript
interface UserProfile {
  userId: string;
  email: string;
  name: string;
  income?: number;
  expenses?: number;
  savingsGoal?: number;
  // ... other fields except:
  // - hashedPassword (removed)
  // - resetToken (removed)
  // - resetTokenExpiry (removed)
}
```

### Financial Plan (Output)

Generated by n8n agent and saved to DynamoDB:

```typescript
interface FinancialPlan {
  goal: string;          // Savings goal description
  timeline: string;      // Time to achieve goal
  monthly: number;       // Monthly savings amount
  breakdown: Array<{
    category: string;    // Expense category
    amount: number;      // Amount to save in category
    tip: string;         // Savings tip for category
  }>;
}
```

### Stored Plan Record

Persisted to savesmart-plans table:

```typescript
interface StoredPlan {
  planId: string;        // Format: "plan-{timestamp}"
  userId: string;        // User who owns the plan
  plan: FinancialPlan;   // The financial plan object
  createdAt: string;     // ISO 8601 timestamp
}
```

### Environment Configuration

```typescript
interface EnvironmentConfig {
  N8N_WEBHOOK_URL: string;           // Required: n8n webhook endpoint
  USERS_TABLE_NAME?: string;         // Default: "savesmart-users"
  PLANS_TABLE_NAME?: string;         // Default: "savesmart-plans"
  AWS_REGION?: string;               // Default: "ap-southeast-2"
}
```

## Deployment Architecture

### Build Process

1. **TypeScript Compilation**: Compile src/ to dist/ using tsc
2. **Package Initialization**: Create package.json in dist/chat with type="commonjs"
3. **Dependency Installation**: Install AWS SDK packages in dist/chat
4. **Archive Creation**: Zip dist/chat contents into chat.zip
5. **Upload**: Deploy chat.zip to AWS Lambda

### Deployment Scripts

**Bash Script** (`create-chat-deployment.sh`):
- Checks for dist directory
- Navigates to dist/chat
- Initializes package.json with commonjs type
- Installs dependencies
- Creates chat.zip using PowerShell Compress-Archive
- Places zip in project root

**PowerShell Script** (`create-chat-deployment.ps1`):
- Same functionality as bash script
- Native Windows PowerShell implementation
- Uses Compress-Archive cmdlet

### Lambda Configuration

**Runtime**: Node.js 20.x
**Handler**: chat.handler
**Timeout**: 60 seconds
**Memory**: 256 MB
**Architecture**: x86_64

**Environment Variables**:
- `N8N_WEBHOOK_URL`: n8n webhook endpoint (required)
- `USERS_TABLE_NAME`: DynamoDB users table (default: savesmart-users)
- `PLANS_TABLE_NAME`: DynamoDB plans table (default: savesmart-plans)
- `AWS_REGION`: AWS region (default: ap-southeast-2)

**IAM Permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "dynamodb:GetItem",
      "Resource": "arn:aws:dynamodb:*:*:table/savesmart-users"
    },
    {
      "Effect": "Allow",
      "Action": "dynamodb:PutItem",
      "Resource": "arn:aws:dynamodb:*:*:table/savesmart-plans"
    }
  ]
}
```

### API Gateway Integration

**Method**: POST
**Path**: /chat
**Integration Type**: Lambda Proxy
**CORS**: Enabled with Access-Control-Allow-Origin: *

