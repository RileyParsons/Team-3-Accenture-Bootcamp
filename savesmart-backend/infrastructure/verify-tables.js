/**
 * DynamoDB Table Verification Script
 *
 * This script verifies that the DynamoDB tables exist and are accessible.
 *
 * Usage:
 *   node verify-tables.js
 */

import {
  DynamoDBClient,
  DescribeTableCommand,
  ListTablesCommand
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "ap-southeast-2" });

const USERS_TABLE = "savesmart-users";
const PLANS_TABLE = "savesmart-plans";

async function verifyTable(tableName) {
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await client.send(command);

    console.log(`\n✅ ${tableName}:`);
    console.log(`   Status: ${response.Table.TableStatus}`);
    console.log(`   Billing Mode: ${response.Table.BillingModeSummary?.BillingMode || 'PROVISIONED'}`);
    console.log(`   Item Count: ${response.Table.ItemCount}`);

    // Display key schema
    console.log(`   Keys:`);
    response.Table.KeySchema.forEach(key => {
      const attrDef = response.Table.AttributeDefinitions.find(
        attr => attr.AttributeName === key.AttributeName
      );
      console.log(`     - ${key.AttributeName} (${key.KeyType === 'HASH' ? 'Partition' : 'Sort'} Key, Type: ${attrDef?.AttributeType})`);
    });

    // Display GSI if exists
    if (response.Table.GlobalSecondaryIndexes?.length > 0) {
      console.log(`   Global Secondary Indexes:`);
      response.Table.GlobalSecondaryIndexes.forEach(gsi => {
        console.log(`     - ${gsi.IndexName} (Status: ${gsi.IndexStatus})`);
        gsi.KeySchema.forEach(key => {
          console.log(`       - ${key.AttributeName} (${key.KeyType === 'HASH' ? 'Partition' : 'Sort'} Key)`);
        });
      });
    }

    return true;
  } catch (error) {
    if (error.name === "ResourceNotFoundException") {
      console.log(`\n❌ ${tableName}: NOT FOUND`);
      return false;
    }
    console.error(`\n❌ ${tableName}: Error - ${error.message}`);
    return false;
  }
}

async function listAllTables() {
  try {
    const command = new ListTablesCommand({});
    const response = await client.send(command);

    console.log("\n📋 All DynamoDB tables in region ap-southeast-2:");
    if (response.TableNames.length === 0) {
      console.log("   (none)");
    } else {
      response.TableNames.forEach(name => {
        const isSaveSmart = name.startsWith('savesmart-');
        console.log(`   ${isSaveSmart ? '✓' : ' '} ${name}`);
      });
    }
  } catch (error) {
    console.error("❌ Error listing tables:", error.message);
  }
}

async function main() {
  console.log("🔍 SaveSmart DynamoDB Table Verification");
  console.log("=========================================");

  await listAllTables();

  const usersExists = await verifyTable(USERS_TABLE);
  const plansExists = await verifyTable(PLANS_TABLE);

  console.log("\n" + "=".repeat(50));

  if (usersExists && plansExists) {
    console.log("✅ All required tables exist and are accessible");
  } else {
    console.log("❌ Some tables are missing. Run 'npm run setup' to create them.");
    process.exit(1);
  }
}

main();
