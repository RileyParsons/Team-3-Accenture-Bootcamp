# Backend: AWS Infrastructure - Requirements

## 1. Overview

Set up the complete AWS serverless backend infrastructure including DynamoDB tables, API Gateway endpoints, and Lambda functions to support the SaveSmart application.

## 2. User Stories

### 2.1 User Data Storage
**As a** backend system
**I want to** store user profile data securely in DynamoDB
**So that** the AI agent can access user context for personalized recommendations

### 2.2 API Gateway
**As a** frontend application
**I want to** communicate with backend services through a REST API
**So that** I can create users, retrieve profiles, and send chat messages

### 2.3 Lambda Functions
**As a** backend system
**I want to** process API requests with serverless Lambda functions
**So that** I can scale automatically and minimize costs

### 2.4 AI Agent Integration
**As a** Lambda function
**I want to** forward chat messages to the n8n AI agent with user context
**So that** users receive personalized financial advice

## 3. Acceptance Criteria

### 3.1 DynamoDB Tables Created
- Table: `savesmart-users`
  - Partition key: `userId` (String)
  - Status: Active
  - On-demand billing mode
- Table: `savesmart-plans`
  - Partition key: `planId` (String)
  - Sort key: `userId` (String)
  - Status: Active
  - On-demand billing mode
- Both tables accessible from Lambda functions
- Tables support read/write operations

### 3.2 API Gateway Configuration
- REST API named `savesmart-api` created
- Deployed to stage: `prod`
- Public URL available (format: https://{id}.execute-api.ap-southeast-2.amazonaws.com/prod)
- CORS enabled on all resources:
  - Allow origin: * (for hackathon)
  - Allow headers: Content-Type, Authorization
  - Allow methods: GET, POST, PUT, OPTIONS
- All endpoints return proper HTTP status codes

### 3.3 API Endpoints Operational
- POST /users - Create user profile
  - Accepts: userId, email, name, income, rent, groceryBudget, savings, hasCar, fuelType, location, dietaryPreferences, subscriptions
  - Returns: 200 with success message
  - Saves data to savesmart-users table
- GET /users/{userId} - Retrieve user profile
  - Accepts: userId in path
  - Returns: 200 with user profile data
  - Returns: 404 if user not found
- PUT /users/{userId} - Update user profile
  - Accepts: userId in path + updated fields
  - Returns: 200 with success message
  - Updates data in savesmart-users table
- POST /chat - Send message to AI agent
  - Accepts: userId, message
  - Returns: 200 with AI response (reply, savings, plan)
  - Retrieves user profile from DynamoDB
  - Forwards to n8n webhook
  - Optionally saves plan to savesmart-plans table
- GET /plans/{userId} - Retrieve saved plans
  - Accepts: userId in path
  - Returns: 200 with array of saved plans
  - Queries savesmart-plans table

### 3.4 Lambda Functions Deployed
- `savesmart-saveUser` (POST /users)
  - Runtime: Node.js 20.x
  - Timeout: 10 seconds
  - Memory: 128 MB
  - Has DynamoDB write permissions
- `savesmart-getUser` (GET /users/{userId})
  - Runtime: Node.js 20.x
  - Timeout: 10 seconds
  - Memory: 128 MB
  - Has DynamoDB read permissions
- `savesmart-updateUser` (PUT /users/{userId})
  - Runtime: Node.js 20.x
  - Timeout: 10 seconds
  - Memory: 128 MB
  - Has DynamoDB write permissions
- `savesmart-chat` (POST /chat)
  - Runtime: Node.js 20.x
  - Timeout: 60 seconds (AI agents take time)
  - Memory: 256 MB
  - Has DynamoDB read/write permissions
  - Environment variable: N8N_WEBHOOK_URL
- `savesmart-getPlans` (GET /plans/{userId})
  - Runtime: Node.js 20.x
  - Timeout: 10 seconds
  - Memory: 128 MB
  - Has DynamoDB read permissions

### 3.5 IAM Permissions Configured
- Each Lambda function has execution role
- Roles include AmazonDynamoDBFullAccess policy
- Lambda functions can read/write to DynamoDB tables
- No permission errors in CloudWatch Logs

### 3.6 Error Handling
- Lambda functions handle missing parameters
- Lambda functions handle DynamoDB errors
- Lambda functions handle n8n webhook timeouts
- Lambda functions return standardized error format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400/404/500
}
```
- All errors logged to CloudWatch

### 3.7 Logging & Monitoring
- CloudWatch Logs enabled for all Lambda functions
- Logs include:
  - Incoming request payload
  - DynamoDB operations
  - n8n webhook calls
  - Response payload
  - Error details
- Logs are searchable and filterable

## 4. Technical Requirements

### 4.1 DynamoDB Schema

**savesmart-users table:**
```json
{
  "userId": "user-abc-123",
  "email": "sarah@uni.edu.au",
  "name": "Sarah",
  "income": 1200,
  "rent": 600,
  "groceryBudget": 80,
  "savings": 500,
  "hasCar": true,
  "fuelType": "E10",
  "location": "Parramatta",
  "postcode": "2150",
  "dietaryPreferences": ["vegetarian"],
  "subscriptions": ["Netflix", "Spotify"],
  "createdAt": "2026-02-11T10:00:00Z"
}
```

**savesmart-plans table:**
```json
{
  "planId": "plan-1707649200000",
  "userId": "user-abc-123",
  "plan": {
    "goal": "Save $3000 for Japan trip",
    "timeline": "6 months",
    "monthly": 500,
    "breakdown": [...]
  },
  "createdAt": "2026-02-11T10:30:00Z"
}
```

### 4.2 Lambda Function: savesmart-chat (Critical)

This is the most important Lambda function. It orchestrates the entire chat flow:

```javascript
import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { userId, message } = body;

    // 1. Get user profile from DynamoDB
    const userResult = await client.send(new GetItemCommand({
      TableName: "savesmart-users",
      Key: { userId: { S: userId } }
    }));

    if (!userResult.Item) {
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "User not found" })
      };
    }

    const userProfile = userResult.Item;

    // 2. Send to n8n with user context
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId,
        message: message,
        userProfile: userProfile
      })
    });

    const agentResponse = await n8nResponse.json();

    // 3. (Optional) Save plan to DynamoDB
    if (agentResponse.plan) {
      await client.send(new PutItemCommand({
        TableName: "savesmart-plans",
        Item: {
          planId: { S: `plan-${Date.now()}` },
          userId: { S: userId },
          plan: { S: JSON.stringify(agentResponse.plan) },
          createdAt: { S: new Date().toISOString() }
        }
      }));
    }

    // 4. Return to frontend
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        reply: agentResponse.reply,
        savings: agentResponse.savings,
        plan: agentResponse.plan
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};
```

### 4.3 API Gateway Integration
- Each endpoint connected to corresponding Lambda function
- Integration type: Lambda Function (proxy integration)
- Lambda functions invoked synchronously
- API Gateway passes request body to Lambda

### 4.4 Performance Requirements
- API Gateway response time < 1 second (excluding AI processing)
- DynamoDB read operations < 100ms
- DynamoDB write operations < 200ms
- Lambda cold start < 3 seconds
- Lambda warm execution < 500ms

## 5. Demo Requirements

### 5.1 Demo Data
- Sarah's account pre-created in DynamoDB
- userId: demo-sarah-123
- All profile fields populated
- At least 1 saved plan in savesmart-plans table

### 5.2 Demo Flow Testing
- POST /users creates new user successfully
- GET /users/{userId} retrieves Sarah's profile
- POST /chat with demo prompts returns AI responses
- GET /plans/{userId} retrieves saved plans
- All operations complete without errors

## 6. Testing Checklist

### 6.1 Unit Testing (Manual)
- [ ] Test POST /users with valid data
- [ ] Test POST /users with missing fields
- [ ] Test GET /users/{userId} with valid userId
- [ ] Test GET /users/{userId} with invalid userId
- [ ] Test PUT /users/{userId} with valid updates
- [ ] Test POST /chat with valid message
- [ ] Test POST /chat with missing userId
- [ ] Test GET /plans/{userId} with valid userId

### 6.2 Integration Testing
- [ ] Frontend → API Gateway → Lambda → DynamoDB (write)
- [ ] Frontend → API Gateway → Lambda → DynamoDB (read)
- [ ] Frontend → API Gateway → Lambda → n8n → Lambda → Frontend
- [ ] All CORS headers present in responses
- [ ] Error responses formatted correctly

### 6.3 Load Testing (Optional)
- [ ] API handles 10 concurrent requests
- [ ] No Lambda throttling errors
- [ ] DynamoDB handles concurrent reads/writes

## 7. Out of Scope (MVP)

- JWT authentication
- Rate limiting
- API key management
- Database backups
- Multi-region deployment
- CloudFront CDN
- WAF (Web Application Firewall)
- Automated testing suite
- CI/CD pipeline

## 8. Dependencies

- AWS account with appropriate permissions
- n8n webhook URL (from AI/Agent squad)
- Frontend needs API Gateway URL

## 9. Handoff Requirements

### 9.1 To Frontend Team
- [ ] API Gateway URL shared
- [ ] API endpoint documentation provided
- [ ] Example request/response payloads documented
- [ ] Postman collection created

### 9.2 From AI/Agent Team
- [ ] n8n webhook URL received
- [ ] Webhook request format documented
- [ ] Expected response format documented

## 10. Success Metrics

- All 5 Lambda functions operational
- All 5 API endpoints return 200 status for valid requests
- DynamoDB tables accessible and writable
- POST /chat successfully forwards to n8n and returns response
- 0 permission errors in CloudWatch Logs
- API Gateway URL accessible from frontend
- Demo flow works end-to-end without errors
