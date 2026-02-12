/**
 * Recipe Price Calculator
 *
 * Calculates total recipe cost at both Coles and Woolworths
 * and determines which store offers the best value
 */

import { Recipe, Ingredient, StorePricing } from '../models/Recipe.js';
import { getAustralianPrice } from '../data/australian-grocery-prices.js';

export class RecipePriceCalculator {
  /**
   * Calculate pricing for a recipe at both Coles and Woolworths
   */
  static calculateStorePricing(recipe: Recipe): StorePricing {
    let colesTotal = 0;
    let woolworthsTotal = 0;

    // Calculate total for each store
    for (const ingredient of recipe.ingredients) {
      // Get prices from both stores
      const priceData = getAustralianPrice(ingredient.name);

      // Add prices from both stores
      colesTotal += priceData.colesPrice;
      woolworthsTotal += priceData.woolworthsPrice;
    }

    // Round to 2 decimal places
    colesTotal = Math.round(colesTotal * 100) / 100;
    woolworthsTotal = Math.round(woolworthsTotal * 100) / 100;

    // Determine cheapest and calculate savings
    const cheapest = colesTotal <= woolworthsTotal ? 'coles' : 'woolworths';
    const savings = Math.abs(colesTotal - woolworthsTotal);

    return {
      coles: colesTotal,
      woolworths: woolworthsTotal,
      cheapest,
      savings: Math.round(savings * 100) / 100,
    };
  }

  /**
   * Add store pricing to a recipe
   */
  static enrichRecipeWithPricing(recipe: Recipe): Recipe {
    const storePricing = this.calculateStorePricing(recipe);

    return {
      ...recipe,
      storePricing,
      totalCost: Math.min(storePricing.coles, storePricing.woolworths),
    };
  }

  /**
   * Add store pricing to multiple recipes
   */
  static enrichRecipesWithPricing(recipes: Recipe[]): Recipe[] {
    return recipes.map(recipe => this.enrichRecipeWithPricing(recipe));
  }
}
