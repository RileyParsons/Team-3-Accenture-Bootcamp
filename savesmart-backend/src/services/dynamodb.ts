/**
 * DynamoDB Service Module
 *
 * Provides data access layer for DynamoDB operations.
 * Handles CRUD operations for users and savings plans.
 */

import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { getDocumentClient } from '../config/aws.js';
import { getConfig } from '../config/env.js';
import { User } from '../models/User.js';
import { SavingsPlan } from '../models/SavingsPlan.js';
import { Event } from '../models/Event.js';
import { Recipe } from '../models/Recipe.js';
import { FuelStation } from '../models/FuelStation.js';

/**
 * DynamoDB Service class for database operations
 */
export class DynamoDBService {
  private docClient = getDocumentClient();
  private config = getConfig();

  /**
   * Get a user by userId
   * @param userId - The user's unique identifier
   * @returns User object or null if not found
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      const command = new GetCommand({
        TableName: this.config.dynamodb.usersTable,
        Key: { userId },
      });

      const response = await this.docClient.send(command);

      if (!response.Item) {
        return null;
      }

      return response.Item as User;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a user's information
   * @param userId - The user's unique identifier
   * @param updates - Partial user object with fields to update
   * @returns Updated user object
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      // First, get the existing user to ensure it exists
      const existingUser = await this.getUser(userId);
      if (!existingUser) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Build update expression dynamically
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      // Add updatedAt timestamp
      updates.updatedAt = new Date().toISOString();

      // Build update expressions for each field
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'userId') { // Don't update the partition key
          updateExpressions.push(`#${key} = :${key}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:${key}`] = value;
        }
      });

      const command = new UpdateCommand({
        TableName: this.config.dynamodb.usersTable,
        Key: { userId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      });

      const response = await this.docClient.send(command);

      return response.Attributes as User;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new user
   * @param user - User object to create
   * @returns Created user object
   */
  async createUser(user: User): Promise<User> {
    try {
      // Add timestamps
      const now = new Date().toISOString();
      const userWithTimestamps = {
        ...user,
        createdAt: user.createdAt || now,
        updatedAt: user.updatedAt || now,
      };

      const command = new PutCommand({
        TableName: this.config.dynamodb.usersTable,
        Item: userWithTimestamps,
        ConditionExpression: 'attribute_not_exists(userId)', // Prevent overwriting existing users
      });

      await this.docClient.send(command);

      return userWithTimestamps;
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        throw new Error(`User with ID ${user.userId} already exists`);
      }
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a savings plan by planId
   * @param planId - The plan's unique identifier
   * @returns SavingsPlan object or null if not found
   */
  async getSavingsPlan(planId: string): Promise<SavingsPlan | null> {
    try {
      const command = new GetCommand({
        TableName: this.config.dynamodb.plansTable,
        Key: { planId },
      });

      const response = await this.docClient.send(command);

      if (!response.Item) {
        return null;
      }

      return response.Item as SavingsPlan;
    } catch (error) {
      console.error('Error getting savings plan:', error);
      throw new Error(`Failed to get savings plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all savings plans for a user
   * @param userId - The user's unique identifier
   * @returns Array of savings plans
   */
  async getUserSavingsPlans(userId: string): Promise<SavingsPlan[]> {
    try {
      // Use Scan with filter for now
      // In production, this should use a GSI on userId for better performance
      const command = new ScanCommand({
        TableName: this.config.dynamodb.plansTable,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      });

      const response = await this.docClient.send(command);

      return (response.Items || []) as SavingsPlan[];
    } catch (error) {
      console.error('Error getting user savings plans:', error);
      throw new Error(`Failed to get user savings plans: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new savings plan
   * @param plan - SavingsPlan object to create
   * @returns Created savings plan object
   */
  async createSavingsPlan(plan: SavingsPlan): Promise<SavingsPlan> {
    try {
      // Add createdAt timestamp if not provided
      const planWithTimestamp = {
        ...plan,
        createdAt: plan.createdAt || new Date().toISOString(),
      };

      const command = new PutCommand({
        TableName: this.config.dynamodb.plansTable,
        Item: planWithTimestamp,
        ConditionExpression: 'attribute_not_exists(planId)', // Prevent overwriting existing plans
      });

      await this.docClient.send(command);

      return planWithTimestamp;
    } catch (error) {
      console.error('Error creating savings plan:', error);
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        throw new Error(`Savings plan with ID ${plan.planId} already exists`);
      }
      throw new Error(`Failed to create savings plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get events with optional filtering
   * @param filters - Optional filters for suburb and postcode
   * @returns Array of events
   */
  async getEvents(filters?: { suburb?: string; postcode?: string }): Promise<Event[]> {
    try {
      if (filters?.suburb || filters?.postcode) {
        // Use Scan with filter for location-based queries
        const filterExpressions: string[] = [];
        const expressionAttributeValues: Record<string, any> = {};

        if (filters.suburb) {
          filterExpressions.push('location.suburb = :suburb');
          expressionAttributeValues[':suburb'] = filters.suburb;
        }

        if (filters.postcode) {
          filterExpressions.push('location.postcode = :postcode');
          expressionAttributeValues[':postcode'] = filters.postcode;
        }

        const command = new ScanCommand({
          TableName: this.config.dynamodb.eventsTable,
          FilterExpression: filterExpressions.join(' AND '),
          ExpressionAttributeValues: expressionAttributeValues,
        });

        const response = await this.docClient.send(command);
        return (response.Items || []) as Event[];
      } else {
        // No filters, return all events
        const command = new ScanCommand({
          TableName: this.config.dynamodb.eventsTable,
        });

        const response = await this.docClient.send(command);
        return (response.Items || []) as Event[];
      }
    } catch (error) {
      console.error('Error getting events:', error);
      throw new Error(`Failed to get events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cache events in DynamoDB
   * @param events - Array of events to cache
   */
  async cacheEvents(events: Event[]): Promise<void> {
    try {
      // Add cachedAt timestamp to all events
      const now = new Date().toISOString();
      const eventsWithTimestamp = events.map(event => ({
        ...event,
        cachedAt: now,
      }));

      // Batch write events (DynamoDB supports up to 25 items per batch)
      const batchSize = 25;
      for (let i = 0; i < eventsWithTimestamp.length; i += batchSize) {
        const batch = eventsWithTimestamp.slice(i, i + batchSize);

        // Use individual PutCommands for simplicity
        await Promise.all(
          batch.map(event =>
            this.docClient.send(
              new PutCommand({
                TableName: this.config.dynamodb.eventsTable,
                Item: event,
              })
            )
          )
        );
      }
    } catch (error) {
      console.error('Error caching events:', error);
      throw new Error(`Failed to cache events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get recipes with optional filtering
   * @param filters - Optional filters for dietary tags
   * @returns Array of recipes
   */
  async getRecipes(filters?: { dietaryTags?: string[] }): Promise<Recipe[]> {
    try {
      if (filters?.dietaryTags && filters.dietaryTags.length > 0) {
        // Use Scan with filter for dietary tags
        const command = new ScanCommand({
          TableName: this.config.dynamodb.recipesTable,
          FilterExpression: 'contains(dietaryTags, :tag)',
          ExpressionAttributeValues: {
            ':tag': filters.dietaryTags[0], // For simplicity, filter by first tag
          },
        });

        const response = await this.docClient.send(command);
        return (response.Items || []) as Recipe[];
      } else {
        // No filters, return all recipes
        const command = new ScanCommand({
          TableName: this.config.dynamodb.recipesTable,
        });

        const response = await this.docClient.send(command);
        return (response.Items || []) as Recipe[];
      }
    } catch (error) {
      console.error('Error getting recipes:', error);
      throw new Error(`Failed to get recipes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a single recipe by recipeId
   * @param recipeId - The recipe's unique identifier
   * @returns Recipe object or null if not found
   */
  async getRecipe(recipeId: string): Promise<Recipe | null> {
    try {
      const command = new GetCommand({
        TableName: this.config.dynamodb.recipesTable,
        Key: { recipeId },
      });

      const response = await this.docClient.send(command);

      if (!response.Item) {
        return null;
      }

      return response.Item as Recipe;
    } catch (error) {
      console.error('Error getting recipe:', error);
      throw new Error(`Failed to get recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cache recipes in DynamoDB
   * @param recipes - Array of recipes to cache
   */
  async cacheRecipes(recipes: Recipe[]): Promise<void> {
    try {
      // Add cachedAt timestamp to all recipes
      const now = new Date().toISOString();
      const recipesWithTimestamp = recipes.map(recipe => ({
        ...recipe,
        cachedAt: now,
      }));

      // Batch write recipes (DynamoDB supports up to 25 items per batch)
      const batchSize = 25;
      for (let i = 0; i < recipesWithTimestamp.length; i += batchSize) {
        const batch = recipesWithTimestamp.slice(i, i + batchSize);

        // Use individual PutCommands for simplicity
        await Promise.all(
          batch.map(recipe =>
            this.docClient.send(
              new PutCommand({
                TableName: this.config.dynamodb.recipesTable,
                Item: recipe,
              })
            )
          )
        );
      }
    } catch (error) {
      console.error('Error caching recipes:', error);
      throw new Error(`Failed to cache recipes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get fuel stations with optional filtering
   * @param filters - Optional filters for suburb, postcode, and fuel type
   * @returns Array of fuel stations
   */
  async getFuelStations(filters?: { suburb?: string; postcode?: string; fuelType?: string }): Promise<FuelStation[]> {
    try {
      if (filters?.suburb || filters?.postcode) {
        // Use Scan with filter for location-based queries
        const filterExpressions: string[] = [];
        const expressionAttributeValues: Record<string, any> = {};

        if (filters.suburb) {
          filterExpressions.push('location.suburb = :suburb');
          expressionAttributeValues[':suburb'] = filters.suburb;
        }

        if (filters.postcode) {
          filterExpressions.push('location.postcode = :postcode');
          expressionAttributeValues[':postcode'] = filters.postcode;
        }

        const command = new ScanCommand({
          TableName: this.config.dynamodb.fuelStationsTable,
          FilterExpression: filterExpressions.join(' AND '),
          ExpressionAttributeValues: expressionAttributeValues,
        });

        const response = await this.docClient.send(command);
        let stations = (response.Items || []) as FuelStation[];

        // Filter by fuel type in memory if specified
        if (filters.fuelType) {
          stations = stations.filter(station =>
            station.prices.some(price => price.fuelType === filters.fuelType)
          );
        }

        return stations;
      } else {
        // No filters, return all fuel stations
        const command = new ScanCommand({
          TableName: this.config.dynamodb.fuelStationsTable,
        });

        const response = await this.docClient.send(command);
        let stations = (response.Items || []) as FuelStation[];

        // Filter by fuel type in memory if specified
        if (filters?.fuelType) {
          stations = stations.filter(station =>
            station.prices.some(price => price.fuelType === filters.fuelType)
          );
        }

        return stations;
      }
    } catch (error) {
      console.error('Error getting fuel stations:', error);
      throw new Error(`Failed to get fuel stations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cache fuel stations in DynamoDB
   * @param stations - Array of fuel stations to cache
   */
  async cacheFuelStations(stations: FuelStation[]): Promise<void> {
    try {
      // Add updatedAt timestamp to all stations
      const now = new Date().toISOString();
      const stationsWithTimestamp = stations.map(station => ({
        ...station,
        updatedAt: now,
      }));

      // Batch write stations (DynamoDB supports up to 25 items per batch)
      const batchSize = 25;
      for (let i = 0; i < stationsWithTimestamp.length; i += batchSize) {
        const batch = stationsWithTimestamp.slice(i, i + batchSize);

        // Use individual PutCommands for simplicity
        await Promise.all(
          batch.map(station =>
            this.docClient.send(
              new PutCommand({
                TableName: this.config.dynamodb.fuelStationsTable,
                Item: station,
              })
            )
          )
        );
      }
    } catch (error) {
      console.error('Error caching fuel stations:', error);
      throw new Error(`Failed to cache fuel stations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const dynamoDBService = new DynamoDBService();
