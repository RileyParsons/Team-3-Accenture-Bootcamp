/**
 * Recipe Routes
 *
 * Provides endpoints for recipe browsing with dietary filtering and pricing.
 * Integrates with GroceryService for ingredient pricing and caching.
 *
 * Requirements: 10.5, 10.8, 12.7, 12.8
 */

import { Router, Request, Response } from 'express';
import { DynamoDBService } from '../services/dynamodb.js';
import { GroceryService } from '../services/grocery.js';
import { CacheService } from '../utils/cache.js';
import { Recipe } from '../models/Recipe.js';

const router = Router();

// Lazy-load services to avoid initialization issues
let dbService: DynamoDBService | null = null;
let groceryService: GroceryService | null = null;
let cacheService: CacheService | null = null;

function getDBService(): DynamoDBService {
  if (!dbService) {
    dbService = new DynamoDBService();
  }
  return dbService;
}

function getGroceryService(): GroceryService {
  if (!groceryService) {
    groceryService = new GroceryService();
  }
  return groceryService;
}

function getCacheService(): CacheService {
  if (!cacheService) {
    cacheService = new CacheService();
  }
  return cacheService;
}

/**
 * Calculate total meal cost from ingredient prices
 * Requirement 10.4: Calculate and display the total meal cost
 *
 * @param recipe - Recipe object with ingredients
 * @returns Total cost of all ingredients
 */
function calculateTotalCost(recipe: Recipe): number {
  return recipe.ingredients.reduce((sum, ingredient) => sum + ingredient.price, 0);
}

/**
 * GET /api/recipes
 *
 * Retrieve a list of recipes with optional dietary filtering.
 * Requirement 10.5: Allow users to filter recipes by dietary preferences
 * Requirement 10.8: Cache grocery prices for 24 hours
 * Requirement 12.7: GET /api/recipes endpoint
 *
 * Query parameters:
 * - dietaryTags: Comma-separated list of dietary tags (vegetarian, vegan, gluten-free)
 *
 * Response:
 * - 200: Array of recipes
 * - 500: Database error
 */
router.get('/recipes', async (req: Request, res: Response) => {
  try {
    const { dietaryTags } = req.query;

    // Parse dietary tags from query parameter
    let dietaryTagsArray: string[] | undefined;
    if (dietaryTags && typeof dietaryTags === 'string') {
      dietaryTagsArray = dietaryTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    // Check cache first (Requirement 10.8)
    const cacheKey = `recipes:${dietaryTagsArray?.join(',') || 'all'}`;
    const cachedRecipes = getCacheService().get(cacheKey);

    if (cachedRecipes) {
      console.log('Returning cached recipes');
      return res.status(200).json({
        recipes: cachedRecipes,
      });
    }

    // Get recipes from database with dietary filtering (Requirement 10.5)
    const recipes = await getDBService().getRecipes(
      dietaryTagsArray ? { dietaryTags: dietaryTagsArray } : undefined
    );

    // Update ingredient prices and calculate total cost
    const recipesWithPricing = await Promise.all(
      recipes.map(async (recipe) => {
        // Update ingredient prices from grocery service
        const updatedIngredients = await Promise.all(
          recipe.ingredients.map(async (ingredient) => {
            const price = await getGroceryService().getProductPrice(ingredient.name);
            return {
              ...ingredient,
              price,
            };
          })
        );

        // Calculate total cost
        const updatedRecipe = {
          ...recipe,
          ingredients: updatedIngredients,
        };
        updatedRecipe.totalCost = calculateTotalCost(updatedRecipe);

        return updatedRecipe;
      })
    );

    // Cache recipes for 24 hours (Requirement 10.8)
    getCacheService().set(cacheKey, recipesWithPricing, 24 * 60 * 60 * 1000);

    return res.status(200).json({
      recipes: recipesWithPricing,
    });
  } catch (error) {
    console.error('Recipes GET endpoint error:', error);
    return res.status(500).json({
      error: 'Database operation failed',
      message: error instanceof Error ? error.message : 'Failed to retrieve recipes',
    });
  }
});

/**
 * GET /api/recipes/:recipeId
 *
 * Retrieve a single recipe with full details and current pricing.
 * Requirement 10.3: Display current prices for each ingredient
 * Requirement 10.4: Calculate and display the total meal cost
 * Requirement 10.8: Cache grocery prices for 24 hours
 * Requirement 12.8: GET /api/recipes/:recipeId endpoint
 *
 * Path parameters:
 * - recipeId: Recipe's unique identifier
 *
 * Response:
 * - 200: Recipe object with pricing
 * - 404: Recipe not found
 * - 500: Database error
 */
router.get('/recipes/:recipeId', async (req: Request, res: Response) => {
  try {
    const { recipeId } = req.params;

    // Validate recipeId
    if (!recipeId || typeof recipeId !== 'string' || recipeId.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: { recipeId: 'recipeId is required and must be a non-empty string' },
      });
    }

    // Check cache first (Requirement 10.8)
    const cacheKey = `recipe:${recipeId}`;
    const cachedRecipe = getCacheService().get(cacheKey);

    if (cachedRecipe) {
      console.log('Returning cached recipe');
      return res.status(200).json(cachedRecipe);
    }

    // Get recipe from database
    const recipe = await getDBService().getRecipe(recipeId);

    if (!recipe) {
      return res.status(404).json({
        error: 'Resource not found',
        resource: 'Recipe',
        id: recipeId,
      });
    }

    // Update ingredient prices from grocery service (Requirement 10.3)
    const updatedIngredients = await Promise.all(
      recipe.ingredients.map(async (ingredient) => {
        const price = await getGroceryService().getProductPrice(ingredient.name);
        return {
          ...ingredient,
          price,
        };
      })
    );

    // Calculate total cost (Requirement 10.4)
    const updatedRecipe = {
      ...recipe,
      ingredients: updatedIngredients,
    };
    updatedRecipe.totalCost = calculateTotalCost(updatedRecipe);

    // Cache recipe for 24 hours (Requirement 10.8)
    getCacheService().set(cacheKey, updatedRecipe, 24 * 60 * 60 * 1000);

    return res.status(200).json(updatedRecipe);
  } catch (error) {
    console.error('Recipe GET endpoint error:', error);
    return res.status(500).json({
      error: 'Database operation failed',
      message: error instanceof Error ? error.message : 'Failed to retrieve recipe',
    });
  }
});

export default router;
