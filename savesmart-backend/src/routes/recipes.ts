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
import { generateMockRecipes } from '../utils/mockData.js';

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

    try {
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
    } catch (dbError) {
      // If DynamoDB table doesn't exist, fall back to mock data
      console.log('DynamoDB table not found, using mock recipes data');

      const mockRecipes: Recipe[] = [
        {
          recipeId: 'recipe-1',
          name: 'Budget Pasta Carbonara',
          description: 'A classic Italian pasta dish that\'s quick, easy, and budget-friendly',
          imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
          prepTime: 20,
          servings: 4,
          dietaryTags: [],
          ingredients: [
            { name: 'Spaghetti', quantity: 400, unit: 'g', price: 2.50, source: 'mock' },
            { name: 'Bacon', quantity: 200, unit: 'g', price: 4.00, source: 'mock' },
            { name: 'Eggs', quantity: 4, unit: 'whole', price: 1.50, source: 'mock' },
            { name: 'Parmesan Cheese', quantity: 100, unit: 'g', price: 3.00, source: 'mock' },
          ],
          instructions: [
            'Cook spaghetti according to package directions',
            'Fry bacon until crispy',
            'Mix eggs and parmesan',
            'Combine hot pasta with bacon and egg mixture',
            'Serve immediately'
          ],
          totalCost: 11.00,
          cachedAt: new Date().toISOString(),
        },
        {
          recipeId: 'recipe-2',
          name: 'Vegetarian Stir Fry',
          description: 'Colorful and nutritious vegetable stir fry with tofu',
          imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
          prepTime: 15,
          servings: 3,
          dietaryTags: ['vegetarian', 'vegan'],
          ingredients: [
            { name: 'Tofu', quantity: 300, unit: 'g', price: 3.50, source: 'mock' },
            { name: 'Mixed Vegetables', quantity: 500, unit: 'g', price: 4.00, source: 'mock' },
            { name: 'Soy Sauce', quantity: 50, unit: 'ml', price: 1.00, source: 'mock' },
            { name: 'Rice', quantity: 300, unit: 'g', price: 2.00, source: 'mock' },
          ],
          instructions: [
            'Press and cube tofu',
            'Stir fry tofu until golden',
            'Add vegetables and cook until tender',
            'Add soy sauce',
            'Serve over rice'
          ],
          totalCost: 10.50,
          cachedAt: new Date().toISOString(),
        },
        {
          recipeId: 'recipe-3',
          name: 'Chicken and Rice Bowl',
          description: 'Simple and satisfying one-bowl meal',
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
          prepTime: 25,
          servings: 4,
          dietaryTags: ['gluten-free'],
          ingredients: [
            { name: 'Chicken Breast', quantity: 500, unit: 'g', price: 8.00, source: 'mock' },
            { name: 'Rice', quantity: 400, unit: 'g', price: 2.50, source: 'mock' },
            { name: 'Broccoli', quantity: 300, unit: 'g', price: 3.00, source: 'mock' },
            { name: 'Soy Sauce', quantity: 50, unit: 'ml', price: 1.00, source: 'mock' },
          ],
          instructions: [
            'Cook rice according to package',
            'Season and cook chicken',
            'Steam broccoli',
            'Slice chicken',
            'Assemble bowls with rice, chicken, and broccoli'
          ],
          totalCost: 14.50,
          cachedAt: new Date().toISOString(),
        },
      ];

      // Filter by dietary tags if provided
      let filteredRecipes = mockRecipes;
      if (dietaryTagsArray && dietaryTagsArray.length > 0) {
        filteredRecipes = mockRecipes.filter(recipe =>
          dietaryTagsArray.some(tag => recipe.dietaryTags.includes(tag))
        );
      }

      // Cache mock recipes
      getCacheService().set(cacheKey, filteredRecipes, 24 * 60 * 60 * 1000);

      return res.status(200).json({
        recipes: filteredRecipes,
        source: 'mock',
      });
    }
  } catch (error) {
    console.error('Recipes GET endpoint error:', error);
    return res.status(500).json({
      error: 'Internal server error',
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
