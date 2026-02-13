# Async Groceries Refactor - Diff Summary

## File: `savesmart-frontend/src/lib/api.ts`

### Change 1: API Base URL
```diff
- const API_BASE_URL = 'http://localhost:3001/api';
+ const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod';
```

### Change 2: Added Async Groceries Functions (at end of file)
```typescript
// ========================
// ASYNC GROCERIES WORKFLOW
// ========================
// POST /groceries returns jobId (202), poll GET /groceries/{jobId} until SUCCEEDED/ERROR

export type JobStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'ERROR';

export interface GroceriesJobResponse {
  ok: boolean;
  jobId: string;
}

export interface GroceriesJobStatusResponse {
  ok: boolean;
  jobId: string;
  status: JobStatus;
  result?: MealPlan;
  error?: any;
}

export interface PollOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

// Start a groceries job (async)
// POST /groceries - returns HTTP 202 with { ok: true, jobId: "<uuid>" }
export const startGroceriesJob = async (
  userId: string,
  preferences: MealPlanPreferences
): Promise<string> => { /* ... */ }

// Get groceries job status
// GET /groceries/{jobId} - returns job status and result when complete
export const getGroceriesJob = async (jobId: string): Promise<GroceriesJobStatusResponse> => { /* ... */ }

// Poll groceries job until completion
// Implements exponential backoff: 1s -> 2s -> 4s -> 8s (capped at 8s)
// Default timeout: 180s (3 minutes)
export const pollGroceriesJob = async (
  jobId: string,
  options: PollOptions = {}
): Promise<MealPlan> => { /* ... */ }

// Legacy sync function - now uses async workflow internally
export const generateMealPlanAsync = async (
  userId: string,
  preferences: MealPlanPreferences,
  options?: PollOptions
): Promise<MealPlan> => { /* ... */ }
```

---

## File: `savesmart-frontend/src/app/(app)/meal-plan/page.tsx`

### Change 1: Imports
```diff
  import {
-   generateMealPlan,
+   startGroceriesJob,
+   pollGroceriesJob,
    getMealPlan,
    removeMealFromSlot,
    addMealToSlot,
    MealPlan,
  } from '@/lib/api';

- type PageState = 'empty' | 'preferences' | 'loading' | 'display';
+ type PageState = 'empty' | 'preferences' | 'loading' | 'display' | 'error';
```

### Change 2: State Variables
```diff
  const [replacementContext, setReplacementContext] = useState<{
    day: string;
    mealType: MealType;
  } | null>(null);
+ const [currentJobId, setCurrentJobId] = useState<string | null>(null);
+ const [abortController, setAbortController] = useState<AbortController | null>(null);
```

### Change 3: useEffect Cleanup
```diff
    loadUserData();
+
+   // Cleanup: abort any ongoing polling when component unmounts
+   return () => {
+     if (abortController) {
+       abortController.abort();
+     }
+   };
  }, []);
```

### Change 4: handleGenerateMealPlan Function
```diff
- const handleGenerateMealPlan = async (preferences: MealPlanPreferences) => {
-   setPageState('loading');
-   setLoadingMessage('Generating your personalized meal plan...');
-   setError(null);
-
-   const longRunningTimer = setTimeout(() => {
-     setLoadingMessage('AI is working on your personalized meal plan. This may take a moment...');
-   }, 5000);
-
-   try {
-     const generatedPlan = await generateMealPlan(userId, preferences);
-     clearTimeout(longRunningTimer);
-     setMealPlan(generatedPlan);
-     setPageState('display');
-     showSuccessMessage('Meal plan generated successfully!');
-   } catch (err) {
-     clearTimeout(longRunningTimer);
-     console.error('Error generating meal plan:', err);
-     setError(err instanceof Error ? err.message : 'Failed to generate meal plan');
-     setPageState('preferences');
-   }
- };

+ const handleGenerateMealPlan = async (preferences: MealPlanPreferences) => {
+   // Cancel any existing polling
+   if (abortController) {
+     abortController.abort();
+   }
+
+   const newAbortController = new AbortController();
+   setAbortController(newAbortController);
+
+   setPageState('loading');
+   setLoadingMessage('Starting meal plan generation...');
+   setError(null);
+   setCurrentJobId(null);
+
+   try {
+     // Step 1: Start the job (POST /groceries returns jobId with 202)
+     const jobId = await startGroceriesJob(userId, preferences);
+     setCurrentJobId(jobId);
+     setLoadingMessage(`Generating your meal plan (Job: ${jobId.substring(0, 8)}...)...`);
+
+     // Set a timer to update the message after 5 seconds
+     const longRunningTimer = setTimeout(() => {
+       setLoadingMessage('AI is working on your personalized meal plan. This may take a moment...');
+     }, 5000);
+
+     // Step 2: Poll for completion (GET /groceries/{jobId} until SUCCEEDED/ERROR)
+     const result = await pollGroceriesJob(jobId, {
+       signal: newAbortController.signal,
+       timeoutMs: 180000, // 3 minutes
+     });
+
+     clearTimeout(longRunningTimer);
+     
+     // Success!
+     setMealPlan(result);
+     setPageState('display');
+     setCurrentJobId(null);
+     showSuccessMessage('Meal plan generated successfully!');
+   } catch (err) {
+     console.error('Error generating meal plan:', err);
+     
+     // Check if it was cancelled
+     if (err instanceof Error && err.message.includes('cancelled')) {
+       setError('Meal plan generation was cancelled');
+     } else {
+       setError(err instanceof Error ? err.message : 'Failed to generate meal plan');
+     }
+     
+     setPageState('error');
+     setCurrentJobId(null);
+   } finally {
+     setAbortController(null);
+   }
+ };
```

### Change 5: handleRegenerate Function
```diff
  const handleRegenerate = () => {
+   // Cancel any ongoing polling
+   if (abortController) {
+     abortController.abort();
+   }
    setPageState('preferences');
  };
```

### Change 6: Loading State Render
```diff
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              {/* ... spinner SVG ... */}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {loadingMessage}
            </h2>
            <p className="text-gray-600 text-sm">
              This may take a few moments...
            </p>
+           {currentJobId && (
+             <p className="text-xs text-gray-400 mt-2 font-mono">
+               Job ID: {currentJobId}
+             </p>
+           )}
          </div>
+         {abortController && (
+           <button
+             onClick={() => {
+               abortController.abort();
+               setPageState('preferences');
+             }}
+             className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
+           >
+             Cancel
+           </button>
+         )}
        </div>
      </div>
    );
  }
```

### Change 7: Added Error State Render (new section after empty state)
```typescript
+ // Render error state
+ if (pageState === 'error') {
+   return (
+     <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
+       <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
+         <div className="mb-6">
+           <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
+             {/* Error icon SVG */}
+           </div>
+           <h1 className="text-2xl font-bold text-gray-900 mb-2">
+             Generation Failed
+           </h1>
+           <p className="text-gray-600 mb-4">
+             {error || 'An error occurred while generating your meal plan'}
+           </p>
+         </div>
+
+         <div className="space-y-3">
+           <button
+             onClick={() => setPageState('preferences')}
+             className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
+           >
+             Try Again
+           </button>
+           {mealPlan && (
+             <button
+               onClick={() => setPageState('display')}
+               className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
+             >
+               View Previous Plan
+             </button>
+           )}
+         </div>
+       </div>
+     </div>
+   );
+ }
```

---

## File: `savesmart-frontend/.env.example` (NEW FILE)

```bash
# API Configuration
# Production AWS API Gateway URL
NEXT_PUBLIC_API_BASE_URL=https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod

# For local development, uncomment and use:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

---

## Exact URLs Used

### Frontend calls:
1. **POST** `https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod/groceries`
   - Returns: `202 { ok: true, jobId: "<uuid>" }`

2. **GET** `https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod/groceries/{jobId}`
   - Returns: `200 { ok: true, jobId, status, result?, error? }`

### Backend callbacks (NOT called by frontend):
3. **POST** `/groceries/{jobId}/status` - n8n updates status
4. **POST** `/groceries/{jobId}/complete` - n8n provides result

---

## Comments Added

In `api.ts`:
```typescript
// POST /groceries returns jobId (202), poll GET /groceries/{jobId} until SUCCEEDED/ERROR
```

In `meal-plan/page.tsx`:
```typescript
// Step 1: Start the job (POST /groceries returns jobId with 202)
// Step 2: Poll for completion (GET /groceries/{jobId} until SUCCEEDED/ERROR)
```
