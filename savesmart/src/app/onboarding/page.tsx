"use client";

import { useState } from "react";
import { PiggyBank, ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserProfile {
  livingOutOfHome: boolean;
  monthlyIncome: number;
  monthlyRent: number;
  weeklyGroceryBudget: number;
  currentSavings: number;
  hasCard: boolean;
  fuelType: string;
  subscriptions: string[];
  savingsGoal: string;
  timeframe: string;
}

const SUBSCRIPTION_OPTIONS = [
  "Netflix", "Spotify", "Disney+", "Amazon Prime", "YouTube Premium", 
  "Apple Music", "Stan", "Binge", "Kayo Sports", "Adobe Creative Cloud"
];

const FUEL_TYPES = ["Petrol (E10)", "Petrol (91)", "Petrol (95)", "Petrol (98)", "Diesel", "Don't drive"];

export default function Onboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    livingOutOfHome: false,
    monthlyIncome: 0,
    monthlyRent: 0,
    weeklyGroceryBudget: 0,
    currentSavings: 0,
    hasCard: false,
    fuelType: "",
    subscriptions: [],
    savingsGoal: "",
    timeframe: ""
  });

  const totalSteps = 7;

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

  const toggleSubscription = (subscription: string) => {
    const newSubs = profile.subscriptions.includes(subscription)
      ? profile.subscriptions.filter(s => s !== subscription)
      : [...profile.subscriptions, subscription];
    updateProfile({ subscriptions: newSubs });
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
                onClick={() => updateProfile({ livingOutOfHome: false })}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  !profile.livingOutOfHome ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">No, I live at home</div>
                <div className="text-sm text-gray-600">Living with family/parents</div>
              </button>
            </div>
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
            <h2 className="text-2xl font-bold text-gray-900">Monthly Rent</h2>
            <p className="text-gray-600">
              {profile.livingOutOfHome ? "How much do you pay in rent per month?" : "Great! Living at home saves money on rent."}
            </p>
            {profile.livingOutOfHome ? (
              <div className="space-y-4">
                <input
                  type="number"
                  placeholder="e.g. 600"
                  value={profile.monthlyRent || ''}
                  onChange={(e) => updateProfile({ monthlyRent: parseInt(e.target.value) || 0 })}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-lg"
                />
                <div className="text-sm text-gray-500">
                  Include: rent, utilities, internet (if included in rent)
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <div className="font-semibold text-green-800">Rent: $0/month</div>
                <div className="text-sm text-green-600">This gives you a big advantage for saving!</div>
              </div>
            )}
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
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-lg"
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
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-lg"
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
            <h2 className="text-2xl font-bold text-gray-900">Transport & Fuel</h2>
            <p className="text-gray-600">Do you drive? What fuel type?</p>
            <div className="space-y-3">
              {FUEL_TYPES.map((fuel) => (
                <button
                  key={fuel}
                  onClick={() => updateProfile({ fuelType: fuel, hasCard: fuel !== "Don't drive" })}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                    profile.fuelType === fuel ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {fuel}
                </button>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Active Subscriptions</h2>
            <p className="text-gray-600">Which of these services do you currently pay for?</p>
            <div className="grid grid-cols-2 gap-3">
              {SUBSCRIPTION_OPTIONS.map((sub) => (
                <button
                  key={sub}
                  onClick={() => toggleSubscription(sub)}
                  className={`p-3 rounded-lg border-2 text-sm transition-colors ${
                    profile.subscriptions.includes(sub) 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-500">
              Selected: {profile.subscriptions.length} services
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