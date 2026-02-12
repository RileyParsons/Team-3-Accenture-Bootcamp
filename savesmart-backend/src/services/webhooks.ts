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
  private readonly CHAT_TIMEOUT = 30000; // 30 seconds

  constructor() {
    const config = getConfig();
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
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

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
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

      // Race between API call and timeout
      const completion = await Promise.race([apiPromise, timeoutPromise]);

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from chat agent');
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Chat agent error:', error.message);
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
}
