/**
 * SavingsPlan data model for SaveSmart application
 * Represents a generated financial report with recommendations
 */

export interface SavingsPlan {
  planId: string;              // Partition key
  userId: string;              // GSI partition key
  title: string;
  description: string;
  totalSavings: number;
  recommendations: string[];
  createdAt: string;
  status: 'active' | 'completed' | 'archived';
}
