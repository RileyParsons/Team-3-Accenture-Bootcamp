/**
 * Unit tests for UserRepository
 *
 * Tests CRUD operations with mock DynamoDB client
 * Requirements: 1.5, 2.1, 6.1
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { UserRepository, UserRecord } from './UserRepository';

describe('UserRepository', () => {
  let repository: UserRepository;
  let mockDynamoClient: any;
  const tableName = 'test-users-table';

  beforeEach(() => {
    // Create a mock DynamoDB client
    mockDynamoClient = {
      send: jest.fn(),
    };

    repository = new UserRepository(tableName, mockDynamoClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user with all required fields', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const email = 'test@example.com';
      const hashedPassword = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
      const createdAt = '2024-01-15T10:30:00.000Z';

      mockDynamoClient.send.mockResolvedValueOnce({});

      await repository.createUser(userId, email, hashedPassword, createdAt);

      expect(mockDynamoClient.send).toHaveBeenCalledTimes(1);
      const call = mockDynamoClient.send.mock.calls[0][0];
      expect(call.constructor.name).toBe('PutItemCommand');
      expect(call.input.TableName).toBe(tableName);

      // Verify the item structure
      const item = unmarshall(call.input.Item);
      expect(item).toEqual({
        userId,
        email,
        hashedPassword,
        createdAt,
      });
    });

    it('should handle DynamoDB errors', async () => {
      mockDynamoClient.send.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(
        repository.createUser('user-id', 'test@example.com', 'hash', '2024-01-15T10:30:00.000Z')
      ).rejects.toThrow('DynamoDB error');
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const userRecord: UserRecord = {
        userId,
        email: 'test@example.com',
        hashedPassword: '$2b$10$hash',
        createdAt: '2024-01-15T10:30:00.000Z',
      };

      mockDynamoClient.send.mockResolvedValueOnce({
        Item: marshall(userRecord),
      });

      const result = await repository.getUserById(userId);

      expect(result).toEqual(userRecord);
      expect(mockDynamoClient.send).toHaveBeenCalledTimes(1);
      const call = mockDynamoClient.send.mock.calls[0][0];
      expect(call.constructor.name).toBe('GetItemCommand');
      expect(call.input.TableName).toBe(tableName);
    });

    it('should return null when user not found', async () => {
      mockDynamoClient.send.mockResolvedValueOnce({
        Item: undefined,
      });

      const result = await repository.getUserById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle DynamoDB errors', async () => {
      mockDynamoClient.send.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(repository.getUserById('user-id')).rejects.toThrow('DynamoDB error');
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when found using GSI', async () => {
      const email = 'test@example.com';
      const userRecord: UserRecord = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        email,
        hashedPassword: '$2b$10$hash',
        createdAt: '2024-01-15T10:30:00.000Z',
      };

      mockDynamoClient.send.mockResolvedValueOnce({
        Items: [marshall(userRecord)],
      });

      const result = await repository.getUserByEmail(email);

      expect(result).toEqual(userRecord);
      expect(mockDynamoClient.send).toHaveBeenCalledTimes(1);
      const call = mockDynamoClient.send.mock.calls[0][0];
      expect(call.constructor.name).toBe('QueryCommand');
      expect(call.input.TableName).toBe(tableName);
      expect(call.input.IndexName).toBe('email-index');
    });

    it('should return null when user not found', async () => {
      mockDynamoClient.send.mockResolvedValueOnce({
        Items: [],
      });

      const result = await repository.getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should return null when Items is undefined', async () => {
      mockDynamoClient.send.mockResolvedValueOnce({
        Items: undefined,
      });

      const result = await repository.getUserByEmail('test@example.com');

      expect(result).toBeNull();
    });

    it('should handle DynamoDB errors', async () => {
      mockDynamoClient.send.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(repository.getUserByEmail('test@example.com')).rejects.toThrow('DynamoDB error');
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const newHashedPassword = '$2b$10$newHash';

      mockDynamoClient.send.mockResolvedValueOnce({});

      await repository.updatePassword(userId, newHashedPassword);

      expect(mockDynamoClient.send).toHaveBeenCalledTimes(1);
      const call = mockDynamoClient.send.mock.calls[0][0];
      expect(call.constructor.name).toBe('UpdateItemCommand');
      expect(call.input.TableName).toBe(tableName);
      expect(call.input.UpdateExpression).toBe('SET hashedPassword = :hashedPassword');
    });

    it('should handle DynamoDB errors', async () => {
      mockDynamoClient.send.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(repository.updatePassword('user-id', 'hash')).rejects.toThrow('DynamoDB error');
    });
  });

  describe('setResetToken', () => {
    it('should set reset token and expiry', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const tokenHash = '$2b$10$tokenHash';
      const expiry = '2024-01-15T11:30:00.000Z';

      mockDynamoClient.send.mockResolvedValueOnce({});

      await repository.setResetToken(userId, tokenHash, expiry);

      expect(mockDynamoClient.send).toHaveBeenCalledTimes(1);
      const call = mockDynamoClient.send.mock.calls[0][0];
      expect(call.constructor.name).toBe('UpdateItemCommand');
      expect(call.input.TableName).toBe(tableName);
      expect(call.input.UpdateExpression).toBe(
        'SET resetToken = :resetToken, resetTokenExpiry = :resetTokenExpiry'
      );
    });

    it('should handle DynamoDB errors', async () => {
      mockDynamoClient.send.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(
        repository.setResetToken('user-id', 'token-hash', '2024-01-15T11:30:00.000Z')
      ).rejects.toThrow('DynamoDB error');
    });
  });

  describe('clearResetToken', () => {
    it('should remove reset token and expiry fields', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';

      mockDynamoClient.send.mockResolvedValueOnce({});

      await repository.clearResetToken(userId);

      expect(mockDynamoClient.send).toHaveBeenCalledTimes(1);
      const call = mockDynamoClient.send.mock.calls[0][0];
      expect(call.constructor.name).toBe('UpdateItemCommand');
      expect(call.input.TableName).toBe(tableName);
      expect(call.input.UpdateExpression).toBe('REMOVE resetToken, resetTokenExpiry');
    });

    it('should handle DynamoDB errors', async () => {
      mockDynamoClient.send.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(repository.clearResetToken('user-id')).rejects.toThrow('DynamoDB error');
    });
  });

  describe('Edge cases', () => {
    it('should handle user records with optional reset token fields', async () => {
      const userWithResetToken: UserRecord = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        hashedPassword: '$2b$10$hash',
        createdAt: '2024-01-15T10:30:00.000Z',
        resetToken: '$2b$10$resetTokenHash',
        resetTokenExpiry: '2024-01-15T11:30:00.000Z',
      };

      mockDynamoClient.send.mockResolvedValueOnce({
        Item: marshall(userWithResetToken),
      });

      const result = await repository.getUserById(userWithResetToken.userId);

      expect(result).toEqual(userWithResetToken);
      expect(result?.resetToken).toBeDefined();
      expect(result?.resetTokenExpiry).toBeDefined();
    });

    it('should handle empty email query results', async () => {
      mockDynamoClient.send.mockResolvedValueOnce({
        Items: [],
        Count: 0,
      });

      const result = await repository.getUserByEmail('test@example.com');

      expect(result).toBeNull();
    });
  });
});
