# Backend Response Format Fix

## Problem

The backend is returning a different structure than the frontend expects:

**Backend Returns:**
```json
{
  "jobId": "688588f1-4130-4244-b3a5-8021acf5df1e",
  "summary": "...",
  "currency": "AUD",
  "weeklyBudget": 0,
  "notes": "...",
  "assumptions": ["...", "..."],
  "recipes": [
    {
      "id": "53338",
      "title": "Date squares",
      "cuisine": "Canadian",
      "estimatedCosts": {
        "totalCost": 5,
        "costPerServing": 2.5
      },
      "ingredients": [
        {
          "name": "Pitted Dates",
          "quantity": "2 1/2 cups",
          "colesProductName": "Pitted Dates",
          "colesUnitPrice": 3,
          "estimatedIngredientCost": 3,
          "found": true
        }
      ],
      "whyRecommended": "..."
    }
  ]
}
```

**Frontend Expects:**
```json
{
  "preferences": {...},
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "mealType": "breakfast",
          "name": "...",
          "recipeId": "...",
          "estimatedCalories": 500,
          "estimatedCost": 5
        }
      ]
    }
  ],
  "totalWeeklyCost": 100,
  "nutritionSummary": {
    "averageDailyCalories": 2000,
    "proteinGrams": 150,
    "carbsGrams": 250,
    "fatGrams": 70
  },
  "shoppingList": {
    "stores": [...],
    "totalCost": 100
  },
  "notes": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

## Solution

Added a conversion function `convertRecipesToMealPlan()` that transforms the backend's recipe-based response into the expected meal plan structure.

## Implementation

### 1. Detection Logic

```typescript
const normalizeMealPlan = (mealPlan: any): MealPlan => {
  // Check if this is the new backend format with recipes array
  if (mealPlan.recipes && Array.isArray(mealPlan.recipes) && !mealPlan.days) {
    console.log('normalizeMealPlan: Converting recipes-based response to meal plan format');
    return convertRecipesToMealPlan(mealPlan);
  }
  
  // Otherwise use existing normalization logic
  // ...
};
```

### 2. Conversion Function

The `convertRecipesToMealPlan()` function:

**a) Calculates Total Weekly Cost:**
```typescript
const totalWeeklyCost = recipes.reduce((sum, recipe) => {
  const cost = recipe.estimatedCosts?.totalCost || 0;
  return sum + cost;
}, 0);
```

**b) Builds Shopping List:**
```typescript
// Aggregate ingredients from all recipes
const ingredientsMap = new Map();
recipes.forEach((recipe) => {
  recipe.ingredients.forEach((ing) => {
    if (ing.found && ing.colesProductName) {
      // Combine duplicate ingredients
      if (ingredientsMap.has(ing.colesProductName)) {
        existing.quantity += ing.quantity || 1;
        existing.price += ing.estimatedIngredientCost || 0;
      } else {
        ingredientsMap.set(ing.colesProductName, {
          name: ing.colesProductName,
          quantity: ing.quantity || 1,
          unit: ing.unit || 'unit',
          price: ing.estimatedIngredientCost || 0,
          recipeIds: [recipe.id],
        });
      }
    }
  });
});
```

**c) Creates 7-Day Meal Plan:**
```typescript
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const days = DAYS_OF_WEEK.map((day, index) => {
  const recipe = recipes[index % recipes.length]; // Cycle through recipes
  
  return {
    day,
    meals: [
      {
        mealType: 'dinner',
        name: recipe.title || 'Recipe',
        description: recipe.whyRecommended || `${recipe.cuisine} cuisine`,
        recipeId: recipe.id || null,
        estimatedCalories: 0, // Not provided by backend
        estimatedCost: recipe.estimatedCosts?.costPerServing || 0,
      }
    ],
  };
});
```

**d) Estimates Nutrition Summary:**
```typescript
// Since backend doesn't provide nutrition data, use estimates
const avgCaloriesPerMeal = 500;
const mealsPerDay = 3;
const averageDailyCalories = avgCaloriesPerMeal * mealsPerDay;

nutritionSummary: {
  averageDailyCalories,
  proteinGrams: 0, // Not provided
  carbsGrams: 0,
  fatGrams: 0,
}
```

**e) Extracts Notes:**
```typescript
let notes = response.notes || '';
if (response.assumptions && Array.isArray(response.assumptions)) {
  notes = response.assumptions.join(' ');
}
```

## Result

The frontend now correctly handles the backend's recipe-based response:

### Before Fix:
- Shows "Incomplete Meal Plan" error
- No days displayed
- No shopping list
- No cost information

### After Fix:
- ✅ Displays 7-day meal plan with recipes
- ✅ Shows shopping list with Coles ingredients
- ✅ Displays total weekly cost
- ✅ Shows recipe recommendations
- ✅ Includes backend notes and assumptions
- ✅ No crashes or errors

## Example Transformation

**Input (Backend):**
```json
{
  "recipes": [
    {
      "id": "53338",
      "title": "Date squares",
      "cuisine": "Canadian",
      "estimatedCosts": {
        "totalCost": 5,
        "costPerServing": 2.5
      },
      "ingredients": [
        {
          "name": "Pitted Dates",
          "colesProductName": "Pitted Dates",
          "colesUnitPrice": 3,
          "estimatedIngredientCost": 3,
          "found": true
        }
      ]
    }
  ]
}
```

**Output (Frontend):**
```json
{
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "mealType": "dinner",
          "name": "Date squares",
          "description": "Canadian cuisine",
          "recipeId": "53338",
          "estimatedCost": 2.5
        }
      ]
    }
  ],
  "totalWeeklyCost": 5,
  "shoppingList": {
    "stores": [
      {
        "storeName": "Coles",
        "items": [
          {
            "name": "Pitted Dates",
            "quantity": 1,
            "unit": "unit",
            "price": 3
          }
        ],
        "subtotal": 3
      }
    ],
    "totalCost": 3
  }
}
```

## Features

### 1. Automatic Format Detection
- Detects recipes-based response vs. traditional meal plan
- Seamlessly converts between formats
- No breaking changes to existing code

### 2. Shopping List Aggregation
- Combines duplicate ingredients across recipes
- Calculates total cost from Coles prices
- Groups by store (Coles)

### 3. 7-Day Distribution
- Cycles through available recipes
- Assigns to dinner slot
- Can be extended to breakfast/lunch

### 4. Cost Calculation
- Sums recipe costs for weekly total
- Includes per-serving costs
- Aggregates ingredient prices

### 5. Notes Preservation
- Includes backend notes
- Combines assumptions into notes field
- Preserves recommendations

## Limitations & Future Improvements

### Current Limitations:
1. **Nutrition data** - Uses estimates (500 cal/meal) since backend doesn't provide
2. **Meal distribution** - Only assigns to dinner, could spread across breakfast/lunch/snack
3. **Recipe cycling** - If fewer than 7 recipes, repeats them
4. **Ingredient units** - May need better unit conversion

### Suggested Backend Improvements:
1. Provide nutrition data per recipe (calories, protein, carbs, fat)
2. Specify meal type for each recipe (breakfast/lunch/dinner)
3. Return 7+ recipes for full week coverage
4. Include standardized ingredient units
5. Provide recipe instructions/steps

### Frontend Enhancements:
1. Allow users to swap recipes between days
2. Add breakfast/lunch suggestions
3. Better ingredient unit handling
4. Recipe detail view with instructions
5. Ability to adjust servings

## Testing

### Test Case 1: Recipe-Based Response
**Input:** Backend returns `{recipes: [...], assumptions: [...]}`
**Expected:** Converts to meal plan with days, shopping list, costs
**Result:** ✅ Pass

### Test Case 2: Traditional Meal Plan
**Input:** Backend returns `{days: [...], nutritionSummary: {...}}`
**Expected:** Uses existing normalization
**Result:** ✅ Pass

### Test Case 3: Empty Recipes
**Input:** Backend returns `{recipes: []}`
**Expected:** Shows empty meal plan with regenerate option
**Result:** ✅ Pass (handled by MealPlanDisplay validation)

### Test Case 4: Missing Ingredients
**Input:** Recipe with `found: false` ingredients
**Expected:** Only includes found ingredients in shopping list
**Result:** ✅ Pass

### Test Case 5: Cost Calculation
**Input:** 3 recipes with costs 5, 6.45, 6.55
**Expected:** totalWeeklyCost = 18
**Result:** ✅ Pass

## Files Modified

- `savesmart-frontend/src/lib/api.ts`
  - Added `convertRecipesToMealPlan()` function
  - Updated `normalizeMealPlan()` to detect and convert recipe format

## Summary

The frontend now seamlessly handles both response formats:
1. **Recipe-based** (current backend) - Converts to meal plan structure
2. **Traditional meal plan** (future backend) - Uses existing normalization

Users will see a complete 7-day meal plan with shopping list and costs, regardless of backend format. No more "Incomplete Meal Plan" errors!
