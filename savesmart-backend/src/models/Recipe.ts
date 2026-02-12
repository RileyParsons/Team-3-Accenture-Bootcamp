/**
 * Recipe data model for SaveSmart application
 * Represents a meal preparation guide with ingredient list and pricing
 */

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  source: 'coles' | 'woolworths' | 'mock';
}

export interface Recipe {
  recipeId: string;            // Partition key
  name: string;
  description: string;
  imageUrl: string;
  prepTime: number;            // minutes
  servings: number;
  dietaryTags: string[];       // ['vegetarian', 'vegan', 'gluten-free']
  ingredients: Ingredient[];
  instructions: string[];
  totalCost: number;           // calculated from ingredients
  cachedAt: string;
}
