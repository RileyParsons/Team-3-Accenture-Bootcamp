/**
 * Transaction data model for tracking savings and expenses over time
 */

export type TransactionType = 'income' | 'expense' | 'savings';
export type TransactionCategory =
  | 'salary' | 'allowance' | 'other-income'
  | 'rent' | 'groceries' | 'fuel' | 'entertainment' | 'utilities' | 'other-expense'
  | 'savings-deposit' | 'savings-withdrawal';

export interface Transaction {
  transactionId: string;        // Partition key: userId#timestamp
  userId: string;                // GSI partition key
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description?: string;
  date: string;                  // ISO 8601 timestamp
  createdAt: string;
}

export interface SavingsSnapshot {
  snapshotId: string;            // Partition key: userId#date
  userId: string;                // GSI partition key
  date: string;                  // ISO 8601 date (YYYY-MM-DD)
  totalSavings: number;
  totalIncome: number;           // Month-to-date
  totalExpenses: number;         // Month-to-date
  createdAt: string;
}
