# Async Groceries Workflow - Test Scenarios

## Test Scenario 1: Happy Path (Success)

### Steps:
1. Navigate to `/meal-plan`
2. Click "Create Meal Plan"
3. Fill in preferences
4. Click "Generate Meal Plan"

### Expected Behavior:
1. UI shows "Starting meal plan generation..."
2. POST /groceries called → receives 202 + jobId
3. UI shows "Generating your meal plan (Job: abc12345...)..."
4. Polling starts: GET /groceries/{jobId} every 1s, 2s, 4s, 8s...
5. Status progresses: PENDING → RUNNING → SUCCEEDED
6. UI shows success message
7. Meal plan displays with recipes

### Verify:
- ✅ No console errors
- ✅ Network tab shows POST then multiple GETs
- ✅ jobId displayed in UI
- ✅ Polling stops when SUCCEEDED
- ✅ Result rendered correctly

---

## Test Scenario 2: Error from Backend

### Steps:
1. Navigate to `/meal-plan`
2. Click "Create Meal Plan"
3. Fill in invalid preferences (if applicable)
4. Click "Generate Meal Plan"

### Expected Behavior:
1. POST /groceries → 202 + jobId
2. Polling starts
3. Status becomes ERROR
4. UI shows error state with message
5. "Try Again" button appears

### Verify:
- ✅ Error message displayed
- ✅ No crash/white screen
- ✅ Retry button works
- ✅ Can view previous plan (if exists)

---

## Test Scenario 3: Timeout (3 minutes)

### Setup:
- Ensure n8n workflow is NOT running or is very slow

### Steps:
1. Start meal plan generation
2. Wait 3+ minutes

### Expected Behavior:
1. Polling continues for 3 minutes
2. After 180 seconds, error shown: "Job polling timed out after 3 minutes"
3. Error state displayed with retry option

### Verify:
- ✅ Timeout occurs at ~180 seconds
- ✅ Error message clear
- ✅ Can retry

---

## Test Scenario 4: User Cancellation

### Steps:
1. Start meal plan generation
2. Click "Cancel" button during polling

### Expected Behavior:
1. Polling stops immediately
2. Returns to preferences form
3. No error shown (or "generation was cancelled")

### Verify:
- ✅ Polling stops (no more GET requests)
- ✅ Can start new generation
- ✅ Old jobId ignored if response arrives late

---

## Test Scenario 5: Component Unmount

### Steps:
1. Start meal plan generation
2. Navigate away (e.g., click "Recipes" in nav)
3. Navigate back to meal plan

### Expected Behavior:
1. Polling stops when navigating away
2. No background requests continue
3. Returns to empty/display state (depending on if plan exists)

### Verify:
- ✅ No polling after unmount
- ✅ No memory leaks
- ✅ Can start fresh generation

---

## Test Scenario 6: Multiple Rapid Submissions

### Steps:
1. Start meal plan generation
2. Immediately click "Cancel"
3. Start new generation
4. Repeat 2-3 times quickly

### Expected Behavior:
1. Each new submission cancels previous polling
2. Only latest jobId is tracked
3. Old responses ignored
4. No race conditions

### Verify:
- ✅ Only one active polling at a time
- ✅ Correct jobId displayed
- ✅ No stale responses processed

---

## Test Scenario 7: 404 During Startup

### Setup:
- Job created in Lambda but not yet in DynamoDB

### Steps:
1. Start meal plan generation
2. First few GET requests return 404

### Expected Behavior:
1. 404 treated as PENDING for first 10 seconds
2. Polling continues
3. Once job appears in DynamoDB, status returned
4. Generation completes normally

### Verify:
- ✅ 404 doesn't cause immediate error
- ✅ Polling continues
- ✅ Eventually succeeds

---

## Test Scenario 8: 404 After Grace Period

### Setup:
- Job never created in DynamoDB

### Steps:
1. Start meal plan generation
2. GET requests return 404 for >10 seconds

### Expected Behavior:
1. After 10 seconds of 404s, error shown
2. Error message: "Job not found" or similar

### Verify:
- ✅ Error after grace period
- ✅ Can retry

---

## Test Scenario 9: Non-JSON Response

### Setup:
- Backend returns HTML error page or plain text

### Steps:
1. Start meal plan generation
2. Backend returns non-JSON

### Expected Behavior:
1. Error caught and displayed
2. No crash
3. Error message: "Expected JSON response from server"

### Verify:
- ✅ No console errors about JSON parsing
- ✅ User-friendly error shown
- ✅ Can retry

---

## Test Scenario 10: Network Failure

### Setup:
- Disconnect internet or block API calls

### Steps:
1. Start meal plan generation
2. Network fails during polling

### Expected Behavior:
1. Error caught
2. Error message shown
3. Can retry when network restored

### Verify:
- ✅ Network error handled gracefully
- ✅ No infinite retry loop
- ✅ User informed

---

## Test Scenario 11: Environment Variable Override

### Setup:
Create `.env.local`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

### Steps:
1. Restart dev server
2. Start meal plan generation
3. Check Network tab

### Expected Behavior:
1. Requests go to localhost:3001
2. Not to AWS API Gateway

### Verify:
- ✅ Correct URL used
- ✅ Can switch between local/prod

---

## Test Scenario 12: Existing Meal Plan

### Setup:
- User already has a meal plan

### Steps:
1. Navigate to `/meal-plan`
2. Existing plan loads
3. Click "Regenerate"
4. Generate new plan

### Expected Behavior:
1. Existing plan shown initially
2. Can regenerate
3. New plan replaces old
4. If error, can view previous plan

### Verify:
- ✅ Existing plan loads
- ✅ Regenerate works
- ✅ Fallback to previous plan on error

---

## Test Scenario 13: Concurrent Users

### Setup:
- Multiple browser tabs or users

### Steps:
1. User A starts generation
2. User B starts generation
3. Both complete

### Expected Behavior:
1. Each user has unique jobId
2. No interference between users
3. Each gets their own result

### Verify:
- ✅ Unique jobIds
- ✅ No cross-contamination
- ✅ Correct results per user

---

## Test Scenario 14: Status Progression

### Steps:
1. Start generation
2. Monitor status in UI/console

### Expected Behavior:
Status progresses:
- PENDING (job queued)
- RUNNING (n8n processing)
- SUCCEEDED (result ready)

### Verify:
- ✅ Status updates visible
- ✅ Logical progression
- ✅ No skipped states

---

## Test Scenario 15: Long Job (>1 minute)

### Setup:
- n8n workflow takes 90 seconds

### Steps:
1. Start generation
2. Wait for completion

### Expected Behavior:
1. Polling continues with backoff
2. Eventually reaches 8s intervals
3. Completes successfully
4. No timeout (under 3 minutes)

### Verify:
- ✅ Backoff works correctly
- ✅ Doesn't timeout prematurely
- ✅ Completes successfully

---

## Performance Checks

### Network Efficiency:
- ✅ Exponential backoff reduces requests
- ✅ No polling after completion
- ✅ Cancellation stops requests immediately

### Memory:
- ✅ No memory leaks on unmount
- ✅ AbortController cleaned up
- ✅ Timers cleared

### UX:
- ✅ Loading states clear
- ✅ Error messages helpful
- ✅ Can cancel/retry easily
- ✅ jobId visible for debugging

---

## Browser Compatibility

Test in:
- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge

Verify:
- ✅ AbortController supported
- ✅ Fetch API works
- ✅ Async/await works
- ✅ UI renders correctly

---

## Checklist Summary

- [ ] Happy path success
- [ ] Backend error handling
- [ ] Timeout after 3 minutes
- [ ] User cancellation
- [ ] Component unmount cleanup
- [ ] Multiple rapid submissions
- [ ] 404 grace period
- [ ] 404 after grace period
- [ ] Non-JSON response handling
- [ ] Network failure handling
- [ ] Environment variable override
- [ ] Existing meal plan flow
- [ ] Concurrent users
- [ ] Status progression
- [ ] Long-running jobs
- [ ] Network efficiency
- [ ] Memory management
- [ ] UX quality
- [ ] Browser compatibility

---

## Debugging Tips

### Check Network Tab:
1. POST /groceries → 202 with jobId
2. Multiple GET /groceries/{jobId}
3. Increasing intervals (1s, 2s, 4s, 8s)
4. Stops when SUCCEEDED/ERROR

### Check Console:
- No errors during normal flow
- Clear error messages on failure
- jobId logged for debugging

### Check State:
- currentJobId set after POST
- abortController created/cleaned up
- pageState transitions correctly

### Check DynamoDB:
- Job record created
- Status updates: PENDING → RUNNING → SUCCEEDED
- Result stored when complete

### Check n8n:
- Workflow triggered
- Processes request
- Calls /complete callback
- Updates DynamoDB

---

## Success Criteria

✅ All test scenarios pass  
✅ No console errors in happy path  
✅ Errors handled gracefully  
✅ No memory leaks  
✅ Network efficient  
✅ UX smooth and clear  
✅ Works across browsers  
✅ Production-ready  
