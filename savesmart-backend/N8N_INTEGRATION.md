# n8n AI Agent Integration

## Webhook URL

The n8n AI agent webhook is hosted at:

```
https://henrykb.app.n8n.cloud/webhook/02e3f00d-8a1f-4dfa-b772-eef5e1f68b08
```

This URL must be set as the `N8N_WEBHOOK_URL` environment variable in the **savesmart-chat** Lambda function.

---

## Request Format

The chat Lambda function sends this payload to the n8n webhook:

```json
{
  "userId": "demo-sarah-123",
  "message": "Help me save money on groceries",
  "userProfile": {
    "userId": "demo-sarah-123",
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
}
```

### Request Fields

| Field | Type | Description |
|-------|------|-------------|
| userId | String | Unique user identifier |
| message | String | User's chat message/question |
| userProfile | Object | Complete user profile from DynamoDB |

---

## Expected Response Format

The n8n webhook should return a JSON response with this structure:

```json
{
  "reply": "Based on your vegetarian diet and $80 weekly grocery budget, here are some tips...",
  "savings": 150,
  "plan": {
    "goal": "Save $500 per month",
    "timeline": "3 months",
    "monthly": 500,
    "breakdown": [
      {
        "category": "Groceries",
        "amount": 150,
        "tip": "Shop at ALDI instead of Coles for 30% savings on produce"
      },
      {
        "category": "Transport",
        "amount": 200,
        "tip": "Use Opal card off-peak for 30% discount on public transport"
      },
      {
        "category": "Subscriptions",
        "amount": 150,
        "tip": "Cancel unused Netflix subscription, use free alternatives"
      }
    ]
  }
}
```

### Response Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reply | String | Yes | AI's conversational response to the user |
| savings | Number | No | Estimated monthly savings amount in AUD |
| plan | Object | No | Detailed savings plan (if applicable) |
| plan.goal | String | Yes* | Description of the savings goal |
| plan.timeline | String | Yes* | Time to achieve the goal |
| plan.monthly | Number | Yes* | Monthly savings target |
| plan.breakdown | Array | Yes* | Category-wise breakdown of savings |

*Required if `plan` object is present

---

## Integration Flow

```
Frontend
   ↓ POST /chat {userId, message}
   ↓
API Gateway
   ↓
chat Lambda
   ↓ 1. Fetch user profile from DynamoDB
   ↓ 2. Send {userId, message, userProfile} to n8n
   ↓
n8n AI Agent (https://henrykb.app.n8n.cloud/webhook/...)
   ↓ Process with AI
   ↓ Return {reply, savings, plan}
   ↓
chat Lambda
   ↓ 3. Save plan to DynamoDB (if present)
   ↓ 4. Return response to frontend
   ↓
Frontend displays AI response
```

---

## Testing the Webhook

You can test the n8n webhook directly using curl:

```bash
curl -X POST https://henrykb.app.n8n.cloud/webhook/02e3f00d-8a1f-4dfa-b772-eef5e1f68b08 \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-123",
    "message": "How can I save money?",
    "userProfile": {
      "userId": "test-123",
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
  }'
```

Expected response should include `reply` field at minimum.

---

## Error Handling

The chat Lambda handles these n8n webhook scenarios:

### 1. Webhook Timeout (>55 seconds)
- Lambda returns 502 error
- Error code: `AI_AGENT_ERROR`
- Message: "AI agent timeout"

### 2. Webhook Returns Non-200 Status
- Lambda returns 502 error
- Error code: `AI_AGENT_ERROR`
- Message: "AI agent unavailable"

### 3. Webhook Unreachable
- Lambda returns 502 error
- Error code: `AI_AGENT_ERROR`
- Message: "AI agent unavailable"

### 4. Invalid Response Format
- Lambda returns 500 error
- Error code: `INTERNAL_ERROR`
- Logs the parsing error

---

## Configuration in AWS Lambda

To set the webhook URL in the chat Lambda function:

### Via AWS Console:
1. Go to Lambda → Functions → savesmart-chat
2. Configuration → Environment variables
3. Click "Edit"
4. Add key: `N8N_WEBHOOK_URL`
5. Add value: `https://henrykb.app.n8n.cloud/webhook/02e3f00d-8a1f-4dfa-b772-eef5e1f68b08`
6. Click "Save"

### Via AWS CLI:
```bash
aws lambda update-function-configuration \
  --function-name savesmart-chat \
  --environment Variables={N8N_WEBHOOK_URL=https://henrykb.app.n8n.cloud/webhook/02e3f00d-8a1f-4dfa-b772-eef5e1f68b08} \
  --region ap-southeast-2
```

---

## Notes

- The webhook URL is specific to this hackathon project
- Timeout is set to 55 seconds (Lambda has 60 second timeout)
- The `plan` object is optional in the response
- If a plan is returned, it's automatically saved to DynamoDB
- All errors are logged to CloudWatch for debugging
