'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import { startGroceriesJob, pollGroceriesJob } from '@/lib/api';

export default function RecipesPage() {
  const router = useRouter();

  const abortRef = useRef<AbortController | null>(null);

  const [selectedDietaryFilters, setSelectedDietaryFilters] = useState<string[]>([]);
  const [selectedCuisineFilter, setSelectedCuisineFilter] = useState<string>('all');
  const [selectedMealTypeFilter, setSelectedMealTypeFilter] = useState<string>('all');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

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

  const handleGenerateMealPlan = async () => {
    // Cancel any existing run
    abortRef.current?.abort();

    const newAbortController = new AbortController();
    abortRef.current = newAbortController;

    setIsGenerating(true);
    setError(null);
    setCurrentJobId(null);

    try {
      // Get userId from localStorage (source of truth)
      const storedUser = localStorage.getItem('savesmart_user');
      if (!storedUser) throw new Error('Please log in to generate a meal plan');

      const parsed = JSON.parse(storedUser);
      const userId: string | undefined = parsed?.userId;
      if (!userId) throw new Error('Missing userId. Please log in again.');

      // Build preferences from selected filters
      const preferences = {
        allergies: selectedDietaryFilters.includes('gluten-free') ? ['gluten'] : [],
        calorieGoal: 2000,
        culturalPreference: selectedCuisineFilter !== 'all' ? selectedCuisineFilter : 'none',
        dietType: selectedDietaryFilters.includes('vegan')
          ? 'vegan'
          : selectedDietaryFilters.includes('vegetarian')
          ? 'vegetarian'
          : 'balanced',
        notes: `Meal type: ${selectedMealTypeFilter}, Price range: ${selectedPriceFilter}${
          searchQuery ? `, Notes: ${searchQuery}` : ''
        }`,
      };

      // Step 1: Start job (POST /groceries) -> {jobId}
      const jobId = await startGroceriesJob(userId, preferences);
      setCurrentJobId(jobId);

      // Step 2: Poll for completion (GET /groceries/{jobId})
      await pollGroceriesJob(jobId, {
        signal: newAbortController.signal,
        timeoutMs: 240000, // 4 mins to be safe
      });

      // IMPORTANT: navigate with jobId so meal-plan can load the generated result
      router.push(`/meal-plan?jobId=${encodeURIComponent(jobId)}`);
    } catch (err) {
      console.error('Error generating meal plan:', err);

      if (newAbortController.signal.aborted) {
        setError('Meal plan generation was cancelled');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate meal plan. Please try again.');
      }
    } finally {
      setIsGenerating(false);
      setCurrentJobId(null);
      abortRef.current = null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Meal Plan</h1>
          <p className="text-gray-600">Choose your preferences, then generate a personalized meal plan</p>
        </div>
        <button
          onClick={() => router.push('/meal-plan')}
          className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
        >
          View Meal Plan
        </button>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Add notes or specific requests (optional)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isGenerating}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-3">Dietary Preferences</h2>
          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleDietaryFilter(option.value)}
                disabled={isGenerating}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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

        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-3">Cuisine Type</h2>
          <div className="flex flex-wrap gap-2">
            {cuisineOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedCuisineFilter(option.value)}
                disabled={isGenerating}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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

        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-3">Meal Type</h2>
          <div className="flex flex-wrap gap-2">
            {mealTypeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedMealTypeFilter(option.value)}
                disabled={isGenerating}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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

        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-3">Price Range</h2>
          <div className="flex flex-wrap gap-2">
            {priceOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedPriceFilter(option.value)}
                disabled={isGenerating}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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

        {(selectedDietaryFilters.length > 0 ||
          selectedCuisineFilter !== 'all' ||
          selectedMealTypeFilter !== 'all' ||
          selectedPriceFilter !== 'all' ||
          searchQuery) && (
          <div className="flex items-center justify-end pt-2">
            <button
              onClick={clearAllFilters}
              disabled={isGenerating}
              className="text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 mb-2">{error}</p>
          <button onClick={handleGenerateMealPlan} className="text-sm text-red-600 hover:text-red-700 font-medium">
            Try Again
          </button>
        </div>
      )}

      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-8 mb-8">
        <div className="max-w-2xl mx-auto text-center">
          <Sparkles className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to Generate Your Meal Plan?</h2>
          <p className="text-gray-600 mb-6">
            Based on your preferences, we'll create a personalized 7-day meal plan and a shopping list.
          </p>
        </div>
      </div>

      <div className="flex justify-center pb-6">
        <button
          onClick={handleGenerateMealPlan}
          disabled={isGenerating}
          className="px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-3 shadow-lg hover:shadow-xl"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Generating Meal Plan...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-6 w-6" />
              <span>Generate Meal Plan</span>
            </>
          )}
        </button>
      </div>

      {isGenerating && currentJobId && (
        <div className="text-center text-sm text-gray-500 pb-8">
          <p>Job ID: {currentJobId}</p>
          <p className="mt-2">This may take a few moments...</p>
          <button
            onClick={() => abortRef.current?.abort()}
            className="mt-4 text-gray-600 hover:text-gray-800 underline"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}