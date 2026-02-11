# 🚨 URGENT: CORS Issue Blocking Frontend

## Current Status
The frontend signup is implemented and working, but API calls are blocked by CORS policy.

## What I Fixed in the Code
1. ✅ Kept endpoint as `/test_users` (correct path)
2. ✅ Maintained nested body structure (body inside body) as required by API Gateway
3. ✅ Added all required fields to match Lambda expectations
4. ✅ Added proper error handling

## What Needs to be Fixed in AWS (BLOCKING)

### The Problem
```
Access-Control-Allow-Origin header is missing from API Gateway responses
```

### Who Needs to Fix This
**Backend/Infrastructure team member with AWS Console access**

### How to Fix (5 minutes)

1. Open AWS Console → API Gateway
2. Find your API: `savesmart-api`
3. For the `/test_users` resource:
   - Click **Actions** → **Enable CORS**
   - Set Access-Control-Allow-Origin to `*`
   - Click **Enable CORS and replace existing CORS headers**
4. Click **Actions** → **Deploy API**
5. Select stage: `prod`
6. Click **Deploy**

### Detailed Instructions
See `CORS_FIX.md` for step-by-step screenshots and troubleshooting.

### Test After Fix
```bash
# Should return CORS headers
curl -X OPTIONS https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod/test_users \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

## Current API Implementation

### Endpoint
```
POST https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod/test_users
```

### Request Body (Note: body is nested)
```json
{
  "body": "{\"userId\":\"u_1234567890_abc123def\",\"email\":\"user@example.com\",\"name\":\"John Doe\",\"income\":0,\"rent\":0,\"groceryBudget\":0,\"savings\":0,\"hasCar\":false,\"location\":\"\",\"dietaryPreferences\":[],\"subscriptions\":[]}"
}
```

### Expected Response
```json
{
  "message": "User created successfully",
  "userId": "u_1234567890_abc123def"
}
```

## Files Updated
- ✅ `savesmart/src/app/auth/signup/page.tsx` - Integrated API calls
- ✅ `savesmart/src/lib/api.ts` - Fixed endpoint and request format

## Next Steps
1. **URGENT**: Enable CORS in API Gateway (see above)
2. Test signup flow end-to-end
3. Verify user is created in DynamoDB
4. Move on to onboarding page integration

## Questions?
Contact the person who set up the API Gateway or check the AWS Console access.
