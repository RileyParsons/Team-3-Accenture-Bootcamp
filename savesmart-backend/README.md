# SaveSmart Backend (AWS)

## AWS Infrastructure Setup

### 1. DynamoDB Tables

#### Create savesmart-users table
```bash
# Via AWS Console:
# 1. Navigate to DynamoDB
# 2. Click "Create table"
# 3. Table name: savesmart-users
# 4. Partition key: userId (String)
# 5. Leave other settings as default
# 6. Click "Create table"
```

#### Create savesmart-plans table
```bash
# Via AWS Console:
# 1. Navigate to DynamoDB
# 2. Click "Create table"
# 3. Table name: savesmart-plans
# 4. Partition key: planId (String)
# 5. Sort key: userId (String)
# 6. Leave other settings as default
# 7. Click "Create table"
```

### 2. API Gateway

```bash
# Via AWS Console:
# 1. Navigate to API Gateway
# 2. Click "Create API"
# 3. Choose "REST API" → "Build"
# 4. API name: savesmart-api
# 5. Click "Create API"
```

#### Create Resources and Methods

Create these endpoints:
- POST /users
- GET /users/{userId}
- PUT /users/{userId}
- POST /chat
- GET /plans/{userId}

For each endpoint:
1. Create Resource (if needed)
2. Create Method
3. Integration type: Lambda Function
4. Select corresponding Lambda function
5. Enable CORS

#### Deploy API
1. Click "Deploy API"
2. Stage name: prod
3. Copy the Invoke URL
4. Share with Frontend team

### 3. Lambda Functions

Create 5 Lambda functions in AWS Console:

#### Function 1: savesmart-saveUser
- Runtime: Node.js 20.x
- Timeout: 10 seconds
- Memory: 128 MB
- Handler: index.handler

#### Function 2: savesmart-getUser
- Runtime: Node.js 20.x
- Timeout: 10 seconds
- Memory: 128 MB
- Handler: index.handler

#### Function 3: savesmart-updateUser
- Runtime: Node.js 20.x
- Timeout: 10 seconds
- Memory: 128 MB
- Handler: index.handler

#### Function 4: savesmart-chat (MOST IMPORTANT)
- Runtime: Node.js 20.x
- Timeout: 60 seconds
- Memory: 256 MB
- Handler: index.handler
- Environment variable: N8N_WEBHOOK_URL (get from AI/Agent team)

#### Function 5: savesmart-getPlans
- Runtime: Node.js 20.x
- Timeout: 10 seconds
- Memory: 128 MB
- Handler: index.handler

### 4. IAM Permissions

For each Lambda function:
1. Go to Configuration → Permissions
2. Click the role name (opens IAM)
3. Click "Add permissions" → "Attach policies"
4. Search for `AmazonDynamoDBFullAccess`
5. Attach the policy

## Lambda Function Code

### saveUser Lambda

```javascript
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const params = {
      TableName: "savesmart-users",
      Item: {
        userId: { S: body.userId },
        email: { S: body.email },
        name: { S: body.name },
        income: { N: String(body.income) },
        rent: { N: String(body.rent) },
        groceryBudget: { N: String(body.groceryBudget) },
        savings: { N: String(body.savings || 0) },
        hasCar: { BOOL: body.hasCar },
        fuelType: { S: body.fuelType || "" },
        location: { S: body.location },
        postcode: { S: body.postcode || "" },
        dietaryPreferences: { S: JSON.stringify(body.dietaryPreferences || []) },
        subscriptions: { S: JSON.stringify(body.subscriptions || []) },
        createdAt: { S: new Date().toISOString() }
      }
    };

    await client.send(new PutItemCommand(params));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "User saved successfully" })
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

### chat Lambda (CRITICAL)

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

## Testing

### Postman Collection

Create a collection with these requests:

#### 1. POST /users
```json
{
  "userId": "test-user-123",
  "email": "test@example.com",
  "name": "Test User",
  "income": 1200,
  "rent": 600,
  "groceryBudget": 80,
  "savings": 500,
  "hasCar": true,
  "fuelType": "E10",
  "location": "Parramatta",
  "postcode": "2150",
  "dietaryPreferences": ["vegetarian"],
  "subscriptions": ["Netflix", "Spotify"]
}
```

#### 2. GET /users/{userId}
No body required

#### 3. POST /chat
```json
{
  "userId": "test-user-123",
  "message": "Help me save money on groceries"
}
```

## Handoffs

### To Frontend Team
- [ ] API Gateway URL
- [ ] Postman collection
- [ ] API documentation

### From AI/Agent Team
- [ ] n8n webhook URL
- [ ] Webhook request format
- [ ] Expected response format

## Resources

- **Spec:** `.kiro/specs/backend-aws-infrastructure/requirements.md`
- **Setup Guide:** `SETUP_CHECKLIST.md` (Squad B section)
- **Team Guide:** `TEAM_GUIDE.md`
- **Architecture:** `ARCHITECTURE.md`
