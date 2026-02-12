'use client';

import Link from 'next/link';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  mealType: MealType;
  name: string;
  description: string;
  recipeId: string | null;
  estimatedCalories: number;
  estimatedCost: number;
}

interface MealSlotProps {
  meal: Meal | null;
  day: string;
  mealType: MealType;
  onAdd: () => void;
  onRemove: () => void;
  onReplace: () => void;
}

export default function MealSlot({ meal, day, mealType, onAdd, onRemove, onReplace }: MealSlotProps) {
  // Empty state - no meal assigned
  if (!meal) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors">
        <p className="text-sm text-gray-500 mb-3 capitalize">{mealType}</p>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          Add Meal
        </button>
      </div>
    );
  }

  // Filled state - meal exists
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      <p className="text-xs text-gray-500 mb-2 capitalize">{mealType}</p>

      {/* Meal name - clickable if recipeId exists */}
      {meal.recipeId ? (
        <Link
          href={`/recipes/${meal.recipeId}`}
          className="text-sm font-semibold text-gray-900 hover:text-green-600 transition-colors block mb-1"
        >
          {meal.name}
        </Link>
      ) : (
        <h4 className="text-sm font-semibold text-gray-900 mb-1">{meal.name}</h4>
      )}

      {/* Meal description */}
      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{meal.description}</p>

      {/* Meal info */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span>{meal.estimatedCalories} cal</span>
        <span>${meal.estimatedCost.toFixed(2)}</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onReplace}
          className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-900 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
        >
          Replace
        </button>
        <button
          onClick={onRemove}
          className="flex-1 px-3 py-1.5 border border-red-300 text-red-600 rounded text-xs font-medium hover:bg-red-50 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
