'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PreferencesForm, { MealPlanPreferences } from '@/components/PreferencesForm';
import MealPlanDisplay from '@/components/MealPlanDisplay';
import RecipeBrowserModal from '@/components/RecipeBrowserModal';
import { MealType } from '@/components/MealSlot';
import {
  startGroceriesJob,
  pollGroceriesJob,
  getMealPlan,
  removeMealFromSlot,
  addMealToSlot,
  MealPlan,
} from '@/lib/api';

type PageState = 'empty' | 'preferences' | 'loading' | 'display' | 'error';

export default function MealPlanPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRecipeBrowser, setShowRecipeBrowser] = useState(false);
  const [replacementContext, setReplacementContext] = useState<{
    day: string;
    mealType: MealType;
  } | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Load userId and check for existing meal plan on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get userId from localStorage
        const storedUser = localStorage.getItem('savesmart_user');
        if (!storedUser) {
          setError('Please log in to view your meal plan');
          setPageState('empty');
          return;
        }

        const userData = JSON.parse(storedUser);
        const userIdValue = userData.userId || 'u_1770877895466_4kjplxhml';
        setUserId(userIdValue);

        // Check if user has an existing meal plan
        const existingPlan = await getMealPlan(userIdValue);
        if (existingPlan) {
          setMealPlan(existingPlan);
          setPageState('display');
        } else {
          setPageState('empty');
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setPageState('empty');
      }
    };

    loadUserData();

    // Cleanup: abort any ongoing polling when component unmounts
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, []);

  // Handle meal plan generation (async workflow)
  const handleGenerateMealPlan = async (preferences: MealPlanPreferences) => {
    // Cancel any existing polling
    if (abortController) {
      abortController.abort();
    }

    const newAbortController = new AbortController();
    setAbortController(newAbortController);

    setPageState('loading');
    setLoadingMessage('Starting meal plan generation...');
    setError(null);
    setCurrentJobId(null);

    try {
      // Step 1: Start the job (POST /groceries returns jobId with 202)
      const jobId = await startGroceriesJob(userId, preferences);
      setCurrentJobId(jobId);
      setLoadingMessage(`Generating your meal plan (Job: ${jobId.substring(0, 8)}...)...`);

      // Set a timer to update the message after 5 seconds
      const longRunningTimer = setTimeout(() => {
        setLoadingMessage('AI is working on your personalized meal plan. This may take a moment...');
      }, 5000);

      // Step 2: Poll for completion (GET /groceries/{jobId} until SUCCEEDED/ERROR)
      const result = await pollGroceriesJob(jobId, {
        signal: newAbortController.signal,
        timeoutMs: 180000, // 3 minutes
      });

      clearTimeout(longRunningTimer);
      
      // Success!
      setMealPlan(result);
      setPageState('display');
      setCurrentJobId(null);
      showSuccessMessage('Meal plan generated successfully!');
    } catch (err) {
      console.error('Error generating meal plan:', err);
      
      // Check if it was cancelled
      if (err instanceof Error && err.message.includes('cancelled')) {
        setError('Meal plan generation was cancelled');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate meal plan');
      }
      
      setPageState('error');
      setCurrentJobId(null);
    } finally {
      setAbortController(null);
    }
  };

  // Handle meal plan regeneration
  const handleRegenerate = () => {
    // Cancel any ongoing polling
    if (abortController) {
      abortController.abort();
    }
    setPageState('preferences');
  };

  // Handle adding a meal to a slot
  const handleAddMeal = async (day: string, mealType: MealType) => {
    // For now, navigate to recipes page with context
    // In a full implementation, this would open a recipe browser modal
    router.push(`/recipes?addToMealPlan=true&day=${day}&mealType=${mealType}`);
  };

  // Handle removing a meal from a slot
  const handleRemoveMeal = async (day: string, mealType: MealType) => {
    if (!userId || !mealPlan) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to remove this ${mealType} from ${day}?`
    );

    if (!confirmed) return;

    setLoadingMessage('Removing meal...');
    setError(null);

    try {
      const updatedPlan = await removeMealFromSlot(userId, day, mealType);
      setMealPlan(updatedPlan);
      showSuccessMessage('Meal removed successfully!');
    } catch (err) {
      console.error('Error removing meal:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove meal');
    }
  };

  // Handle replacing a meal in a slot
  const handleReplaceMeal = async (day: string, mealType: MealType) => {
    setReplacementContext({ day, mealType });
    setShowRecipeBrowser(true);
  };

  // Handle recipe selection from browser modal
  const handleSelectRecipe = async (recipeId: string) => {
    if (!userId || !replacementContext) return;

    setLoadingMessage('Replacing meal...');
    setError(null);

    try {
      // First remove the old meal, then add the new one
      await removeMealFromSlot(userId, replacementContext.day, replacementContext.mealType);
      const updatedPlan = await addMealToSlot(
        userId,
        replacementContext.day,
        replacementContext.mealType,
        recipeId
      );
      setMealPlan(updatedPlan);
      showSuccessMessage('Meal replaced successfully!');
      setReplacementContext(null);
    } catch (err) {
      console.error('Error replacing meal:', err);
      setError(err instanceof Error ? err.message : 'Failed to replace meal');
    }
  };

  // Handle browsing recipes
  const handleBrowseRecipes = () => {
    router.push('/recipes');
  };

  // Handle creating a new meal plan
  const handleCreateMealPlan = () => {
    setPageState('preferences');
  };

  // Show success message temporarily
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Render empty state
  if (pageState === 'empty') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              No Meal Plan Yet
            </h1>
            <p className="text-gray-600">
              Create a personalized weekly meal plan based on your dietary preferences and goals.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleCreateMealPlan}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Create Meal Plan
          </button>
        </div>
      </div>
    );
  }

  // Render error state
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Generation Failed
            </h1>
            <p className="text-gray-600 mb-4">
              {error || 'An error occurred while generating your meal plan'}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setPageState('preferences')}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Try Again
            </button>
            {mealPlan && (
              <button
                onClick={() => setPageState('display')}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                View Previous Plan
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render preferences form
  if (pageState === 'preferences') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-6">
        {error && (
          <div className="max-w-2xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <PreferencesForm
          initialPreferences={mealPlan?.preferences}
          onSubmit={handleGenerateMealPlan}
          onCancel={mealPlan ? () => setPageState('display') : undefined}
        />
      </div>
    );
  }

  // Render loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg
                className="w-10 h-10 text-green-600 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {loadingMessage}
            </h2>
            <p className="text-gray-600 text-sm">
              This may take a few moments...
            </p>
            {currentJobId && (
              <p className="text-xs text-gray-400 mt-2 font-mono">
                Job ID: {currentJobId}
              </p>
            )}
          </div>
          {abortController && (
            <button
              onClick={() => {
                abortController.abort();
                setPageState('preferences');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render meal plan display
  if (pageState === 'display' && mealPlan) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-6">
        {/* Success message toast */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
            <p className="font-medium">{successMessage}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="max-w-7xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <MealPlanDisplay
          mealPlan={mealPlan}
          onAddMeal={handleAddMeal}
          onRemoveMeal={handleRemoveMeal}
          onReplaceMeal={handleReplaceMeal}
          onRegenerate={handleRegenerate}
          onBrowseRecipes={handleBrowseRecipes}
        />

        {/* Recipe Browser Modal for Replacement */}
        {showRecipeBrowser && replacementContext && (
          <RecipeBrowserModal
            isOpen={showRecipeBrowser}
            mealType={replacementContext.mealType}
            onClose={() => {
              setShowRecipeBrowser(false);
              setReplacementContext(null);
            }}
            onSelectRecipe={handleSelectRecipe}
          />
        )}
      </div>
    );
  }

  return null;
}
