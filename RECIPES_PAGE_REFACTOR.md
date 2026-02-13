# Recipes Page Refactor - User-Driven Meal Plan Generation

## Problem

The recipes page was automatically loading recipes on mount, causing:
- "Failed to load recipes" error on initial render
- Unnecessary API calls before user selects preferences
- Poor UX - users couldn't configure preferences before generation

## Solution

Refactored to a preference-first, user-driven workflow:
1. User selects preferences (dietary, cuisine, meal type, price)
2. User clicks "Generate Meal Plan" button
3. System generates meal plan using async backend workflow
4. User navigates to meal plan page to view results

## Changes Made

### Removed (Auto-Loading)

**1. Automatic Recipe Loading:**
```typescript
// REMOVED:
useEffect(() => {
  loadRecipes();
}, []);

const loadRecipes = async () => {
  const data = await getRecipes();
  setRecipes(data);
  setFilteredRecipes(data);
};
```

**2. Filter-Based Re-fetching:**
```typescript
// REMOVED:
useEffect(() => {
  applyFilters();
}, [recipes, selectedDietaryFilters, ...]);

const applyFilters = () => {
  // Complex filtering logic
};
```

**3. Recipe State Management:**
```typescript
// REMOVED:
const [recipes, setRecipes] = useState<Recipe[]>([]);
const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
const [isLoading, setIsLoading] = useState(true);
```

**4. Recipe Grid Display:**
- Removed entire recipes grid with cards
- Removed "No recipes found" empty state
- Removed recipe click navigation

**5. Imports:**
```typescript
// REMOVED:
import { Clock, Users, DollarSign, Search } from 'lucide-react';
import { getRecipes, Recipe } from '@/lib/api';
```

### Added (User-Driven Generation)

**1. Async Generation State:**
```typescript
const [isGenerating, setIsGenerating] = useState(false);
const [currentJobId, setCurrentJobId] = useState<string | null>(null);
const [abortController, setAbortController] = useState<AbortController | null>(null);
```

**2. Generate Meal Plan Handler:**
```typescript
const handleGenerateMealPlan = async () => {
  // Cancel any existing generation
  if (abortController) {
    abortController.abort();
  }

  const newAbortController = new AbortController();
  setAbortController(newAbortController);
  setIsGenerating(true);
  setError(null);
  setCurrentJobId(null);

  try {
    // Get userId from localStorage
    const storedUser = localStorage.getItem('savesmart_user');
    const { userId } = JSON.parse(storedUser);

    // Build preferences from selected filters
    const preferences = {
      allergies: selectedDietaryFilters.includes('gluten-free') ? ['gluten'] : [],
      calorieGoal: 2000,
      culturalPreference: selectedCuisineFilter !== 'all' ? selectedCuisineFilter : 'none',
      dietType: selectedDietaryFilters.includes('vegan') ? 'vegan' :
                selectedDietaryFilters.includes('vegetarian') ? 'vegetarian' : 'balanced',
      notes: `Meal type: ${selectedMealTypeFilter}, Price range: ${selectedPriceFilter}`,
    };

    // Step 1: Start the job (POST /groceries)
    const jobId = await startGroceriesJob(userId, preferences);
    setCurrentJobId(jobId);

    // Step 2: Poll for completion (GET /groceries/{jobId})
    await pollGroceriesJob(jobId, {
      signal: newAbortController.signal,
      timeoutMs: 180000,
    });

    // Success! Navigate to meal plan page
    router.push('/meal-plan');
  } catch (err) {
    // Error handling
    setError(err.message);
    setIsGenerating(false);
  } finally {
    setAbortController(null);
  }
};
```

**3. New Imports:**
```typescript
import { Loader2, Sparkles } from 'lucide-react';
import { startGroceriesJob, pollGroceriesJob } from '@/lib/api';
```

**4. Updated Header:**
```typescript
<h1>Generate Meal Plan</h1>
<p>Choose your preferences, then generate a personalized meal plan</p>
```

**5. Updated Search Input:**
```typescript
<input
  placeholder="Add notes or specific requests (optional)..."
  disabled={isGenerating}
/>
```

**6. Disabled Filters During Generation:**
```typescript
<button
  disabled={isGenerating}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
```

**7. Info Section:**
```typescript
<div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-8">
  <Sparkles className="h-12 w-12 text-green-600" />
  <h2>Ready to Generate Your Meal Plan?</h2>
  <p>Based on your preferences, we'll create a personalized 7-day meal plan...</p>
  
  {/* Selected Preferences Summary */}
  <div className="bg-white/60 rounded-lg p-4">
    <p>Your Preferences:</p>
    {/* Display selected filters as tags */}
  </div>
</div>
```

**8. Generate Button:**
```typescript
<button
  onClick={handleGenerateMealPlan}
  disabled={isGenerating}
  className="px-8 py-4 bg-green-600 text-white text-lg font-semibold..."
>
  {isGenerating ? (
    <>
      <Loader2 className="animate-spin" />
      <span>Generating Meal Plan...</span>
    </>
  ) : (
    <>
      <Sparkles />
      <span>Generate Meal Plan</span>
    </>
  )}
</button>
```

**9. Loading State with Job ID:**
```typescript
{isGenerating && currentJobId && (
  <div className="text-center">
    <p>Job ID: {currentJobId}</p>
    <p>This may take a few moments...</p>
    <button onClick={() => abortController.abort()}>
      Cancel
    </button>
  </div>
)}
```

**10. Error Handling with Retry:**
```typescript
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <p className="text-red-700">{error}</p>
    <button onClick={handleGenerateMealPlan}>
      Try Again
    </button>
  </div>
)}
```

## New User Flow

### Before (Auto-Loading):
1. User navigates to /recipes
2. Page immediately calls `getRecipes()`
3. If API fails → "Failed to load recipes" error
4. User sees recipe grid (or error)
5. User can filter recipes
6. User clicks recipe to view details

### After (User-Driven):
1. User navigates to /recipes
2. Page renders instantly (no API calls)
3. User selects preferences:
   - Dietary: Vegetarian, Vegan, Gluten-Free
   - Cuisine: Italian, Asian, Mexican, etc.
   - Meal Type: Breakfast, Lunch, Dinner, Snacks
   - Price Range: Budget, Moderate, Premium
   - Notes: Optional text input
4. User sees selected preferences summary
5. User clicks "Generate Meal Plan" button
6. System:
   - Calls `POST /groceries` → gets jobId
   - Shows loading state with jobId
   - Polls `GET /groceries/{jobId}` until complete
7. On success → Navigate to /meal-plan
8. On error → Show error with retry button

## API Calls

### Before:
```
GET /api/recipes (on page load)
GET /api/recipes?dietaryTags=... (on filter change)
```

### After:
```
POST /groceries (on button click)
  → Returns: 202 { jobId: "..." }

GET /groceries/{jobId} (polling)
  → Returns: 200 { status: "PENDING|RUNNING|SUCCEEDED|ERROR", result: {...} }
```

## Benefits

### 1. No Initial Load Errors
- Page renders instantly without API calls
- No "Failed to load recipes" on mount
- Better perceived performance

### 2. User-Driven Workflow
- User configures preferences first
- Clear call-to-action button
- User controls when generation happens

### 3. Better UX
- Visual feedback during generation
- Shows jobId for debugging
- Cancel button for long operations
- Retry button on errors

### 4. Async Backend Integration
- Uses proper async workflow (POST + poll)
- Exponential backoff polling
- Timeout handling (3 minutes)
- Cancellation support

### 5. Preference Visibility
- Shows selected preferences as tags
- Clear summary before generation
- Easy to modify before submitting

## UI States

### 1. Initial State (Idle)
- All filters enabled
- "Generate Meal Plan" button enabled
- No loading indicators
- No errors

### 2. Generating State
- All filters disabled
- Button shows spinner + "Generating..."
- JobId displayed below button
- Cancel button available

### 3. Success State
- Navigates to /meal-plan page
- User sees generated meal plan

### 4. Error State
- Error banner with message
- "Try Again" button
- Filters remain enabled
- User can modify preferences and retry

## Preferences Mapping

User selections are mapped to backend preferences:

```typescript
{
  allergies: selectedDietaryFilters.includes('gluten-free') ? ['gluten'] : [],
  calorieGoal: 2000,
  culturalPreference: selectedCuisineFilter !== 'all' ? selectedCuisineFilter : 'none',
  dietType: selectedDietaryFilters.includes('vegan') ? 'vegan' :
            selectedDietaryFilters.includes('vegetarian') ? 'vegetarian' : 'balanced',
  notes: `Meal type: ${selectedMealTypeFilter}, Price range: ${selectedPriceFilter}${searchQuery ? `, ${searchQuery}` : ''}`,
}
```

## Error Handling

### Network Errors:
```typescript
catch (err) {
  if (err.message.includes('cancelled')) {
    setError('Meal plan generation was cancelled');
  } else {
    setError(err.message || 'Failed to generate meal plan. Please try again.');
  }
}
```

### User Not Logged In:
```typescript
const storedUser = localStorage.getItem('savesmart_user');
if (!storedUser) {
  setError('Please log in to generate a meal plan');
  return;
}
```

### Timeout (3 minutes):
Handled by `pollGroceriesJob()` - throws error after 180 seconds

### Cancellation:
```typescript
<button onClick={() => {
  if (abortController) {
    abortController.abort();
  }
  setIsGenerating(false);
}}>
  Cancel
</button>
```

## Testing Checklist

- [x] Page loads without API calls
- [x] No "Failed to load recipes" error on mount
- [x] All filters work and update local state
- [x] Selected preferences display as tags
- [x] Generate button triggers async workflow
- [x] Loading state shows spinner and jobId
- [x] Cancel button aborts generation
- [x] Success navigates to /meal-plan
- [x] Error shows retry button
- [x] Filters disabled during generation
- [x] User not logged in shows error
- [x] Timeout handled gracefully

## File Modified

- `savesmart-frontend/src/app/(app)/recipes/page.tsx`

## Lines Changed

- Removed: ~200 lines (recipe loading, filtering, grid display)
- Added: ~150 lines (async generation, info section, button)
- Net: ~50 lines removed

## Summary

✅ **No automatic recipe loading** - Page renders instantly  
✅ **No "Failed to load recipes" error** - No API calls on mount  
✅ **User-driven workflow** - Generate button after preferences  
✅ **Async backend integration** - POST /groceries + polling  
✅ **Better UX** - Loading states, cancel, retry  
✅ **Preference visibility** - Shows selected filters as tags  
✅ **Error handling** - Graceful failures with retry  
✅ **Production-ready** - Timeout, cancellation, validation  

The recipes page is now a preference selection interface that generates meal plans on demand! 🎉
