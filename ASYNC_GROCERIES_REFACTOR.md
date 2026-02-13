# Async Groceries Workflow Refactor - Complete

## Summary

Successfully refactored the Next.js frontend to support the async groceries workflow with AWS API Gateway and n8n AI agent integration.

## Changes Made

### 1. API Base URL Configuration (`src/lib/api.ts`)

**Changed from:**
```typescript
const API_BASE_URL = 'http://localhost:3001/api';
```

**Changed to:**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod';
```

- Uses environment variable `NEXT_PUBLIC_API_BASE_URL` with fallback to production URL
- Allows easy switching between local and production environments

### 2. New Async Groceries API Functions (`src/lib/api.ts`)

Added three new functions to handle the async workflow:

#### `startGroceriesJob(userId, preferences): Promise<string>`
- **URL:** `POST {API_BASE_URL}/groceries`
- **Response:** HTTP 202 with `{ ok: true, jobId: "<uuid>" }`
- **Returns:** jobId string
- **Error handling:** Validates 202 response, checks for jobId, handles non-JSON responses

#### `getGroceriesJob(jobId): Promise<GroceriesJobStatusResponse>`
- **URL:** `GET {API_BASE_URL}/groceries/{jobId}`
- **Response:** `{ ok: true, jobId, status: "PENDING"|"RUNNING"|"SUCCEEDED"|"ERROR", result?, error? }`
- **Returns:** Job status object
- **404 handling:** Treats 404 as PENDING during startup grace period

#### `pollGroceriesJob(jobId, options): Promise<MealPlan>`
- **Polling strategy:** Exponential backoff (1s → 2s → 4s → 8s, capped at 8s)
- **Timeout:** 180 seconds (3 minutes) by default
- **Cancellation:** Supports AbortSignal for cancellation
- **404 grace period:** Allows 10 seconds for job to appear in DynamoDB
- **Returns:** Final MealPlan result when status is SUCCEEDED
- **Throws:** Error if status is ERROR or timeout occurs

#### `generateMealPlanAsync(userId, preferences, options): Promise<MealPlan>`
- Legacy compatibility wrapper that uses async workflow internally
- Combines startGroceriesJob + pollGroceriesJob

### 3. Meal Plan Page Refactor (`src/app/(app)/meal-plan/page.tsx`)

#### State Management Updates

**Added new state:**
```typescript
const [currentJobId, setCurrentJobId] = useState<string | null>(null);
const [abortController, setAbortController] = useState<AbortController | null>(null);
```

**Updated PageState type:**
```typescript
type PageState = 'empty' | 'preferences' | 'loading' | 'display' | 'error';
```

#### Async Workflow Implementation

**`handleGenerateMealPlan` function:**
1. Cancels any existing polling (prevents stale responses)
2. Creates new AbortController for cancellation support
3. Calls `startGroceriesJob()` to get jobId (POST /groceries)
4. Updates UI with jobId
5. Calls `pollGroceriesJob()` with AbortSignal (GET /groceries/{jobId})
6. Handles success/error states appropriately
7. Cleans up AbortController

**Error handling:**
- Catches and displays errors without crashing
- Distinguishes between cancellation and actual errors
- Shows error state with retry option

**Cancellation support:**
- User can cancel during generation
- Component unmount cancels ongoing polling
- Prevents stale responses from old jobs

#### UI Updates

**Loading state:**
- Shows current jobId (truncated for display)
- Displays progress messages
- Includes Cancel button

**Error state (new):**
- Shows error message
- Provides "Try Again" button
- Option to view previous plan if available

**Cleanup on unmount:**
- Aborts any ongoing polling when component unmounts

### 4. Environment Configuration

**Created `.env.example`:**
```bash
# Production AWS API Gateway URL
NEXT_PUBLIC_API_BASE_URL=https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod

# For local development, uncomment and use:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

## API Endpoints Used

### Frontend → Backend

1. **Start Job:**
   - `POST https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod/groceries`
   - Body: `{ userId, preferences }`
   - Response: `202 { ok: true, jobId: "<uuid>" }`

2. **Poll Status:**
   - `GET https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod/groceries/{jobId}`
   - Response: `200 { ok: true, jobId, status, result?, error? }`

### Backend → n8n (NOT called by frontend)

3. **Status Update (callback):**
   - `POST /groceries/{jobId}/status`
   - Called by n8n to update job status

4. **Complete Job (callback):**
   - `POST /groceries/{jobId}/complete`
   - Called by n8n to provide final result

## Key Features

### Polling Behavior
- **Exponential backoff:** Starts at 1s, doubles each time, caps at 8s
- **Timeout:** 180 seconds (3 minutes)
- **404 handling:** Treats 404 as "starting" for first 10 seconds
- **Safe JSON parsing:** Handles non-JSON responses gracefully

### Cancellation
- Uses AbortController for clean cancellation
- Aborts polling if user submits again
- Aborts polling on component unmount
- Ignores stale polling responses for old jobIds

### Error Handling
- No unhandled exceptions during render
- Errors caught and displayed in UI
- Retry functionality available
- Distinguishes between different error types

### State Machine
```
idle → submitting → processing(jobId,status) → success(result) OR error(message)
```

## Files Modified

1. `savesmart-frontend/src/lib/api.ts`
   - Updated API_BASE_URL to use env var
   - Added async groceries functions (startGroceriesJob, getGroceriesJob, pollGroceriesJob)
   - Added types (JobStatus, GroceriesJobResponse, GroceriesJobStatusResponse, PollOptions)

2. `savesmart-frontend/src/app/(app)/meal-plan/page.tsx`
   - Updated imports (removed generateMealPlan, added startGroceriesJob, pollGroceriesJob)
   - Added state for jobId and AbortController
   - Refactored handleGenerateMealPlan to use async workflow
   - Added error state rendering
   - Added cleanup on unmount
   - Updated loading state to show jobId and cancel button

3. `savesmart-frontend/.env.example` (created)
   - Environment variable configuration example

## Testing Checklist

- [ ] POST /groceries returns 202 with jobId
- [ ] GET /groceries/{jobId} returns job status
- [ ] Polling continues until SUCCEEDED or ERROR
- [ ] Success state displays meal plan
- [ ] Error state shows error message with retry
- [ ] Cancel button aborts polling
- [ ] Component unmount cancels polling
- [ ] Multiple rapid submissions don't cause issues
- [ ] 404 during startup is handled gracefully
- [ ] Timeout after 3 minutes shows error
- [ ] Environment variable override works

## Backward Compatibility

- Existing recipe endpoints (getRecipe, getRecipes) unchanged
- Other API functions remain functional
- Only meal plan generation uses new async workflow

## Next Steps

1. Create `.env.local` file with appropriate API URL for your environment
2. Test the async workflow end-to-end
3. Monitor for any edge cases in production
4. Consider adding progress percentage if backend provides it
5. Add analytics/logging for job completion times

## Notes

- Frontend does NOT call `/groceries/{jobId}/status` or `/groceries/{jobId}/complete` - these are n8n callbacks only
- The `status` field in the job response is authoritative (stored/updated server-side)
- Frontend only reads status via GET /groceries/{jobId}
- All polling logic is client-side with exponential backoff
