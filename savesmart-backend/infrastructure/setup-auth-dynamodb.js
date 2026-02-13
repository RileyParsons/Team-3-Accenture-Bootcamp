/**
 * DynamoDB Authentication Table Setup Script
 *
 * This script sets up the DynamoDB table for authentication:
 * - Deletes existing savesmart-users table if it exists
 * - Creates new table with userId as partition key
 * - Creates Global Secondary Index on email field for login lookups
 * - Waits for table to be active
 *
 * Usage:
 *   node setup-auth-dynamodb.js
 *
 * Requirements:
 *   - AWS credentials configured (via AWS CLI or environment variables)
 *   - Appropriate IAM permissions to create/delete DynamoDB tables
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
  waitUntilTableNotExists
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "ap-southeast-2" });
const USERS_TABLE = "savesmart-users";

/**
 * Delete existing table if it exists
 */
async function deleteExistingTable() {
  console.log(`\n🗑️  Checking for existing ${USERS_TABLE} table...`);

  try {
    // Check if table exists
    await client.send(new DescribeTableCommand({ TableName: USERS_TABLE }));

    console.log(`⚠️  Table ${USERS_TABLE} exists, deleting...`);
    await client.send(new DeleteTableCommand({ TableName: USERS_TABLE }));

    // Wait for table to be deleted
    console.log(`⏳ Waiting for ${USERS_TABLE} to be deleted...`);
    await waitUntilTableNotExists(
      { client, maxWaitTime: 120 },
      { TableName: USERS_TABLE }
    );

    console.log(`✅ Table ${USERS_TABLE} deleted successfully`);
  } catch (error) {
    if (error.name === "ResourceNotFoundException") {
      console.log(`✅ No existing ${USERS_TABLE} table found`);
    } else {
      console.error(`❌ Error deleting table:`, error.message);
      throw error;
    }
  }
}

/**
 * Create the authentication-enabled savesmart-users table
 */
async function createAuthUsersTable() {
  console.log(`\n📋 Creating authentication table: ${USERS_TABLE}`);

  try {
    const command = new CreateTableCommand({
      TableName: USERS_TABLE,
      KeySchema: [
        { AttributeName: "userId", KeyType: "HASH" } // Partition key
      ],
      AttributeDefinitions: [
        { AttributeName: "userId", AttributeType: "S" },
        { AttributeName: "email", AttributeType: "S" }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "email-index",
          KeySchema: [
            { AttributeName: "email", KeyType: "HASH" }
          ],
          Projection: {
            ProjectionType: "ALL" // Include all attributes
          }
        }
      ],
      BillingMode: "PAY_PER_REQUEST", // On-demand billing
      Tags: [
        { Key: "Project", Value: "SaveSmart" },
        { Key: "Environment", Value: "Production" },
        { Key: "Feature", Value: "Authentication" }
      ]
    });

    await client.send(command);
    console.log(`✅ Table ${USERS_TABLE} created successfully`);
    console.log(`✅ Global Secondary Index 'email-index' created`);

    // Wait for table to become active
    await waitForTableActive();

  } catch (error) {
    console.error(`❌ Error creating ${USERS_TABLE}:`, error.message);
    throw error;
  }
}

/**
 * Wait for table to become active
 */
async function waitForTableActive() {
  console.log(`⏳ Waiting for ${USERS_TABLE} to become active...`);

  try {
    await waitUntilTableExists(
      { client, maxWaitTime: 120 },
      { TableName: USERS_TABLE }
    );

    console.log(`✅ Table ${USERS_TABLE} is now active`);
  } catch (error) {
    console.error(`❌ Error waiting for table:`, error.message);
    throw error;
  }
}

/**
 * Display table information
 */
async function displayTableInfo() {
  console.log("\n📊 Table Information:");

  try {
    const info = await client.send(new DescribeTableCommand({
      TableName: USERS_TABLE
    }));

    console.log(`\n${USERS_TABLE}:`);
    console.log(`  Status: ${info.Table.TableStatus}`);
    console.log(`  Partition Key: ${info.Table.KeySchema[0].AttributeName} (String)`);
    console.log(`  Billing Mode: ${info.Table.BillingModeSummary?.BillingMode || 'PROVISIONED'}`);
    console.log(`  Item Count: ${info.Table.ItemCount}`);
    console.log(`  Global Secondary Indexes:`);
    info.Table.GlobalSecondaryIndexes?.forEach(gsi => {
      console.log(`    - ${gsi.IndexName} (Status: ${gsi.IndexStatus})`);
      console.log(`      Key: ${gsi.KeySchema[0].AttributeName}`);
    });

    console.log(`\n📝 Schema:`);
    console.log(`  - userId (String, Partition Key)`);
    console.log(`  - email (String, GSI)`);
    console.log(`  - hashedPassword (String)`);
    console.log(`  - createdAt (String, ISO 8601)`);
    console.log(`  - resetToken (String, optional)`);
    console.log(`  - resetTokenExpiry (String, optional)`);

  } catch (error) {
    console.error("❌ Error retrieving table info:", error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 SaveSmart Authentication DynamoDB Setup");
  console.log("==========================================");

  try {
    // Delete existing table
    await deleteExistingTable();

    // Create new authentication table
    await createAuthUsersTable();

    // Display table information
    await displayTableInfo();

    console.log("\n✅ Authentication DynamoDB setup completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Run setup-jwt-secret.js to create JWT secret in SSM");
    console.log("   2. Deploy authentication Lambda functions");
    console.log("   3. Configure API Gateway routes");
    console.log("   4. Update Lambda environment variables");

  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    process.exit(1);
  }
}

// Run the setup
main();
