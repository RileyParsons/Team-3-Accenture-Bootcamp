/**
 * Unit Tests for Webhook Service
 *
 * Tests the WebhookService class with OpenAI integration
 */

import { WebhookService, ChatContext, FinancialData } from './webhooks.js';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

// Mock config
jest.mock('../config/env.js', () => ({
  getConfig: jest.fn(() => ({
    openai: {
      apiKey: 'test-api-key',
    },
  })),
}));

describe('WebhookService', () => {
  let webhookService: WebhookService;
  let mockOpenAI: jest.Mocked<OpenAI>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock OpenAI instance
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    } as any;

    // Mock OpenAI constructor
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI);

    webhookService = new WebhookService();
  });

  describe('callChatAgent', () => {
    it('should send message to OpenAI and return response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Here is some financial advice',
            },
          },
        ],
      };

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      const result = await webhookService.callChatAgent('How can I save money?');

      expect(result).toBe('Here is some financial advice');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: 'How can I save money?' }),
          ]),
        })
      );
    });

    it('should include context in system prompt when provided', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Recipe-specific advice',
            },
          },
        ],
      };

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      const context: ChatContext = {
        pageType: 'recipe',
        dataId: 'recipe-123',
        dataName: 'Pasta Carbonara',
      };

      await webhookService.callChatAgent('Can I substitute ingredients?', context);

      const callArgs = (mockOpenAI.chat.completions.create as jest.Mock).mock.calls[0][0];
      const systemMessage = callArgs.messages[0].content;

      expect(systemMessage).toContain('recipe page');
      expect(systemMessage).toContain('Pasta Carbonara');
      expect(systemMessage).toContain('recipe-123');
    });

    it('should timeout after 30 seconds', async () => {
      // Mock a delayed response
      (mockOpenAI.chat.completions.create as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ choices: [{ message: { content: 'Late response' } }] }), 35000);
          })
      );

      await expect(webhookService.callChatAgent('Test message')).rejects.toThrow(
        'Chat agent request timed out after 30 seconds'
      );
    }, 35000);

    it('should throw error when no response content', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      };

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      await expect(webhookService.callChatAgent('Test message')).rejects.toThrow(
        'No response from chat agent'
      );
    });

    it('should handle API errors gracefully', async () => {
      (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      await expect(webhookService.callChatAgent('Test message')).rejects.toThrow(
        'API rate limit exceeded'
      );
    });
  });

  describe('callSavingsPlanGenerator', () => {
    it('should generate savings plan from financial data', async () => {
      const mockPlan = {
        title: 'Monthly Savings Plan',
        description: 'Save $500 per month',
        totalSavings: 500,
        recommendations: ['Cut dining out', 'Use coupons', 'Track expenses'],
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify(mockPlan),
            },
          },
        ],
      };

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      const financialData: FinancialData = {
        income: 5000,
        expenses: {
          rent: 1500,
          food: 600,
          transport: 300,
        },
        goals: ['Save for vacation', 'Build emergency fund'],
      };

      const result = await webhookService.callSavingsPlanGenerator('user-123', financialData);

      expect(result).toEqual(mockPlan);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
          response_format: { type: 'json_object' },
        })
      );
    });

    it('should include financial data in prompt', async () => {
      const mockPlan = {
        title: 'Test Plan',
        description: 'Test',
        totalSavings: 100,
        recommendations: ['Test'],
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify(mockPlan),
            },
          },
        ],
      };

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      const financialData: FinancialData = {
        income: 3000,
        expenses: { rent: 1000 },
        goals: ['Save money'],
      };

      await webhookService.callSavingsPlanGenerator('user-123', financialData);

      const callArgs = (mockOpenAI.chat.completions.create as jest.Mock).mock.calls[0][0];
      const userMessage = callArgs.messages[1].content;

      expect(userMessage).toContain('3000');
      expect(userMessage).toContain('rent');
      expect(userMessage).toContain('Save money');
    });

    it('should throw error when no response content', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      };

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      const financialData: FinancialData = {
        income: 5000,
        expenses: {},
        goals: [],
      };

      await expect(
        webhookService.callSavingsPlanGenerator('user-123', financialData)
      ).rejects.toThrow('No response from savings plan generator');
    });

    it('should handle invalid JSON response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Invalid JSON',
            },
          },
        ],
      };

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      const financialData: FinancialData = {
        income: 5000,
        expenses: {},
        goals: [],
      };

      await expect(
        webhookService.callSavingsPlanGenerator('user-123', financialData)
      ).rejects.toThrow();
    });
  });

  describe('callMealPlanningAgent', () => {
    it('should generate meal plan from recipe IDs', async () => {
      const mockMealPlan = {
        days: [
          { day: 'Monday', recipeId: 'recipe-1', recipeName: 'Pasta' },
          { day: 'Tuesday', recipeId: 'recipe-2', recipeName: 'Salad' },
        ],
        totalWeeklyCost: 75.5,
        optimizationSuggestions: ['Buy in bulk', 'Use seasonal ingredients'],
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify(mockMealPlan),
            },
          },
        ],
      };

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      const result = await webhookService.callMealPlanningAgent(
        'user-123',
        ['recipe-1', 'recipe-2'],
        '2024-01-01'
      );

      expect(result).toEqual(mockMealPlan);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          response_format: { type: 'json_object' },
        })
      );
    });

    it('should include recipe IDs and date in prompt', async () => {
      const mockMealPlan = {
        days: [],
        totalWeeklyCost: 0,
        optimizationSuggestions: [],
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify(mockMealPlan),
            },
          },
        ],
      };

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      await webhookService.callMealPlanningAgent(
        'user-123',
        ['recipe-1', 'recipe-2', 'recipe-3'],
        '2024-02-15'
      );

      const callArgs = (mockOpenAI.chat.completions.create as jest.Mock).mock.calls[0][0];
      const userMessage = callArgs.messages[1].content;

      expect(userMessage).toContain('2024-02-15');
      expect(userMessage).toContain('recipe-1');
      expect(userMessage).toContain('recipe-2');
      expect(userMessage).toContain('recipe-3');
    });

    it('should throw error when no response content', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      };

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        webhookService.callMealPlanningAgent('user-123', ['recipe-1'], '2024-01-01')
      ).rejects.toThrow('No response from meal planning agent');
    });

    it('should handle API errors gracefully', async () => {
      (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(
        webhookService.callMealPlanningAgent('user-123', ['recipe-1'], '2024-01-01')
      ).rejects.toThrow('Network error');
    });
  });
});
