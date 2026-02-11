# CORS Configuration Fix for API Gateway

## Problem
Frontend is getting CORS errors when calling the API:
```
Access to fetch at 'https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod/test_users' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

## Solution

You need to enable CORS in API Gateway for each endpoint. Here's how:

### Option 1: Enable CORS via AWS Console (Recommended)

1. Go to **API Gateway Console**
2. Select your API: `savesmart-api`
3. For **each resource** (e.g., `/users`, `/chat`, etc.):
   
   a. Click on the resource
   
   b. Click **Actions** → **Enable CORS**
   
   c. Configure CORS settings:
      - **Access-Control-Allow-Origin**: `*` (or `http://localhost:3000` for development)
      - **Access-Control-Allow-Headers**: `Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token`
      - **Access-Control-Allow-Methods**: Check all methods you're using (GET, POST, PUT, OPTIONS)
   
   d. Click **Enable CORS and replace existing CORS headers**
   
   e. Click **Yes, replace existing values**

4. **Deploy the API** after enabling CORS:
   - Click **Actions** → **Deploy API**
   - Select stage: `prod`
   - Click **Deploy**

### Option 2: Manual OPTIONS Method Setup

If Option 1 doesn't work, manually add OPTIONS method:

1. Select the resource (e.g., `/users`)
2. Click **Actions** → **Create Method**
3. Select **OPTIONS** from dropdown
4. Click the checkmark
5. Configure:
   - Integration type: **Mock**
   - Click **Save**
6. Click **Method Response**
   - Add Response Headers:
     - `Access-Control-Allow-Headers`
     - `Access-Control-Allow-Methods`
     - `Access-Control-Allow-Origin`
7. Click **Integration Response**
   - Expand the 200 response
   - Add Header Mappings:
     - `Access-Control-Allow-Headers`: `'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'`
     - `Access-Control-Allow-Methods`: `'GET,POST,PUT,DELETE,OPTIONS'`
     - `Access-Control-Allow-Origin`: `'*'`
8. Deploy the API

### Verify CORS Headers

After deploying, test with curl:

```bash
curl -X OPTIONS https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod/users \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

You should see these headers in the response:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token
```

## Important Notes

1. **Deploy After Changes**: Always deploy the API after making CORS changes
2. **All Resources**: Enable CORS for ALL resources that the frontend calls
3. **Lambda Headers**: Your Lambda functions already have CORS headers (good!)
4. **API Gateway**: API Gateway needs CORS configuration separately

## Resources to Enable CORS On

Based on your API structure:
- ✅ `/users` (POST) - for signup
- ✅ `/users/{userId}` (GET, PUT) - for user profile
- ✅ `/chat` (POST) - for AI chat
- ✅ `/plans/{userId}` (GET) - for saved plans

## Testing After Fix

Once CORS is enabled and deployed, test the signup again from the frontend.

## Alternative: Temporary Workaround (Development Only)

If you need to test immediately while waiting for CORS fix, you can use a CORS proxy for development:

Update `savesmart/src/lib/api.ts`:
```typescript
// TEMPORARY - Remove after CORS is fixed in API Gateway
const API_BASE_URL = 'https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod';
```

But this is NOT recommended for production. Fix CORS in API Gateway properly.
