'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Loader2,
  ShoppingCart,
  Calendar,
  Fuel,
  User,
  ChevronRight,
  Lightbulb,
  Plus,
  TrendingUp as ChartIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getProfile, UserData, getTransactionSummary, TransactionSummary, createTransaction, TransactionType, TransactionCategory, RecurringExpense } from '@/lib/api';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getStoredProfile } from '@/lib/storage';
import { UserProfileV2 } from '@/types/profile';

interface ExpenseBreakdown {
  name: string;
  amount: number;
  frequency: string;
  monthlyAmount: number;
  color: string;
}

// Helper function to convert UserProfileV2 to UserData format
function convertProfileV2ToUserData(profileV2: UserProfileV2): UserData {
  const recurringExpenses: RecurringExpense[] = [];

  // Add rent if applicable
  if (profileV2.living.paysRent && profileV2.living.rentAmount) {
    recurringExpenses.push({
      name: 'Rent',
      amount: profileV2.living.rentAmount,
      frequency: 'weekly',
      isFixed: true,
    });
  }

  // Add groceries
  recurringExpenses.push({
    name: 'Groceries',
    amount: profileV2.spending.groceriesWeekly,
    frequency: 'weekly',
    isFixed: false,
  });

  // Add transport if applicable
  if (profileV2.spending.transportWeekly > 0) {
    const transportName = profileV2.spending.transportMode === 'public' ? 'Public Transport' :
                          profileV2.spending.transportMode === 'car' ? 'Car/Fuel' :
                          profileV2.spending.transportMode === 'rideshare' ? 'Rideshare' : 'Transport';
    recurringExpenses.push({
      name: transportName,
      amount: profileV2.spending.transportWeekly,
      frequency: 'weekly',
      isFixed: false,
    });
  }

  // Add entertainment
  recurringExpenses.push({
    name: 'Entertainment',
    amount: profileV2.spending.entertainmentMonthly,
    frequency: 'monthly',
    isFixed: false,
  });

  return {
    userId: profileV2.userId,
    email: profileV2.email,
    name: profileV2.name,
    income: 0, // Not collected in onboarding v2
    incomeFrequency: 'monthly',
    savings: 0, // Will be calculated from transactions
    location: undefined,
    postcode: undefined,
    recurringExpenses,
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserData | null>(null);
  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    type: 'expense' as 'income' | 'expense' | 'savings',
    category: 'groceries',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const storedUser = localStorage.getItem('savesmart_user');
      if (!storedUser) {
        setError('No user found. Please log in.');
        return;
      }

      const { userId } = JSON.parse(storedUser);
      
      // Try to get profile from backend, fallback to localStorage
      let profileData: UserData | null = null;
      try {
        profileData = await getProfile(userId);
      } catch (backendError) {
        console.warn('Backend profile not available, using localStorage:', backendError);
        
        // Try to get profile from localStorage (new onboarding format)
        const storedProfileV2 = getStoredProfile();
        if (storedProfileV2) {
          profileData = convertProfileV2ToUserData(storedProfileV2);
        } else {
          throw new Error('No profile found. Please complete onboarding.');
        }
      }
      
      setProfile(profileData);

      // Try to load transaction summary (optional - may not exist yet)
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);

        const summary = await getTransactionSummary(
          userId,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          'day'
        );
        setTransactionSummary(summary);
      } catch (transactionError) {
        console.warn('No transaction data available yet:', transactionError);
        // This is OK - user may not have any transactions yet
        setTransactionSummary(null);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const storedUser = localStorage.getItem('savesmart_user');
      if (!storedUser) {
        setError('No user found. Please log in.');
        return;
      }

      const { userId } = JSON.parse(storedUser);

      await createTransaction(
        userId,
        transactionForm.type as TransactionType,
        transactionForm.category as TransactionCategory,
        parseFloat(transactionForm.amount),
        transactionForm.description,
        transactionForm.date
      );

      // Reset form
      setTransactionForm({
        type: 'expense',
        category: 'groceries',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });

      // Close modal
      setShowAddTransaction(false);

      // Reload dashboard data
      await loadDashboardData();
    } catch (err) {
      console.error('Error adding transaction:', err);
      setError('Failed to add transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryOptions = (type: string) => {
    if (type === 'income') {
      return [
        { value: 'salary', label: 'Salary' },
        { value: 'allowance', label: 'Allowance' },
        { value: 'other-income', label: 'Other Income' },
      ];
    } else {
      return [
        { value: 'rent', label: 'Rent' },
        { value: 'groceries', label: 'Groceries' },
        { value: 'fuel', label: 'Fuel' },
        { value: 'entertainment', label: 'Entertainment' },
        { value: 'utilities', label: 'Utilities' },
        { value: 'other-expense', label: 'Other Expense' },
      ];
    }
  };

  // Calculate monthly amount from any frequency
  const getMonthlyAmount = (amount: number, frequency: string): number => {
    switch (frequency.toLowerCase()) {
      case 'weekly': return amount * 4.33;
      case 'fortnightly': return amount * 2.17;
      case 'monthly': return amount;
      case 'yearly': return amount / 12;
      default: return amount;
    }
  };

  // Calculate financial metrics
  const calculateMetrics = () => {
    if (!profile) return null;

    // Check if we have transaction data
    const hasTransactions = transactionSummary && transactionSummary.summary.length > 0;

    let monthlyIncome = 0;
    let totalMonthlyExpenses = 0;
    let currentSavings = profile.savings || 0;

    if (hasTransactions) {
      // Calculate from actual transactions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const lastMonthData = transactionSummary.summary.filter(d => new Date(d.date) >= thirtyDaysAgo);

      monthlyIncome = lastMonthData.reduce((sum, d) => sum + d.income, 0);
      totalMonthlyExpenses = lastMonthData.reduce((sum, d) => sum + d.expenses, 0);

      // Current savings = initial savings + (all income - all expenses)
      transactionSummary.summary.forEach(d => {
        currentSavings += (d.income - d.expenses);
      });
    } else {
      // Use onboarding form data as starting point
      monthlyIncome = profile.income || 0;

      // Calculate total monthly expenses from recurring expenses
      if (profile.recurringExpenses && profile.recurringExpenses.length > 0) {
        profile.recurringExpenses.forEach((expense) => {
          totalMonthlyExpenses += getMonthlyAmount(expense.amount, expense.frequency);
        });
      }
    }

    // Expense breakdown (always from profile recurring expenses)
    const expenseBreakdown: ExpenseBreakdown[] = [];
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-orange-500'
    ];

    if (profile.recurringExpenses && profile.recurringExpenses.length > 0) {
      profile.recurringExpenses.forEach((expense, index) => {
        const monthlyAmount = getMonthlyAmount(expense.amount, expense.frequency);
        expenseBreakdown.push({
          name: expense.name,
          amount: expense.amount,
          frequency: expense.frequency,
          monthlyAmount: monthlyAmount,
          color: colors[index % colors.length]
        });
      });
    }

    const availableToSave = monthlyIncome - totalMonthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (availableToSave / monthlyIncome) * 100 : 0;

    return {
      monthlyIncome,
      totalMonthlyExpenses,
      availableToSave,
      savingsRate,
      currentSavings: Math.max(0, currentSavings),
      expenseBreakdown
    };
  };

  const metrics = calculateMetrics();

  // Generate savings tips based on expenses
  const generateSavingsTips = (): string[] => {
    if (!metrics) return [];

    const tips: string[] = [];

    // Tip based on fuel expenses
    const fuelExpense = metrics.expenseBreakdown.find(e =>
      e.name.toLowerCase().includes('fuel') || e.name.toLowerCase().includes('petrol')
    );
    if (fuelExpense && fuelExpense.monthlyAmount > 0) {
      tips.push(`You spend $${fuelExpense.monthlyAmount.toFixed(0)}/month on fuel - check our fuel map to find cheaper prices nearby`);
    }

    // Tip based on grocery expenses
    const groceryExpense = metrics.expenseBreakdown.find(e =>
      e.name.toLowerCase().includes('grocery') || e.name.toLowerCase().includes('groceries') || e.name.toLowerCase().includes('food')
    );
    if (groceryExpense && groceryExpense.monthlyAmount > 0) {
      tips.push(`Try our budget recipes to reduce your $${groceryExpense.monthlyAmount.toFixed(0)}/month grocery bill`);
    }

    // Tip based on location
    if (profile?.location) {
      tips.push(`Discover free events near ${profile.location} to save on entertainment`);
    }

    // Tip based on savings rate
    if (metrics.savingsRate < 10) {
      tips.push('Aim to save at least 10% of your income - small changes can make a big difference');
    } else if (metrics.savingsRate > 30) {
      tips.push('Great job! You\'re saving over 30% of your income - keep up the excellent work');
    }

    // General tip
    tips.push('Review your recurring expenses monthly to identify savings opportunities');

    return tips.slice(0, 5); // Return max 5 tips
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !profile || !metrics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">
            {error?.includes('onboarding') ? 'Complete Your Profile' : 'Error Loading Dashboard'}
          </h2>
          <p className="text-red-700 mb-4">
            {error || 'Failed to load dashboard data'}
          </p>
          {error?.includes('onboarding') && (
            <button
              onClick={() => router.push('/onboarding')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Complete Onboarding
            </button>
          )}
        </div>
      </div>
    );
  }

  const savingsTips = generateSavingsTips();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {profile.name.split(' ')[0]}! Here's your financial overview.</p>
      </div>

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowAddTransaction(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close X button */}
            <button
              onClick={() => setShowAddTransaction(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Transaction</h2>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransactionForm({ ...transactionForm, type: 'income', category: 'salary' })}
                    className={`p-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      transactionForm.type === 'income'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionForm({ ...transactionForm, type: 'expense', category: 'groceries' })}
                    className={`p-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      transactionForm.type === 'expense'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Expense
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <input
                  type="text"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                  placeholder={transactionForm.type === 'income' ? 'e.g., Weekly paycheck' : 'e.g., Weekly groceries'}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={transactionForm.category}
                  onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                >
                  {getCategoryOptions(transactionForm.type).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTransaction(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !transactionForm.amount}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Adding...' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Current Savings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Current Savings</p>
            <PiggyBank className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">${metrics.currentSavings.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Total saved</p>
        </div>

        {/* Monthly Income */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Monthly Income</p>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">${metrics.monthlyIncome.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Per month</p>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Monthly Expenses</p>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">${metrics.totalMonthlyExpenses.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Total spending</p>
        </div>

        {/* Available to Save */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Available to Save</p>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </div>
          <p className={`text-2xl font-bold ${metrics.availableToSave >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(metrics.availableToSave).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {metrics.savingsRate.toFixed(1)}% of income
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Expense Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Expense Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Expense Breakdown</h2>

            {metrics.expenseBreakdown.length > 0 ? (
              <div className="space-y-4">
                {metrics.expenseBreakdown.map((expense, index) => {
                  const percentage = metrics.monthlyIncome > 0
                    ? (expense.monthlyAmount / metrics.monthlyIncome) * 100
                    : 0;

                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${expense.color}`}></div>
                          <span className="text-sm font-medium text-gray-700">{expense.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            ${expense.monthlyAmount.toFixed(2)}/mo
                          </p>
                          <p className="text-xs text-gray-500">
                            ${expense.amount.toFixed(2)} {expense.frequency}
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${expense.color}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of income</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No expenses recorded yet</p>
            )}
          </div>

          {/* Savings Over Time Chart */}
          {transactionSummary && transactionSummary.summary.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <ChartIcon className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Financial Trend & Projection</h2>
                </div>
                <button
                  onClick={() => setShowAddTransaction(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Transaction</span>
                </button>
              </div>

              {transactionSummary.summary.length === 1 ? (
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center p-6">
                    <ChartIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-2">Add more transactions to see trends</p>
                    <p className="text-sm text-gray-500">
                      You have 1 transaction. Add transactions on different dates to visualize your savings trend over time.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {(() => {
                    const data = transactionSummary.summary;
                    const today = new Date().toISOString().split('T')[0];

                    // Start with initial savings from profile
                    let cumulativeSavings = profile?.savings || 0;

                    const processedData = data.map((d, index) => {
                      // Savings = income - expenses only (no separate savings deposits)
                      const netChange = d.income - d.expenses;
                      cumulativeSavings += netChange;

                      const date = new Date(d.date);
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                      return {
                        date: d.date,
                        dateLabel: `${monthNames[date.getMonth()]} ${date.getDate()}`,
                        income: Math.round(d.income),
                        expenses: Math.round(d.expenses),
                        savings: Math.max(0, Math.round(cumulativeSavings)),
                        isToday: d.date === today,
                        isProjection: false
                      };
                    });

                    // Calculate linear regression for projections
                    const calculateTrend = (values: number[]) => {
                      const n = values.length;
                      if (n < 2) return { slope: 0, intercept: values[0] || 0 };

                      const xValues = Array.from({ length: n }, (_, i) => i);
                      const xMean = xValues.reduce((a, b) => a + b, 0) / n;
                      const yMean = values.reduce((a, b) => a + b, 0) / n;

                      let numerator = 0;
                      let denominator = 0;

                      for (let i = 0; i < n; i++) {
                        numerator += (xValues[i] - xMean) * (values[i] - yMean);
                        denominator += (xValues[i] - xMean) ** 2;
                      }

                      const slope = denominator !== 0 ? numerator / denominator : 0;
                      const intercept = yMean - slope * xMean;

                      return { slope, intercept };
                    };

                    // Get trends
                    const incomeTrend = calculateTrend(processedData.map(d => d.income));
                    const expensesTrend = calculateTrend(processedData.map(d => d.expenses));
                    const savingsTrend = calculateTrend(processedData.map(d => d.savings));

                    // Create 18 projection points (4.5 months of weekly projections)
                    const lastIndex = processedData.length - 1;
                    const projections = [];
                    for (let i = 1; i <= 18; i++) {
                      const futureIndex = lastIndex + i;
                      const futureDate = new Date(processedData[lastIndex].date);
                      futureDate.setDate(futureDate.getDate() + (i * 7)); // Weekly projections

                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                      projections.push({
                        date: futureDate.toISOString().split('T')[0],
                        dateLabel: `${monthNames[futureDate.getMonth()]} ${futureDate.getDate()}`,
                        income: Math.max(0, Math.round(incomeTrend.slope * futureIndex + incomeTrend.intercept)),
                        expenses: Math.max(0, Math.round(expensesTrend.slope * futureIndex + expensesTrend.intercept)),
                        savings: Math.max(0, Math.round(savingsTrend.slope * futureIndex + savingsTrend.intercept)),
                        isToday: false,
                        isProjection: true
                      });
                    }

                    const chartData = [...processedData, ...projections];
                    const todayIndex = processedData.findIndex(d => d.isToday);

                    return (
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="dateLabel"
                              stroke="#6b7280"
                              style={{ fontSize: '12px' }}
                              label={{ value: 'Date', position: 'insideBottom', offset: -5, style: { fontSize: '14px', fill: '#374151', fontWeight: 600 } }}
                            />
                            <YAxis
                              stroke="#6b7280"
                              style={{ fontSize: '12px' }}
                              tickFormatter={(value) => `$${value}`}
                              label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', style: { fontSize: '14px', fill: '#374151', fontWeight: 600 } }}
                            />
                            <Tooltip
                              formatter={(value: any, name: string | undefined) => {
                                if (value === null) return [null, ''];
                                return [`$${value}`, name || ''];
                              }}
                              labelStyle={{ color: '#374151', fontWeight: 600 }}
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px' }}
                            />
                            <Legend
                              wrapperStyle={{ paddingTop: '20px' }}
                              iconType="line"
                            />

                            {/* Today marker */}
                            {todayIndex >= 0 && (
                              <ReferenceLine
                                x={processedData[todayIndex].dateLabel}
                                stroke="#10b981"
                                strokeDasharray="5 5"
                                strokeWidth={2}
                                label={{ value: 'TODAY', position: 'top', fill: '#10b981', fontWeight: 700, fontSize: 12 }}
                              />
                            )}

                            {/* Bars for income and expenses (actual data only) */}
                            <Bar
                              dataKey={(entry) => !entry.isProjection ? entry.income : null}
                              fill="#3b82f6"
                              name="Income"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey={(entry) => !entry.isProjection ? entry.expenses : null}
                              fill="#ef4444"
                              name="Expenses"
                              radius={[4, 4, 0, 0]}
                            />

                            {/* Lines for savings (actual and projected) */}
                            <Line
                              type="monotone"
                              dataKey={(entry) => !entry.isProjection ? entry.savings : null}
                              stroke="#10b981"
                              strokeWidth={3}
                              dot={false}
                              name="Cumulative Savings"
                              connectNulls
                            />

                            {/* Projection line (dashed, savings only) */}
                            <Line
                              type="monotone"
                              dataKey={(entry) => entry.isProjection ? entry.savings : null}
                              stroke="#10b981"
                              strokeWidth={3}
                              strokeDasharray="5 5"
                              dot={false}
                              name="Projected Savings"
                              opacity={0.6}
                              connectNulls
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}
                </>
              )}

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Last Month's Income</p>
                  <p className="text-lg font-bold text-blue-600">
                    ${(() => {
                      // Calculate last month's income (last 30 days)
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      const lastMonthData = transactionSummary.summary.filter(d => new Date(d.date) >= thirtyDaysAgo);
                      const lastMonthIncome = lastMonthData.reduce((sum, d) => sum + d.income, 0);
                      return lastMonthIncome.toFixed(2);
                    })()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Last Month's Expenses</p>
                  <p className="text-lg font-bold text-red-600">
                    ${(() => {
                      // Calculate last month's expenses (last 30 days)
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      const lastMonthData = transactionSummary.summary.filter(d => new Date(d.date) >= thirtyDaysAgo);
                      const lastMonthExpenses = lastMonthData.reduce((sum, d) => sum + d.expenses, 0);
                      return lastMonthExpenses.toFixed(2);
                    })()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Current Savings</p>
                  <p className="text-lg font-bold text-green-600">
                    ${metrics.currentSavings.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <ChartIcon className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Financial Trend & Projection</h2>
                </div>
              </div>
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center p-6">
                  <ChartIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium mb-2">Start tracking your finances</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Add your first transaction to see your financial trends and projections over time.
                  </p>
                  <button
                    onClick={() => setShowAddTransaction(true)}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Your First Transaction</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          {/* Savings Potential */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Savings Potential</h2>
            <div className="text-center mb-4">
              <p className="text-4xl font-bold text-green-600">
                {metrics.savingsRate.toFixed(0)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">of your income</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Math.max(metrics.savingsRate, 0), 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              {metrics.availableToSave >= 0
                ? `You can save $${metrics.availableToSave.toFixed(2)} per month`
                : 'Your expenses exceed your income'}
            </p>
          </div>

          {/* Savings Tips with Action Buttons */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="h-6 w-6 text-yellow-600" />
              <h2 className="text-lg font-bold text-gray-900">Savings Tips</h2>
            </div>
            <div className="space-y-3">
              {/* Fuel tip with button */}
              {metrics.expenseBreakdown.find(e =>
                e.name.toLowerCase().includes('fuel') || e.name.toLowerCase().includes('petrol')
              ) && (
                <div>
                  <p className="text-sm text-gray-700 mb-2">
                    <span>You spend </span>
                    <span className="font-semibold">
                      ${metrics.expenseBreakdown.find(e =>
                        e.name.toLowerCase().includes('fuel') || e.name.toLowerCase().includes('petrol')
                      )?.monthlyAmount.toFixed(0)}/month
                    </span>
                    <span> on fuel</span>
                  </p>
                  <button
                    onClick={() => router.push('/fuel-prices')}
                    className="w-full flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <Fuel className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm font-medium text-gray-700">Compare Fuel Prices</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-yellow-600" />
                  </button>
                </div>
              )}

              {/* Grocery tip with button */}
              {metrics.expenseBreakdown.find(e =>
                e.name.toLowerCase().includes('grocery') || e.name.toLowerCase().includes('groceries') || e.name.toLowerCase().includes('food')
              ) && (
                <div>
                  <p className="text-sm text-gray-700 mb-2">
                    <span>Reduce your </span>
                    <span className="font-semibold">
                      ${metrics.expenseBreakdown.find(e =>
                        e.name.toLowerCase().includes('grocery') || e.name.toLowerCase().includes('groceries') || e.name.toLowerCase().includes('food')
                      )?.monthlyAmount.toFixed(0)}/month
                    </span>
                    <span> grocery bill</span>
                  </p>
                  <button
                    onClick={() => router.push('/recipes')}
                    className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <ShoppingCart className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Find Cheaper Recipes</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-green-600" />
                  </button>
                </div>
              )}

              {/* Location-based events tip with button */}
              {profile?.location && (
                <div>
                  <p className="text-sm text-gray-700 mb-2">
                    Save on entertainment near {profile.location}
                  </p>
                  <button
                    onClick={() => router.push('/events')}
                    className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Discover Free Events</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                  </button>
                </div>
              )}

              {/* General tip with button */}
              <div>
                <p className="text-sm text-gray-700 mb-2">
                  Review your expenses monthly to identify savings opportunities
                </p>
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Update Budget</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
