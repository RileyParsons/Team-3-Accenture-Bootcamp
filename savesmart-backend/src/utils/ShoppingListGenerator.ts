/**
 * Shopping List Generator Utility
 * Generates shopping lists from meal plans by extracting and aggregating ingredients
 */

import { MealPlan, ShoppingList, ShoppingListStore, ShoppingListItem } from '../models/MealPlan';
import { Recipe, Ingredient } from '../models/Recipe';

/**
 * Utility class for generating shopping lists from meal plans
 */
export class ShoppingListGenerator {
  /**
   * Generate a shopping list from a meal plan and associated recipes
   *
   * @param mealPlan - The meal plan containing meals for the week
   * @param recipes - Array of recipes referenced in the meal plan
   * @returns ShoppingList grouped by store with aggregated ingredients
   */
  static generateShoppingList(mealPlan: MealPlan, recipes: Recipe[]): ShoppingList {
    // Create a map of recipeId to Recipe for quick lookup
    const recipeMap = new Map<string, Recipe>();
    recipes.forEach(recipe => {
      recipeMap.set(recipe.recipeId, recipe);
    });

    // Extract all ingredients from recipes in the meal plan
    const ingredientsByStore = new Map<string, Map<string, ShoppingListItem>>();

    // Iterate through all days and meals
    for (const day of mealPlan.days) {
      for (const meal of day.meals) {
        // Skip meals without recipe IDs (custom meals)
        if (!meal.recipeId) {
          continue;
        }

        const recipe = recipeMap.get(meal.recipeId);
        if (!recipe) {
          continue;
        }

        // Process each ingredient in the recipe
        for (const ingredient of recipe.ingredients) {
          const storeName = this.normalizeStoreName(ingredient.source);

          // Initialize store map if it doesn't exist
          if (!ingredientsByStore.has(storeName)) {
            ingredientsByStore.set(storeName, new Map<string, ShoppingListItem>());
          }

          const storeItems = ingredientsByStore.get(storeName)!;
          const itemKey = `${ingredient.name}|${ingredient.unit}`;

          if (storeItems.has(itemKey)) {
            // Aggregate duplicate ingredients
            const existingItem = storeItems.get(itemKey)!;
            existingItem.quantity += ingredient.quantity;
            existingItem.price += ingredient.price;
            existingItem.recipeIds.push(meal.recipeId);
          } else {
            // Add new ingredient
            storeItems.set(itemKey, {
              name: ingredient.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              price: ingredient.price,
              recipeIds: [meal.recipeId]
            });
          }
        }
      }
    }

    // Build the shopping list with stores
    const stores: ShoppingListStore[] = [];
    let totalCost = 0;

    for (const [storeName, items] of ingredientsByStore.entries()) {
      const storeItems = Array.from(items.values());
      const subtotal = storeItems.reduce((sum, item) => sum + item.price, 0);

      stores.push({
        storeName,
        items: storeItems,
        subtotal
      });

      totalCost += subtotal;
    }

    // Sort stores alphabetically for consistent display
    stores.sort((a, b) => a.storeName.localeCompare(b.storeName));

    return {
      stores,
      totalCost
    };
  }

  /**
   * Normalize store names to standard format
   *
   * @param source - The source store name from ingredient
   * @returns Normalized store name
   */
  private static normalizeStoreName(source: string): string {
    const normalized = source.toLowerCase();

    if (normalized === 'coles') {
      return 'Coles';
    } else if (normalized === 'woolworths') {
      return 'Woolworths';
    } else if (normalized === 'aldi') {
      return 'Aldi';
    } else {
      // Default to 'mock' or other sources as 'Other'
      return 'Other';
    }
  }
}
