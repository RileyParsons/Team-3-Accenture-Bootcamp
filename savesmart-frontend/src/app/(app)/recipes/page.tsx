'use client';

import { useState, useEffect } from 'react';
import { Clock, Users, DollarSign, Loader2 } from 'lucide-react';
import { getRecipes, Recipe } from '@/lib/api';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const dietaryOptions = [
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'gluten-free', label: 'Gluten-Free' },
  ];

  useEffect(() => {
    loadRecipes();
  }, [selectedFilters]);

  const loadRecipes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getRecipes(selectedFilters.length > 0 ? selectedFilters : undefined);
      setRecipes(data);
    } catch (err) {
      console.error('Error loading recipes:', err);
      setError('Failed to load recipes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFilter = (filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Recipes</h1>
        <p className="text-gray-600">Find budget-friendly recipes with real-time pricing</p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Dietary Preferences</h2>
        <div className="flex flex-wrap gap-2">
          {dietaryOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => toggleFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilters.includes(option.value)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Recipes Grid */}
      {recipes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No recipes found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div
              key={recipe.recipeId}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              {/* Recipe Image */}
              <div className="h-48 bg-gray-200 relative">
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
                    {recipe.dietaryTags.map((tag) => (
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{recipe.name}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{recipe.description}</p>

                {/* Recipe Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{recipe.prepTime} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{recipe.servings} servings</span>
                  </div>
                  <div className="flex items-center space-x-1 text-green-600 font-medium">
                    <DollarSign className="h-4 w-4" />
                    <span>${recipe.totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
