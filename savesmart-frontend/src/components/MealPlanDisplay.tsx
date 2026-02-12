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
    const dayPlan = mealPlan.days.find((d) => d.day === day);
    if (!dayPlan) return null;

    const meal = dayPlan.meals.find((m) => m.mealType === mealType);
    return meal || null;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header with action buttons */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Weekly Meal Plan</h1>
            <p className="text-gray-600">
              {mealPlan.nutritionSummary.averageDailyCalories.toFixed(0)} avg daily calories
            </p>
          </div>

          {/* Total Weekly Cost */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg px-6 py-4">
            <p className="text-sm text-gray-600 mb-1">Total Weekly Cost</p>
            <p className="text-3xl font-bold text-green-700">
              ${mealPlan.totalWeeklyCost.toFixed(2)}
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
      <ShoppingList shoppingList={mealPlan.shoppingList} />
    </div>
  );
}
