'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Users, DollarSign, Loader2, Search } from 'lucide-react';
import { getRecipes, Recipe } from '@/lib/api';

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDietaryFilters, setSelectedDietaryFilters] = useState<string[]>([]);
  const [selectedCuisineFilter, setSelectedCuisineFilter] = useState<string>('all');
  const [selectedMealTypeFilter, setSelectedMealTypeFilter] = useState<string>('all');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const dietaryOptions = [
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'gluten-free', label: 'Gluten-Free' },
  ];

  const cuisineOptions = [
    { value: 'all', label: 'All Cuisines' },
    { value: 'italian', label: 'Italian' },
    { value: 'asian', label: 'Asian' },
    { value: 'mexican', label: 'Mexican' },
    { value: 'indian', label: 'Indian' },
    { value: 'mediterranean', label: 'Mediterranean' },
    { value: 'american', label: 'American' },
  ];

  const mealTypeOptions = [
    { value: 'all', label: 'All Meals' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snacks' },
  ];

  const priceOptions = [
    { value: 'all', label: 'All Prices' },
    { value: 'budget', label: 'Budget ($0-$10)' },
    { value: 'moderate', label: 'Moderate ($10-$20)' },
    { value: 'premium', label: 'Premium ($20+)' },
  ];

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [recipes, selectedDietaryFilters, selectedCuisineFilter, selectedMealTypeFilter, selectedPriceFilter, searchQuery]);

  const loadRecipes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getRecipes();
      setRecipes(data);
      setFilteredRecipes(data);
    } catch (err) {
      console.error('Error loading recipes:', err);
      setError('Failed to load recipes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...recipes];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((recipe) =>
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Dietary filters
    if (selectedDietaryFilters.length > 0) {
      filtered = filtered.filter((recipe) =>
        selectedDietaryFilters.every((filter) => recipe.dietaryTags.includes(filter))
      );
    }

    // Cuisine filter
    if (selectedCuisineFilter !== 'all') {
      filtered = filtered.filter((recipe) => {
        const name = recipe.name.toLowerCase();
        const description = recipe.description.toLowerCase();
        const recipeId = recipe.recipeId.toLowerCase();

        switch (selectedCuisineFilter) {
          case 'italian':
            return name.includes('pasta') || name.includes('pizza') || name.includes('carbonara') ||
                   name.includes('bolognese') || name.includes('caprese') || recipeId.includes('italian');
          case 'asian':
            return name.includes('stir fry') || name.includes('rice') || name.includes('noodle') ||
                   name.includes('thai') || name.includes('teriyaki') || name.includes('pad thai') ||
                   name.includes('fried rice') || recipeId.includes('asian');
          case 'mexican':
            return name.includes('taco') || name.includes('burrito') || name.includes('quesadilla') ||
                   name.includes('enchilada') || recipeId.includes('mexican');
          case 'indian':
            return name.includes('curry') || name.includes('biryani') || name.includes('butter chicken') ||
                   recipeId.includes('indian');
          case 'mediterranean':
            return name.includes('falafel') || name.includes('hummus') || name.includes('moussaka') ||
                   name.includes('paella') || name.includes('mediterranean') || recipeId.includes('mediterranean');
          case 'american':
            return name.includes('burger') || name.includes('mac and cheese') || name.includes('pot pie') ||
                   name.includes('shepherd') || name.includes('fish and chips') || recipeId.includes('comfort');
          default:
            return true;
        }
      });
    }

    // Meal type filter
    if (selectedMealTypeFilter !== 'all') {
      filtered = filtered.filter((recipe) => {
        const recipeId = recipe.recipeId.toLowerCase();
        const name = recipe.name.toLowerCase();

        switch (selectedMealTypeFilter) {
          case 'breakfast':
            return recipeId.includes('breakfast') || name.includes('eggs') || name.includes('oats') ||
                   name.includes('toast') || name.includes('avocado toast');
          case 'lunch':
            return recipeId.includes('lunch') || name.includes('salad') || name.includes('wrap') ||
                   name.includes('sandwich');
          case 'dinner':
            return recipeId.includes('dinner') || (!recipeId.includes('breakfast') && !recipeId.includes('lunch') &&
                   !recipeId.includes('snack') && !name.includes('salad') && !name.includes('wrap'));
          case 'snack':
            return recipeId.includes('snack') || name.includes('hummus') || name.includes('energy balls') ||
                   name.includes('wings');
          default:
            return true;
        }
      });
    }

    // Price filter
    if (selectedPriceFilter !== 'all') {
      filtered = filtered.filter((recipe) => {
        switch (selectedPriceFilter) {
          case 'budget':
            return recipe.totalCost <= 10;
          case 'moderate':
            return recipe.totalCost > 10 && recipe.totalCost <= 20;
          case 'premium':
            return recipe.totalCost > 20;
          default:
            return true;
        }
      });
    }

    setFilteredRecipes(filtered);
  };

  const toggleDietaryFilter = (filter: string) => {
    setSelectedDietaryFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const clearAllFilters = () => {
    setSelectedDietaryFilters([]);
    setSelectedCuisineFilter('all');
    setSelectedMealTypeFilter('all');
    setSelectedPriceFilter('all');
    setSearchQuery('');
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Recipes</h1>
          <p className="text-gray-900">Find budget-friendly recipes with real-time pricing</p>
        </div>
        <button
          onClick={() => router.push('/meal-plan')}
          className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          View Meal Plan
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search recipes by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Dietary Filters */}
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-3">Dietary Preferences</h2>
          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleDietaryFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDietaryFilters.includes(option.value)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cuisine Filter */}
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-3">Cuisine Type</h2>
          <div className="flex flex-wrap gap-2">
            {cuisineOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedCuisineFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCuisineFilter === option.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Meal Type Filter */}
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-3">Meal Type</h2>
          <div className="flex flex-wrap gap-2">
            {mealTypeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedMealTypeFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMealTypeFilter === option.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price Filter */}
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-3">Price Range</h2>
          <div className="flex flex-wrap gap-2">
            {priceOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedPriceFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPriceFilter === option.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters Button */}
        {(selectedDietaryFilters.length > 0 || selectedCuisineFilter !== 'all' ||
          selectedMealTypeFilter !== 'all' || selectedPriceFilter !== 'all' || searchQuery) && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-gray-600">
              Showing {filteredRecipes.length} of {recipes.length} recipes
            </p>
            <button
              onClick={clearAllFilters}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Recipes Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-900 mb-4">No recipes found matching your filters.</p>
          <button
            onClick={clearAllFilters}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.recipeId}
              onClick={() => router.push(`/recipes/${recipe.recipeId}`)}
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
