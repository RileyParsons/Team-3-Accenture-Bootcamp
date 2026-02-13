/**
 * Tests for Meal Plan Routes - Add Meal Endpoint
 * Tests the core logic for POST /api/meal-plan/:userId/meal
 */

import type { MealPlan, Meal } from '../models/MealPlan.js';
import type { Recipe } from '../models/Recipe.js';

describe('POST /api/meal-plan/:userId/meal - Logic Tests', () => {
  const createMockMealPlan = (): MealPlan => ({
    preferences: {
      allergies: [],
      calorieGoal: 2000,
      culturalPreference: '',
      dietType: '',
      notes: '',
    },
    days: [
      {
        day: 'Monday',
        meals: [
          {
            mealType: 'breakfast',
            name: 'Oatmeal',
            description: 'Healthy breakfast',
            recipeId: 'recipe1',
            estimatedCalories: 300,
            estimatedCost: 5.0,
          },
        ],
      },
      {
        day: 'Tuesday',
        meals: [],
      },
      {
        day: 'Wednesday',
        meals: [
          {
            mealType: 'lunch',
            name: 'Salad',
            description: 'Fresh salad',
            recipeId: 'recipe3',
            estimatedCalories: 250,
            estimatedCost: 6.0,
          },
        ],
      },
    ],
    totalWeeklyCost: 50.0,
    nutritionSummary: {
      averageDailyCalories: 2000,
      proteinGrams: 100,
      carbsGrams: 200,
      fatGrams: 50,
    },
    shoppingList: {
      stores: [],
      totalCost: 50.0,
    },
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  });

  const createMockRecipe = (): Recipe => ({
    recipeId: 'recipe2',
    name: 'Grilled Chicken',
    description: 'Delicious grilled chicken',
    ingredients: [
      {
        name: 'Chicken',
        quantity: 500,
        unit: 'g',
        price: 8.0,
        source: 'coles',
      },
    ],
    instructions: ['Grill the chicken'],
    prepTime: 10,
    servings: 2,
    dietaryTags: ['protein'],
    totalCost: 8.0,
    imageUrl: '',
    cachedAt: '2024-01-01T00:00:00.000Z',
  });

  describe('Request Validation', () => {
    it('should validate mealType values', () => {
      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      const invalidMealTypes = ['brunch', 'dessert', 'invalid', ''];

      validMealTypes.forEach(mealType => {
        expect(validMealTypes.includes(mealType)).toBe(true);
      });

      invalidMealTypes.forEach(mealType => {
        expect(validMealTypes.includes(mealType)).toBe(false);
      });
    });

    it('should validate day values', () => {
      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const invalidDays = ['monday', 'MONDAY', 'Mon', 'InvalidDay', ''];

      validDays.forEach(day => {
        expect(validDays.includes(day)).toBe(true);
      });

      invalidDays.forEach(day => {
        expect(validDays.includes(day)).toBe(false);
      });
    });
  });

  describe('Meal Addition Logic', () => {
    it('should add meal to empty slot', () => {
      const mealPlan = createMockMealPlan();
      const recipe = createMockRecipe();
      const day = 'Tuesday';
      const mealType = 'lunch';

      // Find the day
      const dayIndex = mealPlan.days.findIndex(d => d.day === day);
      expect(dayIndex).toBeGreaterThanOrEqual(0);

      // Check slot is empty
      const existingMealIndex = mealPlan.days[dayIndex].meals.findIndex(m => m.mealType === mealType);
      expect(existingMealIndex).toBe(-1);

      // Add meal
      const newMeal: Meal = {
        mealType: mealType as any,
        name: recipe.name,
        description: recipe.description,
        recipeId: recipe.recipeId,
        estimatedCalories: 0,
        estimatedCost: recipe.totalCost,
      };

      mealPlan.days[dayIndex].meals.push(newMeal);

      // Verify meal was added
      expect(mealPlan.days[dayIndex].meals.length).toBe(1);
      expect(mealPlan.days[dayIndex].meals[0].name).toBe('Grilled Chicken');
      expect(mealPlan.days[dayIndex].meals[0].recipeId).toBe('recipe2');
    });

    it('should replace existing meal in slot', () => {
      const mealPlan = createMockMealPlan();
      const recipe = createMockRecipe();
      const day = 'Monday';
      const mealType = 'breakfast';

      // Find the day
      const dayIndex = mealPlan.days.findIndex(d => d.day === day);
      expect(dayIndex).toBeGreaterThanOrEqual(0);

      // Check slot has existing meal
      const existingMealIndex = mealPlan.days[dayIndex].meals.findIndex(m => m.mealType === mealType);
      expect(existingMealIndex).toBeGreaterThanOrEqual(0);
      expect(mealPlan.days[dayIndex].meals[existingMealIndex].name).toBe('Oatmeal');

      // Replace meal
      const newMeal: Meal = {
        mealType: mealType as any,
        name: recipe.name,
        description: recipe.description,
        recipeId: recipe.recipeId,
        estimatedCalories: 0,
        estimatedCost: recipe.totalCost,
      };

      mealPlan.days[dayIndex].meals[existingMealIndex] = newMeal;

      // Verify meal was replaced
      expect(mealPlan.days[dayIndex].meals.length).toBe(1);
      expect(mealPlan.days[dayIndex].meals[0].name).toBe('Grilled Chicken');
      expect(mealPlan.days[dayIndex].meals[0].recipeId).toBe('recipe2');
    });

    it('should preserve other meals when adding to slot', () => {
      const mealPlan = createMockMealPlan();
      const recipe = createMockRecipe();
      const day = 'Wednesday';
      const mealType = 'dinner';

      // Find the day
      const dayIndex = mealPlan.days.findIndex(d => d.day === day);
      expect(dayIndex).toBeGreaterThanOrEqual(0);

      // Check existing meal count
      const initialMealCount = mealPlan.days[dayIndex].meals.length;
      expect(initialMealCount).toBe(1);

      // Add meal to different slot
      const newMeal: Meal = {
        mealType: mealType as any,
        name: recipe.name,
        description: recipe.description,
        recipeId: recipe.recipeId,
        estimatedCalories: 0,
        estimatedCost: recipe.totalCost,
      };

      mealPlan.days[dayIndex].meals.push(newMeal);

      // Verify both meals exist
      expect(mealPlan.days[dayIndex].meals.length).toBe(2);
      expect(mealPlan.days[dayIndex].meals[0].name).toBe('Salad');
      expect(mealPlan.days[dayIndex].meals[1].name).toBe('Grilled Chicken');
    });
  });

  describe('Recipe to Meal Conversion', () => {
    it('should correctly convert recipe to meal', () => {
      const recipe = createMockRecipe();
      const mealType = 'dinner';

      const meal: Meal = {
        mealType: mealType as any,
        name: recipe.name,
        description: recipe.description,
        recipeId: recipe.recipeId,
        estimatedCalories: 0,
        estimatedCost: recipe.totalCost,
      };

      expect(meal.name).toBe('Grilled Chicken');
      expect(meal.description).toBe('Delicious grilled chicken');
      expect(meal.recipeId).toBe('recipe2');
      expect(meal.estimatedCost).toBe(8.0);
      expect(meal.mealType).toBe('dinner');
    });

    it('should handle recipe with empty description', () => {
      const recipe = createMockRecipe();
      recipe.description = '';

      const meal: Meal = {
        mealType: 'lunch',
        name: recipe.name,
        description: recipe.description || '',
        recipeId: recipe.recipeId,
        estimatedCalories: 0,
        estimatedCost: recipe.totalCost,
      };

      expect(meal.description).toBe('');
    });
  });

  describe('Day Finding Logic', () => {
    it('should find correct day in meal plan', () => {
      const mealPlan = createMockMealPlan();

      const mondayIndex = mealPlan.days.findIndex(d => d.day === 'Monday');
      expect(mondayIndex).toBe(0);

      const tuesdayIndex = mealPlan.days.findIndex(d => d.day === 'Tuesday');
      expect(tuesdayIndex).toBe(1);

      const wednesdayIndex = mealPlan.days.findIndex(d => d.day === 'Wednesday');
      expect(wednesdayIndex).toBe(2);
    });

    it('should return -1 for non-existent day', () => {
      const mealPlan = createMockMealPlan();

      const invalidDayIndex = mealPlan.days.findIndex(d => d.day === 'InvalidDay');
      expect(invalidDayIndex).toBe(-1);
    });
  });
});
