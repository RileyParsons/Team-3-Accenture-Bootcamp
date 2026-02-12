'use client';

import MealSlot, { Meal, MealType } from './MealSlot';
import ShoppingList from './ShoppingList';

interface MealPlanPreferences {
  allergies: string[];
  calorieGoal: number;
  culturalPreference: string;
  dietType: string;
  notes: string;
}

interface MealPlanDay {
  day: string;
  meals: Meal[];
}

interface NutritionSummary {
  averageDailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

interface ShoppingListData {
  stores: {
    storeName: string;
    items: {
      name: string;
      quantity: number;
      unit: string;
      price: number;
      recipeIds: string[];
    }[];
    subtotal: number;
  }[];
  totalCost: number;
}

interface MealPlan {
  preferences: MealPlanPreferences;
  days: MealPlanDay[];
  totalWeeklyCost: number;
  nutritionSummary: NutritionSummary;
  shoppingList: ShoppingListData;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface MealPlanDisplayProps {
  mealPlan: MealPlan;
  onAddMeal: (day: string, mealType: MealType) => void;
  onRemoveMeal: (day: string, mealType: MealType) => void;
  onReplaceMeal: (day: string, mealType: MealType) => void;
  onRegenerate: () => void;
  onBrowseRecipes: () => void;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function MealPlanDisplay({
  mealPlan,
  onAddMeal,
  onRemoveMeal,
  onReplaceMeal,
  onRegenerate,
  onBrowseRecipes,
}: MealPlanDisplayProps) {
  // Helper function to find a meal for a specific day and meal type
  const getMealForSlot = (day: string, mealType: MealType): Meal | null => {
    const dayPlan = mealPlan?.days?.find((d) => d.day === day);
    if (!dayPlan) return null;

    const meal = dayPlan.meals?.find((m) => m.mealType === mealType);
    return meal || null;
  };

  // Safe formatting helpers
  const formatCalories = (): string => {
    const calories = mealPlan?.nutritionSummary?.averageDailyCalories;
    return typeof calories === 'number' ? calories.toFixed(0) : '—';
  };

  const formatWeeklyCost = (): string => {
    const cost = mealPlan?.totalWeeklyCost;
    return typeof cost === 'number' ? cost.toFixed(2) : '0.00';
  };

  // Validate meal plan has minimum required data
  if (!mealPlan || !mealPlan.days || mealPlan.days.length === 0) {
    console.warn('MealPlanDisplay: Incomplete meal plan data', mealPlan);
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">
            Incomplete Meal Plan
          </h2>
          <p className="text-yellow-700 mb-4">
            The meal plan data is incomplete or still loading. Please try regenerating your plan.
          </p>
          <button
            onClick={onRegenerate}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Regenerate Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header with action buttons */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Weekly Meal Plan</h1>
            <p className="text-gray-600">
              {formatCalories()} avg daily calories
            </p>
          </div>

          {/* Total Weekly Cost */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg px-6 py-4">
            <p className="text-sm text-gray-600 mb-1">Total Weekly Cost</p>
            <p className="text-3xl font-bold text-green-700">
              ${formatWeeklyCost()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={onBrowseRecipes}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Browse Recipes
          </button>
          <button
            onClick={onRegenerate}
            className="px-6 py-2 border border-gray-300 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Regenerate Plan
          </button>
        </div>

        {/* AI Notes */}
        {mealPlan.notes && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-900">
              <span className="font-semibold">Note:</span> {mealPlan.notes}
            </p>
          </div>
        )}
      </div>

      {/* 7-Day Meal Grid */}
      <div className="space-y-6">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{day}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {MEAL_TYPES.map((mealType) => (
                <MealSlot
                  key={`${day}-${mealType}`}
                  meal={getMealForSlot(day, mealType)}
                  day={day}
                  mealType={mealType}
                  onAdd={() => onAddMeal(day, mealType)}
                  onRemove={() => onRemoveMeal(day, mealType)}
                  onReplace={() => onReplaceMeal(day, mealType)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Shopping List */}
      {mealPlan.shoppingList ? (
        <ShoppingList shoppingList={mealPlan.shoppingList} />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Shopping List</h2>
          <p className="text-gray-600">Shopping list not available for this meal plan.</p>
        </div>
      )}
    </div>
  );
}
