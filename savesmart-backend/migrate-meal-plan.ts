/**
 * Migration Script: Move Meal Plan from Users Table to Plans Table
 *
 * This script:
 * 1. Reads the user record from the users table
 * 2. Extracts the meal plan data
 * 3. Creates a new plan record in the plans table
 * 4. Updates the user record to remove the embedded meal plan and add planId reference
 * 5. Fixes the postcode to "3000"
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { config } from 'dotenv';

// Load environment variables
config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'savesmart-users';
const PLANS_TABLE = process.env.DYNAMODB_PLANS_TABLE || 'savesmart-plans';

async function migrateMealPlan(userId: string) {
  try {
    console.log(`\n🔍 Fetching user: ${userId}`);

    // 1. Get the user record
    const getUserCommand = new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
    });

    const userResponse = await docClient.send(getUserCommand);

    if (!userResponse.Item) {
      console.error(`❌ User ${userId} not found`);
      return;
    }

    const user = userResponse.Item;
    console.log(`✅ User found: ${user.name || user.email}`);
    console.log(`   Location: ${user.location || 'Not set'}`);
    console.log(`   Postcode: ${user.postcode || 'Not set'}`);

    // Check if user has a meal plan
    if (!user.mealPlan) {
      console.log(`ℹ️  User has no meal plan to migrate`);

      // Still fix the postcode if needed
      if (!user.postcode || user.postcode !== '3000') {
        console.log(`\n📝 Updating postcode to 3000...`);
        const updateUserCommand = new UpdateCommand({
          TableName: USERS_TABLE,
          Key: { userId },
          UpdateExpression: 'SET postcode = :postcode, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':postcode': '3000',
            ':updatedAt': new Date().toISOString(),
          },
        });

        await docClient.send(updateUserCommand);
        console.log(`✅ Postcode updated to 3000`);
      }

      return;
    }

    console.log(`\n📋 Meal plan found in user record`);

    // 2. Generate a plan ID
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    console.log(`   Generated planId: ${planId}`);

    // 3. Create the plan record in the plans table
    const now = new Date().toISOString();
    const planRecord = {
      planId,
      userId,
      planType: 'meal',
      ...user.mealPlan.plan,
      preferences: user.mealPlan.preferences,
      createdAt: user.mealPlan.createdAt || now,
      updatedAt: now,
    };

    console.log(`\n💾 Saving meal plan to plans table...`);
    const putPlanCommand = new PutCommand({
      TableName: PLANS_TABLE,
      Item: planRecord,
    });

    await docClient.send(putPlanCommand);
    console.log(`✅ Meal plan saved to plans table with ID: ${planId}`);

    // 4. Update the user record
    console.log(`\n🔄 Updating user record...`);

    // Build update expression to remove mealPlan and add planId reference
    const updateExpression = 'REMOVE mealPlan SET mealPlanId = :planId, postcode = :postcode, updatedAt = :updatedAt';

    const updateUserCommand = new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: {
        ':planId': planId,
        ':postcode': '3000',
        ':updatedAt': now,
      },
    });

    await docClient.send(updateUserCommand);
    console.log(`✅ User record updated:`);
    console.log(`   - Removed embedded mealPlan`);
    console.log(`   - Added mealPlanId reference: ${planId}`);
    console.log(`   - Set postcode to 3000`);

    console.log(`\n✨ Migration completed successfully!`);

  } catch (error) {
    console.error(`\n❌ Migration failed:`, error);
    throw error;
  }
}

// Get userId from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Usage: tsx migrate-meal-plan.ts <userId>');
  console.error('   Example: tsx migrate-meal-plan.ts u_1770877895466_4kjplxhml');
  process.exit(1);
}

// Run the migration
migrateMealPlan(userId)
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
