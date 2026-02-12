# Async Groceries Workflow - Quick Start Guide

## What Changed?

Your Next.js frontend now supports the async groceries workflow where:
1. POST /groceries returns a jobId immediately (HTTP 202)
2. Frontend polls GET /groceries/{jobId} until the job completes
3. n8n AI agent processes the request in the background
4. Result is stored in DynamoDB and returned when ready

## Setup (1 minute)

### Option 1: Use Production API (Recommended)
No setup needed! The code defaults to your production AWS API Gateway:
```
https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod
```

### Option 2: Use Local Development
Create `savesmart-frontend/.env.local`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

## Testing the Flow

### 1. Start your frontend
```bash
cd savesmart-frontend
npm run dev
```

### 2. Navigate to Meal Plan page
```
http://localhost:3000/meal-plan
```

### 3. Click "Create Meal Plan"
- Fill in preferences
- Click "Generate Meal Plan"

### 4. Watch the async workflow
You'll see:
1. "Starting meal plan generation..." (POST /groceries)
2. "Generating your meal plan (Job: abc12345...)..." (shows jobId)
3. Spinner with polling in progress (GET /groceries/{jobId} every 1-8s)
4. Either:
   - Success: Meal plan displays
   - Error: Error message with "Try Again" button

### 5. Test cancellation
- Click "Cancel" during generation
- Or navigate away (component unmount cancels polling)

## How It Works

### State Machine
```
idle → submitting → processing(jobId) → success OR error
```

### Polling Strategy
- Starts at 1 second intervals
- Doubles each time: 1s → 2s → 4s → 8s
- Caps at 8 seconds
- Timeout after 3 minutes

### Error Handling
- Network errors: Shows error with retry
- Timeout: Shows "timed out after 3 minutes"
- Job ERROR status: Shows error from backend
- Cancellation: Shows "generation was cancelled"

## API Endpoints

### Your Frontend Calls

**Start Job:**
```http
POST /prod/groceries
Content-Type: application/json

{
  "userId": "u_123...",
  "preferences": {
    "allergies": ["peanuts"],
    "calorieGoal": 2000,
    "culturalPreference": "none",
    "dietType": "balanced",
    "notes": ""
  }
}

Response: 202 Accepted
{
  "ok": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Poll Status:**
```http
GET /prod/groceries/{jobId}

Response: 200 OK
{
  "ok": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING" | "RUNNING" | "SUCCEEDED" | "ERROR",
  "result": { /* MealPlan object when SUCCEEDED */ },
  "error": { /* Error details when ERROR */ }
}
```

### n8n Callbacks (Backend Only)

These are called BY n8n, NOT by your frontend:
- `POST /prod/groceries/{jobId}/status` - Update job status
- `POST /prod/groceries/{jobId}/complete` - Provide final result

## Troubleshooting

### "unexpected response format from the server"
✅ FIXED! This was the original bug. Frontend now expects 202 + jobId.

### Job not found (404)
- Normal during first 10 seconds (job starting up)
- After 10 seconds: Check if Lambda created the job in DynamoDB

### Timeout after 3 minutes
- Check n8n workflow is running
- Check n8n can reach your API Gateway callbacks
- Verify DynamoDB job status is being updated

### Polling never stops
- Check job status in DynamoDB
- Ensure status is one of: PENDING, RUNNING, SUCCEEDED, ERROR
- Verify n8n calls the /complete callback

### Multiple rapid clicks
✅ Handled! Each new submission cancels previous polling.

## Code Structure

### `src/lib/api.ts`
- `startGroceriesJob()` - POST /groceries
- `getGroceriesJob()` - GET /groceries/{jobId}
- `pollGroceriesJob()` - Poll with backoff
- `generateMealPlanAsync()` - Convenience wrapper

### `src/app/(app)/meal-plan/page.tsx`
- State: `currentJobId`, `abortController`
- `handleGenerateMealPlan()` - Orchestrates async flow
- Error state rendering
- Cancel button
- Cleanup on unmount

## Next Steps

1. ✅ Test end-to-end with production API
2. ✅ Verify n8n callbacks work
3. ✅ Test cancellation
4. ✅ Test timeout scenario
5. ✅ Test error handling
6. Consider adding progress percentage (if backend provides it)
7. Add analytics for job completion times

## Environment Variables

Create `.env.local` to override API URL:
```bash
# Production (default)
NEXT_PUBLIC_API_BASE_URL=https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod

# Local development
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Network tab for API calls
3. Verify jobId is returned from POST
4. Check DynamoDB for job status
5. Verify n8n workflow is triggered
6. Check API Gateway logs

## Summary

✅ API Base URL uses env var with production fallback  
✅ POST /groceries returns jobId (202)  
✅ GET /groceries/{jobId} polls until complete  
✅ Exponential backoff (1s → 8s)  
✅ 3-minute timeout  
✅ Cancellation support  
✅ Error handling with retry  
✅ No crashes on unexpected responses  
✅ Cleanup on unmount  
✅ Existing recipe endpoints unchanged  

Your frontend is ready for the async groceries workflow! 🎉
