/**
 * UserRepository
 *
 * Handles CRUD operations on the DynamoDB user table including:
 * - User creation with authentication fields
 * - User retrieval by ID and email
 * - Password updates
 * - Reset token management
 *
 * Requirements: 1.5, 2.1, 6.1, 6.3, 7.4, 7.5
 */

import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  UpdateItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

export interface UserRecord {
  userId: string;
  email: string;
  hashedPassword: string;
  createdAt: string;
  resetToken?: string;
  resetTokenExpiry?: string;
}

export class UserRepository {
  private tableName: string;
  private dynamoClient: DynamoDBClient;

  constructor(tableName: string, dynamoClient: DynamoDBClient) {
    this.tableName = tableName;
    this.dynamoClient = dynamoClient;
  }

  /**
   * Creates a new user record in DynamoDB
   * Requirements: 1.5
   *
   * @param userId - UUID v4 user identifier
   * @param email - User's email address
   * @param hashedPassword - Bcrypt hashed password
   * @param createdAt - ISO 8601 timestamp
   */
  async createUser(
    userId: string,
    email: string,
    hashedPassword: string,
    createdAt: string
  ): Promise<void> {
    const user: UserRecord = {
      userId,
      email,
      hashedPassword,
      createdAt,
    };

    await this.dynamoClient.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(user),
      })
    );
  }

  /**
   * Retrieves a user by their userId
   * Requirements: 2.1
   *
   * @param userId - The user's unique identifier
   * @returns User record or null if not found
   */
  async getUserById(userId: string): Promise<UserRecord | null> {
    const result = await this.dynamoClient.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: marshall({ userId }),
      })
    );

    if (!result.Item) {
      return null;
    }

    return unmarshall(result.Item) as UserRecord;
  }

  /**
   * Retrieves a user by their email using the email-index GSI
   * Requirements: 2.1
   *
   * @param email - The user's email address
   * @returns User record or null if not found
   */
  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const result = await this.dynamoClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: marshall({
          ':email': email,
        }),
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return unmarshall(result.Items[0]) as UserRecord;
  }

  /**
   * Updates a user's password
   * Requirements: 7.4
   *
   * @param userId - The user's unique identifier
   * @param hashedPassword - New bcrypt hashed password
   */
  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.dynamoClient.send(
      new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({ userId }),
        UpdateExpression: 'SET hashedPassword = :hashedPassword',
        ExpressionAttributeValues: marshall({
          ':hashedPassword': hashedPassword,
        }),
      })
    );
  }

  /**
   * Sets a reset token and expiration for password reset
   * Requirements: 6.1, 6.3
   *
   * @param userId - The user's unique identifier
   * @param tokenHash - Bcrypt hash of the reset token
   * @param expiry - ISO 8601 timestamp for token expiration
   */
  async setResetToken(userId: string, tokenHash: string, expiry: string): Promise<void> {
    await this.dynamoClient.send(
      new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({ userId }),
        UpdateExpression: 'SET resetToken = :resetToken, resetTokenExpiry = :resetTokenExpiry',
        ExpressionAttributeValues: marshall({
          ':resetToken': tokenHash,
          ':resetTokenExpiry': expiry,
        }),
      })
    );
  }

  /**
   * Clears the reset token and expiration from a user record
   * Requirements: 7.5
   *
   * @param userId - The user's unique identifier
   */
  async clearResetToken(userId: string): Promise<void> {
    await this.dynamoClient.send(
      new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({ userId }),
        UpdateExpression: 'REMOVE resetToken, resetTokenExpiry',
      })
    );
  }

  /**
   * Retrieves all users from the table
   * Note: This is inefficient and should only be used for development/testing
   * In production, use a GSI on resetToken for password reset lookups
   * Requirements: 7.1
   *
   * @returns Array of all user records
   */
  async getAllUsers(): Promise<UserRecord[]> {
    const users: UserRecord[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;

    do {
      const result: any = await this.dynamoClient.send(
        new ScanCommand({
          TableName: this.tableName,
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );

      if (result.Items) {
        users.push(...result.Items.map((item: any) => unmarshall(item) as UserRecord));
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return users;
  }
}
