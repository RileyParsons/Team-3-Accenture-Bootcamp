/**
 * DynamoDB Recipes Table Setup Script
 *
 * Creates the savesmart-recipes table for caching budget-friendly recipes.
 *
 * Usage: node setup-recipes-table.js
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists
} from '@aws-sdk/client-dynamodb';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
config({ path: join(__dirname, '..', '.env') });

const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-2';
const TABLE_NAME = 'savesmart-recipes';

const client = new DynamoDBClient({ region: AWS_REGION });

/**
 * Check if table already exists
 */
async function tableExists() {
  try {
    const command = new DescribeTableCommand({ TableName: TABLE_NAME });
    await client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

/**
 * Create the recipes table
 */
async function createRecipesTable() {
  console.log(`\n📊 Creating DynamoDB table: ${TABLE_NAME}`);
  console.log(`Region: ${AWS_REGION}\n`);

  // Check if table already exists
  if (await tableExists()) {
    console.log(`✓ Table ${TABLE_NAME} already exists`);
    console.log(`\n✅ Setup complete!\n`);
    return;
  }

  const params = {
    TableName: TABLE_NAME,
    KeySchema: [
      { AttributeName: 'recipeId', KeyType: 'HASH' }, // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'recipeId', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
    Tags: [
      { Key: 'Project', Value: 'SaveSmart' },
      { Key: 'Environment', Value: 'Development' },
      { Key: 'Purpose', Value: 'Recipes Cache' },
    ],
  };

  try {
    const command = new CreateTableCommand(params);
    await client.send(command);
    console.log(`✓ Table creation initiated`);

    // Wait for table to be active
    console.log(`⏳ Waiting for table to become active...`);
    await waitUntilTableExists(
      { client, maxWaitTime: 60 },
      { TableName: TABLE_NAME }
    );

    console.log(`✓ Table ${TABLE_NAME} is now active`);
    console.log(`\n✅ Setup complete!`);
    console.log(`\nTable structure:`);
    console.log(`  - Partition Key: recipeId`);
    console.log(`\nAttributes stored:`);
    console.log(`  - recipeId: string (PK)`);
    console.log(`  - name: string`);
    console.log(`  - description: string`);
    console.log(`  - imageUrl: string`);
    console.log(`  - prepTime: number (minutes)`);
    console.log(`  - servings: number`);
    console.log(`  - dietaryTags: array (vegetarian, vegan, gluten-free, etc.)`);
    console.log(`  - ingredients: array of objects (name, quantity, unit, price, source)`);
    console.log(`  - instructions: array of strings`);
    console.log(`  - totalCost: number`);
    console.log(`  - cachedAt: string (ISO 8601)`);
    console.log(`\n`);
  } catch (error) {
    console.error(`\n❌ Error creating table:`, error.message);
    throw error;
  }
}

// Run the setup
createRecipesTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
