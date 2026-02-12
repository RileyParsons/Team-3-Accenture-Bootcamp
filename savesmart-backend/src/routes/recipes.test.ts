/**
 * Unit Tests for Recipe Routes
 *
 * Tests the recipe endpoints with dietary filtering and pricing
 * Requirements: 10.5, 10.8, 12.7, 12.8
 */

import request from 'supertest';
import express, { Express } from 'express';
import { Recipe } from '../models/Recipe.js';

// Mock config first to avoid initialization errors
jest.mock('../config/env.js', () => ({
  getConfig: jest.fn(() => ({
    nodeEnv: 'test',
    port: 3001,
    corsOrigin: 'http://localhost:3000',
    aws: {
      region: 'us-east-1',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
    },
    dynamodb: {
      usersTable: 'test-users',
      plansTable: 'test-plans',
      eventsTable: 'test-events',
      recipesTable: 'test-recipes',
      fuelStationsTable: 'test-fuel-stations',
    },
    externalApis: {
      groceryApiKey: undefined,
    },
    openai: {
      apiKey: 'test-openai-key',
    },
  })),
}));

// Mock AWS SDK
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: jest.fn(),
    })),
  },
  GetCommand: jest.fn(),
  PutCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  QueryCommand: jest.fn(),
  ScanCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({
    send: jest.fn(),
  })),
}));

// Mock DynamoDB service
const mockGetRecipes = jest.fn();
const mockGetRecipe = jest.fn();

jest.mock('../services/dynamodb.js', () => ({
  DynamoDBService: jest.fn().mockImplementation(() => ({
    getRecipes: mockGetRecipes,
    getRecipe: mockGetRecipe,
  })),
}));

// Mock Grocery service
const mockGetProductPrice = jest.fn();

jest.mock('../services/grocery.js', () => ({
  GroceryService: jest.fn().mockImplementation(() => ({
    getProductPrice: mockGetProductPrice,
  })),
}));

// Mock Cache service
const mockCacheGet = jest.fn();
const mockCacheSet = jest.fn();

jest.mock('../utils/cache.js', () => ({
  CacheService: jest.fn().mockImplementation(() => ({
    get: mockCacheGet,
    set: mockCacheSet,
  })),
}));

// Import routes after mocks are set up
import recipeRoutes from './recipes.js';

describe('Recipe Routes', () => {
  let app: Express;

  const mockRecipe: Recipe = {
    recipeId: 'recipe-1',
    name: 'Pasta Carbonara',
    description: 'Classic Italian pasta dish',
    imageUrl: 'https://example.com/carbonara.jpg',
    prepTime: 30,
    servings: 4,
    dietaryTags: ['vegetarian'],
    ingredients: [
      { name: 'spaghetti', quantity: 400, unit: 'g', price: 2.50, source: 'mock' },
      { name: 'eggs', quantity: 4, unit: 'each', price: 3.20, source: 'mock' },
      { name: 'parmesan cheese', quantity: 100, unit: 'g', price: 4.50, source: 'mock' },
    ],
    instructions: ['Boil pasta', 'Mix eggs and cheese', 'Combine'],
    totalCost: 10.20,
    cachedAt: new Date().toISOString(),
  };

  const mockVeganRecipe: Recipe = {
    recipeId: 'recipe-2',
    name: 'Vegan Stir Fry',
    description: 'Healthy vegetable stir fry',
    imageUrl: 'https://example.com/stirfry.jpg',
    prepTime: 20,
    servings: 2,
    dietaryTags: ['vegan', 'vegetarian'],
    ingredients: [
      { name: 'broccoli', quantity: 200, unit: 'g', price: 3.00, source: 'mock' },
      { name: 'carrots', quantity: 150, unit: 'g', price: 1.50, source: 'mock' },
      { name: 'soy sauce', quantity: 50, unit: 'ml', price: 1.00, source: 'mock' },
    ],
    instructions: ['Chop vegetables', 'Stir fry', 'Add sauce'],
    totalCost: 5.50,
    cachedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create Express app with recipe routes
    app = express();
    app.use(express.json());
    app.use('/api', recipeRoutes);

    // Default mock implementations
    mockCacheGet.mockReturnValue(null);
    mockGetProductPrice.mockImplementation(async (name: string) => {
      const prices: Record<string, number> = {
        'spaghetti': 2.50,
        'eggs': 3.20,
        'parmesan cheese': 4.50,
        'broccoli': 3.00,
        'carrots': 1.50,
        'soy sauce': 1.00,
      };
      return prices[name] || 5.00;
    });
  });

  describe('GET /api/recipes', () => {
    it('should return all recipes when no filters are applied', async () => {
      mockGetRecipes.mockResolvedValue([mockRecipe, mockVeganRecipe]);

      const response = await request(app).get('/api/recipes');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('recipes');
      expect(Array.isArray(response.body.recipes)).toBe(true);
      expect(response.body.recipes.length).toBe(2);
      expect(mockGetRecipes).toHaveBeenCalledWith(undefined);
    });

    it('should filter recipes by dietary tags', async () => {
      mockGetRecipes.mockResolvedValue([mockVeganRecipe]);

      const response = await request(app).get('/api/recipes?dietaryTags=vegan');

      expect(response.status).toBe(200);
      expect(response.body.recipes.length).toBe(1);
      expect(response.body.recipes[0].dietaryTags).toContain('vegan');
      expect(mockGetRecipes).toHaveBeenCalledWith({ dietaryTags: ['vegan'] });
    });

    it('should handle multiple dietary tags', async () => {
      mockGetRecipes.mockResolvedValue([mockVeganRecipe]);

      const response = await request(app).get('/api/recipes?dietaryTags=vegan,vegetarian');

      expect(response.status).toBe(200);
      expect(mockGetRecipes).toHaveBeenCalledWith({ dietaryTags: ['vegan', 'vegetarian'] });
    });

    it('should calculate total cost from ingredient prices', async () => {
      mockGetRecipes.mockResolvedValue([mockRecipe]);

      const response = await request(app).get('/api/recipes');

      expect(response.status).toBe(200);
      expect(response.body.recipes[0].totalCost).toBe(10.20);
    });

    it('should return cached recipes if available', async () => {
      const cachedRecipes = [mockRecipe];
      mockCacheGet.mockReturnValue(cachedRecipes);

      const response = await request(app).get('/api/recipes');

      expect(response.status).toBe(200);
      expect(response.body.recipes).toEqual(cachedRecipes);
      expect(mockGetRecipes).not.toHaveBeenCalled();
      expect(mockGetProductPrice).not.toHaveBeenCalled();
    });

    it('should cache recipes after fetching from database', async () => {
      mockGetRecipes.mockResolvedValue([mockRecipe]);

      await request(app).get('/api/recipes');

      expect(mockCacheSet).toHaveBeenCalled();
      const cacheCall = mockCacheSet.mock.calls[0];
      expect(cacheCall[0]).toBe('recipes:all'); // cache key
      expect(cacheCall[2]).toBe(24 * 60 * 60 * 1000); // 24 hours TTL
    });

    it('should handle database errors', async () => {
      mockGetRecipes.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/api/recipes');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Database operation failed');
    });
  });

  describe('GET /api/recipes/:recipeId', () => {
    it('should return a single recipe by ID', async () => {
      mockGetRecipe.mockResolvedValue(mockRecipe);

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(200);
      expect(response.body.recipeId).toBe('recipe-1');
      expect(response.body.name).toBe('Pasta Carbonara');
      expect(mockGetRecipe).toHaveBeenCalledWith('recipe-1');
    });

    it('should update ingredient prices from grocery service', async () => {
      mockGetRecipe.mockResolvedValue(mockRecipe);

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(200);
      expect(mockGetProductPrice).toHaveBeenCalledTimes(3); // 3 ingredients
      expect(mockGetProductPrice).toHaveBeenCalledWith('spaghetti');
      expect(mockGetProductPrice).toHaveBeenCalledWith('eggs');
      expect(mockGetProductPrice).toHaveBeenCalledWith('parmesan cheese');
    });

    it('should calculate total cost correctly', async () => {
      mockGetRecipe.mockResolvedValue(mockRecipe);

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(200);
      expect(response.body.totalCost).toBe(10.20); // 2.50 + 3.20 + 4.50
    });

    it('should return 404 if recipe not found', async () => {
      mockGetRecipe.mockResolvedValue(null);

      const response = await request(app).get('/api/recipes/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Resource not found');
      expect(response.body.resource).toBe('Recipe');
    });

    it('should return cached recipe if available', async () => {
      mockCacheGet.mockReturnValue(mockRecipe);

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRecipe);
      expect(mockGetRecipe).not.toHaveBeenCalled();
      expect(mockGetProductPrice).not.toHaveBeenCalled();
    });

    it('should cache recipe after fetching from database', async () => {
      mockGetRecipe.mockResolvedValue(mockRecipe);

      await request(app).get('/api/recipes/recipe-1');

      expect(mockCacheSet).toHaveBeenCalled();
      const cacheCall = mockCacheSet.mock.calls[0];
      expect(cacheCall[0]).toBe('recipe:recipe-1'); // cache key
      expect(cacheCall[2]).toBe(24 * 60 * 60 * 1000); // 24 hours TTL
    });

    it('should handle database errors', async () => {
      mockGetRecipe.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Database operation failed');
    });
  });

  describe('Total Cost Calculation', () => {
    it('should sum all ingredient prices correctly', async () => {
      const recipeWithMultipleIngredients: Recipe = {
        ...mockRecipe,
        ingredients: [
          { name: 'item1', quantity: 1, unit: 'each', price: 1.50, source: 'mock' },
          { name: 'item2', quantity: 1, unit: 'each', price: 2.75, source: 'mock' },
          { name: 'item3', quantity: 1, unit: 'each', price: 3.25, source: 'mock' },
          { name: 'item4', quantity: 1, unit: 'each', price: 4.00, source: 'mock' },
        ],
      };
      mockGetRecipe.mockResolvedValue(recipeWithMultipleIngredients);
      mockGetProductPrice.mockImplementation(async (name: string) => {
        const prices: Record<string, number> = {
          'item1': 1.50,
          'item2': 2.75,
          'item3': 3.25,
          'item4': 4.00,
        };
        return prices[name] || 0;
      });

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(200);
      expect(response.body.totalCost).toBe(11.50); // 1.50 + 2.75 + 3.25 + 4.00
    });

    it('should handle recipes with no ingredients', async () => {
      const recipeWithNoIngredients: Recipe = {
        ...mockRecipe,
        ingredients: [],
      };
      mockGetRecipe.mockResolvedValue(recipeWithNoIngredients);

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(200);
      expect(response.body.totalCost).toBe(0);
    });
  });
});

  describe('GET /api/recipes', () => {
    it('should return all recipes when no filters are applied', async () => {
      mockGetRecipes.mockResolvedValue([mockRecipe, mockVeganRecipe]);

      const response = await request(app).get('/api/recipes');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('recipes');
      expect(Array.isArray(response.body.recipes)).toBe(true);
      expect(response.body.recipes.length).toBe(2);
      expect(mockGetRecipes).toHaveBeenCalledWith(undefined);
    });

    it('should filter recipes by dietary tags', async () => {
      mockGetRecipes.mockResolvedValue([mockVeganRecipe]);

      const response = await request(app).get('/api/recipes?dietaryTags=vegan');

      expect(response.status).toBe(200);
      expect(response.body.recipes.length).toBe(1);
      expect(response.body.recipes[0].dietaryTags).toContain('vegan');
      expect(mockGetRecipes).toHaveBeenCalledWith({ dietaryTags: ['vegan'] });
    });

    it('should handle multiple dietary tags', async () => {
      mockGetRecipes.mockResolvedValue([mockVeganRecipe]);

      const response = await request(app).get('/api/recipes?dietaryTags=vegan,vegetarian');

      expect(response.status).toBe(200);
      expect(mockGetRecipes).toHaveBeenCalledWith({ dietaryTags: ['vegan', 'vegetarian'] });
    });

    it('should calculate total cost from ingredient prices', async () => {
      mockGetRecipes.mockResolvedValue([mockRecipe]);

      const response = await request(app).get('/api/recipes');

      expect(response.status).toBe(200);
      expect(response.body.recipes[0].totalCost).toBe(10.20);
    });

    it('should return cached recipes if available', async () => {
      const cachedRecipes = [mockRecipe];
      mockCacheGet.mockReturnValue(cachedRecipes);

      const response = await request(app).get('/api/recipes');

      expect(response.status).toBe(200);
      expect(response.body.recipes).toEqual(cachedRecipes);
      expect(mockGetRecipes).not.toHaveBeenCalled();
      expect(mockGetProductPrice).not.toHaveBeenCalled();
    });

    it('should cache recipes after fetching from database', async () => {
      mockGetRecipes.mockResolvedValue([mockRecipe]);

      await request(app).get('/api/recipes');

      expect(mockCacheSet).toHaveBeenCalled();
      const cacheCall = mockCacheSet.mock.calls[0];
      expect(cacheCall[0]).toBe('recipes:all'); // cache key
      expect(cacheCall[2]).toBe(24 * 60 * 60 * 1000); // 24 hours TTL
    });

    it('should handle database errors', async () => {
      mockGetRecipes.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/api/recipes');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Database operation failed');
    });
  });

  describe('GET /api/recipes/:recipeId', () => {
    it('should return a single recipe by ID', async () => {
      mockGetRecipe.mockResolvedValue(mockRecipe);

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(200);
      expect(response.body.recipeId).toBe('recipe-1');
      expect(response.body.name).toBe('Pasta Carbonara');
      expect(mockGetRecipe).toHaveBeenCalledWith('recipe-1');
    });

    it('should update ingredient prices from grocery service', async () => {
      mockGetRecipe.mockResolvedValue(mockRecipe);

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(200);
      expect(mockGetProductPrice).toHaveBeenCalledTimes(3); // 3 ingredients
      expect(mockGetProductPrice).toHaveBeenCalledWith('spaghetti');
      expect(mockGetProductPrice).toHaveBeenCalledWith('eggs');
      expect(mockGetProductPrice).toHaveBeenCalledWith('parmesan cheese');
    });

    it('should calculate total cost correctly', async () => {
      mockGetRecipe.mockResolvedValue(mockRecipe);

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(200);
      expect(response.body.totalCost).toBe(10.20); // 2.50 + 3.20 + 4.50
    });

    it('should return 404 if recipe not found', async () => {
      mockGetRecipe.mockResolvedValue(null);

      const response = await request(app).get('/api/recipes/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Resource not found');
      expect(response.body.resource).toBe('Recipe');
    });

    it('should return cached recipe if available', async () => {
      mockCacheGet.mockReturnValue(mockRecipe);

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRecipe);
      expect(mockGetRecipe).not.toHaveBeenCalled();
      expect(mockGetProductPrice).not.toHaveBeenCalled();
    });

    it('should cache recipe after fetching from database', async () => {
      mockGetRecipe.mockResolvedValue(mockRecipe);

      await request(app).get('/api/recipes/recipe-1');

      expect(mockCacheSet).toHaveBeenCalled();
      const cacheCall = mockCacheSet.mock.calls[0];
      expect(cacheCall[0]).toBe('recipe:recipe-1'); // cache key
      expect(cacheCall[2]).toBe(24 * 60 * 60 * 1000); // 24 hours TTL
    });

    it('should handle database errors', async () => {
      mockGetRecipe.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Database operation failed');
    });
  });

  describe('Total Cost Calculation', () => {
    it('should sum all ingredient prices correctly', async () => {
      const recipeWithMultipleIngredients: Recipe = {
        ...mockRecipe,
        ingredients: [
          { name: 'item1', quantity: 1, unit: 'each', price: 1.50, source: 'mock' },
          { name: 'item2', quantity: 1, unit: 'each', price: 2.75, source: 'mock' },
          { name: 'item3', quantity: 1, unit: 'each', price: 3.25, source: 'mock' },
          { name: 'item4', quantity: 1, unit: 'each', price: 4.00, source: 'mock' },
        ],
      };
      mockGetRecipe.mockResolvedValue(recipeWithMultipleIngredients);
      mockGetProductPrice.mockImplementation(async (name: string) => {
        const prices: Record<string, number> = {
          'item1': 1.50,
          'item2': 2.75,
          'item3': 3.25,
          'item4': 4.00,
        };
        return prices[name] || 0;
      });

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(200);
      expect(response.body.totalCost).toBe(11.50); // 1.50 + 2.75 + 3.25 + 4.00
    });

    it('should handle recipes with no ingredients', async () => {
      const recipeWithNoIngredients: Recipe = {
        ...mockRecipe,
        ingredients: [],
      };
      mockGetRecipe.mockResolvedValue(recipeWithNoIngredients);

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(200);
      expect(response.body.totalCost).toBe(0);
    });
  });
});


  describe('GET /api/recipes', () => {
    it('should return all recipes when no filters are applied', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockDBService.getRecipes.mockResolvedValue([mockRecipe, mockVeganRecipe]);
      mockGroceryService.getProductPrice.mockImplementation(async (name: string) => {
        const prices: Record<string, number> = {
          'spaghetti': 2.50,
          'eggs': 3.20,
          'parmesan cheese': 4.50,
          'broccoli': 3.00,
          'carrots': 1.50,
          'soy sauce': 1.00,
        };
        return prices[name] || 5.00;
      });

      const response = await request(app).get('/api/recipes');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('recipes');
      expect(Array.isArray(response.body.recipes)).toBe(true);
      expect(response.body.recipes.length).toBe(2);
      expect(mockDBService.getRecipes).toHaveBeenCalledWith(undefined);
    });

    it('should filter recipes by dietary tags', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockDBService.getRecipes.mockResolvedValue([mockVeganRecipe]);
      mockGroceryService.getProductPrice.mockResolvedValue(3.00);

      const response = await request(app).get('/api/recipes?dietaryTags=vegan');

      expect(response.status).toBe(200);
      expect(response.body.recipes.length).toBe(1);
      expect(response.body.recipes[0].dietaryTags).toContain('vegan');
      expect(mockDBService.getRecipes).toHaveBeenCalledWith({ dietaryTags: ['vegan'] });
    });

    it('should handle multiple dietary tags', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockDBService.getRecipes.mockResolvedValue([mockVeganRecipe]);
      mockGroceryService.getProductPrice.mockResolvedValue(3.00);

      const response = await request(app).get('/api/recipes?dietaryTags=vegan,vegetarian');

      expect(response.status).toBe(200);
      expect(mockDBService.getRecipes).toHaveBeenCalledWith({ dietaryTags: ['vegan', 'vegetarian'] });
    });

    it('should calculate total cost from ingredient prices', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockDBService.getRecipes.mockResolvedValue([mockRecipe]);
      mockGroceryService.getProductPrice.mockImplementation(async (name: string) => {
        const prices: Record<string, number> = {
          'spaghetti': 2.50,
          'eggs': 3.20,
          'parmesan cheese': 4.50,
        };
        return prices[name] || 5.00;
      });

      const response = await request(app).get('/api/recipes');

      expect(response.status).toBe(200);
      expect(response.body.recipes[0].totalCost).toBe(10.20);
    });

    it('should return cached recipes if available', async () => {
      const cachedRecipes = [mockRecipe];
      mockCacheService.get.mockReturnValue(cachedRecipes);

      const response = await request(app).get('/api/recipes');

      expect(response.status).toBe(200);
      expect(response.body.recipes).toEqual(cachedRecipes);
      expect(mockDBService.getRecipes).not.toHaveBeenCalled();
      expect(mockGroceryService.getProductPrice).not.toHaveBeenCalled();
    });

    it('should cache recipes after fetching from database', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockDBService.getRecipes.mockResolvedValue([mockRecipe]);
      mockGroceryService.getProductPrice.mockResolvedValue(3.00);

      await request(app).get('/api/recipes');

      expect(mockCacheService.set).toHaveBeenCalled();
      const cacheCall = mockCacheService.set.mock.calls[0];
      expect(cacheCall[0]).toBe('recipes:all'); // cache key
      expect(cacheCall[2]).toBe(24 * 60 * 60 * 1000); // 24 hours TTL
    });

    it('should handle database errors', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockDBService.getRecipes.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/api/recipes');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Database operation failed');
    });
  });

  describe('GET /api/recipes/:recipeId', () => {
    it('should return a single recipe by ID', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockDBService.getRecipe.mockResolvedValue(mockRecipe);
      mockGroceryService.getProductPrice.mockImplementation(async (name: string) => {
        const prices: Record<string, number> = {
          'spaghetti': 2.50,
          'eggs': 3.20,
          'parmesan cheese': 4.50,
        };
        return prices[name] || 5.00;
      });

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(200);
      expect(response.body.recipeId).toBe('recipe-1');
      expect(response.body.name).toBe('Pasta Carbonara');
      expect(mockDBService.getRecipe).toHaveBeenCalledWith('recipe-1');
    });

    it('should update ingredient prices from grocery service', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockDBService.getRecipe.mockResolvedValue(mockRecipe);
      mockGroceryService.getProductPrice.mockResolvedValue(5.00);

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(200);
      expect(mockGroceryService.getProductPrice).toHaveBeenCalledTimes(3); // 3 ingredients
      expect(mockGroceryService.getProductPrice).toHaveBeenCalledWith('spaghetti');
      expect(mockGroceryService.getProductPrice).toHaveBeenCalledWith('eggs');
      expect(mockGroceryService.getProductPrice).toHaveBeenCalledWith('parmesan cheese');
    });

    it('should calculate total cost correctly', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockDBService.getRecipe.mockResolvedValue(mockRecipe);
      mockGroceryService.getProductPrice.mockImplementation(async (name: string) => {
        const prices: Record<string, number> = {
          'spaghetti': 2.50,
          'eggs': 3.20,
          'parmesan cheese': 4.50,
        };
        return prices[name] || 5.00;
      });

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(200);
      expect(response.body.totalCost).toBe(10.20); // 2.50 + 3.20 + 4.50
    });

    it('should return 404 if recipe not found', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockDBService.getRecipe.mockResolvedValue(null);

      const response = await request(app).get('/api/recipes/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Resource not found');
      expect(response.body.resource).toBe('Recipe');
    });

    it('should return cached recipe if available', async () => {
      mockCacheService.get.mockReturnValue(mockRecipe);

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRecipe);
      expect(mockDBService.getRecipe).not.toHaveBeenCalled();
      expect(mockGroceryService.getProductPrice).not.toHaveBeenCalled();
    });

    it('should cache recipe after fetching from database', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockDBService.getRecipe.mockResolvedValue(mockRecipe);
      mockGroceryService.getProductPrice.mockResolvedValue(3.00);

      await request(app).get('/api/recipes/recipe-1');

      expect(mockCacheService.set).toHaveBeenCalled();
      const cacheCall = mockCacheService.set.mock.calls[0];
      expect(cacheCall[0]).toBe('recipe:recipe-1'); // cache key
      expect(cacheCall[2]).toBe(24 * 60 * 60 * 1000); // 24 hours TTL
    });

    it('should validate recipeId parameter', async () => {
      const response = await request(app).get('/api/recipes/');

      expect(response.status).toBe(404); // Express returns 404 for missing route param
    });

    it('should handle database errors', async () => {
      mockCacheService.get.mockReturnValue(null);
      mockDBService.getRecipe.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Database operation failed');
    });
  });

  describe('Total Cost Calculation', () => {
    it('should sum all ingredient prices correctly', async () => {
      mockCacheService.get.mockReturnValue(null);
      const recipeWithMultipleIngredients: Recipe = {
        ...mockRecipe,
        ingredients: [
          { name: 'item1', quantity: 1, unit: 'each', price: 1.50, source: 'mock' },
          { name: 'item2', quantity: 1, unit: 'each', price: 2.75, source: 'mock' },
          { name: 'item3', quantity: 1, unit: 'each', price: 3.25, source: 'mock' },
          { name: 'item4', quantity: 1, unit: 'each', price: 4.00, source: 'mock' },
        ],
      };
      mockDBService.getRecipe.mockResolvedValue(recipeWithMultipleIngredients);
      mockGroceryService.getProductPrice.mockImplementation(async (name: string) => {
        const prices: Record<string, number> = {
          'item1': 1.50,
          'item2': 2.75,
          'item3': 3.25,
          'item4': 4.00,
        };
        return prices[name] || 0;
      });

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(200);
      expect(response.body.totalCost).toBe(11.50); // 1.50 + 2.75 + 3.25 + 4.00
    });

    it('should handle recipes with no ingredients', async () => {
      mockCacheService.get.mockReturnValue(null);
      const recipeWithNoIngredients: Recipe = {
        ...mockRecipe,
        ingredients: [],
      };
      mockDBService.getRecipe.mockResolvedValue(recipeWithNoIngredients);

      const response = await request(app).get('/api/recipes/recipe-1');

      expect(response.status).toBe(200);
      expect(response.body.totalCost).toBe(0);
    });
  });
});
