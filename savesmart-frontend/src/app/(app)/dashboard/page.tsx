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
import { getProfile, UserData, getTransactionSummary, TransactionSummary } from '@/lib/api';

interface ExpenseBreakdown {
  name: string;
  amount: number;
  frequency: string;
  monthlyAmount: number;
  color: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserData | null>(null);
  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const profileData = await getProfile(userId);
      setProfile(profileData);

      // Load transaction summary for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const summary = await getTransactionSummary(
        userId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        'day'
      );
      setTransactionSummary(summary);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
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

    const monthlyIncome = profile.income || 0;

    // Calculate total monthly expenses
    let totalMonthlyExpenses = 0;
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
        totalMonthlyExpenses += monthlyAmount;

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
      currentSavings: profile.savings || 0,
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'Failed to load dashboard data'}
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

          {/* Savings Tips */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="h-6 w-6 text-yellow-600" />
              <h2 className="text-xl font-bold text-gray-900">Savings Tips</h2>
            </div>
            <ul className="space-y-3">
              {savingsTips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold mt-1">•</span>
                  <span className="text-sm text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Savings Over Time Chart */}
          {transactionSummary && transactionSummary.summary.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <ChartIcon className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Savings Trend (Last 30 Days)</h2>
                </div>
              </div>

              <div className="h-64 relative">
                <svg className="w-full h-full" viewBox="0 0 800 250" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="0" x2="800" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="62.5" x2="800" y2="62.5" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="125" x2="800" y2="125" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="187.5" x2="800" y2="187.5" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="250" x2="800" y2="250" stroke="#e5e7eb" strokeWidth="1" />

                  {/* Data lines */}
                  {(() => {
                    const data = transactionSummary.summary;
                    const maxValue = Math.max(...data.map(d => Math.max(d.income, d.expenses, d.savings)));
                    const points = data.map((d, i) => ({
                      x: (i / (data.length - 1)) * 800,
                      yIncome: 250 - (d.income / maxValue) * 250,
                      yExpenses: 250 - (d.expenses / maxValue) * 250,
                      ySavings: 250 - (d.savings / maxValue) * 250,
                    }));

                    const createPath = (yKey: 'yIncome' | 'yExpenses' | 'ySavings') =>
                      points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p[yKey]}`).join(' ');

                    return (
                      <>
                        {/* Income line */}
                        <path
                          d={createPath('yIncome')}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                        />
                        {/* Expenses line */}
                        <path
                          d={createPath('yExpenses')}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="2"
                        />
                        {/* Savings line */}
                        <path
                          d={createPath('ySavings')}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                        />
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-0.5 bg-blue-500"></div>
                  <span className="text-sm text-gray-600">Income</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-0.5 bg-red-500"></div>
                  <span className="text-sm text-gray-600">Expenses</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-0.5 bg-green-500"></div>
                  <span className="text-sm text-gray-600">Savings</span>
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Income</p>
                  <p className="text-lg font-bold text-blue-600">
                    ${transactionSummary.totals.income.toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-lg font-bold text-red-600">
                    ${transactionSummary.totals.expenses.toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Saved</p>
                  <p className="text-lg font-bold text-green-600">
                    ${transactionSummary.totals.savings.toFixed(2)}
                  </p>
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

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
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
  );
}
