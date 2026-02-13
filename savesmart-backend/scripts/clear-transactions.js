/**
 * Clear all transactions for a user
 * Run with: node scripts/clear-transactions.js <userId>
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
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

// Get userId from command line
const userId = process.argv[2];

if (!userId) {
  console.error('Usage: node scripts/clear-transactions.js <userId>');
  process.exit(1);
}

const clearTransactions = async () => {
  console.log(`Fetching transactions for user: ${userId}`);

  // Query all transactions for this user
  const queryResult = await docClient.send(new QueryCommand({
    TableName: 'savesmart-transactions',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  }));

  const transactions = queryResult.Items || [];
  console.log(`Found ${transactions.length} transactions to delete`);

  if (transactions.length === 0) {
    console.log('No transactions to delete');
    return;
  }

  let deleteCount = 0;
  for (const transaction of transactions) {
    try {
      await docClient.send(new DeleteCommand({
        TableName: 'savesmart-transactions',
        Key: {
          userId: transaction.userId,
          transactionId: transaction.transactionId
        }
      }));
      deleteCount++;
      process.stdout.write(`\rDeleted: ${deleteCount}/${transactions.length}`);
    } catch (error) {
      console.error(`\nError deleting transaction:`, error.message);
    }
  }

  console.log(`\n\n✅ Successfully deleted ${deleteCount} transactions`);
};

// Run the clearing
clearTransactions()
  .then(() => {
    console.log('\n✨ All transactions cleared!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Clearing failed:', error);
    process.exit(1);
  });
