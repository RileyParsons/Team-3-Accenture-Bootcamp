# Frontend-Backend Integration Test Guide

This guide helps you test the integration between the SaveSmart frontend and the new local Express.js backend.

## Prerequisites

Before testing, ensure you have:

1. **Backend server running** on `localhost:3001`
   - Navigate to `savesmart-backend/`
   - Run `npm run dev` or `npm start`
   - Verify at http://localhost:3001/health

2. **Frontend server running** on `localhost:3000`
   - Navigate to `savesmart-frontend/`
   - Run `npm run dev`
   - Open http://localhost:3000

## Quick Integration Test

### Automated Test Script

Run the automated integration test:

```bash
cd savesmart-frontend
node test-integration.js
```

This script tests:
- Health check endpoint
- GET /api/recipes
- GET /api/events
- POST /api/chat
- GET /api/profile/:userId

Expected output:
```
✓ Health Check - SUCCESS
✓ GET /api/recipes - SUCCESS
✓ GET /api/events - SUCCESS
✓ POST /api/chat - SUCCESS
✓ GET /api/profile/:userId (expect 404) - SUCCESS

Passed: 5/5
✓ All tests passed! Frontend can connect to backend.
```

## Manual Testing Checklist

### 1. Test Chat Interface (FAB)

1. Open any page in the frontend
2. Click the green chat button (bottom-right corner)
3. Type a message: "Hello, can you help me save money?"
4. Press Send
5. **Expected**: You should receive a response from the AI agent

**What to check:**
- Chat overlay opens/closes correctly
- Messages appear in the chat history
- Loading indicator shows while waiting for response
- Responses are displayed correctly

### 2. Test Profile Page

1. Navigate to http://localhost:3000/profile
2. **Expected**: You should see a "No user found" message (if not logged in)

**To test with a user:**
1. Create a test user in localStorage:
   ```javascript
   localStorage.setItem('savesmart_user', JSON.stringify({
     userId: 'test-user-123',
     email: 'test@example.com',
     name: 'Test User'
   }));
   ```
2. Refresh the page
3. Click "Edit Profile"
4. Update fields and click "Save Changes"
5. **Expected**: Profile updates successfully

**What to check:**
- Profile displays correctly
- Edit mode works
- Form validation works
- Save updates the profile
- Cancel discards changes

### 3. Test Recipes Page

1. Navigate to http://localhost:3000/recipes
2. **Expected**: You should see a list of recipes with:
   - Recipe name and description
   - Prep time and servings
   - Total cost
   - Dietary tags

**What to check:**
- Recipes load correctly
- Dietary filters work (Vegetarian, Vegan, Gluten-Free)
- Recipe cards display all information
- Images load (or show placeholder)

### 4. Test Events Page

1. Navigate to http://localhost:3000/events
2. **Expected**: You should see a list of local events

**What to check:**
- Events load correctly
- Search filters work (suburb, postcode)
- Event details display correctly
- "View Details" links work
- Clear filters button works

### 5. Test Navigation

1. Click through all navigation links in the header:
   - Dashboard
   - Events
   - Fuel Prices
   - Recipes
   - Profile

**What to check:**
- All pages load without errors
- Active page is highlighted in navigation
- Mobile menu works (resize browser to test)

## Common Issues and Solutions

### Issue: "Failed to fetch" errors

**Solution:**
- Ensure backend server is running on port 3001
- Check backend logs for errors
- Verify CORS is configured correctly in backend

### Issue: Chat not working

**Possible causes:**
1. OpenAI API key not configured in backend `.env`
2. Backend webhook service error
3. Network connectivity issue

**Solution:**
- Check backend logs for OpenAI API errors
- Verify `OPENAI_API_KEY` in `savesmart-backend/.env`
- Test chat endpoint directly: `curl -X POST http://localhost:3001/api/chat -H "Content-Type: application/json" -d '{"userId":"test","message":"hello"}'`

### Issue: Profile page shows "No user found"

**Solution:**
- This is expected if you haven't logged in
- Create a test user in localStorage (see Manual Testing section)
- Or use the onboarding flow to create a real user

### Issue: Recipes/Events show "Failed to load"

**Possible causes:**
1. Backend not running
2. DynamoDB connection issue
3. Mock data not generated

**Solution:**
- Check backend server logs
- Verify DynamoDB tables exist
- Backend should automatically use mock data if external APIs fail

### Issue: CORS errors in browser console

**Solution:**
- Verify `CORS_ORIGIN=http://localhost:3000` in backend `.env`
- Restart backend server after changing `.env`
- Clear browser cache

## Testing with Real Data

### Create Test User in DynamoDB

Use AWS CLI to create a test user:

```bash
aws dynamodb put-item \
  --table-name savesmart-users \
  --item '{
    "userId": {"S": "test-user-123"},
    "email": {"S": "test@example.com"},
    "name": {"S": "Test User"},
    "location": {
      "M": {
        "suburb": {"S": "Sydney"},
        "postcode": {"S": "2000"}
      }
    },
    "savingsGoal": {"N": "5000"},
    "createdAt": {"S": "2024-01-01T00:00:00Z"},
    "updatedAt": {"S": "2024-01-01T00:00:00Z"}
  }' \
  --region ap-southeast-2
```

Then set this user in localStorage:
```javascript
localStorage.setItem('savesmart_user', JSON.stringify({
  userId: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User'
}));
```

## API Endpoint Reference

All endpoints are prefixed with `http://localhost:3001/api`

### Chat
- `POST /chat` - Send chat message with context

### Profile
- `GET /profile/:userId` - Get user profile
- `PUT /profile/:userId` - Update user profile

### Recipes
- `GET /recipes` - List recipes (optional: `?dietaryTags=vegetarian,vegan`)
- `GET /recipes/:recipeId` - Get recipe details

### Events
- `GET /events` - List events (optional: `?suburb=Sydney&postcode=2000`)

### Health
- `GET /health` - Backend health check

## Success Criteria

Integration is successful when:

1. ✓ Backend health check returns 200 OK
2. ✓ Chat interface sends messages and receives responses
3. ✓ Profile page loads and updates work
4. ✓ Recipes page displays recipes with filtering
5. ✓ Events page displays events with search
6. ✓ Navigation works across all pages
7. ✓ No CORS errors in browser console
8. ✓ No 500 errors in backend logs

## Next Steps

After successful integration testing:

1. Implement remaining backend routes (dashboard, fuel prices)
2. Add more comprehensive frontend features
3. Implement proper authentication
4. Add error boundaries and loading states
5. Write automated E2E tests with Playwright or Cypress

## Getting Help

If you encounter issues:

1. Check backend logs: `savesmart-backend/` terminal
2. Check browser console: F12 → Console tab
3. Review backend README: `savesmart-backend/README.md`
4. Check design document: `.kiro/specs/local-backend-expansion/design.md`

---

**Last Updated**: February 2026
