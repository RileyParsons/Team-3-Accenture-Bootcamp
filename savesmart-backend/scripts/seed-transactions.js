/**
 * Seed realistic transaction data for testing
 * Run with: node scripts/seed-transactions.js <userId>
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
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
  console.error('Usage: node scripts/seed-transactions.js <userId>');
  process.exit(1);
}

// Verify environment variables are loaded
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('❌ Error: AWS credentials not found in environment variables');
  console.error('Make sure .env file exists in savesmart-backend/ directory with:');
  console.error('  AWS_ACCESS_KEY_ID=your_key');
  console.error('  AWS_SECRET_ACCESS_KEY=your_secret');
  console.error('  AWS_REGION=ap-southeast-2');
  process.exit(1);
}

console.log('✓ AWS credentials loaded');
console.log(`✓ Region: ${process.env.AWS_REGION || 'ap-southeast-2'}`);

// Generate realistic transactions for the last 3 months
const generateTransactions = (userId) => {
  const transactions = [];
  const today = new Date();

  // Note: Initial savings should be set to $1000 in the user's profile
  // Strategy: Gentle decline from $1000 to $400 over 90 days
  // Target: -$600 total = -$200/month deficit
  // CRITICAL: Income must be LESS than expenses

  // Go back 90 days
  for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split('T')[0];

    // Weekly income (every 7 days) - REDUCED income
    if (daysAgo % 7 === 0) {
      transactions.push({
        transactionId: `${userId}#income_${Date.now()}_${daysAgo}`,
        userId,
        type: 'income',
        category: 'salary',
        amount: 400, // Reduced to $400 weekly (~$1600/month)
        description: 'Weekly salary',
        date: dateStr,
        createdAt: new Date().toISOString(),
      });
    }

    // Groceries - every 4 days (~$70/week = $280/month)
    if (daysAgo % 4 === 1) {
      transactions.push({
        transactionId: `${userId}#expense_groceries_${Date.now()}_${daysAgo}`,
        userId,
        type: 'expense',
        category: 'groceries',
        amount: 70,
        description: 'Grocery shopping',
        date: dateStr,
        createdAt: new Date().toISOString(),
      });
    }

    // Fuel - every 5 days (~$60/week = $240/month)
    if (daysAgo % 5 === 2) {
      transactions.push({
        transactionId: `${userId}#expense_fuel_${Date.now()}_${daysAgo}`,
        userId,
        type: 'expense',
        category: 'fuel',
        amount: 60,
        description: 'Fuel',
        date: dateStr,
        createdAt: new Date().toISOString(),
      });
    }

    // Monthly rent ($550/month)
    if (daysAgo % 30 === 15) {
      transactions.push({
        transactionId: `${userId}#expense_rent_${Date.now()}_${daysAgo}`,
        userId,
        type: 'expense',
        category: 'rent',
        amount: 550,
        description: 'Monthly rent',
        date: dateStr,
        createdAt: new Date().toISOString(),
      });
    }

    // Utilities ($100/month)
    if (daysAgo % 30 === 20) {
      transactions.push({
        transactionId: `${userId}#expense_utilities_${Date.now()}_${daysAgo}`,
        userId,
        type: 'expense',
        category: 'utilities',
        amount: 100,
        description: 'Utilities bill',
        date: dateStr,
        createdAt: new Date().toISOString(),
      });
    }

    // Entertainment - every 7 days (~$50/week = $200/month)
    if (daysAgo % 7 === 3) {
      transactions.push({
        transactionId: `${userId}#expense_entertainment_${Date.now()}_${daysAgo}`,
        userId,
        type: 'expense',
        category: 'entertainment',
        amount: 50,
        description: 'Entertainment',
        date: dateStr,
        createdAt: new Date().toISOString(),
      });
    }

    // Other expenses - every 8 days (~$40/week = $160/month)
    if (daysAgo % 8 === 0) {
      transactions.push({
        transactionId: `${userId}#expense_other_${Date.now()}_${daysAgo}`,
        userId,
        type: 'expense',
        category: 'other-expense',
        amount: 40,
        description: 'Other expenses',
        date: dateStr,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Monthly totals: Income ~$1600, Expenses ~$1830 = -$230/month deficit
  // Over 90 days (3 months): -$690 total
  // Starting at $1000 -> ~$310 final (close to $400 target)

  return transactions;
};

// Insert transactions into DynamoDB
const seedTransactions = async () => {
  console.log(`Generating transactions for user: ${userId}`);

  const transactions = generateTransactions(userId);
  console.log(`Generated ${transactions.length} transactions`);

  let successCount = 0;
  let errorCount = 0;

  for (const transaction of transactions) {
    try {
      await docClient.send(new PutCommand({
        TableName: 'savesmart-transactions',
        Item: transaction,
      }));
      successCount++;
      process.stdout.write(`\rProgress: ${successCount}/${transactions.length}`);
    } catch (error) {
      errorCount++;
      console.error(`\nError inserting transaction:`, error.message);
    }
  }

  console.log(`\n\nCompleted!`);
  console.log(`✅ Successfully inserted: ${successCount} transactions`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} transactions`);
  }

  // Calculate summary
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  console.log(`\nSummary (Last 3 months):`);
  console.log(`💰 Total Income: $${income.toFixed(2)}`);
  console.log(`💸 Total Expenses: $${expenses.toFixed(2)}`);
  console.log(`📊 Net Change: $${(income - expenses).toFixed(2)}`);
  console.log(`\n💡 Your savings will be: Initial Savings + Net Change`);
};

// Run the seeding
seedTransactions()
  .then(() => {
    console.log('\n✨ Seeding complete! Refresh your dashboard to see the data.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });
