# SaveSmart Quick Start Guide

Get the SaveSmart application running in 5 minutes!

## Step 1: Check Backend Environment

```bash
cd savesmart-backend
npm run check-env
```

This will verify your `.env` file is properly configured.

### If you see errors:

The `.env` file exists but needs real AWS credentials and OpenAI API key.

**Update these values in `savesmart-backend/.env`:**

```env
# Replace with your real AWS credentials
AWS_ACCESS_KEY_ID=your_real_access_key_here
AWS_SECRET_ACCESS_KEY=your_real_secret_key_here

# Replace with your real OpenAI API key
OPENAI_API_KEY=sk-your_real_openai_key_here
```

**How to get AWS credentials:**
1. Log in to AWS Console
2. Go to IAM → Users → Your User → Security Credentials
3. Create access key
4. Copy Access Key ID and Secret Access Key

**How to get OpenAI API key:**
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Go to API Keys section
4. Create new API key
5. Copy the key

**Note:** The existing DynamoDB tables `savesmart-users` and `savesmart-plans` will be used automatically.

## Step 2: Start Backend Server

```bash
cd savesmart-backend
npm run dev
```

You should see:
```
✅ SaveSmart Backend Server is ready!
🌐 Server running at: http://localhost:3001
```

**Keep this terminal open!**

## Step 3: Start Frontend Server

Open a **new terminal**:

```bash
cd savesmart-frontend
npm run dev
```

You should see:
```
▲ Next.js 16.1.6
- Local:        http://localhost:3000
```

## Step 4: Test the Integration

### Quick Test (Automated)

In another terminal:

```bash
cd savesmart-frontend
node test-integration.js
```

Expected output:
```
✓ Health Check - SUCCESS
✓ GET /api/recipes - SUCCESS
✓ GET /api/events - SUCCESS
✓ POST /api/chat - SUCCESS
```

### Manual Test (Browser)

1. Open http://localhost:3000
2. Click the green chat button (bottom-right)
3. Type: "Hello, can you help me save money?"
4. You should get a response from the AI!

## Step 5: Explore the Features

### Test Recipes Page
- Go to http://localhost:3000/recipes
- Try the dietary filters (Vegetarian, Vegan, Gluten-Free)
- See recipes with real-time pricing

### Test Events Page
- Go to http://localhost:3000/events
- Search by suburb or postcode
- View local events with discounts

### Test Profile Page
- Go to http://localhost:3000/profile
- You'll need to create a test user first (see below)

## Creating a Test User

### Option 1: Using localStorage (Quick)

Open browser console (F12) and run:

```javascript
localStorage.setItem('savesmart_user', JSON.stringify({
  userId: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User'
}));
```

Then refresh the page.

### Option 2: Using DynamoDB (Persistent)

```bash
aws dynamodb put-item \
  --table-name savesmart-users \
  --item '{
    "userId": {"S": "test-user-123"},
    "email": {"S": "test@example.com"},
    "name": {"S": "Test User"},
    "location": {"M": {
      "suburb": {"S": "Sydney"},
      "postcode": {"S": "2000"}
    }},
    "savingsGoal": {"N": "5000"},
    "createdAt": {"S": "2024-01-01T00:00:00Z"},
    "updatedAt": {"S": "2024-01-01T00:00:00Z"}
  }' \
  --region ap-southeast-2
```

## Troubleshooting

### Backend won't start

**Error: "Missing required environment variable"**
- Run `npm run check-env` to see what's missing
- Update `.env` with real values
- Restart the server

**Error: "Failed to connect to DynamoDB"**
- Check AWS credentials are valid
- Verify tables exist: `aws dynamodb list-tables --region ap-southeast-2`
- Ensure IAM permissions include DynamoDB access

### Frontend shows errors

**Error: "Failed to fetch"**
- Ensure backend is running on port 3001
- Check backend terminal for errors
- Verify http://localhost:3001/health returns OK

**CORS errors in browser console**
- Verify `CORS_ORIGIN=http://localhost:3000` in backend `.env`
- Restart backend server

### Chat not working

**Error: "AI agent timeout"**
- Check OpenAI API key is valid
- Verify you have OpenAI credits
- Check backend logs for OpenAI errors

## What's Working

✓ Backend Express.js server on localhost:3001
✓ Frontend Next.js app on localhost:3000
✓ Chat interface with OpenAI integration
✓ Profile management (view/edit)
✓ Recipes browsing with dietary filters
✓ Events discovery with location search
✓ Navigation between all pages
✓ Mock data fallback for external APIs

## What's Not Implemented Yet

- Dashboard with savings statistics
- Fuel prices map
- Meal planning integration
- User authentication/registration flow
- Real-time data from external APIs (using mock data)

## Next Steps

1. Add real AWS credentials and OpenAI API key
2. Test all features manually
3. Create test users in DynamoDB
4. Implement remaining features (dashboard, fuel prices)
5. Add proper authentication

## Getting Help

- Backend issues: Check `savesmart-backend/README.md`
- Integration testing: Check `INTEGRATION_TEST_GUIDE.md`
- Design details: Check `.kiro/specs/local-backend-expansion/design.md`

---

**Ready to go!** Start with Step 1 above. 🚀
