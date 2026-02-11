# Testing Instructions - Updated

## ✅ Setup Complete & Verified

Your frontend is now connected to your AWS backend and fully tested!

**API Gateway URL:** `https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod`

**Available Endpoints:**
- POST `/test_users` - Create user profile ✅ VERIFIED
- GET `/test_users/{userId}` - Get user profile
- PUT `/test_users/{userId}` - Update user profile
- POST `/chat` - Send message to AI agent

**Last Verified:** February 11, 2026

---

## 🎯 What's Working

✅ User signup flow
✅ 6-step onboarding process
✅ Data validation and submission
✅ API Gateway routing
✅ Lambda function processing
✅ DynamoDB storage with NEW schema
✅ CORS configuration

---

## 🚀 How to Test

### Step 1: Open the Frontend

The dev server should be running at: **http://localhost:3000**

If not running:
```bash
cd savesmart-frontend
npm run dev
```

### Step 2: Create an Account

1. Click "Get Started" or go to `/auth/signup`
2. Fill in the form:
   - First Name: **Sarah**
   - Last Name: **Student**
   - Email: **sarah@student.com**
   - Password: **password123**
   - ✓ Agree to terms
3. Click "Create Account"

### Step 3: Complete Onboarding (6 Steps)

**Step 1: Welcome & Location (Optional)**
- Shows: "Welcome, Sarah! 👋"
- Optional fields:
  - City/Suburb: **Parramatta** (or leave blank)
  - Postcode: **2150** (or leave blank)
- Click "Next"

**Step 2: Living Situation**
- Select: "Yes, I live out of home"
- Rent: **$150**
- Frequency: **Weekly**
- Click "Next"

**Step 3: Income**
- Amount: **$1200**
- Frequency: **Monthly**
- Click "Next"

**Step 4: Grocery Budget**
- Amount: **$80** (per week)
- Click "Next"

**Step 5: Current Savings**
- Amount: **$500**
- Click "Next"

**Step 6: Recurring Costs**
- Phone Bill: **$50/month** (Fixed)
- Internet: **$60/month** (Fixed)
- Fuel: **$40/week** (Variable)
- (Add any custom expenses if you want)
- Click "Complete Setup"

### Step 4: Watch What Happens

When you click "Complete Setup":

1. **Button changes to "Saving..."** with a spinner
2. **Profile data is sent to:** `POST https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod/test_users`
3. **If successful:** Redirects to `/chat`
4. **If error:** Shows red error message (but still saves to localStorage as backup)

### Step 5: Verify in DynamoDB

Open AWS Console and check DynamoDB:

```bash
# Or use AWS CLI:
aws dynamodb get-item \
  --table-name savesmart-users \
  --key '{"userId": {"S": "sarah-student-com"}}' \
  --region ap-southeast-2
```

**Look for a user with:**
- `userId`: `sarah-student-com` (email with @ and . replaced by -)
- `email`: `sarah@student.com`
- `name`: `Sarah Student`
- `income`: `1200`
- `incomeFrequency`: `monthly`
- `savings`: `500`
- `location`: `Parramatta` (if provided)
- `postcode`: `2150` (if provided)
- `recurringExpenses`: Array with 5 items (Rent, Groceries, Phone, Internet, Fuel)

---

## 🔍 Debugging

### Check Browser Console

Open DevTools (F12) → Console tab

You should see:
```
Profile saved to backend: {message: "User saved successfully", userId: "..."}
```

Or if there's an error:
```
Error saving profile: [error message]
```

### Check Network Tab

Open DevTools (F12) → Network tab

Look for a request to:
- **URL:** `https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod/test_users`
- **Method:** POST
- **Status:** 200 (success) or error code

Click on the request to see:
- **Request Payload:** The user profile data being sent
- **Response:** The API response

### Check localStorage

In Console, run:
```javascript
// Check user data from signup
console.log(JSON.parse(localStorage.getItem('savesmart_user')));

// Check profile data (backup)
console.log(JSON.parse(localStorage.getItem('savesmart_profile')));
```

---

## 📊 Expected Data Format (NEW SCHEMA)

The frontend sends this to your Lambda:

```json
{
  "userId": "sarah-student-com",
  "email": "sarah@student.com",
  "name": "Sarah Student",
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
    },
    {
      "name": "Internet",
      "amount": 60,
      "frequency": "monthly",
      "isFixed": true
    },
    {
      "name": "Fuel",
      "amount": 40,
      "frequency": "weekly",
      "isFixed": false
    }
  ]
}
```

**Key Changes from Old Schema:**
- ❌ Removed: `rent`, `groceryBudget`, `hasCar`, `fuelType`, `dietaryPreferences`, `subscriptions`
- ✅ Added: `incomeFrequency`, `location`, `postcode`, `recurringExpenses` array
- ✅ All expenses now in single array with `isFixed` flag

---

## ✅ Verified Test Results

**Test Date:** February 11, 2026

**Test User:**
```json
{
  "userId": "testing-123-com",
  "email": "testing@123.com",
  "name": "Test User",
  "income": 123,
  "incomeFrequency": "monthly",
  "savings": 123,
  "location": "West Sydney",
  "postcode": null,
  "recurringExpenses": [
    {"name": "Rent", "amount": 233, "frequency": "weekly", "isFixed": true},
    {"name": "Groceries", "amount": 123, "frequency": "weekly", "isFixed": false},
    {"name": "Phone Bill", "amount": 123, "frequency": "monthly", "isFixed": true},
    {"name": "Internet", "amount": 123, "frequency": "monthly", "isFixed": true},
    {"name": "Fuel", "amount": 133, "frequency": "weekly", "isFixed": false}
  ]
}
```

**Result:** ✅ All data captured correctly in DynamoDB

---

## 🧪 API Testing with curl

### Test User Creation (NEW SCHEMA)
```bash
curl -X POST https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod/test_users \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-123",
    "email": "test@example.com",
    "name": "Test User",
    "income": 1200,
    "incomeFrequency": "monthly",
    "savings": 500,
    "location": "Sydney",
    "postcode": "2000",
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
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "headers": {"Access-Control-Allow-Origin": "*"},
  "body": "{\"message\":\"User saved successfully\",\"userId\":\"test-123\"}"
}
```

---

## 📝 Documentation

- **System Architecture:** `SYSTEM_ARCHITECTURE.md`
- **Onboarding Data Mapping:** `savesmart-frontend/src/app/onboarding/ONBOARDING_DATA_MAPPING.md`
- **Backend Deployment:** `savesmart-backend/DEPLOYMENT.md`
