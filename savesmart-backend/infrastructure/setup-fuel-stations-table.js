/**
 * DynamoDB Fuel Stations Table Setup Script
 *
 * Creates the savesmart-fuel-stations table for caching fuel prices.
 *
 * Usage: node setup-fuel-stations-table.js
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
const TABLE_NAME = 'savesmart-fuel-stations';

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
 * Create the fuel stations table
 */
async function createFuelStationsTable() {
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
      { AttributeName: 'stationId', KeyType: 'HASH' }, // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'stationId', AttributeType: 'S' },
      { AttributeName: 'postcode', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'PostcodeIndex',
        KeySchema: [
          { AttributeName: 'postcode', KeyType: 'HASH' },
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
      { Key: 'Purpose', Value: 'Fuel Prices Cache' },
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
    console.log(`  - Partition Key: stationId`);
    console.log(`  - GSI: PostcodeIndex (postcode for location queries)`);
    console.log(`\nAttributes stored:`);
    console.log(`  - stationId: string (PK)`);
    console.log(`  - name: string`);
    console.log(`  - brand: string`);
    console.log(`  - location: object (address, suburb, postcode, coordinates)`);
    console.log(`  - prices: array of objects (fuelType, price, lastUpdated)`);
    console.log(`  - source: string (fuelcheck | mock)`);
    console.log(`  - updatedAt: string (ISO 8601)`);
    console.log(`\n`);
  } catch (error) {
    console.error(`\n❌ Error creating table:`, error.message);
    throw error;
  }
}

// Run the setup
createFuelStationsTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
