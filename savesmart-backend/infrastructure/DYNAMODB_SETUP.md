# DynamoDB Tables Setup Guide

Complete step-by-step instructions for setting up the SaveSmart DynamoDB tables.

---

## Table 1: savesmart-users

### Purpose
Stores user profile data including income, expenses, preferences, and location.

### AWS Console Steps

1. **Navigate to DynamoDB**
   - Go to AWS Console → Services → DynamoDB
   - Region: **ap-southeast-2 (Sydney)**

2. **Create Table**
   - Click "Create table"
   - Table name: `savesmart-users`
   - Partition key: `userId` (String)
   - Sort key: Leave empty (none)

3. **Table Settings**
   - Table class: DynamoDB Standard
   - Capacity mode: **On-demand**
   - Encryption: AWS owned key (default)

4. **Click "Create table"**
   - Wait 1-2 minutes for table to become Active

### Schema (What Gets Stored)

```json
{
  "userId": "demo-sarah-123",
  "email": "sarah@uni.edu.au",
  "name": "Sarah",
  "income": 1200,
  "incomeFrequency": "monthly",
  "savings": 500,
  "location": "Parramatta",
  "postcode": "2150",
  "recurringExpenses": [
    {
      "name": "Rent",
      "amount": 600,
      "frequency": "monthly",
      "isFixed": true
    },
    {
      "name": "Groceries",
      "amount": 80,
      "frequency": "weekly",
      "isFixed": false
    },
    {
      "name": "Netflix",
      "amount": 16.99,
      "frequency": "monthly",
      "isFixed": true
    },
    {
      "name": "Gym Membership",
      "amount": 25,
      "frequency": "monthly",
      "isFixed": true
    },
    {
      "name": "Fuel",
      "amount": 60,
      "frequency": "weekly",
      "isFixed": false
    }
  ],
  "createdAt": "2026-02-11T10:00:00Z"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | String | Yes | Unique user identifier (partition key) |
| email | String | Yes | User's email address |
| name | String | Yes | User's display name |
| income | Number | Yes | Income amount in AUD |
| incomeFrequency | String | No | How often income is received (weekly/monthly/yearly, default: monthly) |
| savings | Number | Yes | Current savings in AUD |
| location | String | Yes | Suburb name |
| postcode | String | No | Australian postcode (4 digits) |
| recurringExpenses | Array | No | List of recurring expenses (default: empty array) |
| recurringExpenses[].name | String | Yes | Name of the expense (e.g., "Rent", "Netflix") |
| recurringExpenses[].amount | Number | Yes | Cost in AUD |
| recurringExpenses[].frequency | String | Yes | How often charged (weekly/monthly/yearly) |
| recurringExpenses[].isFixed | Boolean | Yes | true = fixed cost (e.g., rent, internet), false = variable (e.g., groceries, fuel) |
| createdAt | String | Yes | ISO 8601 timestamp |

---

## Table 2: savesmart-plans

### Purpose
Stores AI-generated savings plans for users.

### AWS Console Steps

1. **Navigate to DynamoDB**
   - Go to AWS Console → Services → DynamoDB
   - Region: **ap-southeast-2 (Sydney)**

2. **Create Table**
   - Click "Create table"
   - Table name: `savesmart-plans`
   - Partition key: `userId` (String)
   - Sort key: `planId` (String)

3. **Table Settings**
   - Table class: DynamoDB Standard
   - Capacity mode: **On-demand**
   - Encryption: AWS owned key (default)

4. **Create Global Secondary Index (GSI)**
   - Scroll down to "Secondary indexes"
   - Click "Create global index"
   - Index name: `userId-index`
   - Partition key: `userId` (String)
   - Sort key: `createdAt` (String)
   - Attribute projections: **All**
   - Click "Create index"

5. **Click "Create table"**
   - Wait 1-2 minutes for table to become Active

### Schema (What Gets Stored)

```json
{
  "planId": "plan-1707649200000",
  "userId": "demo-sarah-123",
  "plan": {
    "goal": "Save $3000 for Japan trip",
    "timeline": "6 months",
    "monthly": 500,
    "breakdown": [
      {
        "category": "Groceries",
        "amount": 150,
        "tip": "Shop at ALDI instead of Coles for 30% savings"
      },
      {
        "category": "Transport",
        "amount": 200,
        "tip": "Use Opal card off-peak for 30% discount"
      }
    ]
  },
  "createdAt": "2026-02-11T10:30:00Z"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | String | Yes | User identifier (partition key) |
| planId | String | Yes | Unique plan identifier (sort key) |
| plan | Object | Yes | The savings plan details |
| plan.goal | String | Yes | Savings goal description |
| plan.timeline | String | Yes | Time to achieve goal |
| plan.monthly | Number | Yes | Monthly savings target |
| plan.breakdown | Array | Yes | Category-wise breakdown |
| createdAt | String | Yes | ISO 8601 timestamp |

---

## Verification Steps

After creating both tables, verify they're set up correctly:

### 1. Check Table Status
- Both tables should show status: **Active**
- Capacity mode: **On-demand**

### 2. Check Keys
- `savesmart-users`: Partition key = `userId` (String)
- `savesmart-plans`: Partition key = `userId` (String), Sort key = `planId` (String)

### 3. Check GSI
- `savesmart-plans` should have GSI named `userId-index`
- GSI partition key = `userId`, sort key = `createdAt`

### 4. Test Access (Optional)
You can insert a test item to verify:

**For savesmart-users:**
```json
{
  "userId": "test-123",
  "email": "test@example.com",
  "name": "Test User",
  "income": 1000,
  "incomeFrequency": "monthly",
  "savings": 200,
  "location": "Sydney",
  "recurringExpenses": [
    {
      "name": "Rent",
      "amount": 500,
      "frequency": "monthly",
      "isFixed": true
    }
  ],
  "createdAt": "2026-02-11T12:00:00Z"
}
```

---

## AWS CLI Alternative (Optional)

If you prefer using AWS CLI:

### Create savesmart-users table
```bash
aws dynamodb create-table \
  --table-name savesmart-users \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-2
```

### Create savesmart-plans table
```bash
aws dynamodb create-table \
  --table-name savesmart-plans \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=planId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=planId,KeyType=RANGE \
  --global-secondary-indexes \
    "[{
      \"IndexName\": \"userId-index\",
      \"KeySchema\": [
        {\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},
        {\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}
      ],
      \"Projection\": {\"ProjectionType\":\"ALL\"}
    }]" \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-2
```

---

## Common Issues

### Issue: "Table already exists"
**Solution**: Check if table was created previously. Delete and recreate if needed.

### Issue: GSI not showing up
**Solution**: Wait 1-2 minutes after table creation. GSI takes time to build.

### Issue: Wrong region
**Solution**: Ensure you're in **ap-southeast-2 (Sydney)** region.

---

## What to Share Back

Once tables are created, confirm:
- ✅ Both tables are Active
- ✅ Keys are configured correctly
- ✅ GSI exists on savesmart-plans
- ✅ Region is ap-southeast-2

Then the Lambda functions can be deployed!
