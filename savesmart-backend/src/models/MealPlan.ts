/**
 * Meal Plan data models for AI-powered meal planning feature
 * Represents user preferences, meal plans, and shopping lists
 */

/**
 * User dietary preferences for meal plan generation
 */
export interface MealPlanPreferences {
  allergies: string[];           // ['Dairy', 'Gluten', 'Nuts', 'Shellfish', 'Eggs', 'Soy']
  calorieGoal: number;           // 1500 | 2000 | 2500 | 3000
  culturalPreference: string;    // 'Mediterranean' | 'Asian' | 'Mexican' | 'Indian' | 'Italian' | 'Australian' | ''
  dietType: string;              // 'Vegetarian' | 'Vegan' | 'Pescatarian' | 'Keto' | 'Paleo' | ''
  notes: string;                 // Free-text user preferences
}

/**
 * Meal type enumeration
 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * Individual meal in a meal plan
 */
export interface Meal {
  mealType: MealType;
  name: string;
  description: string;
  recipeId: string | null;       // null if custom meal not from database
  estimatedCalories: number;
  estimatedCost: number;
}

/**
 * Single day in a meal plan
 */
export interface MealPlanDay {
  day: string;                   // 'Monday' | 'Tuesday' | ... | 'Sunday'
  meals: Meal[];
}

/**
 * Nutrition summary for the meal plan
 */
export interface NutritionSummary {
  averageDailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

/**
 * Shopping list item
 */
export interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  recipeIds: string[];           // Which recipes use this ingredient
}

/**
 * Shopping list grouped by store
 */
export interface ShoppingListStore {
  storeName: string;             // 'Coles' | 'Woolworths' | 'Aldi'
  items: ShoppingListItem[];
  subtotal: number;
}

/**
 * Complete shopping list with store grouping
 */
export interface ShoppingList {
  stores: ShoppingListStore[];
  totalCost: number;
}

/**
 * Complete meal plan with all details
 */
export interface MealPlan {
  preferences: MealPlanPreferences;
  days: MealPlanDay[];
  totalWeeklyCost: number;
  nutritionSummary: NutritionSummary;
  shoppingList: ShoppingList;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * AI-generated meal plan response structure
 */
export interface AIMealPlanResponse {
  days: {
    day: string;
    meals: {
      mealType: MealType;
      name: string;
      description: string;
      recipeId: string | null;
      estimatedCalories: number;
      estimatedCost: number;
    }[];
  }[];
  totalWeeklyCost: number;
  nutritionSummary: NutritionSummary;
  notes: string;
}
