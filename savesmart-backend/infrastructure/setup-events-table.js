/**
 * DynamoDB Events Table Setup Script
 *
 * Creates the savesmart-events table for caching local events with discounts.
 *
 * Usage: node setup-events-table.js
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
const TABLE_NAME = 'savesmart-events';

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
 * Create the events table
 */
async function createEventsTable() {
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
      { AttributeName: 'eventId', KeyType: 'HASH' }, // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'eventId', AttributeType: 'S' },
      { AttributeName: 'postcode', AttributeType: 'S' },
      { AttributeName: 'date', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'PostcodeIndex',
        KeySchema: [
          { AttributeName: 'postcode', KeyType: 'HASH' },
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
      { Key: 'Purpose', Value: 'Events Cache' },
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
    console.log(`  - Partition Key: eventId`);
    console.log(`  - GSI: PostcodeIndex (postcode + date for location queries)`);
    console.log(`\nAttributes stored:`);
    console.log(`  - eventId: string (PK)`);
    console.log(`  - name: string`);
    console.log(`  - description: string`);
    console.log(`  - date: string (ISO 8601)`);
    console.log(`  - location: object (venue, suburb, postcode, coordinates)`);
    console.log(`  - discount: object (description, amount, percentage)`);
    console.log(`  - externalUrl: string`);
    console.log(`  - source: string (eventbrite | mock)`);
    console.log(`  - cachedAt: string (ISO 8601)`);
    console.log(`\n`);
  } catch (error) {
    console.error(`\n❌ Error creating table:`, error.message);
    throw error;
  }
}

// Run the setup
createEventsTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
