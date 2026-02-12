"use client";

import { useState } from "react";
import { PiggyBank, ChevronRight, ChevronLeft, Plus, Minus } from "lucide-react";
import { useRouter } from "next/navigation";

interface RecurringCost {
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  type: 'fixed' | 'variable';
}

interface UserProfile {
  name: string;
  location: string;
  postcode: string;
  livingOutOfHome: boolean;
  monthlyIncome: number;
  incomeFrequency: 'weekly' | 'fortnightly' | 'monthly';
  monthlyRent: number;
  rentFrequency: 'weekly' | 'fortnightly' | 'monthly';
  weeklyGroceryBudget: number;
  currentSavings: number;
  recurringCosts: RecurringCost[];
  savingsGoal: string;
  timeframe: string;
}

const DEFAULT_RECURRING_COSTS: RecurringCost[] = [
  { name: "Phone Bill", amount: 0, frequency: 'monthly', type: 'fixed' },
  { name: "Internet", amount: 0, frequency: 'monthly', type: 'fixed' },
  { name: "Fuel", amount: 0, frequency: 'weekly', type: 'variable' }
];


export default function Onboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user data from localStorage to pre-fill name
  const getUserData = () => {
    if (typeof window === 'undefined') return '';

    // Try to get temp signup data first
    const tempSignupStr = localStorage.getItem('savesmart_temp_signup');
    if (tempSignupStr) {
      const tempSignup = JSON.parse(tempSignupStr);
      return tempSignup.name || `${tempSignup.firstName || ''} ${tempSignup.lastName || ''}`.trim();
    }

    // Fallback to regular user data
    const userDataStr = localStorage.getItem('savesmart_user');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      return `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
    }
    return '';
  };

  const [profile, setProfile] = useState<UserProfile>({
    name: getUserData(),
    location: "",
    postcode: "",
    livingOutOfHome: false,
    monthlyIncome: 0,
    incomeFrequency: 'monthly',
    monthlyRent: 0,
    rentFrequency: 'weekly',
    weeklyGroceryBudget: 0,
    currentSavings: 0,
    recurringCosts: [...DEFAULT_RECURRING_COSTS],
    savingsGoal: "",
    timeframe: ""
  });

  const totalSteps = 6;

  const handleNext = async () => {
    // Clear any previous errors
    setError(null);

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save profile to backend
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Get temporary signup data from localStorage
      const tempSignupStr = localStorage.getItem('savesmart_temp_signup');
      if (!tempSignupStr) {
        throw new Error('Signup data not found. Please sign up first.');
      }

      const tempSignup = JSON.parse(tempSignupStr);

      // Generate userId from email
      const userId = tempSignup.email.replace('@', '-').replace(/\./g, '-');

      // Convert frequencies to monthly amounts
      const getMonthlyAmount = (amount: number, frequency: 'weekly' | 'fortnightly' | 'monthly') => {
        switch (frequency) {
          case 'weekly': return amount * 4.33;
          case 'fortnightly': return amount * 2.17;
          case 'monthly': return amount;
          default: return amount;
        }
      };

      const monthlyIncome = getMonthlyAmount(profile.monthlyIncome, profile.incomeFrequency);

      // Build recurringExpenses array from all expenses
      const recurringExpenses = [];

      // Add rent if living out of home
      if (profile.livingOutOfHome && profile.monthlyRent > 0) {
        recurringExpenses.push({
          name: "Rent",
          amount: profile.monthlyRent,
          frequency: profile.rentFrequency,
          isFixed: true
        });
      }

      // Add groceries
      if (profile.weeklyGroceryBudget > 0) {
        recurringExpenses.push({
          name: "Groceries",
          amount: profile.weeklyGroceryBudget,
          frequency: "weekly",
          isFixed: false
        });
      }

      // Add other recurring costs (Phone, Internet, Fuel, custom expenses)
      profile.recurringCosts.forEach(cost => {
        if (cost.amount > 0 && cost.name.trim() !== '') {
          recurringExpenses.push({
            name: cost.name,
            amount: cost.amount,
            frequency: cost.frequency,
            isFixed: cost.type === 'fixed'
          });
        }
      });

      // Import registerUser function for API call
      const { registerUser } = await import('@/lib/api');

      // Register user with complete profile (includes password hashing)
      const result = await registerUser(
        tempSignup.email,
        tempSignup.password,
        profile.name.trim() || tempSignup.name,
        {
          income: Math.round(monthlyIncome),
          incomeFrequency: profile.incomeFrequency,
          savings: profile.currentSavings,
          location: profile.location.trim() || null,
          postcode: profile.postcode.trim() || null,
          recurringExpenses: recurringExpenses
        }
      );

      if (!result || !result.userId) {
        throw new Error('Failed to create account');
      }

      // Store user data in localStorage for session management
      const localUserData = {
        userId: result.userId,
        email: tempSignup.email,
        firstName: tempSignup.firstName,
        lastName: tempSignup.lastName,
        name: profile.name.trim() || tempSignup.name,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('savesmart_user', JSON.stringify(localUserData));
      localStorage.setItem('savesmart_authenticated', 'true');

      // Clear temporary signup data
      localStorage.removeItem('savesmart_temp_signup');

      // Navigate to dashboard page
      router.push('/dashboard');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const addRecurringCost = () => {
    const newCost: RecurringCost = { name: "", amount: 0, frequency: 'monthly', type: 'fixed' };
    updateProfile({ recurringCosts: [...profile.recurringCosts, newCost] });
  };

  const updateRecurringCost = (index: number, updates: Partial<RecurringCost>) => {
    const updatedCosts = profile.recurringCosts.map((cost, i) =>
      i === index ? { ...cost, ...updates } : cost
    );
    updateProfile({ recurringCosts: updatedCosts });
  };

  const removeRecurringCost = (index: number) => {
    const updatedCosts = profile.recurringCosts.filter((_, i) => i !== index);
    updateProfile({ recurringCosts: updatedCosts });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Welcome! Let's Get Started</h2>
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome{profile.name ? `, ${profile.name.split(' ')[0]}` : ''}! 👋
            </h2>
            <p className="text-gray-600">Let's set up your savings profile. This will only take 2-3 minutes.</p>

            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800 mb-3">
                <div className="font-semibold mb-1">📍 Optional: Help us find local deals</div>
                <div>You can give your approximate location to help us find the best prices and deals near you.</div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City or Suburb
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Parramatta, Sydney CBD, Melbourne"
                    value={profile.location}
                    onChange={(e) => updateProfile({ location: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-gray-900 placeholder-gray-400"
                  />
                </div>

                <div className="text-center text-gray-500 text-sm">OR</div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postcode
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2150, 3000"
                    value={profile.postcode}
                    onChange={(e) => updateProfile({ postcode: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-gray-900 placeholder-gray-400"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-2">
                💡 You can skip this and add it later in your profile
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Living Situation</h2>
            <p className="text-gray-600">Do you live out of home (rent/share house)?</p>
            <div className="space-y-3">
              <button
                onClick={() => updateProfile({ livingOutOfHome: true })}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${profile.livingOutOfHome ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="font-semibold">Yes, I live out of home</div>
                <div className="text-sm text-gray-600">Paying rent or sharing accommodation</div>
              </button>
              <button
                onClick={() => updateProfile({ livingOutOfHome: false, monthlyRent: 0, rentFrequency: 'weekly' })}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${!profile.livingOutOfHome ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="font-semibold">No, I live at home</div>
                <div className="text-sm text-gray-600">Living with family/parents</div>
              </button>
            </div>

            {profile.livingOutOfHome && (
              <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rent
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Amount ($)</label>
                    <input
                      type="number"
                      placeholder="e.g. 150"
                      value={profile.monthlyRent || ''}
                      onChange={(e) => updateProfile({ monthlyRent: parseInt(e.target.value) || 0 })}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-lg text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Frequency</label>
                    <select
                      value={profile.rentFrequency}
                      onChange={(e) => updateProfile({ rentFrequency: e.target.value as 'weekly' | 'fortnightly' | 'monthly' })}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-lg text-gray-900 bg-white"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="fortnightly">Fortnightly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Include: rent, utilities, internet (if included in rent)
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Income</h2>
            <p className="text-gray-600">What's your income from work/study allowance?</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1200"
                    value={profile.monthlyIncome || ''}
                    onChange={(e) => updateProfile({ monthlyIncome: parseInt(e.target.value) || 0 })}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-lg text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    value={profile.incomeFrequency}
                    onChange={(e) => updateProfile({ incomeFrequency: e.target.value as 'weekly' | 'fortnightly' | 'monthly' })}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-lg text-gray-900 bg-white"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="fortnightly">Fortnightly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Include: part-time job, Austudy, Youth Allowance, family support
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Grocery Budget</h2>
            <p className="text-gray-600">How much do you typically spend on groceries per week?</p>
            <div className="space-y-4">
              <input
                type="number"
                placeholder="e.g. 80"
                value={profile.weeklyGroceryBudget || ''}
                onChange={(e) => updateProfile({ weeklyGroceryBudget: parseInt(e.target.value) || 0 })}
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-lg text-gray-900 placeholder-gray-400"
              />
              <div className="text-sm text-gray-500">
                Include: food, drinks, household items from supermarkets
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Current Savings</h2>
            <p className="text-gray-600">How much do you currently have saved?</p>
            <div className="space-y-4">
              <input
                type="number"
                placeholder="e.g. 1500"
                value={profile.currentSavings || ''}
                onChange={(e) => updateProfile({ currentSavings: parseInt(e.target.value) || 0 })}
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-lg text-gray-900 placeholder-gray-400"
              />
              <div className="text-sm text-gray-500">
                Total in savings accounts, term deposits, cash
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Recurring Costs</h2>
            <p className="text-gray-600">Review and update your regular expenses. Add amounts for what applies to you, or remove items you don't have.</p>

            <div className="space-y-4">
              {profile.recurringCosts.map((cost, index) => (
                <div key={index} className={`p-4 rounded-lg space-y-3 border-2 transition-colors ${cost.amount > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      placeholder="e.g. Netflix, Phone Bill, Transport"
                      value={cost.name}
                      onChange={(e) => updateRecurringCost(index, { name: e.target.value })}
                      className="flex-1 p-2 border border-gray-300 rounded focus:border-green-500 focus:outline-none font-medium text-gray-900 placeholder-gray-400"
                    />
                    <button
                      onClick={() => removeRecurringCost(index)}
                      className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Remove this expense"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Amount ($)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={cost.amount || ''}
                        onChange={(e) => updateRecurringCost(index, { amount: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 border border-gray-300 rounded focus:border-green-500 focus:outline-none text-gray-900 placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Frequency</label>
                      <select
                        value={cost.frequency}
                        onChange={(e) => updateRecurringCost(index, { frequency: e.target.value as 'weekly' | 'monthly' | 'yearly' })}
                        className="w-full p-2 border border-gray-300 rounded focus:border-green-500 focus:outline-none text-gray-900 bg-white"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                      <select
                        value={cost.type}
                        onChange={(e) => updateRecurringCost(index, { type: e.target.value as 'fixed' | 'variable' })}
                        className="w-full p-2 border border-gray-300 rounded focus:border-green-500 focus:outline-none text-gray-900 bg-white"
                      >
                        <option value="fixed">Fixed</option>
                        <option value="variable">Variable</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addRecurringCost}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Custom Expense</span>
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <div className="font-semibold mb-1">💡 Tips:</div>
                <div className="space-y-1">
                  <div>• Add amounts for expenses you have (items turn green when filled)</div>
                  <div>• Remove items you don't need by clicking the ✖ button</div>
                  <div>• Leave amounts at $0 for expenses you're not sure about</div>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              {profile.recurringCosts.filter(c => c.amount > 0).length} of {profile.recurringCosts.length} expenses have amounts added
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <nav className="px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-2">
            <PiggyBank className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold text-gray-900">SaveSmart</span>
          </div>
          <div className="text-sm text-gray-600">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="px-6">
        <div className="max-w-4xl mx-auto">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {renderStep()}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="text-red-800 text-sm">
                <div className="font-semibold mb-1">⚠️ Error saving profile:</div>
                <div>{error}</div>
                <div className="mt-2 text-xs">Profile saved to browser storage as backup.</div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className="flex items-center space-x-2 px-6 py-3 rounded-lg border-2 border-gray-200 text-gray-600 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>{currentStep === totalSteps ? 'Complete Setup' : 'Next'}</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}