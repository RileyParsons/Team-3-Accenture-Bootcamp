/**
 * Unit tests for ShoppingListGenerator utility
 */

import { ShoppingListGenerator } from './ShoppingListGenerator';
import { MealPlan, MealPlanDay, Meal } from '../models/MealPlan';
import { Recipe, Ingredient } from '../models/Recipe';

describe('ShoppingListGenerator', () => {
  // Helper function to create a basic meal plan
  const createMealPlan = (days: MealPlanDay[]): MealPlan => ({
    preferences: {
      allergies: [],
      calorieGoal: 2000,
      culturalPreference: '',
      dietType: '',
      notes: ''
    },
    days,
    totalWeeklyCost: 0,
    nutritionSummary: {
      averageDailyCalories: 2000,
      proteinGrams: 100,
      carbsGrams: 250,
      fatGrams: 70
    },
    shoppingList: { stores: [], totalCost: 0 },
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Helper function to create a basic recipe
  const createRecipe = (recipeId: string, ingredients: Ingredient[]): Recipe => ({
    recipeId,
    name: `Recipe ${recipeId}`,
    description: 'Test recipe',
    imageUrl: '',
    prepTime: 30,
    servings: 4,
    dietaryTags: [],
    ingredients,
    instructions: [],
    totalCost: ingredients.reduce((sum, ing) => sum + ing.price, 0),
    cachedAt: new Date().toISOString()
  });

  describe('generateShoppingList', () => {
    it('should generate empty shopping list for meal plan with no recipes', () => {
      const mealPlan = createMealPlan([
        {
          day: 'Monday',
          meals: [
            {
              mealType: 'breakfast',
              name: 'Custom Breakfast',
              description: 'Custom meal',
              recipeId: null,
              estimatedCalories: 400,
              estimatedCost: 5
            }
          ]
        }
      ]);

      const recipes: Recipe[] = [];
      const shoppingList = ShoppingListGenerator.generateShoppingList(mealPlan, recipes);

      expect(shoppingList.stores).toHaveLength(0);
      expect(shoppingList.totalCost).toBe(0);
    });

    it('should generate shopping list with single recipe from one store', () => {
      const recipe = createRecipe('recipe1', [
        { name: 'Milk', quantity: 1, unit: 'L', price: 3.50, source: 'coles' },
        { name: 'Eggs', quantity: 12, unit: 'count', price: 5.00, source: 'coles' }
      ]);

      const mealPlan = createMealPlan([
        {
          day: 'Monday',
          meals: [
            {
              mealType: 'breakfast',
              name: 'Breakfast',
              description: 'Test meal',
              recipeId: 'recipe1',
              estimatedCalories: 400,
              estimatedCost: 8.50
            }
          ]
        }
      ]);

      const shoppingList = ShoppingListGenerator.generateShoppingList(mealPlan, [recipe]);

      expect(shoppingList.stores).toHaveLength(1);
      expect(shoppingList.stores[0].storeName).toBe('Coles');
      expect(shoppingList.stores[0].items).toHaveLength(2);
      expect(shoppingList.stores[0].subtotal).toBe(8.50);
      expect(shoppingList.totalCost).toBe(8.50);
    });

    it('should group ingredients by store correctly', () => {
      const recipe1 = createRecipe('recipe1', [
        { name: 'Milk', quantity: 1, unit: 'L', price: 3.50, source: 'coles' }
      ]);

      const recipe2 = createRecipe('recipe2', [
        { name: 'Bread', quantity: 1, unit: 'loaf', price: 2.50, source: 'woolworths' }
      ]);

      const recipe3 = createRecipe('recipe3', [
        { name: 'Butter', quantity: 250, unit: 'g', price: 4.00, source: 'mock' }
      ]);

      const mealPlan = createMealPlan([
        {
          day: 'Monday',
          meals: [
            {
              mealType: 'breakfast',
              name: 'Meal 1',
              description: 'Test',
              recipeId: 'recipe1',
              estimatedCalories: 400,
              estimatedCost: 3.50
            },
            {
              mealType: 'lunch',
              name: 'Meal 2',
              description: 'Test',
              recipeId: 'recipe2',
              estimatedCalories: 500,
              estimatedCost: 2.50
            },
            {
              mealType: 'dinner',
              name: 'Meal 3',
              description: 'Test',
              recipeId: 'recipe3',
              estimatedCalories: 600,
              estimatedCost: 4.00
            }
          ]
        }
      ]);

      const shoppingList = ShoppingListGenerator.generateShoppingList(
        mealPlan,
        [recipe1, recipe2, recipe3]
      );

      expect(shoppingList.stores).toHaveLength(3);

      // Stores should be sorted alphabetically
      expect(shoppingList.stores[0].storeName).toBe('Coles');
      expect(shoppingList.stores[1].storeName).toBe('Other');
      expect(shoppingList.stores[2].storeName).toBe('Woolworths');

      expect(shoppingList.totalCost).toBe(10.00);
    });

    it('should aggregate duplicate ingredients with same unit', () => {
      const recipe1 = createRecipe('recipe1', [
        { name: 'Milk', quantity: 1, unit: 'L', price: 3.50, source: 'coles' },
        { name: 'Eggs', quantity: 6, unit: 'count', price: 2.50, source: 'coles' }
      ]);

      const recipe2 = createRecipe('recipe2', [
        { name: 'Milk', quantity: 2, unit: 'L', price: 7.00, source: 'coles' },
        { name: 'Eggs', quantity: 6, unit: 'count', price: 2.50, source: 'coles' }
      ]);

      const mealPlan = createMealPlan([
        {
          day: 'Monday',
          meals: [
            {
              mealType: 'breakfast',
              name: 'Meal 1',
              description: 'Test',
              recipeId: 'recipe1',
              estimatedCalories: 400,
              estimatedCost: 6.00
            },
            {
              mealType: 'lunch',
              name: 'Meal 2',
              description: 'Test',
              recipeId: 'recipe2',
              estimatedCalories: 500,
              estimatedCost: 9.50
            }
          ]
        }
      ]);

      const shoppingList = ShoppingListGenerator.generateShoppingList(
        mealPlan,
        [recipe1, recipe2]
      );

      expect(shoppingList.stores).toHaveLength(1);
      expect(shoppingList.stores[0].items).toHaveLength(2);

      const milkItem = shoppingList.stores[0].items.find(item => item.name === 'Milk');
      const eggsItem = shoppingList.stores[0].items.find(item => item.name === 'Eggs');

      expect(milkItem).toBeDefined();
      expect(milkItem!.quantity).toBe(3); // 1 + 2
      expect(milkItem!.price).toBe(10.50); // 3.50 + 7.00
      expect(milkItem!.recipeIds).toEqual(['recipe1', 'recipe2']);

      expect(eggsItem).toBeDefined();
      expect(eggsItem!.quantity).toBe(12); // 6 + 6
      expect(eggsItem!.price).toBe(5.00); // 2.50 + 2.50
    });

    it('should NOT aggregate ingredients with different units', () => {
      const recipe1 = createRecipe('recipe1', [
        { name: 'Flour', quantity: 500, unit: 'g', price: 2.00, source: 'coles' }
      ]);

      const recipe2 = createRecipe('recipe2', [
        { name: 'Flour', quantity: 1, unit: 'kg', price: 3.50, source: 'coles' }
      ]);

      const mealPlan = createMealPlan([
        {
          day: 'Monday',
          meals: [
            {
              mealType: 'breakfast',
              name: 'Meal 1',
              description: 'Test',
              recipeId: 'recipe1',
              estimatedCalories: 400,
              estimatedCost: 2.00
            },
            {
              mealType: 'lunch',
              name: 'Meal 2',
              description: 'Test',
              recipeId: 'recipe2',
              estimatedCalories: 500,
              estimatedCost: 3.50
            }
          ]
        }
      ]);

      const shoppingList = ShoppingListGenerator.generateShoppingList(
        mealPlan,
        [recipe1, recipe2]
      );

      expect(shoppingList.stores).toHaveLength(1);
      expect(shoppingList.stores[0].items).toHaveLength(2); // Two separate items

      const flourGrams = shoppingList.stores[0].items.find(
        item => item.name === 'Flour' && item.unit === 'g'
      );
      const flourKg = shoppingList.stores[0].items.find(
        item => item.name === 'Flour' && item.unit === 'kg'
      );

      expect(flourGrams).toBeDefined();
      expect(flourGrams!.quantity).toBe(500);
      expect(flourKg).toBeDefined();
      expect(flourKg!.quantity).toBe(1);
    });

    it('should calculate subtotals per store correctly', () => {
      const recipe1 = createRecipe('recipe1', [
        { name: 'Item1', quantity: 1, unit: 'unit', price: 5.00, source: 'coles' },
        { name: 'Item2', quantity: 1, unit: 'unit', price: 3.00, source: 'coles' }
      ]);

      const recipe2 = createRecipe('recipe2', [
        { name: 'Item3', quantity: 1, unit: 'unit', price: 7.50, source: 'woolworths' }
      ]);

      const mealPlan = createMealPlan([
        {
          day: 'Monday',
          meals: [
            {
              mealType: 'breakfast',
              name: 'Meal 1',
              description: 'Test',
              recipeId: 'recipe1',
              estimatedCalories: 400,
              estimatedCost: 8.00
            },
            {
              mealType: 'lunch',
              name: 'Meal 2',
              description: 'Test',
              recipeId: 'recipe2',
              estimatedCalories: 500,
              estimatedCost: 7.50
            }
          ]
        }
      ]);

      const shoppingList = ShoppingListGenerator.generateShoppingList(
        mealPlan,
        [recipe1, recipe2]
      );

      const colesStore = shoppingList.stores.find(s => s.storeName === 'Coles');
      const woolworthsStore = shoppingList.stores.find(s => s.storeName === 'Woolworths');

      expect(colesStore).toBeDefined();
      expect(colesStore!.subtotal).toBe(8.00);
      expect(woolworthsStore).toBeDefined();
      expect(woolworthsStore!.subtotal).toBe(7.50);
      expect(shoppingList.totalCost).toBe(15.50);
    });

    it('should handle recipes across multiple days', () => {
      const recipe = createRecipe('recipe1', [
        { name: 'Milk', quantity: 1, unit: 'L', price: 3.50, source: 'coles' }
      ]);

      const mealPlan = createMealPlan([
        {
          day: 'Monday',
          meals: [
            {
              mealType: 'breakfast',
              name: 'Breakfast',
              description: 'Test',
              recipeId: 'recipe1',
              estimatedCalories: 400,
              estimatedCost: 3.50
            }
          ]
        },
        {
          day: 'Tuesday',
          meals: [
            {
              mealType: 'breakfast',
              name: 'Breakfast',
              description: 'Test',
              recipeId: 'recipe1',
              estimatedCalories: 400,
              estimatedCost: 3.50
            }
          ]
        }
      ]);

      const shoppingList = ShoppingListGenerator.generateShoppingList(mealPlan, [recipe]);

      expect(shoppingList.stores).toHaveLength(1);
      expect(shoppingList.stores[0].items).toHaveLength(1);

      const milkItem = shoppingList.stores[0].items[0];
      expect(milkItem.quantity).toBe(2); // Used on both days
      expect(milkItem.price).toBe(7.00);
      expect(milkItem.recipeIds).toEqual(['recipe1', 'recipe1']);
    });

    it('should skip meals with missing recipe IDs', () => {
      const recipe = createRecipe('recipe1', [
        { name: 'Milk', quantity: 1, unit: 'L', price: 3.50, source: 'coles' }
      ]);

      const mealPlan = createMealPlan([
        {
          day: 'Monday',
          meals: [
            {
              mealType: 'breakfast',
              name: 'Custom Meal',
              description: 'No recipe',
              recipeId: null,
              estimatedCalories: 400,
              estimatedCost: 5.00
            },
            {
              mealType: 'lunch',
              name: 'Recipe Meal',
              description: 'Has recipe',
              recipeId: 'recipe1',
              estimatedCalories: 500,
              estimatedCost: 3.50
            }
          ]
        }
      ]);

      const shoppingList = ShoppingListGenerator.generateShoppingList(mealPlan, [recipe]);

      expect(shoppingList.stores).toHaveLength(1);
      expect(shoppingList.stores[0].items).toHaveLength(1);
      expect(shoppingList.stores[0].items[0].name).toBe('Milk');
    });

    it('should skip meals with recipe IDs not found in recipes array', () => {
      const recipe = createRecipe('recipe1', [
        { name: 'Milk', quantity: 1, unit: 'L', price: 3.50, source: 'coles' }
      ]);

      const mealPlan = createMealPlan([
        {
          day: 'Monday',
          meals: [
            {
              mealType: 'breakfast',
              name: 'Missing Recipe',
              description: 'Recipe not provided',
              recipeId: 'recipe999',
              estimatedCalories: 400,
              estimatedCost: 5.00
            },
            {
              mealType: 'lunch',
              name: 'Valid Recipe',
              description: 'Recipe exists',
              recipeId: 'recipe1',
              estimatedCalories: 500,
              estimatedCost: 3.50
            }
          ]
        }
      ]);

      const shoppingList = ShoppingListGenerator.generateShoppingList(mealPlan, [recipe]);

      expect(shoppingList.stores).toHaveLength(1);
      expect(shoppingList.stores[0].items).toHaveLength(1);
      expect(shoppingList.stores[0].items[0].name).toBe('Milk');
    });

    it('should handle recipes with no ingredients', () => {
      const recipe = createRecipe('recipe1', []);

      const mealPlan = createMealPlan([
        {
          day: 'Monday',
          meals: [
            {
              mealType: 'breakfast',
              name: 'Empty Recipe',
              description: 'No ingredients',
              recipeId: 'recipe1',
              estimatedCalories: 400,
              estimatedCost: 0
            }
          ]
        }
      ]);

      const shoppingList = ShoppingListGenerator.generateShoppingList(mealPlan, [recipe]);

      expect(shoppingList.stores).toHaveLength(0);
      expect(shoppingList.totalCost).toBe(0);
    });

    it('should normalize store names correctly', () => {
      const recipe1 = createRecipe('recipe1', [
        { name: 'Item1', quantity: 1, unit: 'unit', price: 5.00, source: 'coles' }
      ]);

      const recipe2 = createRecipe('recipe2', [
        { name: 'Item2', quantity: 1, unit: 'unit', price: 3.00, source: 'woolworths' }
      ]);

      const recipe3 = createRecipe('recipe3', [
        { name: 'Item3', quantity: 1, unit: 'unit', price: 2.00, source: 'mock' }
      ]);

      const mealPlan = createMealPlan([
        {
          day: 'Monday',
          meals: [
            {
              mealType: 'breakfast',
              name: 'Meal 1',
              description: 'Test',
              recipeId: 'recipe1',
              estimatedCalories: 400,
              estimatedCost: 5.00
            },
            {
              mealType: 'lunch',
              name: 'Meal 2',
              description: 'Test',
              recipeId: 'recipe2',
              estimatedCalories: 500,
              estimatedCost: 3.00
            },
            {
              mealType: 'dinner',
              name: 'Meal 3',
              description: 'Test',
              recipeId: 'recipe3',
              estimatedCalories: 600,
              estimatedCost: 2.00
            }
          ]
        }
      ]);

      const shoppingList = ShoppingListGenerator.generateShoppingList(
        mealPlan,
        [recipe1, recipe2, recipe3]
      );

      const storeNames = shoppingList.stores.map(s => s.storeName);
      expect(storeNames).toContain('Coles');
      expect(storeNames).toContain('Woolworths');
      expect(storeNames).toContain('Other'); // 'mock' should be normalized to 'Other'
    });

    it('should track which recipes use each ingredient', () => {
      const recipe1 = createRecipe('recipe1', [
        { name: 'Milk', quantity: 1, unit: 'L', price: 3.50, source: 'coles' }
      ]);

      const recipe2 = createRecipe('recipe2', [
        { name: 'Milk', quantity: 1, unit: 'L', price: 3.50, source: 'coles' }
      ]);

      const recipe3 = createRecipe('recipe3', [
        { name: 'Eggs', quantity: 12, unit: 'count', price: 5.00, source: 'coles' }
      ]);

      const mealPlan = createMealPlan([
        {
          day: 'Monday',
          meals: [
            {
              mealType: 'breakfast',
              name: 'Meal 1',
              description: 'Test',
              recipeId: 'recipe1',
              estimatedCalories: 400,
              estimatedCost: 3.50
            },
            {
              mealType: 'lunch',
              name: 'Meal 2',
              description: 'Test',
              recipeId: 'recipe2',
              estimatedCalories: 500,
              estimatedCost: 3.50
            },
            {
              mealType: 'dinner',
              name: 'Meal 3',
              description: 'Test',
              recipeId: 'recipe3',
              estimatedCalories: 600,
              estimatedCost: 5.00
            }
          ]
        }
      ]);

      const shoppingList = ShoppingListGenerator.generateShoppingList(
        mealPlan,
        [recipe1, recipe2, recipe3]
      );

      const milkItem = shoppingList.stores[0].items.find(item => item.name === 'Milk');
      const eggsItem = shoppingList.stores[0].items.find(item => item.name === 'Eggs');

      expect(milkItem).toBeDefined();
      expect(milkItem!.recipeIds).toEqual(['recipe1', 'recipe2']);

      expect(eggsItem).toBeDefined();
      expect(eggsItem!.recipeIds).toEqual(['recipe3']);
    });
  });
});
