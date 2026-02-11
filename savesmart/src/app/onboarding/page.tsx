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
  livingOutOfHome: boolean;
  monthlyIncome: number;
  monthlyRent: number;
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
  const [profile, setProfile] = useState<UserProfile>({
    livingOutOfHome: false,
    monthlyIncome: 0,
    monthlyRent: 0,
    weeklyGroceryBudget: 0,
    currentSavings: 0,
    recurringCosts: [...DEFAULT_RECURRING_COSTS],
    savingsGoal: "",
    timeframe: ""
  });

  const totalSteps = 5;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Navigate to chat interface (we'll create this later)
      router.push('/chat');
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
            <h2 className="text-2xl font-bold text-gray-900">Living Situation</h2>
            <p className="text-gray-600">Do you live out of home (rent/share house)?</p>
            <div className="space-y-3">
              <button
                onClick={() => updateProfile({ livingOutOfHome: true })}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  profile.livingOutOfHome ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">Yes, I live out of home</div>
                <div className="text-sm text-gray-600">Paying rent or sharing accommodation</div>
              </button>
              <button
                onClick={() => updateProfile({ livingOutOfHome: false, monthlyRent: 0 })}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  !profile.livingOutOfHome ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">No, I live at home</div>
                <div className="text-sm text-gray-600">Living with family/parents</div>
              </button>
            </div>
            
            {profile.livingOutOfHome && (
              <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Rent
                </label>
                <input
                  type="number"
                  placeholder="e.g. 600"
                  value={profile.monthlyRent || ''}
                  onChange={(e) => updateProfile({ monthlyRent: parseInt(e.target.value) || 0 })}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-lg"
                />
                <div className="text-sm text-gray-500 mt-1">
                  Include: rent, utilities, internet (if included in rent)
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Monthly Income</h2>
            <p className="text-gray-600">What's your monthly income from work/study allowance?</p>
            <div className="space-y-4">
              <input
                type="number"
                placeholder="e.g. 1200"
                value={profile.monthlyIncome || ''}
                onChange={(e) => updateProfile({ monthlyIncome: parseInt(e.target.value) || 0 })}
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-lg"
              />
              <div className="text-sm text-gray-500">
                Include: part-time job, Austudy, Youth Allowance, family support
              </div>
            </div>
          </div>
        );

      case 3:
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
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-lg"
              />
              <div className="text-sm text-gray-500">
                Include: food, drinks, household items from supermarkets
              </div>
            </div>
          </div>
        );

      case 4:
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
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-lg"
              />
              <div className="text-sm text-gray-500">
                Total in savings accounts, term deposits, cash
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Recurring Costs</h2>
            <p className="text-gray-600">Review and update your regular expenses. Add amounts for what applies to you, or remove items you don't have.</p>
            
            <div className="space-y-4">
              {profile.recurringCosts.map((cost, index) => (
                <div key={index} className={`p-4 rounded-lg space-y-3 border-2 transition-colors ${
                  cost.amount > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      placeholder="e.g. Netflix, Phone Bill, Transport"
                      value={cost.name}
                      onChange={(e) => updateRecurringCost(index, { name: e.target.value })}
                      className="flex-1 p-2 border border-gray-300 rounded focus:border-green-500 focus:outline-none font-medium"
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
                        className="w-full p-2 border border-gray-300 rounded focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Frequency</label>
                      <select
                        value={cost.frequency}
                        onChange={(e) => updateRecurringCost(index, { frequency: e.target.value as 'weekly' | 'monthly' | 'yearly' })}
                        className="w-full p-2 border border-gray-300 rounded focus:border-green-500 focus:outline-none"
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
                        className="w-full p-2 border border-gray-300 rounded focus:border-green-500 focus:outline-none"
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

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-6 py-3 rounded-lg border-2 border-gray-200 text-gray-600 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <span>{currentStep === totalSteps ? 'Complete Setup' : 'Next'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}