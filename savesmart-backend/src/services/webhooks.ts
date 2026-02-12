/**
 * Webhook Service for AI Agent Integration
 *
 * This service provides integration with AI agents for chat, savings plan generation,
 * and meal planning. Currently uses OpenAI API directly as n8n is temporarily unavailable.
 * The interface is designed to be swappable back to n8n webhooks when available.
 *
 * Requirements: 3.1, 3.2, 3.5, 11.3
 */

import OpenAI from 'openai';
import { getConfig } from '../config/env.js';
import { DynamoDBService } from './dynamodb.js';
import type { MealPlanPreferences, AIMealPlanResponse } from '../models/MealPlan.js';
import type { Recipe } from '../models/Recipe.js';

/**
 * Chat context from the frontend
 */
export interface ChatContext {
  pageType?: 'dashboard' | 'recipe' | 'event' | 'fuel' | 'profile';
  dataId?: string;
  dataName?: string;
}

/**
 * Financial data for savings plan generation
 */
export interface FinancialData {
  income: number;
  expenses: Record<string, number>;
  goals: string[];
}

/**
 * Meal plan structure
 */
export interface MealPlan {
  days: {
    day: string;
    recipeId: string;
    recipeName: string;
  }[];
  totalWeeklyCost: number;
  optimizationSuggestions: string[];
}

/**
 * Savings plan structure
 */
export interface SavingsPlan {
  title: string;
  description: string;
  totalSavings: number;
  recommendations: string[];
}

/**
 * WebhookService class for AI agent integration
 * Uses OpenAI API directly with interface designed for easy swap to n8n webhooks
 */
export class WebhookService {
  private openai: OpenAI;
  private dynamoDBService: DynamoDBService;
  private readonly CHAT_TIMEOUT = 30000; // 30 seconds

  constructor() {
    const config = getConfig();
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    this.dynamoDBService = new DynamoDBService();
  }

  /**
   * Call the chat agent with a user message and optional context
   * Requirement 3.1: Forward chat messages to AI agent
   * Requirement 3.5: 30-second timeout for webhook responses
   *
   * @param message - User's chat message
   * @param context - Optional page context (minimal data)
   * @returns AI agent response
   * @throws Error if timeout or API failure
   */
  async callChatAgent(message: string, context?: ChatContext): Promise<string> {
    try {
      console.log('WebhookService: Starting OpenAI API call');

      // Build context-aware system prompt
      let systemPrompt = 'You are a helpful financial assistant for the SaveSmart application. ';
      systemPrompt += 'Provide concise, practical advice about saving money and managing finances.';

      // Add context if provided
      if (context?.pageType) {
        systemPrompt += `\n\nContext: User is currently on the ${context.pageType} page`;
        if (context.dataName) {
          systemPrompt += ` viewing "${context.dataName}"`;
        }
        if (context.dataId) {
          systemPrompt += ` (ID: ${context.dataId})`;
        }
        systemPrompt += '.';
      }

      console.log('WebhookService: Creating OpenAI completion request');

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          console.log('WebhookService: Request timed out after 30 seconds');
          reject(new Error('Chat agent request timed out after 30 seconds'));
        }, this.CHAT_TIMEOUT);
      });

      // Create OpenAI API call promise
      const apiPromise = this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      console.log('WebhookService: Waiting for OpenAI response...');

      // Race between API call and timeout
      const completion = await Promise.race([apiPromise, timeoutPromise]);

      console.log('WebhookService: OpenAI response received');

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from chat agent');
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        console.error('WebhookService: Chat agent error:', error.message);
        throw error;
      }
      throw new Error('Unknown error calling chat agent');
    }
  }

  /**
   * Call the savings plan generator agent
   * Requirement 3.2: Forward savings plan requests to AI agent
   *
   * @param userId - User ID for personalization
   * @param financialData - User's financial information
   * @returns Generated savings plan
   * @throws Error if API failure
   */
  async callSavingsPlanGenerator(
    userId: string,
    financialData: FinancialData
  ): Promise<SavingsPlan> {
    try {
      const systemPrompt = `You are a financial planning expert. Generate a detailed savings plan based on the user's financial data.
Return your response as a JSON object with this structure:
{
  "title": "Brief plan title",
  "description": "Detailed description of the savings strategy",
  "totalSavings": estimated_monthly_savings_amount,
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`;

      const userPrompt = `Generate a savings plan for a user with:
- Monthly Income: $${financialData.income}
- Monthly Expenses: ${JSON.stringify(financialData.expenses)}
- Financial Goals: ${financialData.goals.join(', ')}

Provide actionable recommendations to help them save money.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from savings plan generator');
      }

      const plan = JSON.parse(response) as SavingsPlan;
      return plan;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Savings plan generator error:', error.message);
        throw error;
      }
      throw new Error('Unknown error calling savings plan generator');
    }
  }

  /**
   * Call the meal planning agent
   * Requirement 11.3: Connect to meal planning agent
   *
   * @param userId - User ID for personalization
   * @param recipeIds - Array of recipe IDs to include in the plan
   * @param weekStartDate - Start date for the meal plan (ISO format)
   * @returns Optimized meal plan
   * @throws Error if API failure
   */
  async callMealPlanningAgent(
    userId: string,
    recipeIds: string[],
    weekStartDate: string
  ): Promise<MealPlan> {
    try {
      const systemPrompt = `You are a meal planning expert. Create an optimized weekly meal plan.
Return your response as a JSON object with this structure:
{
  "days": [
    {"day": "Monday", "recipeId": "recipe-id", "recipeName": "Recipe Name"},
    ...
  ],
  "totalWeeklyCost": estimated_total_cost,
  "optimizationSuggestions": ["suggestion 1", "suggestion 2"]
}`;

      const userPrompt = `Create a weekly meal plan starting ${weekStartDate} using these recipe IDs: ${recipeIds.join(', ')}.
Distribute the recipes across the week for variety and provide cost optimization suggestions.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from meal planning agent');
      }

      const mealPlan = JSON.parse(response) as MealPlan;
      return mealPlan;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Meal planning agent error:', error.message);
        throw error;
      }
      throw new Error('Unknown error calling meal planning agent');
    }
  }

  /**
   * Generate AI-powered meal plan based on user preferences
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.7, 3.8
   *
   * @param preferences - User's dietary preferences and restrictions
   * @returns AI-generated meal plan with 7 days of meals
   * @throws Error if API failure or validation error
   */
  async generateMealPlan(preferences: MealPlanPreferences): Promise<AIMealPlanResponse> {
    try {
      console.log('WebhookService: Starting meal plan generation');

      // Fetch available recipes from DynamoDB
      const recipes = await this.dynamoDBService.getRecipes();
      console.log(`WebhookService: Fetched ${recipes.length} recipes from database`);

      // Build recipe list for prompt
      const recipeList = recipes.map((recipe: Recipe) => ({
        id: recipe.recipeId,
        name: recipe.name,
        dietaryTags: recipe.dietaryTags,
        cost: recipe.totalCost,
        servings: recipe.servings,
      }));

      // Construct detailed prompt
      const systemPrompt = `You are a professional meal planning nutritionist. Generate a personalized weekly meal plan based on user preferences.

Return your response as a JSON object with this exact structure:
{
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "mealType": "breakfast",
          "name": "Meal Name",
          "description": "Brief description",
          "recipeId": "recipe-id or null if custom",
          "estimatedCalories": number,
          "estimatedCost": number
        },
        {
          "mealType": "lunch",
          "name": "Meal Name",
          "description": "Brief description",
          "recipeId": "recipe-id or null if custom",
          "estimatedCalories": number,
          "estimatedCost": number
        },
        {
          "mealType": "dinner",
          "name": "Meal Name",
          "description": "Brief description",
          "recipeId": "recipe-id or null if custom",
          "estimatedCalories": number,
          "estimatedCost": number
        },
        {
          "mealType": "snack",
          "name": "Meal Name",
          "description": "Brief description",
          "recipeId": "recipe-id or null if custom",
          "estimatedCalories": number,
          "estimatedCost": number
        }
      ]
    }
  ],
  "totalWeeklyCost": number,
  "nutritionSummary": {
    "averageDailyCalories": number,
    "proteinGrams": number,
    "carbsGrams": number,
    "fatGrams": number
  },
  "notes": "Any important notes about the meal plan"
}`;

      const userPrompt = `Generate a personalized weekly meal plan with these preferences:

Dietary Restrictions (Allergies): ${preferences.allergies.length > 0 ? preferences.allergies.join(', ') : 'None'}
Daily Calorie Goal: ${preferences.calorieGoal} calories
Cultural Preference: ${preferences.culturalPreference || 'None'}
Diet Type: ${preferences.dietType || 'None'}
Additional Notes: ${preferences.notes || 'None'}

Requirements:
- Generate exactly 7 days of meals (Monday through Sunday)
- Each day MUST have exactly 4 meals: breakfast, lunch, dinner, and snack
- STRICTLY avoid any ingredients containing the listed allergens
- Aim for the specified daily calorie goal (within 15% tolerance)
- Incorporate the cultural preference where possible
- Follow the diet type restrictions strictly
- Prioritize recipes from the provided database when available (aim for at least 70% of meals)
- Pay attention to the user's likes and dislikes in the notes

Available Recipes from Database:
${JSON.stringify(recipeList, null, 2)}

Important:
- Use recipeId from the database when using a recipe
- Set recipeId to null for custom meals not from the database
- Ensure meal variety across the week
- Balance nutrition across all meals
- Provide realistic calorie and cost estimates`;

      console.log('WebhookService: Calling OpenAI API for meal plan generation');

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 3000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI meal plan generator');
      }

      console.log('WebhookService: Parsing AI response');
      const mealPlan = JSON.parse(response) as AIMealPlanResponse;

      // Validate response structure
      if (!mealPlan.days || !Array.isArray(mealPlan.days)) {
        throw new Error('Invalid meal plan structure: missing days array');
      }

      if (mealPlan.days.length !== 7) {
        throw new Error(`Invalid meal plan structure: expected 7 days, got ${mealPlan.days.length}`);
      }

      for (const day of mealPlan.days) {
        if (!day.meals || !Array.isArray(day.meals)) {
          throw new Error(`Invalid meal plan structure: missing meals array for ${day.day}`);
        }
        if (day.meals.length < 3 || day.meals.length > 4) {
          throw new Error(`Invalid meal plan structure: ${day.day} has ${day.meals.length} meals, expected 3-4`);
        }
      }

      if (!mealPlan.nutritionSummary) {
        throw new Error('Invalid meal plan structure: missing nutritionSummary');
      }

      console.log('WebhookService: Meal plan generated successfully');
      return mealPlan;
    } catch (error) {
      if (error instanceof Error) {
        console.error('WebhookService: Meal plan generation error:', error.message);
        throw error;
      }
      throw new Error('Unknown error generating meal plan');
    }
  }
}
