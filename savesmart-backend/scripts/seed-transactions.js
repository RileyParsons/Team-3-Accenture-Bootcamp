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

  // Start with a good initial savings balance
  let currentSavings = 1500; // Starting with $1500 in savings

  // Go back 90 days
  for (let daysAgo = 90; daysAgo >= 0; daysAgo -= 3) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split('T')[0];

    // Weekly income (every 7 days) - consistent amount
    if (daysAgo % 7 === 0) {
      transactions.push({
        transactionId: `${userId}#income_${Date.now()}_${daysAgo}`,
        userId,
        type: 'income',
        category: 'salary',
        amount: 600 + Math.random() * 50, // $600-$650 weekly
        description: 'Weekly salary',
        date: dateStr,
        createdAt: new Date().toISOString(),
      });
    }

    // Regular expenses (every 3-4 days) - gradually increasing
    const expenseMultiplier = 1 + ((90 - daysAgo) / 90) * 0.3; // Expenses increase by 30% over time

    if (daysAgo % 3 === 0) {
      // Groceries - increasing over time
      transactions.push({
        transactionId: `${userId}#expense_groceries_${Date.now()}_${daysAgo}`,
        userId,
        type: 'expense',
        category: 'groceries',
        amount: (40 + Math.random() * 30) * expenseMultiplier, // $40-$70, increasing
        description: 'Grocery shopping',
        date: dateStr,
        createdAt: new Date().toISOString(),
      });
    }

    if (daysAgo % 4 === 0) {
      // Fuel - increasing over time
      transactions.push({
        transactionId: `${userId}#expense_fuel_${Date.now()}_${daysAgo}`,
        userId,
        type: 'expense',
        category: 'fuel',
        amount: (30 + Math.random() * 20) * expenseMultiplier, // $30-$50, increasing
        description: 'Fuel',
        date: dateStr,
        createdAt: new Date().toISOString(),
      });
    }

    // Monthly expenses
    if (daysAgo % 30 === 0) {
      // Rent - fixed
      transactions.push({
        transactionId: `${userId}#expense_rent_${Date.now()}_${daysAgo}`,
        userId,
        type: 'expense',
        category: 'rent',
        amount: 500, // Fixed $500 rent
        description: 'Monthly rent',
        date: dateStr,
        createdAt: new Date().toISOString(),
      });

      // Utilities - slightly increasing
      transactions.push({
        transactionId: `${userId}#expense_utilities_${Date.now()}_${daysAgo}`,
        userId,
        type: 'expense',
        category: 'utilities',
        amount: (60 + Math.random() * 20) * expenseMultiplier, // $60-$80, increasing
        description: 'Utilities bill',
        date: dateStr,
        createdAt: new Date().toISOString(),
      });
    }

    // Occasional entertainment - increasing frequency
    if (daysAgo % 12 === 0) {
      transactions.push({
        transactionId: `${userId}#expense_entertainment_${Date.now()}_${daysAgo}`,
        userId,
        type: 'expense',
        category: 'entertainment',
        amount: (20 + Math.random() * 40) * expenseMultiplier, // $20-$60, increasing
        description: 'Entertainment',
        date: dateStr,
        createdAt: new Date().toISOString(),
      });
    }

    // Savings deposits (every 2 weeks) - decreasing over time
    if (daysAgo % 14 === 0 && daysAgo > 30) {
      const savingsAmount = Math.max(50, 150 - ((90 - daysAgo) / 90) * 100); // Start at $150, decrease to $50
      transactions.push({
        transactionId: `${userId}#savings_${Date.now()}_${daysAgo}`,
        userId,
        type: 'savings',
        category: 'savings-deposit',
        amount: savingsAmount,
        description: 'Savings deposit',
        date: dateStr,
        createdAt: new Date().toISOString(),
      });
    }
  }

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
  const savings = transactions.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0);

  console.log(`\nSummary (Last 3 months):`);
  console.log(`💰 Total Income: $${income.toFixed(2)}`);
  console.log(`💸 Total Expenses: $${expenses.toFixed(2)}`);
  console.log(`🏦 Total Savings: $${savings.toFixed(2)}`);
  console.log(`📊 Net: $${(income - expenses).toFixed(2)}`);
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
