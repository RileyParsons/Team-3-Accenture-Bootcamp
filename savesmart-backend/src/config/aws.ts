/**
 * AWS DynamoDB Configuration Module
 *
 * Initializes and exports the DynamoDB client for database operations.
 * Uses environment configuration for AWS credentials and region.
 */

import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getConfig } from './env.js';

/**
 * Creates and configures a DynamoDB client
 * @returns Configured DynamoDB client instance
 */
function createDynamoDBClient(): DynamoDBClient {
  const config = getConfig();

  try {
    const client = new DynamoDBClient({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });

    console.log(`✓ DynamoDB client initialized for region: ${config.aws.region}`);
    return client;
  } catch (error) {
    console.error('\n❌ Failed to initialize DynamoDB client:');
    if (error instanceof Error) {
      console.error(error.message);
    }
    console.error('\nResolution Steps:');
    console.error('1. Verify AWS credentials are correct');
    console.error('2. Ensure AWS_REGION is set to a valid region');
    console.error('3. Check that your AWS account has DynamoDB access');
    console.error('4. Verify network connectivity to AWS\n');
    throw error;
  }
}

/**
 * Creates a DynamoDB Document Client for simplified operations
 * The Document Client automatically handles marshalling/unmarshalling
 * of JavaScript objects to DynamoDB format
 */
function createDocumentClient(client: DynamoDBClient): DynamoDBDocumentClient {
  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      // Whether to automatically convert empty strings, blobs, and sets to `null`
      convertEmptyValues: false,
      // Whether to remove undefined values while marshalling
      removeUndefinedValues: true,
      // Whether to convert typeof object to map attribute
      convertClassInstanceToMap: false,
    },
    unmarshallOptions: {
      // Whether to return numbers as a string instead of converting them to native JavaScript numbers
      wrapNumbers: false,
    },
  });
}

// Initialize clients
let dynamoDBClient: DynamoDBClient | null = null;
let documentClient: DynamoDBDocumentClient | null = null;

/**
 * Gets the DynamoDB client singleton
 * Creates the client on first call
 */
export function getDynamoDBClient(): DynamoDBClient {
  if (!dynamoDBClient) {
    dynamoDBClient = createDynamoDBClient();
  }
  return dynamoDBClient;
}

/**
 * Gets the DynamoDB Document Client singleton
 * Creates the client on first call
 */
export function getDocumentClient(): DynamoDBDocumentClient {
  if (!documentClient) {
    const client = getDynamoDBClient();
    documentClient = createDocumentClient(client);
  }
  return documentClient;
}

/**
 * Tests the DynamoDB connection by listing tables
 * @returns Promise that resolves to true if connection is successful
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = getDynamoDBClient();
    const command = new ListTablesCommand({});
    const response = await client.send(command);

    console.log('✓ DynamoDB connection test successful');
    console.log(`  Found ${response.TableNames?.length || 0} tables`);

    return true;
  } catch (error) {
    console.error('❌ DynamoDB connection test failed:');
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
    }
    return false;
  }
}

/**
 * Validates that all required DynamoDB tables exist
 * @returns Promise that resolves to true if all tables exist
 */
export async function validateTables(): Promise<boolean> {
  try {
    const config = getConfig();
    const client = getDynamoDBClient();
    const command = new ListTablesCommand({});
    const response = await client.send(command);
    const existingTables = response.TableNames || [];

    const requiredTables = [
      config.dynamodb.usersTable,
      config.dynamodb.plansTable,
      config.dynamodb.eventsTable,
      config.dynamodb.recipesTable,
      config.dynamodb.fuelStationsTable,
    ];

    const missingTables = requiredTables.filter(
      table => !existingTables.includes(table)
    );

    if (missingTables.length > 0) {
      console.warn('\n⚠️  Warning: Some DynamoDB tables are missing:');
      missingTables.forEach(table => console.warn(`  - ${table}`));
      console.warn('\nThe application may not function correctly until these tables are created.\n');
      return false;
    }

    console.log('✓ All required DynamoDB tables exist');
    return true;
  } catch (error) {
    console.error('❌ Failed to validate DynamoDB tables:');
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
    }
    return false;
  }
}

export { DynamoDBClient, DynamoDBDocumentClient };
