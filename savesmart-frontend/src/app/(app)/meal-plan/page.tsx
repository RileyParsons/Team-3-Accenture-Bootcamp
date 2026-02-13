'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const jobIdFromUrl = searchParams.get('jobId');

  const abortRef = useRef<AbortController | null>(null);

  const [pageState, setPageState] = useState<PageState>('loading');
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRecipeBrowser, setShowRecipeBrowser] = useState(false);
  const [replacementContext, setReplacementContext] = useState<{ day: string; mealType: MealType } | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Load user + optionally load by jobId
  useEffect(() => {
    const run = async () => {
      try {
        const storedUser = localStorage.getItem('savesmart_user');
        if (!storedUser) {
          setError('Please log in to view your meal plan');
          setPageState('empty');
          return;
        }

        const parsed = JSON.parse(storedUser);
        const userIdValue: string | undefined = parsed?.userId;
        if (!userIdValue) {
          setError('Missing userId. Please log in again.');
          setPageState('empty');
          return;
        }

        setUserId(userIdValue);

        // If we were sent here after generation, load from jobId first
        if (jobIdFromUrl) {
          setPageState('loading');
          setLoadingMessage('Loading your generated meal plan...');
          setCurrentJobId(jobIdFromUrl);

          const ac = new AbortController();
          abortRef.current = ac;

          const pollResult: any = await pollGroceriesJob(jobIdFromUrl, {
            signal: ac.signal,
            timeoutMs: 90000, // should be instant if backend already done
          });

          const plan: MealPlan | null = (pollResult?.result ?? pollResult) || null;
          if (!plan) throw new Error('No meal plan was returned for this job.');

          setMealPlan(plan);
          setPageState('display');
          setCurrentJobId(null);
          return;
        }

        // Fallback: load existing plan (if any)
        const existingPlan = await getMealPlan(userIdValue);
        if (existingPlan) {
          setMealPlan(existingPlan);
          setPageState('display');
        } else {
          setPageState('empty');
        }
      } catch (err) {
        console.error('MealPlanPage init error:', err);
        setPageState('empty');
      }
    };

    run();

    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [jobIdFromUrl]);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleGenerateMealPlan = async (preferences: MealPlanPreferences) => {
    // cancel any existing poll
    abortRef.current?.abort();

    const ac = new AbortController();
    abortRef.current = ac;

    setPageState('loading');
    setLoadingMessage('Starting meal plan generation...');
    setError(null);
    setCurrentJobId(null);

    let timer: ReturnType<typeof setTimeout> | null = null;

    try {
      const storedUser = localStorage.getItem('savesmart_user');
      if (!storedUser) throw new Error('Please log in to generate a meal plan');

      const parsed = JSON.parse(storedUser);
      const effectiveUserId: string | undefined = parsed?.userId;
      if (!effectiveUserId) throw new Error('Missing userId. Please log in again.');

      const jobId = await startGroceriesJob(effectiveUserId, preferences);
      setCurrentJobId(jobId);
      setLoadingMessage(`Generating your meal plan (Job: ${jobId.substring(0, 8)}...)...`);

      timer = setTimeout(() => {
        setLoadingMessage('AI is working on your personalized meal plan. This may take a moment...');
      }, 5000);

      const pollResult: any = await pollGroceriesJob(jobId, {
        signal: ac.signal,
        timeoutMs: 240000,
      });

      const plan: MealPlan | null = (pollResult?.result ?? pollResult) || null;
      if (!plan) throw new Error('Job completed but no meal plan was returned.');

      setMealPlan(plan);
      setPageState('display');
      setCurrentJobId(null);
      showSuccessMessage('Meal plan generated successfully!');
    } catch (err) {
      console.error('Error generating meal plan:', err);

      if (ac.signal.aborted) {
        setError('Meal plan generation was cancelled');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate meal plan');
      }

      setPageState('error');
      setCurrentJobId(null);
    } finally {
      if (timer) clearTimeout(timer);
      abortRef.current = null;
    }
  };

  const handleRegenerate = () => setPageState('preferences');

  const handleAddMeal = async (day: string, mealType: MealType) => {
    router.push(`/recipes?addToMealPlan=true&day=${day}&mealType=${mealType}`);
  };

  const handleRemoveMeal = async (day: string, mealType: MealType) => {
    if (!userId || !mealPlan) return;

    const confirmed = window.confirm(`Are you sure you want to remove this ${mealType} from ${day}?`);
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

  const handleReplaceMeal = async (day: string, mealType: MealType) => {
    setReplacementContext({ day, mealType });
    setShowRecipeBrowser(true);
  };

  const handleSelectRecipe = async (recipeId: string) => {
    if (!userId || !replacementContext) return;

    setLoadingMessage('Replacing meal...');
    setError(null);

    try {
      await removeMealFromSlot(userId, replacementContext.day, replacementContext.mealType);
      const updatedPlan = await addMealToSlot(userId, replacementContext.day, replacementContext.mealType, recipeId);
      setMealPlan(updatedPlan);
      showSuccessMessage('Meal replaced successfully!');
      setReplacementContext(null);
    } catch (err) {
      console.error('Error replacing meal:', err);
      setError(err instanceof Error ? err.message : 'Failed to replace meal');
    }
  };

  const handleBrowseRecipes = () => router.push('/recipes');

  const handleCreateMealPlan = () => setPageState('preferences');

  // EMPTY
  if (pageState === 'empty') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Meal Plan Yet</h1>
            <p className="text-gray-600">Create a personalized weekly meal plan based on your preferences.</p>
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

  // ERROR
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Generation Failed</h1>
            <p className="text-gray-600 mb-4">{error || 'An error occurred while generating your meal plan'}</p>
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

  // PREFERENCES
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

  // LOADING
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg className="w-10 h-10 text-green-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{loadingMessage}</h2>
            <p className="text-gray-600 text-sm">This may take a few moments...</p>
            {currentJobId && <p className="text-xs text-gray-400 mt-2 font-mono">Job ID: {currentJobId}</p>}
          </div>

          {abortRef.current && (
            <button
              onClick={() => {
                abortRef.current?.abort();
                abortRef.current = null;
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

  // DISPLAY
  if (pageState === 'display' && mealPlan) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-6">
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
            <p className="font-medium">{successMessage}</p>
          </div>
        )}

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