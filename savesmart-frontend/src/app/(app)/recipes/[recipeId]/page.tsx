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
  X,
  Store,
  TrendingDown,
} from 'lucide-react';
import { getRecipe, Recipe, addMealToSlot, MealType } from '@/lib/api';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.recipeId as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingToMealPlan, setIsAddingToMealPlan] = useState(false);
  const [addedToMealPlan, setAddedToMealPlan] = useState(false);
  const [showMealPlanModal, setShowMealPlanModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

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

  const handleAddToMealPlan = () => {
    setShowMealPlanModal(true);
    setError(null);
  };

  const handleConfirmAddToMealPlan = async () => {
    if (!recipe) return;

    // Get userId from localStorage
    const storedUser = localStorage.getItem('savesmart_user');
    if (!storedUser) {
      setError('Please log in to add meals to your plan');
      setShowMealPlanModal(false);
      return;
    }

    const userData = JSON.parse(storedUser);
    const userId = userData.userId;

    setIsAddingToMealPlan(true);
    setError(null);

    try {
      await addMealToSlot(userId, selectedDay, selectedMealType, recipe.recipeId);

      setShowMealPlanModal(false);
      setAddedToMealPlan(true);
      setSuccessMessage(`Added to ${selectedDay} ${selectedMealType}!`);

      setTimeout(() => {
        setAddedToMealPlan(false);
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error adding to meal plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to add to meal plan. Please try again.');
      setShowMealPlanModal(false);
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

          {successMessage && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
              {successMessage}
            </div>
          )}
        </div>
      </div>

      {/* Meal Plan Selection Modal */}
      {showMealPlanModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)' }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add to Meal Plan</h3>
              <button
                onClick={() => setShowMealPlanModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Select when you'd like to have this meal:
            </p>

            {/* Day Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Meal Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meal Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {mealTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedMealType(type)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                      selectedMealType === type
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowMealPlanModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddToMealPlan}
                disabled={isAddingToMealPlan}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 flex items-center justify-center space-x-2"
              >
                {isAddingToMealPlan ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <span>Add to Plan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Comparison Section */}
      {recipe.storePricing && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Store className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Price Comparison</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Coles Card */}
            <div
              className={`border-2 rounded-lg p-4 transition-all ${
                recipe.storePricing.cheapest === 'coles'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">C</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Coles</h3>
                </div>
                {recipe.storePricing.cheapest === 'coles' && (
                  <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                    <TrendingDown className="h-4 w-4" />
                    <span>Cheapest</span>
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ${recipe.storePricing.coles.toFixed(2)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                ${(recipe.storePricing.coles / recipe.servings).toFixed(2)} per serving
              </p>
            </div>

            {/* Woolworths Card */}
            <div
              className={`border-2 rounded-lg p-4 transition-all ${
                recipe.storePricing.cheapest === 'woolworths'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">W</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Woolworths</h3>
                </div>
                {recipe.storePricing.cheapest === 'woolworths' && (
                  <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                    <TrendingDown className="h-4 w-4" />
                    <span>Cheapest</span>
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ${recipe.storePricing.woolworths.toFixed(2)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                ${(recipe.storePricing.woolworths / recipe.servings).toFixed(2)} per serving
              </p>
            </div>
          </div>

          {/* Savings Banner */}
          {recipe.storePricing.savings > 0 && (
            <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3 flex items-center justify-center space-x-2">
              <TrendingDown className="h-5 w-5 text-green-700" />
              <p className="text-green-800 font-medium">
                Save ${recipe.storePricing.savings.toFixed(2)} by shopping at{' '}
                <span className="font-bold capitalize">{recipe.storePricing.cheapest}</span>
              </p>
            </div>
          )}
        </div>
      )}

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
              className="py-3 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{ingredient.name}</p>
                  <p className="text-sm text-gray-500">
                    {ingredient.quantity} {ingredient.unit}
                  </p>
                </div>
              </div>

              {/* Side-by-side price comparison for each ingredient */}
              {ingredient.colesPrice !== undefined && ingredient.woolworthsPrice !== undefined && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {/* Coles Price */}
                  <div
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                      ingredient.colesPrice <= ingredient.woolworthsPrice
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">C</span>
                      </div>
                      <span className="text-xs text-gray-600">Coles</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold text-gray-900">
                        ${ingredient.colesPrice.toFixed(2)}
                      </span>
                      {ingredient.colesPrice < ingredient.woolworthsPrice && (
                        <TrendingDown className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                  </div>

                  {/* Woolworths Price */}
                  <div
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                      ingredient.woolworthsPrice < ingredient.colesPrice
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">W</span>
                      </div>
                      <span className="text-xs text-gray-600">Woolworths</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold text-gray-900">
                        ${ingredient.woolworthsPrice.toFixed(2)}
                      </span>
                      {ingredient.woolworthsPrice < ingredient.colesPrice && (
                        <TrendingDown className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                  </div>
                </div>
              )}
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
