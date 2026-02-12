'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Clock,
  Users,
  DollarSign,
  Loader2,
  ArrowLeft,
  ShoppingCart,
  Plus,
  Check,
} from 'lucide-react';
import { getRecipe, Recipe } from '@/lib/api';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.recipeId as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingToMealPlan, setIsAddingToMealPlan] = useState(false);
  const [addedToMealPlan, setAddedToMealPlan] = useState(false);

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  const loadRecipe = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getRecipe(recipeId);
      setRecipe(data);
    } catch (err) {
      console.error('Error loading recipe:', err);
      setError('Failed to load recipe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToMealPlan = async () => {
    if (!recipe) return;

    setIsAddingToMealPlan(true);
    setError(null);

    try {
      // Get current meal plan from localStorage
      const storedMealPlan = localStorage.getItem('savesmart_meal_plan');
      let mealPlan: string[] = storedMealPlan ? JSON.parse(storedMealPlan) : [];

      // Check if recipe is already in meal plan
      if (mealPlan.includes(recipe.recipeId)) {
        setError('This recipe is already in your meal plan');
        setIsAddingToMealPlan(false);
        return;
      }

      // Add recipe to meal plan
      mealPlan.push(recipe.recipeId);
      localStorage.setItem('savesmart_meal_plan', JSON.stringify(mealPlan));

      setAddedToMealPlan(true);
      setTimeout(() => setAddedToMealPlan(false), 3000);
    } catch (err) {
      console.error('Error adding to meal plan:', err);
      setError('Failed to add to meal plan. Please try again.');
    } finally {
      setIsAddingToMealPlan(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error && !recipe) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Recipe not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to Recipes</span>
      </button>

      {/* Recipe Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        {/* Recipe Image */}
        <div className="h-64 bg-gray-200 relative">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image available
            </div>
          )}
          {/* Dietary Tags */}
          {recipe.dietaryTags.length > 0 && (
            <div className="absolute top-4 right-4 flex flex-wrap gap-2">
              {recipe.dietaryTags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-white/95 text-sm font-medium text-gray-700 rounded-full shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Recipe Info */}
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{recipe.name}</h1>
          <p className="text-gray-600 mb-6">{recipe.description}</p>

          {/* Recipe Stats */}
          <div className="flex items-center space-x-6 mb-6">
            <div className="flex items-center space-x-2 text-gray-700">
              <Clock className="h-5 w-5 text-gray-400" />
              <span className="font-medium">{recipe.prepTime} minutes</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="font-medium">{recipe.servings} servings</span>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <DollarSign className="h-5 w-5" />
              <span className="text-xl font-bold">${recipe.totalCost.toFixed(2)}</span>
              <span className="text-sm text-gray-500">total cost</span>
            </div>
          </div>

          {/* Add to Meal Plan Button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleAddToMealPlan}
              disabled={isAddingToMealPlan || addedToMealPlan}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                addedToMealPlan
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300'
              }`}
            >
              {addedToMealPlan ? (
                <>
                  <Check className="h-5 w-5" />
                  <span>Added to Meal Plan</span>
                </>
              ) : (
                <>
                  {isAddingToMealPlan ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                  <span>Add to Meal Plan</span>
                </>
              )}
            </button>
            <button
              onClick={() => router.push('/meal-plan')}
              className="px-6 py-3 border-2 border-green-600 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors"
            >
              View Meal Plan
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Ingredients Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <ShoppingCart className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Ingredients</h2>
        </div>

        <div className="space-y-3">
          {recipe.ingredients.map((ingredient, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{ingredient.name}</p>
                <p className="text-sm text-gray-500">
                  {ingredient.quantity} {ingredient.unit}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">${ingredient.price.toFixed(2)}</p>
                <p className="text-xs text-gray-500 capitalize">{ingredient.source}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Total Cost */}
        <div className="mt-6 pt-4 border-t-2 border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">Total Cost</span>
            <span className="text-2xl font-bold text-green-600">
              ${recipe.totalCost.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            ${(recipe.totalCost / recipe.servings).toFixed(2)} per serving
          </p>
        </div>
      </div>

      {/* Instructions Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
        <ol className="space-y-4">
          {recipe.instructions.map((instruction, index) => (
            <li key={index} className="flex space-x-4">
              <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </span>
              <p className="text-gray-700 pt-1">{instruction}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
