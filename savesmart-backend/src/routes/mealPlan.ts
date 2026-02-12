/**
 * Meal Plan Routes
 *
 * Provides endpoints for creating and managing meal plans.
 */

import { Router, Request, Response } from 'express';
import { DynamoDBService } from '../services/dynamodb.js';
import { WebhookService } from '../services/webhooks.js';
import { ShoppingListGenerator } from '../utils/ShoppingListGenerator.js';
import type { MealPlanPreferences, MealPlan } from '../models/MealPlan.js';
import type { Recipe } from '../models/Recipe.js';

const router = Router();

let dbService: DynamoDBService | null = null;
let webhookService: WebhookService | null = null;

function getDBService(): DynamoDBService {
  if (!dbService) {
    dbService = new DynamoDBService();
  }
  return dbService;
}

function getWebhookService(): WebhookService {
  if (!webhookService) {
    webhookService = new WebhookService();
  }
  return webhookService;
}

/**
 * POST /api/meal-plan/generate
 *
 * Generate AI-powered meal plan from user preferences
 * Requirements: 3.1, 3.2, 3.8, 10.1, 10.2, 12.1
 */
router.post('/meal-plan/generate', async (req: Request, res: Response) => {
  try {
    const { userId, preferences } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'userId is required',
        retryable: false,
      });
    }

    if (!preferences) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'preferences is required',
        retryable: false,
      });
    }

    // Validate preferences structure
    const prefs = preferences as MealPlanPreferences;
    if (!Array.isArray(prefs.allergies)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'preferences.allergies must be an array',
        retryable: false,
      });
    }

    if (typeof prefs.calorieGoal !== 'number') {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'preferences.calorieGoal must be a number',
        retryable: false,
      });
    }

    // Verify user exists
    const user = await getDBService().getUser(userId);
    if (!user) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'User not found',
        retryable: false,
      });
    }

    console.log(`Generating meal plan for user ${userId}`);

    // Call WebhookService to generate meal plan
    const aiResponse = await getWebhookService().generateMealPlan(prefs);

    console.log('AI meal plan generated, fetching recipe details');

    // Fetch recipe details for all recipe IDs in the plan
    const recipeIds = new Set<string>();
    for (const day of aiResponse.days) {
      for (const meal of day.meals) {
        if (meal.recipeId) {
          recipeIds.add(meal.recipeId);
        }
      }
    }

    const recipes: Recipe[] = [];
    for (const recipeId of recipeIds) {
      try {
        const recipe = await getDBService().getRecipe(recipeId);
        if (recipe) {
          recipes.push(recipe);
        }
      } catch (error) {
        console.warn(`Failed to fetch recipe ${recipeId}:`, error);
      }
    }

    console.log(`Fetched ${recipes.length} recipes, generating shopping list`);

    // Build complete meal plan structure
    const now = new Date().toISOString();
    const mealPlan: MealPlan = {
      preferences: prefs,
      days: aiResponse.days,
      totalWeeklyCost: aiResponse.totalWeeklyCost,
      nutritionSummary: aiResponse.nutritionSummary,
      shoppingList: { stores: [], totalCost: 0 }, // Will be generated next
      notes: aiResponse.notes,
      createdAt: now,
      updatedAt: now,
    };

    // Generate shopping list using ShoppingListGenerator
    mealPlan.shoppingList = ShoppingListGenerator.generateShoppingList(mealPlan, recipes);

    // Calculate total weekly cost from shopping list
    mealPlan.totalWeeklyCost = mealPlan.shoppingList.totalCost;

    console.log('Shopping list generated, saving to DynamoDB');

    // Save complete meal plan to DynamoDB plans table
    const savedPlan = await getDBService().createMealPlan(userId, mealPlan);

    console.log('Meal plan saved successfully to plans table');

    // Return meal plan with 201 status
    return res.status(201).json({
      message: 'Meal plan generated successfully',
      planId: savedPlan.planId,
      mealPlan: savedPlan,
    });
  } catch (error) {
    console.error('Generate meal plan error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // OpenAI API errors
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        return res.status(503).json({
          error: 'ServiceUnavailable',
          message: 'AI service timed out. Please try again.',
          retryable: true,
        });
      }

      // Rate limit errors
      if (error.message.includes('rate limit')) {
        return res.status(503).json({
          error: 'ServiceUnavailable',
          message: 'AI service is currently busy. Please try again in a moment.',
          retryable: true,
        });
      }

      // Validation errors from AI response
      if (error.message.includes('Invalid meal plan structure')) {
        return res.status(500).json({
          error: 'InternalError',
          message: 'Failed to generate valid meal plan. Please try again.',
          details: error.message,
          retryable: true,
        });
      }
    }

    // Generic error
    return res.status(500).json({
      error: 'InternalError',
      message: 'Failed to generate meal plan',
      details: error instanceof Error ? error.message : 'Unknown error',
      retryable: true,
    });
  }
});

/**
 * POST /api/meal-plan
 *
 * Create a meal plan from selected recipes
 */
router.post('/meal-plan', async (req: Request, res: Response) => {
  try {
    const { userId, recipeIds, weekStartDate } = req.body;

    // Validate required fields
    if (!userId || !recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: {
          userId: !userId ? 'userId is required' : undefined,
          recipeIds: !recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0
            ? 'recipeIds must be a non-empty array'
            : undefined,
        },
      });
    }

    // Default to next Monday if no date provided
    const startDate = weekStartDate || getNextMonday();

    // Call meal planning agent to generate optimized plan
    const mealPlan = await getWebhookService().callMealPlanningAgent(
      userId,
      recipeIds,
      startDate
    );

    // Save meal plan to user profile
    const user = await getDBService().getUser(userId);
    if (user) {
      await getDBService().updateUser(userId, {
        mealPlan: {
          weekStartDate: startDate,
          plan: mealPlan,
          createdAt: new Date().toISOString(),
        },
      } as any);
    }

    return res.status(201).json({
      message: 'Meal plan created successfully',
      mealPlan: {
        weekStartDate: startDate,
        ...mealPlan,
      },
    });
  } catch (error) {
    console.error('Create meal plan error:', error);
    return res.status(500).json({
      error: 'Failed to create meal plan',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/meal-plan/:userId
 *
 * Retrieve user's current meal plan
 * Requirements: 10.4, 12.2
 */
router.get('/meal-plan/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Validate userId parameter
    if (!userId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'userId is required',
        retryable: false,
      });
    }

    // Fetch user from DynamoDB
    const user = await getDBService().getUser(userId);

    if (!user) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'User not found',
        retryable: false,
      });
    }

    // Get meal plan from plans table using mealPlanId reference
    const mealPlan = await getDBService().getUserMealPlan(userId);

    return res.status(200).json({
      mealPlan,
    });
  } catch (error) {
    console.error('Get meal plan error:', error);

    // Handle errors with appropriate status codes
    return res.status(500).json({
      error: 'InternalError',
      message: 'Failed to retrieve meal plan',
      details: error instanceof Error ? error.message : 'Unknown error',
      retryable: true,
    });
  }
});

/**
 * PUT /api/meal-plan/:userId
 *
 * Update user's meal plan
 * Requirements: 10.3, 12.3
 */
router.put('/meal-plan/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { mealPlan } = req.body;

    // Validate userId parameter
    if (!userId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'userId is required',
        retryable: false,
      });
    }

    // Validate request body
    if (!mealPlan) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'mealPlan is required',
        retryable: false,
      });
    }

    // Validate meal plan structure
    if (!mealPlan.days || !Array.isArray(mealPlan.days)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'mealPlan.days must be an array',
        retryable: false,
      });
    }

    // Verify user exists and has a meal plan
    const user = await getDBService().getUser(userId);
    if (!user) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'User not found',
        retryable: false,
      });
    }

    const mealPlanId = (user as any).mealPlanId;
    if (!mealPlanId) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'No meal plan found for user',
        retryable: false,
      });
    }

    console.log(`Updating meal plan for user ${userId}`);

    // Fetch recipe details for all recipe IDs in plan
    const recipeIds = new Set<string>();
    for (const day of mealPlan.days) {
      if (!day.meals || !Array.isArray(day.meals)) {
        continue;
      }
      for (const meal of day.meals) {
        if (meal.recipeId) {
          recipeIds.add(meal.recipeId);
        }
      }
    }

    const recipes: Recipe[] = [];
    for (const recipeId of recipeIds) {
      try {
        const recipe = await getDBService().getRecipe(recipeId);
        if (recipe) {
          recipes.push(recipe);
        }
      } catch (error) {
        console.warn(`Failed to fetch recipe ${recipeId}:`, error);
      }
    }

    console.log(`Fetched ${recipes.length} recipes, regenerating shopping list`);

    // Regenerate shopping list using ShoppingListGenerator
    const shoppingList = ShoppingListGenerator.generateShoppingList(mealPlan, recipes);

    // Recalculate total weekly cost
    const totalWeeklyCost = shoppingList.totalCost;

    console.log('Shopping list regenerated, updating plans table');

    // Update meal plan in plans table
    const updatedMealPlan = await getDBService().updateMealPlan(userId, mealPlanId, {
      days: mealPlan.days,
      shoppingList,
      totalWeeklyCost,
      preferences: mealPlan.preferences,
      nutritionSummary: mealPlan.nutritionSummary,
      notes: mealPlan.notes,
    });

    console.log('Meal plan updated successfully');

    // Return updated meal plan with 200 status
    return res.status(200).json({
      message: 'Meal plan updated successfully',
      mealPlan: updatedMealPlan,
    });
  } catch (error) {
    console.error('Update meal plan error:', error);

    // Handle errors with appropriate status codes
    return res.status(500).json({
      error: 'InternalError',
      message: 'Failed to update meal plan',
      details: error instanceof Error ? error.message : 'Unknown error',
      retryable: true,
    });
  }
});

/**
    console.error('Update meal plan error:', error);

    // Handle errors with appropriate status codes
    return res.status(500).json({
      error: 'InternalError',
      message: 'Failed to update meal plan',
      details: error instanceof Error ? error.message : 'Unknown error',
      retryable: true,
    });
  }
});

/**
 * POST /api/meal-plan/:userId/meal
 *
 * Add a meal to specific slot in the meal plan
 * Requirements: 5.3, 5.5, 5.6, 10.3, 12.5
 */
router.post('/meal-plan/:userId/meal', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { day, mealType, recipeId } = req.body;

    // Validate userId parameter
    if (!userId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'userId is required',
        retryable: false,
      });
    }

    // Validate request body
    if (!day) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'day is required',
        retryable: false,
      });
    }

    if (!mealType) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'mealType is required',
        retryable: false,
      });
    }

    if (!recipeId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'recipeId is required',
        retryable: false,
      });
    }

    // Validate mealType is valid
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validMealTypes.includes(mealType)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: `mealType must be one of: ${validMealTypes.join(', ')}`,
        retryable: false,
      });
    }

    // Validate day is valid
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: `day must be one of: ${validDays.join(', ')}`,
        retryable: false,
      });
    }

    console.log(`Adding meal to plan for user ${userId}: ${day} ${mealType}`);

    // Verify user exists and has a meal plan
    const user = await getDBService().getUser(userId);
    if (!user) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'User not found',
        retryable: false,
      });
    }

    const mealPlanId = (user as any).mealPlanId;
    if (!mealPlanId) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'No meal plan found for user',
        retryable: false,
      });
    }

    // Fetch current meal plan from plans table
    const currentPlan = await getDBService().getMealPlan(userId, mealPlanId);
    if (!currentPlan) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'No meal plan found for user',
        retryable: false,
      });
    }

    // Fetch recipe details for the new recipe
    const recipe = await getDBService().getRecipe(recipeId);
    if (!recipe) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'Recipe not found',
        retryable: false,
      });
    }

    console.log(`Recipe found: ${recipe.name}, adding to meal plan`);

    // Find the day in the meal plan
    const dayIndex = (currentPlan.days as any[]).findIndex((d: any) => d.day === day);
    if (dayIndex === -1) {
      return res.status(400).json({
        error: 'ValidationError',
        message: `Day ${day} not found in meal plan`,
        retryable: false,
      });
    }

    // Create new meal from recipe
    const newMeal: any = {
      mealType,
      name: recipe.name,
      description: recipe.description || '',
      recipeId: recipe.recipeId,
      estimatedCalories: 0, // Recipe model doesn't have calories field
      estimatedCost: recipe.totalCost || 0,
    };

    // Add meal to specified slot in meal plan
    // Find if there's already a meal in this slot
    const mealIndex = (currentPlan.days[dayIndex].meals as any[]).findIndex((m: any) => m.mealType === mealType);

    if (mealIndex !== -1) {
      // Replace existing meal
      currentPlan.days[dayIndex].meals[mealIndex] = newMeal;
    } else {
      // Add new meal
      currentPlan.days[dayIndex].meals.push(newMeal);
    }

    console.log('Meal added, fetching all recipes for shopping list regeneration');

    // Fetch all recipe details for shopping list regeneration
    const recipeIds = new Set<string>();
    for (const d of currentPlan.days) {
      for (const meal of d.meals) {
        if (meal.recipeId) {
          recipeIds.add(meal.recipeId);
        }
      }
    }

    const recipes: Recipe[] = [];
    for (const rid of recipeIds) {
      try {
        const r = await getDBService().getRecipe(rid);
        if (r) {
          recipes.push(r);
        }
      } catch (error) {
        console.warn(`Failed to fetch recipe ${rid}:`, error);
      }
    }

    console.log(`Fetched ${recipes.length} recipes, regenerating shopping list`);

    // Regenerate shopping list
    const shoppingList = ShoppingListGenerator.generateShoppingList(currentPlan, recipes);

    // Recalculate total weekly cost
    const totalWeeklyCost = shoppingList.totalCost;

    console.log('Shopping list regenerated, updating plans table');

    // Update meal plan in plans table
    const updatedMealPlan = await getDBService().updateMealPlan(userId, mealPlanId, {
      days: currentPlan.days,
      shoppingList,
      totalWeeklyCost,
    });

    console.log('Meal added successfully');

    // Return updated meal plan with 200 status
    return res.status(200).json({
      message: 'Meal added successfully',
      mealPlan: updatedMealPlan,
    });
  } catch (error) {
    console.error('Add meal error:', error);

    // Handle errors with appropriate status codes
    return res.status(500).json({
      error: 'InternalError',
      message: 'Failed to add meal to plan',
      details: error instanceof Error ? error.message : 'Unknown error',
      retryable: true,
    });
  }
});

/**
 * DELETE /api/meal-plan/:userId/meal
 *
 * Remove a meal from specific slot in the meal plan
 * Requirements: 6.3, 6.5, 6.6, 10.3, 12.4
 */
router.delete('/meal-plan/:userId/meal', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { day, mealType } = req.body;

    // Validate userId parameter
    if (!userId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'userId is required',
        retryable: false,
      });
    }

    // Validate request body
    if (!day) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'day is required',
        retryable: false,
      });
    }

    if (!mealType) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'mealType is required',
        retryable: false,
      });
    }

    // Validate mealType is valid
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validMealTypes.includes(mealType)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: `mealType must be one of: ${validMealTypes.join(', ')}`,
        retryable: false,
      });
    }

    // Validate day is valid
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: `day must be one of: ${validDays.join(', ')}`,
        retryable: false,
      });
    }

    console.log(`Removing meal from plan for user ${userId}: ${day} ${mealType}`);

    // Verify user exists and has a meal plan
    const user = await getDBService().getUser(userId);
    if (!user) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'User not found',
        retryable: false,
      });
    }

    const mealPlanId = (user as any).mealPlanId;
    if (!mealPlanId) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'No meal plan found for user',
        retryable: false,
      });
    }

    // Fetch current meal plan from plans table
    const currentPlan = await getDBService().getMealPlan(userId, mealPlanId);
    if (!currentPlan) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'No meal plan found for user',
        retryable: false,
      });
    }

    // Find the day in the meal plan
    const dayIndex = (currentPlan.days as any[]).findIndex((d: any) => d.day === day);
    if (dayIndex === -1) {
      return res.status(400).json({
        error: 'ValidationError',
        message: `Day ${day} not found in meal plan`,
        retryable: false,
      });
    }

    // Find the meal to remove
    const mealIndex = (currentPlan.days[dayIndex].meals as any[]).findIndex((m: any) => m.mealType === mealType);
    if (mealIndex === -1) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: `No ${mealType} found for ${day}`,
        retryable: false,
      });
    }

    console.log(`Meal found, removing from plan`);

    // Remove meal from specified slot
    currentPlan.days[dayIndex].meals.splice(mealIndex, 1);

    console.log('Meal removed, fetching all recipes for shopping list regeneration');

    // Fetch all recipe details for shopping list regeneration
    const recipeIds = new Set<string>();
    for (const d of currentPlan.days) {
      for (const meal of d.meals) {
        if (meal.recipeId) {
          recipeIds.add(meal.recipeId);
        }
      }
    }

    const recipes: Recipe[] = [];
    for (const rid of recipeIds) {
      try {
        const r = await getDBService().getRecipe(rid);
        if (r) {
          recipes.push(r);
        }
      } catch (error) {
        console.warn(`Failed to fetch recipe ${rid}:`, error);
      }
    }

    console.log(`Fetched ${recipes.length} recipes, regenerating shopping list`);

    // Regenerate shopping list (excluding ingredients only in removed meal)
    const shoppingList = ShoppingListGenerator.generateShoppingList(currentPlan, recipes);

    // Recalculate total weekly cost
    const totalWeeklyCost = shoppingList.totalCost;

    console.log('Shopping list regenerated, updating plans table');

    // Update meal plan in plans table
    const updatedMealPlan = await getDBService().updateMealPlan(userId, mealPlanId, {
      days: currentPlan.days,
      shoppingList,
      totalWeeklyCost,
    });

    console.log('Meal removed successfully');

    // Return updated meal plan with 200 status
    return res.status(200).json({
      message: 'Meal removed successfully',
      mealPlan: updatedMealPlan,
    });
  } catch (error) {
    console.error('Remove meal error:', error);

    // Handle errors with appropriate status codes
    return res.status(500).json({
      error: 'InternalError',
      message: 'Failed to remove meal from plan',
      details: error instanceof Error ? error.message : 'Unknown error',
      retryable: true,
    });
  }
});

/**
 * Helper function to get next Monday's date
 */
function getNextMonday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return nextMonday.toISOString().split('T')[0];
}

export default router;
