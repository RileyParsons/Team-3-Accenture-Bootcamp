/**
 * Transaction Routes
 *
 * Provides endpoints for tracking savings and expenses over time.
 */

import { Router, Request, Response } from 'express';
import { DynamoDBService } from '../services/dynamodb.js';
import { Transaction, TransactionType, TransactionCategory } from '../models/Transaction.js';

const router = Router();

let dbService: DynamoDBService | null = null;
function getDBService(): DynamoDBService {
  if (!dbService) {
    dbService = new DynamoDBService();
  }
  return dbService;
}

/**
 * POST /api/transactions
 *
 * Create a new transaction (income, expense, or savings)
 */
router.post('/transactions', async (req: Request, res: Response) => {
  try {
    const { userId, type, category, amount, description, date } = req.body;

    // Validate required fields
    if (!userId || !type || !category || amount === undefined) {
      return res.status(400).json({
        error: 'Validation failed',
        details: {
          userId: !userId ? 'userId is required' : undefined,
          type: !type ? 'type is required' : undefined,
          category: !category ? 'category is required' : undefined,
          amount: amount === undefined ? 'amount is required' : undefined,
        },
      });
    }

    // Validate type
    if (!['income', 'expense', 'savings'].includes(type)) {
      return res.status(400).json({
        error: 'Validation failed',
        details: { type: 'type must be income, expense, or savings' },
      });
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: { amount: 'amount must be a positive number' },
      });
    }

    const timestamp = date || new Date().toISOString();
    const transactionId = `${userId}#${Date.now()}`;

    const transaction: Transaction = {
      transactionId,
      userId,
      type: type as TransactionType,
      category: category as TransactionCategory,
      amount,
      description: description || '',
      date: timestamp,
      createdAt: new Date().toISOString(),
    };

    await getDBService().createTransaction(transaction);

    return res.status(201).json({
      message: 'Transaction created successfully',
      transaction,
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    return res.status(500).json({
      error: 'Database operation failed',
      message: error instanceof Error ? error.message : 'Failed to create transaction',
    });
  }
});

/**
 * GET /api/transactions/:userId
 *
 * Get all transactions for a user with optional date filtering
 */
router.get('/transactions/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, type } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Validation failed',
        details: { userId: 'userId is required' },
      });
    }

    const transactions = await getDBService().getUserTransactions(
      userId,
      startDate as string | undefined,
      endDate as string | undefined,
      type as TransactionType | undefined
    );

    return res.status(200).json({
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({
      error: 'Database operation failed',
      message: error instanceof Error ? error.message : 'Failed to get transactions',
    });
  }
});

/**
 * GET /api/transactions/:userId/summary
 *
 * Get aggregated summary of transactions by time period
 */
router.get('/transactions/:userId/summary', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Validation failed',
        details: { userId: 'userId is required' },
      });
    }

    // Validate groupBy
    if (!['day', 'week', 'month'].includes(groupBy as string)) {
      return res.status(400).json({
        error: 'Validation failed',
        details: { groupBy: 'groupBy must be day, week, or month' },
      });
    }

    const summary = await getDBService().getTransactionSummary(
      userId,
      startDate as string | undefined,
      endDate as string | undefined,
      groupBy as 'day' | 'week' | 'month'
    );

    return res.status(200).json(summary);
  } catch (error) {
    console.error('Get transaction summary error:', error);
    return res.status(500).json({
      error: 'Database operation failed',
      message: error instanceof Error ? error.message : 'Failed to get transaction summary',
    });
  }
});

/**
 * DELETE /api/transactions/:transactionId
 *
 * Delete a transaction
 */
router.delete('/transactions/:transactionId', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({
        error: 'Validation failed',
        details: { transactionId: 'transactionId is required' },
      });
    }

    await getDBService().deleteTransaction(transactionId);

    return res.status(200).json({
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return res.status(500).json({
      error: 'Database operation failed',
      message: error instanceof Error ? error.message : 'Failed to delete transaction',
    });
  }
});

export default router;
