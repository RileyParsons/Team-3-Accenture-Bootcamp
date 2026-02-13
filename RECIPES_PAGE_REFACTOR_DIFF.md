# Recipes Page Refactor - Diff Summary

## File: `savesmart-frontend/src/app/(app)/recipes/page.tsx`

### Change 1: Imports
```diff
  'use client';

- import { useState, useEffect } from 'react';
+ import { useState } from 'react';
  import { useRouter } from 'next/navigation';
- import { Clock, Users, DollarSign, Loader2, Search } from 'lucide-react';
- import { getRecipes, Recipe } from '@/lib/api';
+ import { Loader2, Sparkles } from 'lucide-react';
+ import { startGroceriesJob, pollGroceriesJob } from '@/lib/api';
```

### Change 2: State Variables
```diff
  export default function RecipesPage() {
    const router = useRouter();
-   const [recipes, setRecipes] = useState<Recipe[]>([]);
-   const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
-   const [isLoading, setIsLoading] = useState(true);
-   const [error, setError] = useState<string | null>(null);
    const [selectedDietaryFilters, setSelectedDietaryFilters] = useState<string[]>([]);
    const [selectedCuisineFilter, setSelectedCuisineFilter] = useState<string>('all');
    const [selectedMealTypeFilter, setSelectedMealTypeFilter] = useState<string>('all');
    const [selectedPriceFilter, setSelectedPriceFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
+   const [isGenerating, setIsGenerating] = useState(false);
+   const [error, setError] = useState<string | null>(null);
+   const [currentJobId, setCurrentJobId] = useState<string | null>(null);
+   const [abortController, setAbortController] = useState<AbortController | null>(null);
```

### Change 3: Removed Auto-Loading Logic
```diff
-   useEffect(() => {
-     loadRecipes();
-   }, []);
-
-   useEffect(() => {
-     applyFilters();
-   }, [recipes, selectedDietaryFilters, selectedCuisineFilter, selectedMealTypeFilter, selectedPriceFilter, searchQuery]);
-
-   const loadRecipes = async () => {
-     try {
-       setIsLoading(true);
-       setError(null);
-       const data = await getRecipes();
-       setRecipes(data);
-       setFilteredRecipes(data);
-     } catch (err) {
-       console.error('Error loading recipes:', err);
-       setError('Failed to load recipes. Please try again.');
-     } finally {
-       setIsLoading(false);
-     }
-   };
-
-   const applyFilters = () => {
-     // ... 100+ lines of filtering logic ...
-   };
```

### Change 4: Added Generate Handler
```diff
+   const handleGenerateMealPlan = async () => {
+     // Cancel any existing generation
+     if (abortController) {
+       abortController.abort();
+     }
+
+     const newAbortController = new AbortController();
+     setAbortController(newAbortController);
+     setIsGenerating(true);
+     setError(null);
+     setCurrentJobId(null);
+
+     try {
+       // Get userId from localStorage
+       const storedUser = localStorage.getItem('savesmart_user');
+       if (!storedUser) {
+         setError('Please log in to generate a meal plan');
+         setIsGenerating(false);
+         return;
+       }
+
+       const { userId } = JSON.parse(storedUser);
+
+       // Build preferences from selected filters
+       const preferences = {
+         allergies: selectedDietaryFilters.includes('gluten-free') ? ['gluten'] : [],
+         calorieGoal: 2000,
+         culturalPreference: selectedCuisineFilter !== 'all' ? selectedCuisineFilter : 'none',
+         dietType: selectedDietaryFilters.includes('vegan') ? 'vegan' :
+                   selectedDietaryFilters.includes('vegetarian') ? 'vegetarian' : 'balanced',
+         notes: `Meal type: ${selectedMealTypeFilter}, Price range: ${selectedPriceFilter}${searchQuery ? `, Search: ${searchQuery}` : ''}`,
+       };
+
+       // Step 1: Start the job (POST /groceries)
+       const jobId = await startGroceriesJob(userId, preferences);
+       setCurrentJobId(jobId);
+
+       // Step 2: Poll for completion (GET /groceries/{jobId})
+       await pollGroceriesJob(jobId, {
+         signal: newAbortController.signal,
+         timeoutMs: 180000, // 3 minutes
+       });
+
+       // Success! Navigate to meal plan page
+       router.push('/meal-plan');
+     } catch (err) {
+       console.error('Error generating meal plan:', err);
+       
+       // Check if it was cancelled
+       if (err instanceof Error && err.message.includes('cancelled')) {
+         setError('Meal plan generation was cancelled');
+       } else {
+         setError(err instanceof Error ? err.message : 'Failed to generate meal plan. Please try again.');
+       }
+       
+       setIsGenerating(false);
+       setCurrentJobId(null);
+     } finally {
+       setAbortController(null);
+     }
+   };
```

### Change 5: Removed Loading State Check
```diff
-   if (isLoading) {
-     return (
-       <div className="flex items-center justify-center min-h-[60vh]">
-         <Loader2 className="h-8 w-8 animate-spin text-green-600" />
-       </div>
-     );
-   }
-
    return (
```

### Change 6: Updated Header
```diff
      <div className="mb-8 flex items-center justify-between">
        <div>
-         <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Recipes</h1>
-         <p className="text-gray-900">Find budget-friendly recipes with real-time pricing</p>
+         <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Meal Plan</h1>
+         <p className="text-gray-600">Choose your preferences, then generate a personalized meal plan</p>
        </div>
        <button
          onClick={() => router.push('/meal-plan')}
-         className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
+         className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
        >
          View Meal Plan
        </button>
      </div>
```

### Change 7: Updated Search Input
```diff
      <div className="mb-6">
        <input
          type="text"
-         placeholder="Search recipes by name or description..."
+         placeholder="Add notes or specific requests (optional)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
+         disabled={isGenerating}
-         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400"
+         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>
```

### Change 8: Added Disabled State to Filters
```diff
      <button
        key={option.value}
        onClick={() => toggleDietaryFilter(option.value)}
+       disabled={isGenerating}
-       className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${...}`}
+       className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${...}`}
      >
```

### Change 9: Replaced Recipe Grid with Info Section and Button
```diff
-     {/* Error Message */}
-     {error && (
-       <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
-         {error}
-       </div>
-     )}
-
-     {/* Recipes Grid */}
-     {filteredRecipes.length === 0 ? (
-       <div className="text-center py-12">
-         <p className="text-gray-900 mb-4">No recipes found matching your filters.</p>
-         <button onClick={clearAllFilters} className="text-green-600 hover:text-green-700 font-medium">
-           Clear all filters
-         </button>
-       </div>
-     ) : (
-       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
-         {filteredRecipes.map((recipe) => (
-           <div key={recipe.recipeId} onClick={() => router.push(`/recipes/${recipe.recipeId}`)} className="...">
-             {/* Recipe card content */}
-           </div>
-         ))}
-       </div>
-     )}

+     {/* Error Message */}
+     {error && (
+       <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
+         <p className="text-red-700 mb-2">{error}</p>
+         <button onClick={handleGenerateMealPlan} className="text-sm text-red-600 hover:text-red-700 font-medium">
+           Try Again
+         </button>
+       </div>
+     )}
+
+     {/* Info Section */}
+     <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-8 mb-8">
+       <div className="max-w-2xl mx-auto text-center">
+         <Sparkles className="h-12 w-12 text-green-600 mx-auto mb-4" />
+         <h2 className="text-2xl font-bold text-gray-900 mb-3">
+           Ready to Generate Your Meal Plan?
+         </h2>
+         <p className="text-gray-600 mb-6">
+           Based on your preferences, we'll create a personalized 7-day meal plan with budget-friendly recipes 
+           and a shopping list with real Coles prices.
+         </p>
+         
+         {/* Selected Preferences Summary */}
+         {(selectedDietaryFilters.length > 0 || selectedCuisineFilter !== 'all' || 
+           selectedMealTypeFilter !== 'all' || selectedPriceFilter !== 'all') && (
+           <div className="bg-white/60 rounded-lg p-4 mb-6">
+             <p className="text-sm font-medium text-gray-700 mb-2">Your Preferences:</p>
+             <div className="flex flex-wrap gap-2 justify-center">
+               {/* Display selected filters as tags */}
+             </div>
+           </div>
+         )}
+       </div>
+     </div>
+
+     {/* Generate Button */}
+     <div className="flex justify-center pb-12">
+       <button
+         onClick={handleGenerateMealPlan}
+         disabled={isGenerating}
+         className="px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-3 shadow-lg hover:shadow-xl"
+       >
+         {isGenerating ? (
+           <>
+             <Loader2 className="h-6 w-6 animate-spin" />
+             <span>Generating Meal Plan...</span>
+           </>
+         ) : (
+           <>
+             <Sparkles className="h-6 w-6" />
+             <span>Generate Meal Plan</span>
+           </>
+         )}
+       </button>
+     </div>
+
+     {/* Loading State with Job ID */}
+     {isGenerating && currentJobId && (
+       <div className="text-center text-sm text-gray-500 pb-8">
+         <p>Job ID: {currentJobId}</p>
+         <p className="mt-2">This may take a few moments...</p>
+         <button
+           onClick={() => {
+             if (abortController) {
+               abortController.abort();
+             }
+             setIsGenerating(false);
+           }}
+           className="mt-4 text-gray-600 hover:text-gray-800 underline"
+         >
+           Cancel
+         </button>
+       </div>
+     )}
    </div>
  );
}
```

## Summary of Changes

### Removed:
- ❌ `useEffect` for auto-loading recipes
- ❌ `useEffect` for auto-filtering
- ❌ `loadRecipes()` function
- ❌ `applyFilters()` function (100+ lines)
- ❌ `recipes` and `filteredRecipes` state
- ❌ `isLoading` state
- ❌ Recipe grid display
- ❌ Recipe cards
- ❌ "No recipes found" empty state
- ❌ `getRecipes` import
- ❌ Recipe-related icons

### Added:
- ✅ `handleGenerateMealPlan()` function
- ✅ `isGenerating`, `currentJobId`, `abortController` state
- ✅ `startGroceriesJob`, `pollGroceriesJob` imports
- ✅ Info section with preferences summary
- ✅ "Generate Meal Plan" button
- ✅ Loading state with jobId display
- ✅ Cancel button
- ✅ Error handling with retry
- ✅ Disabled state for filters during generation
- ✅ Sparkles icon for visual appeal

### Modified:
- 🔄 Page title: "Browse Recipes" → "Generate Meal Plan"
- 🔄 Description: Updated to reflect new purpose
- 🔄 Search input: "Search recipes" → "Add notes"
- 🔄 "View Meal Plan" button: Green → Gray (secondary action)
- 🔄 Error display: Added retry button

## Result

✅ No automatic API calls on page load  
✅ No "Failed to load recipes" error  
✅ User-driven meal plan generation  
✅ Clear preference selection interface  
✅ Async backend integration with polling  
✅ Better UX with loading states and cancellation  
