/**
 * DynamoDB Table Setup Script
 *
 * This script creates the required DynamoDB tables for the SaveSmart application:
 * - savesmart-users: Stores user profile data
 * - savesmart-plans: Stores AI-generated savings plans
 *
 * Usage:
 *   node setup-dynamodb.js
 *
 * Requirements:
 *   - AWS credentials configured (via AWS CLI or environment variables)
 *   - Appropriate IAM permissions to create DynamoDB tables
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "ap-southeast-2" });

// Table configurations
const USERS_TABLE = "savesmart-users";
const PLANS_TABLE = "savesmart-plans";

/**
 * Create the savesmart-users table
 */
async function createUsersTable() {
  console.log(`\n📋 Creating table: ${USERS_TABLE}`);

  try {
    const command = new CreateTableCommand({
      TableName: USERS_TABLE,
      KeySchema: [
        { AttributeName: "userId", KeyType: "HASH" } // Partition key
      ],
      AttributeDefinitions: [
        { AttributeName: "userId", AttributeType: "S" }
      ],
      BillingMode: "PAY_PER_REQUEST", // On-demand billing
      Tags: [
        { Key: "Project", Value: "SaveSmart" },
        { Key: "Environment", Value: "Production" }
      ]
    });

    await client.send(command);
    console.log(`✅ Table ${USERS_TABLE} created successfully`);

    // Wait for table to become active
    await waitForTableActive(USERS_TABLE);

  } catch (error) {
    if (error.name === "ResourceInUseException") {
      console.log(`⚠️  Table ${USERS_TABLE} already exists`);
    } else {
      console.error(`❌ Error creating ${USERS_TABLE}:`, error.message);
      throw error;
    }
  }
}

/**
 * Create the savesmart-plans table with GSI
 */
async function createPlansTable() {
  console.log(`\n📋 Creating table: ${PLANS_TABLE}`);

  try {
    const command = new CreateTableCommand({
      TableName: PLANS_TABLE,
      KeySchema: [
        { AttributeName: "userId", KeyType: "HASH" },  // Partition key
        { AttributeName: "planId", KeyType: "RANGE" }  // Sort key
      ],
      AttributeDefinitions: [
        { AttributeName: "userId", AttributeType: "S" },
        { AttributeName: "planId", AttributeType: "S" },
        { AttributeName: "createdAt", AttributeType: "S" }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "userId-index",
          KeySchema: [
            { AttributeName: "userId", KeyType: "HASH" },
            { AttributeName: "createdAt", KeyType: "RANGE" }
          ],
          Projection: {
            ProjectionType: "ALL" // Include all attributes
          }
        }
      ],
      BillingMode: "PAY_PER_REQUEST", // On-demand billing
      Tags: [
        { Key: "Project", Value: "SaveSmart" },
        { Key: "Environment", Value: "Production" }
      ]
    });

    await client.send(command);
    console.log(`✅ Table ${PLANS_TABLE} created successfully`);
    console.log(`✅ Global Secondary Index 'userId-index' created`);

    // Wait for table to become active
    await waitForTableActive(PLANS_TABLE);

  } catch (error) {
    if (error.name === "ResourceInUseException") {
      console.log(`⚠️  Table ${PLANS_TABLE} already exists`);
    } else {
      console.error(`❌ Error creating ${PLANS_TABLE}:`, error.message);
      throw error;
    }
  }
}

/**
 * Wait for a table to become active
 */
async function waitForTableActive(tableName) {
  console.log(`⏳ Waiting for ${tableName} to become active...`);

  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    try {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await client.send(command);

      if (response.Table.TableStatus === "ACTIVE") {
        console.log(`✅ Table ${tableName} is now active`);
        return;
      }

      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;

    } catch (error) {
      console.error(`❌ Error checking table status:`, error.message);
      throw error;
    }
  }

  throw new Error(`Timeout waiting for ${tableName} to become active`);
}

/**
 * Verify table access by performing basic read/write operations
 */
async function verifyTableAccess() {
  console.log("\n🔍 Verifying table access...");

  const testUserId = `test-${Date.now()}`;
  const testPlanId = `plan-${Date.now()}`;

  try {
    // Test write to users table
    console.log(`\n📝 Testing write to ${USERS_TABLE}...`);
    await client.send(new PutItemCommand({
      TableName: USERS_TABLE,
      Item: {
        userId: { S: testUserId },
        email: { S: "test@example.com" },
        name: { S: "Test User" },
        income: { N: "1000" },
        incomeFrequency: { S: "monthly" },
        savings: { N: "200" },
        location: { S: "Sydney" },
        postcode: { S: "2000" },
        recurringExpenses: {
          L: [
            {
              M: {
                name: { S: "Rent" },
                amount: { N: "500" },
                frequency: { S: "monthly" },
                isFixed: { BOOL: true }
              }
            },
            {
              M: {
                name: { S: "Groceries" },
                amount: { N: "100" },
                frequency: { S: "weekly" },
                isFixed: { BOOL: false }
              }
            }
          ]
        },
        createdAt: { S: new Date().toISOString() }
      }
    }));
    console.log(`✅ Write to ${USERS_TABLE} successful`);

    // Test read from users table
    console.log(`\n📖 Testing read from ${USERS_TABLE}...`);
    const userResult = await client.send(new GetItemCommand({
      TableName: USERS_TABLE,
      Key: {
        userId: { S: testUserId }
      }
    }));

    if (userResult.Item) {
      console.log(`✅ Read from ${USERS_TABLE} successful`);
      console.log(`   Retrieved user: ${userResult.Item.name.S}`);
    } else {
      throw new Error("Failed to retrieve test user");
    }

    // Test write to plans table
    console.log(`\n📝 Testing write to ${PLANS_TABLE}...`);
    await client.send(new PutItemCommand({
      TableName: PLANS_TABLE,
      Item: {
        userId: { S: testUserId },
        planId: { S: testPlanId },
        plan: { S: JSON.stringify({
          goal: "Test savings goal",
          timeline: "3 months",
          monthly: 300,
          breakdown: []
        })},
        createdAt: { S: new Date().toISOString() }
      }
    }));
    console.log(`✅ Write to ${PLANS_TABLE} successful`);

    // Test read from plans table
    console.log(`\n📖 Testing read from ${PLANS_TABLE}...`);
    const planResult = await client.send(new GetItemCommand({
      TableName: PLANS_TABLE,
      Key: {
        userId: { S: testUserId },
        planId: { S: testPlanId }
      }
    }));

    if (planResult.Item) {
      console.log(`✅ Read from ${PLANS_TABLE} successful`);
      const plan = JSON.parse(planResult.Item.plan.S);
      console.log(`   Retrieved plan: ${plan.goal}`);
    } else {
      throw new Error("Failed to retrieve test plan");
    }

    console.log("\n✅ All table access tests passed!");
    console.log(`\n🧹 Note: Test data (userId: ${testUserId}) was left in tables for verification`);

  } catch (error) {
    console.error("\n❌ Table access verification failed:", error.message);
    throw error;
  }
}

/**
 * Display table information
 */
async function displayTableInfo() {
  console.log("\n📊 Table Information:");

  try {
    // Users table info
    const usersInfo = await client.send(new DescribeTableCommand({
      TableName: USERS_TABLE
    }));
    console.log(`\n${USERS_TABLE}:`);
    console.log(`  Status: ${usersInfo.Table.TableStatus}`);
    console.log(`  Partition Key: ${usersInfo.Table.KeySchema[0].AttributeName} (${usersInfo.Table.AttributeDefinitions[0].AttributeType})`);
    console.log(`  Billing Mode: ${usersInfo.Table.BillingModeSummary?.BillingMode || 'PROVISIONED'}`);
    console.log(`  Item Count: ${usersInfo.Table.ItemCount}`);

    // Plans table info
    const plansInfo = await client.send(new DescribeTableCommand({
      TableName: PLANS_TABLE
    }));
    console.log(`\n${PLANS_TABLE}:`);
    console.log(`  Status: ${plansInfo.Table.TableStatus}`);
    console.log(`  Partition Key: ${plansInfo.Table.KeySchema[0].AttributeName}`);
    console.log(`  Sort Key: ${plansInfo.Table.KeySchema[1].AttributeName}`);
    console.log(`  Billing Mode: ${plansInfo.Table.BillingModeSummary?.BillingMode || 'PROVISIONED'}`);
    console.log(`  Item Count: ${plansInfo.Table.ItemCount}`);
    console.log(`  Global Secondary Indexes:`);
    plansInfo.Table.GlobalSecondaryIndexes?.forEach(gsi => {
      console.log(`    - ${gsi.IndexName} (Status: ${gsi.IndexStatus})`);
    });

  } catch (error) {
    console.error("❌ Error retrieving table info:", error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 SaveSmart DynamoDB Setup");
  console.log("============================");

  try {
    // Create tables
    await createUsersTable();
    await createPlansTable();

    // Display table information
    await displayTableInfo();

    // Verify access
    await verifyTableAccess();

    console.log("\n✅ DynamoDB setup completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Deploy Lambda functions");
    console.log("   2. Configure API Gateway");
    console.log("   3. Set N8N_WEBHOOK_URL environment variable in chat Lambda");

  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    process.exit(1);
  }
}

// Run the setup
main();
