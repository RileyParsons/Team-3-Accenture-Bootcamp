/**
 * Update user's initial savings balance
 * Run with: node scripts/update-user-savings.js <userId> <savingsAmount>
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// Get userId and savings amount from command line
const userId = process.argv[2];
const savingsAmount = parseFloat(process.argv[3]);

if (!userId || isNaN(savingsAmount)) {
  console.error('Usage: node scripts/update-user-savings.js <userId> <savingsAmount>');
  console.error('Example: node scripts/update-user-savings.js u_1770877895466_4kjplxhml 3000');
  process.exit(1);
}

// Verify environment variables are loaded
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('❌ Error: AWS credentials not found in environment variables');
  process.exit(1);
}

console.log('✓ AWS credentials loaded');
console.log(`✓ Region: ${process.env.AWS_REGION || 'ap-southeast-2'}`);

const updateUserSavings = async () => {
  try {
    console.log(`\nUpdating savings for user: ${userId}`);
    console.log(`New savings amount: $${savingsAmount.toFixed(2)}`);

    // First, check if user exists
    const getResult = await docClient.send(new GetCommand({
      TableName: 'savesmart-users',
      Key: { userId }
    }));

    if (!getResult.Item) {
      console.error(`\n❌ User not found: ${userId}`);
      process.exit(1);
    }

    console.log(`✓ User found: ${getResult.Item.name || getResult.Item.email}`);

    // Update the savings
    await docClient.send(new UpdateCommand({
      TableName: 'savesmart-users',
      Key: { userId },
      UpdateExpression: 'SET savings = :savings, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':savings': savingsAmount,
        ':updatedAt': new Date().toISOString()
      }
    }));

    console.log(`\n✅ Successfully updated savings to $${savingsAmount.toFixed(2)}`);
    console.log('\n💡 Refresh your dashboard to see the updated savings!');
  } catch (error) {
    console.error('\n❌ Update failed:', error.message);
    process.exit(1);
  }
};

// Run the update
updateUserSavings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
