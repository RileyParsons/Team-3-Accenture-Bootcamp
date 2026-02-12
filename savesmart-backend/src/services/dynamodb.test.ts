/**
 * Unit tests for DynamoDB Service
 */

import { User } from '../models/User.js';
import { SavingsPlan } from '../models/SavingsPlan.js';

// Create mock send function before imports
const mockSend = jest.fn();

// Mock the AWS SDK and config modules
jest.mock('../config/aws.js');
jest.mock('../config/env.js');

import { DynamoDBService } from './dynamodb.js';
import { getDocumentClient } from '../config/aws.js';
import { getConfig } from '../config/env.js';

// Setup mocks
(getDocumentClient as jest.Mock).mockReturnValue({
  send: mockSend,
});

(getConfig as jest.Mock).mockReturnValue({
  dynamodb: {
    usersTable: 'savesmart-users',
    plansTable: 'savesmart-plans',
    eventsTable: 'savesmart-events',
    recipesTable: 'savesmart-recipes',
    fuelStationsTable: 'savesmart-fuel-stations',
  },
});

describe('DynamoDBService', () => {
  let service: DynamoDBService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockSend.mockReset();

    // Create service instance
    service = new DynamoDBService();
  });

  describe('getUser', () => {
    it('should return user when found', async () => {
      const mockUser: User = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        location: {
          suburb: 'Sydney',
          postcode: '2000',
        },
        savingsGoal: 10000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockSend.mockResolvedValueOnce({ Item: mockUser });

      const result = await service.getUser('user-123');

      expect(result).toEqual(mockUser);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should return null when user not found', async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined });

      const result = await service.getUser('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error on DynamoDB failure', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(service.getUser('user-123')).rejects.toThrow('Failed to get user');
    });
  });

  describe('createUser', () => {
    it('should create user with timestamps', async () => {
      const newUser: User = {
        userId: 'user-456',
        email: 'new@example.com',
        name: 'New User',
        location: {
          suburb: 'Melbourne',
          postcode: '3000',
        },
        savingsGoal: 5000,
        createdAt: '',
        updatedAt: '',
      };

      mockSend.mockResolvedValueOnce({});

      const result = await service.createUser(newUser);

      expect(result.userId).toBe('user-456');
      expect(result.createdAt).toBeTruthy();
      expect(result.updatedAt).toBeTruthy();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should throw error when user already exists', async () => {
      const existingUser: User = {
        userId: 'user-123',
        email: 'existing@example.com',
        name: 'Existing User',
        location: {
          suburb: 'Brisbane',
          postcode: '4000',
        },
        savingsGoal: 8000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const error = new Error('Conditional check failed');
      error.name = 'ConditionalCheckFailedException';
      mockSend.mockRejectedValueOnce(error);

      await expect(service.createUser(existingUser)).rejects.toThrow('already exists');
    });
  });

  describe('updateUser', () => {
    it('should update user fields', async () => {
      const existingUser: User = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        location: {
          suburb: 'Sydney',
          postcode: '2000',
        },
        savingsGoal: 10000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const updates = {
        name: 'Updated Name',
        savingsGoal: 15000,
      };

      // Mock getUser call
      mockSend.mockResolvedValueOnce({ Item: existingUser });

      // Mock updateUser call
      const updatedUser = { ...existingUser, ...updates, updatedAt: expect.any(String) };
      mockSend.mockResolvedValueOnce({ Attributes: updatedUser });

      const result = await service.updateUser('user-123', updates);

      expect(result.name).toBe('Updated Name');
      expect(result.savingsGoal).toBe(15000);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should throw error when user not found', async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined });

      await expect(service.updateUser('nonexistent', { name: 'Test' })).rejects.toThrow('not found');
    });
  });

  describe('getSavingsPlan', () => {
    it('should return savings plan when found', async () => {
      const mockPlan: SavingsPlan = {
        planId: 'plan-123',
        userId: 'user-123',
        title: 'Monthly Savings',
        description: 'Save $500 per month',
        totalSavings: 6000,
        recommendations: ['Cut dining out', 'Use public transport'],
        createdAt: '2024-01-01T00:00:00Z',
        status: 'active',
      };

      mockSend.mockResolvedValueOnce({ Item: mockPlan });

      const result = await service.getSavingsPlan('plan-123');

      expect(result).toEqual(mockPlan);
    });

    it('should return null when plan not found', async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined });

      const result = await service.getSavingsPlan('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserSavingsPlans', () => {
    it('should return all plans for a user', async () => {
      const mockPlans: SavingsPlan[] = [
        {
          planId: 'plan-1',
          userId: 'user-123',
          title: 'Plan 1',
          description: 'First plan',
          totalSavings: 1000,
          recommendations: [],
          createdAt: '2024-01-01T00:00:00Z',
          status: 'active',
        },
        {
          planId: 'plan-2',
          userId: 'user-123',
          title: 'Plan 2',
          description: 'Second plan',
          totalSavings: 2000,
          recommendations: [],
          createdAt: '2024-02-01T00:00:00Z',
          status: 'completed',
        },
      ];

      mockSend.mockResolvedValueOnce({ Items: mockPlans });

      const result = await service.getUserSavingsPlans('user-123');

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockPlans);
    });

    it('should return empty array when no plans found', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const result = await service.getUserSavingsPlans('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('createSavingsPlan', () => {
    it('should create savings plan with timestamp', async () => {
      const newPlan: SavingsPlan = {
        planId: 'plan-456',
        userId: 'user-123',
        title: 'New Plan',
        description: 'A new savings plan',
        totalSavings: 3000,
        recommendations: ['Save more'],
        createdAt: '',
        status: 'active',
      };

      mockSend.mockResolvedValueOnce({});

      const result = await service.createSavingsPlan(newPlan);

      expect(result.planId).toBe('plan-456');
      expect(result.createdAt).toBeTruthy();
    });

    it('should throw error when plan already exists', async () => {
      const existingPlan: SavingsPlan = {
        planId: 'plan-123',
        userId: 'user-123',
        title: 'Existing Plan',
        description: 'Already exists',
        totalSavings: 1000,
        recommendations: [],
        createdAt: '2024-01-01T00:00:00Z',
        status: 'active',
      };

      const error = new Error('Conditional check failed');
      error.name = 'ConditionalCheckFailedException';
      mockSend.mockRejectedValueOnce(error);

      await expect(service.createSavingsPlan(existingPlan)).rejects.toThrow('already exists');
    });
  });
});
