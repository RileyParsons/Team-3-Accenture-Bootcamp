# End of Day 2 Testing Guide

## Overview
This guide will help you test the complete user flow: signup → onboarding → profile creation → database verification.

## Current Status
- ✅ Frontend (Next.js) is built and ready
- ✅ Backend Lambda functions are coded
- ⚠️ Frontend currently uses localStorage (not connected to backend yet)
- ⚠️ Need to verify DynamoDB tables exist
- ⚠️ Need to verify Lambda functions are deployed

---

## Step 1: Verify DynamoDB Tables

Before testing, ensure your DynamoDB tables are set up:

```bash
# Check if tables exist
aws dynamodb list-tables --region ap-southeast-2
```

You should see:
- `savesmart-users`
- `savesmart-plans`

If tables don't exist, run:
```bash
cd savesmart-backend/infrastructure
node setup-dynamodb.js
```

---

## Step 2: Start the Frontend

```bash
cd savesmart
npm install
npm run dev
```

The app will start at: http://localhost:3000

---

## Step 3: Test User Flow (Current - LocalStorage)

### 3.1 Create Account
1. Open http://localhost:3000
2. Click "Get Started" or navigate to http://localhost:3000/auth/signup
3. Fill in the form:
   - First Name: Sarah
   - Last Name: Student
   - Email: sarah@student.com
   - Password: password123
   - Confirm Password: password123
   - ✓ Agree to terms
4. Click "Create Account"

### 3.2 Complete Onboarding
You'll be redirected to `/onboarding`. Fill in:

**Step 1: Living Situation**
- Select: "Yes, I live out of home"
- Rent: $150
- Frequency: Weekly

**Step 2: Income**
- Amount: $1200
- Frequency: Monthly

**Step 3: Grocery Budget**
- Amount: $80 (per week)

**Step 4: Current Savings**
- Amount: $500

**Step 5: Recurring Costs**
- Phone Bill: $50/month
- Internet: $60/month
- Fuel: $40/week
- Add any custom expenses

Click "Complete Setup"

### 3.3 Verify LocalStorage
Open browser DevTools (F12) → Console, run:

```javascript
// Check if user data is stored
console.log(JSON.parse(localStorage.getItem('savesmart_user')));
console.log(localStorage.getItem('savesmart_authenticated'));
```

You should see the user data object.

---

## Step 4: Check DynamoDB (Manual Verification)

Since the frontend isn't connected to the backend yet, we need to manually test the Lambda function.

### Option A: AWS Console
1. Go to AWS Console → DynamoDB → Tables
2. Select `savesmart-users`
3. Click "Explore table items"
4. Check if any items exist

### Option B: AWS CLI
```bash
aws dynamodb scan \
  --table-name savesmart-users \
  --region ap-southeast-2
```

---

## Step 5: Test Backend Lambda Function (Manual)

### 5.1 Check if Lambda Functions Exist
```bash
aws lambda list-functions --region ap-southeast-2 | grep savesmart
```

You should see:
- savesmart-saveUser
- savesmart-getUser
- savesmart-updateUser
- savesmart-chat
- savesmart-getPlans

### 5.2 Test saveUser Lambda Directly

Create a test file `test-user.json`:
```json
{
  "body": "{\"userId\":\"test-sarah-123\",\"email\":\"sarah@student.com\",\"name\":\"Sarah Student\",\"income\":1200,\"rent\":600,\"groceryBudget\":80,\"savings\":500,\"hasCar\":false,\"location\":\"Parramatta\",\"postcode\":\"2150\",\"dietaryPreferences\":[\"vegetarian\"],\"subscriptions\":[\"Netflix\"]}"
}
```

Invoke the Lambda:
```bash
aws lambda invoke \
  --function-name savesmart-saveUser \
  --payload file://test-user.json \
  --region ap-southeast-2 \
  response.json

cat response.json
```

### 5.3 Verify Data in DynamoDB
```bash
aws dynamodb get-item \
  --table-name savesmart-users \
  --key '{"userId": {"S": "test-sarah-123"}}' \
  --region ap-southeast-2
```

---

## Step 6: Integration Testing (If API Gateway is Set Up)

If your team has deployed API Gateway, test the full flow:

### 6.1 Get API Gateway URL
```bash
aws apigateway get-rest-apis --region ap-southeast-2
```

### 6.2 Test POST /users Endpoint
```bash
curl -X POST https://YOUR_API_ID.execute-api.ap-southeast-2.amazonaws.com/prod/users \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "sarah-123",
    "email": "sarah@student.com",
    "name": "Sarah Student",
    "income": 1200,
    "rent": 600,
    "groceryBudget": 80,
    "savings": 500,
    "hasCar": false,
    "location": "Parramatta",
    "postcode": "2150",
    "dietaryPreferences": ["vegetarian"],
    "subscriptions": ["Netflix"]
  }'
```

### 6.3 Test GET /users/{userId} Endpoint
```bash
curl https://YOUR_API_ID.execute-api.ap-southeast-2.amazonaws.com/prod/users/sarah-123
```

---

## Expected Results

### ✅ Success Criteria
- [ ] Frontend runs without errors
- [ ] User can complete signup flow
- [ ] User can complete all 5 onboarding steps
- [ ] Data is stored in localStorage
- [ ] DynamoDB tables exist and are Active
- [ ] Lambda functions are deployed
- [ ] Can manually invoke saveUser Lambda
- [ ] User data appears in DynamoDB after Lambda invocation

### ⚠️ Known Limitations (Day 2)
- Frontend doesn't call backend API yet (uses localStorage)
- No API Gateway integration in frontend
- No authentication with backend
- Chat interface not connected to n8n

---

## Next Steps (Day 3)

1. **Connect Frontend to Backend**
   - Add API Gateway URL to frontend environment variables
   - Update onboarding page to call POST /users API
   - Add error handling for API calls

2. **Test Full Integration**
   - Signup → API call → DynamoDB
   - Verify data persistence
   - Test error scenarios

3. **Connect Chat to n8n**
   - Get n8n webhook URL from AI team
   - Test chat → Lambda → n8n → response flow

---

## Troubleshooting

### Frontend won't start
```bash
cd savesmart
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### DynamoDB tables don't exist
```bash
cd savesmart-backend/infrastructure
npm install
node setup-dynamodb.js
```

### Lambda functions not deployed
Check with your backend team or deploy manually:
```bash
cd savesmart-backend
npm install
npx tsc
# Follow DEPLOYMENT.md instructions
```

### Can't access AWS
Ensure AWS credentials are configured:
```bash
aws configure
# Enter your Access Key ID, Secret Access Key, and region (ap-southeast-2)
```

---

## Quick Test Script

Save this as `test-day2.sh`:

```bash
#!/bin/bash

echo "=== Day 2 Testing Script ==="
echo ""

echo "1. Checking DynamoDB tables..."
aws dynamodb list-tables --region ap-southeast-2 | grep savesmart

echo ""
echo "2. Checking Lambda functions..."
aws lambda list-functions --region ap-southeast-2 | grep savesmart

echo ""
echo "3. Starting frontend..."
echo "Navigate to: http://localhost:3000"
echo ""
echo "Manual steps:"
echo "  - Create account at /auth/signup"
echo "  - Complete onboarding"
echo "  - Check browser localStorage"
echo ""
echo "=== Test Complete ==="
```

Run with: `bash test-day2.sh`

---

## Contact

If you encounter issues:
- Frontend issues → Squad A
- Backend/Lambda issues → Squad B
- DynamoDB issues → Squad B
- Integration issues → Squad D (Integration Lead)
