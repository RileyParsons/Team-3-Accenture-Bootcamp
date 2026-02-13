'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Users, DollarSign, Loader2 } from 'lucide-react';
import { getRecipes, Recipe } from '@/lib/api';
import { MealType } from './MealSlot';

interface RecipeBrowserModalProps {
  isOpen: boolean;
  mealType: MealType;
  onClose: () => void;
  onSelectRecipe: (recipeId: string) => void;
}

export default function RecipeBrowserModal({
  isOpen,
  mealType,
  onClose,
  onSelectRecipe,
}: RecipeBrowserModalProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRecipes();
    }
  }, [isOpen, mealType]);

  const loadRecipes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getRecipes();

      // Filter recipes by meal type
      // This is a simple filter - in production, you might have meal type tags on recipes
      const filtered = filterRecipesByMealType(data, mealType);
      setRecipes(filtered);
    } catch (err) {
      console.error('Error loading recipes:', err);
      setError('Failed to load recipes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to filter recipes by meal type
  const filterRecipesByMealType = (recipes: Recipe[], mealType: MealType): Recipe[] => {
    // For now, return all recipes
    // In a full implementation, recipes would have meal type tags
    // and we would filter based on those tags
    return recipes;
  };

  const handleSelectRecipe = (recipeId: string) => {
    onSelectRecipe(recipeId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Select a Recipe</h3>
            <p className="text-sm text-gray-600 mt-1">
              Choose a recipe for {mealType}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No recipes found for {mealType}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recipes.map((recipe) => (
                <div
                  key={recipe.recipeId}
                  onClick={() => handleSelectRecipe(recipe.recipeId)}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-green-300 transition-all cursor-pointer"
                >
                  {/* Recipe Image */}
                  <div className="h-32 bg-gray-200 relative">
                    {recipe.imageUrl ? (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                    {/* Dietary Tags */}
                    {recipe.dietaryTags.length > 0 && (
                      <div className="absolute top-2 right-2 flex flex-wrap gap-1">
                        {recipe.dietaryTags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-white/90 text-xs font-medium text-gray-700 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recipe Info */}
                  <div className="p-4">
                    <h4 className="text-base font-semibold text-gray-900 mb-1">
                      {recipe.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {recipe.description}
                    </p>

                    {/* Recipe Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{recipe.prepTime} min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{recipe.servings}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-green-600 font-medium">
                        <DollarSign className="h-3 w-3" />
                        <span>${recipe.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
