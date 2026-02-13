/**
 * Check Transactions Script
 *
 * Verifies that transactions are being saved to DynamoDB
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-2';
const TABLE_NAME = 'savesmart-transactions';

const client = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

async function checkTransactions(userId) {
  try {
    console.log(`\n📊 Checking transactions for user: ${userId || 'ALL'}`);
    console.log(`Table: ${TABLE_NAME}\n`);

    const params = {
      TableName: TABLE_NAME,
      Limit: 20, // Show last 20 transactions
    };

    if (userId) {
      params.FilterExpression = 'userId = :userId';
      params.ExpressionAttributeValues = {
        ':userId': userId,
      };
    }

    const command = new ScanCommand(params);
    const result = await docClient.send(command);

    if (!result.Items || result.Items.length === 0) {
      console.log('❌ No transactions found');
      console.log('\nThis could mean:');
      console.log('1. No transactions have been created yet');
      console.log('2. The userId is incorrect');
      console.log('3. Transactions are not being saved to DynamoDB\n');
      return;
    }

    console.log(`✓ Found ${result.Items.length} transaction(s):\n`);

    result.Items.forEach((transaction, index) => {
      console.log(`${index + 1}. Transaction ID: ${transaction.transactionId}`);
      console.log(`   User ID: ${transaction.userId}`);
      console.log(`   Type: ${transaction.type}`);
      console.log(`   Category: ${transaction.category}`);
      console.log(`   Amount: $${transaction.amount}`);
      console.log(`   Description: ${transaction.description || 'N/A'}`);
      console.log(`   Date: ${transaction.date}`);
      console.log(`   Created: ${transaction.createdAt}`);
      console.log('');
    });

    console.log(`✅ Total transactions: ${result.Items.length}\n`);
  } catch (error) {
    console.error('❌ Error checking transactions:', error.message);
    throw error;
  }
}

// Get userId from command line argument
const userId = process.argv[2];

checkTransactions(userId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
