/**
 * Meal Plan Routes
 *
 * Provides endpoints for creating and managing meal plans.
 */

import { Router, Request, Response } from 'express';
import { DynamoDBService } from '../services/dynamodb.js';
import { WebhookService } from '../services/webhooks.js';

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
      });
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
 * Get the current meal plan for a user
 */
router.get('/meal-plan/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'Validation failed',
        details: { userId: 'userId is required' },
      });
    }

    const user = await getDBService().getUser(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const mealPlan = (user as any).mealPlan || null;

    return res.status(200).json({
      mealPlan,
    });
  } catch (error) {
    console.error('Get meal plan error:', error);
    return res.status(500).json({
      error: 'Failed to get meal plan',
      message: error instanceof Error ? error.message : 'Unknown error',
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
