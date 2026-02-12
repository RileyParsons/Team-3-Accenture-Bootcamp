/**
 * DynamoDB Transactions Table Setup Script
 *
 * Creates the savesmart-transactions table for tracking income, expenses, and savings over time.
 *
 * Usage: node setup-transactions-table.js
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
const TABLE_NAME = 'savesmart-transactions';

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
 * Create the transactions table
 */
async function createTransactionsTable() {
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
      { AttributeName: 'transactionId', KeyType: 'HASH' }, // Partition key: userId#timestamp
    ],
    AttributeDefinitions: [
      { AttributeName: 'transactionId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'date', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserIdIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'date', KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
    Tags: [
      { Key: 'Project', Value: 'SaveSmart' },
      { Key: 'Environment', Value: 'Development' },
      { Key: 'Purpose', Value: 'Transaction Tracking' },
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
    console.log(`  - Partition Key: transactionId (format: userId#timestamp)`);
    console.log(`  - GSI: UserIdIndex (userId + date for querying user transactions)`);
    console.log(`\nAttributes stored:`);
    console.log(`  - transactionId: string (PK)`);
    console.log(`  - userId: string (GSI PK)`);
    console.log(`  - type: string (income | expense | savings)`);
    console.log(`  - category: string (salary, rent, groceries, etc.)`);
    console.log(`  - amount: number`);
    console.log(`  - description: string (optional)`);
    console.log(`  - date: string (ISO 8601, GSI SK)`);
    console.log(`  - createdAt: string (ISO 8601)`);
    console.log(`\n`);
  } catch (error) {
    console.error(`\n❌ Error creating table:`, error.message);
    throw error;
  }
}

// Run the setup
createTransactionsTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
