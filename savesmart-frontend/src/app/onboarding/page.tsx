"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PiggyBank, ChevronRight, ChevronLeft } from "lucide-react";
import { getStoredUser, getUserId, saveStoredProfile } from "@/lib/storage";
import { UserProfileV2 } from "@/types/profile";

type RentRange = "$0-150" | "$150-250" | "$250-400" | "$400+";
type GroceryRange = "$0-50" | "$50-80" | "$80-120" | "$120-180" | "$180+";
type TransportRange = "$0-20" | "$20-50" | "$50-100" | "$100+";
type EntertainmentRange = "$0-50" | "$50-100" | "$100-200" | "$200-350" | "$350+";
type SavingsRange = "$0-100" | "$100-300" | "$300-600" | "$600+";

const RENT_MIDPOINTS: Record<RentRange, number> = {
  "$0-150": 75,
  "$150-250": 200,
  "$250-400": 325,
  "$400+": 500,
};

const GROCERY_MIDPOINTS: Record<GroceryRange, number> = {
  "$0-50": 25,
  "$50-80": 65,
  "$80-120": 100,
  "$120-180": 150,
  "$180+": 220,
};

const TRANSPORT_MIDPOINTS: Record<TransportRange, number> = {
  "$0-20": 10,
  "$20-50": 35,
  "$50-100": 75,
  "$100+": 125,
};

const ENTERTAINMENT_MIDPOINTS: Record<EntertainmentRange, number> = {
  "$0-50": 25,
  "$50-100": 75,
  "$100-200": 150,
  "$200-350": 275,
  "$350+": 450,
};

const SAVINGS_MIDPOINTS: Record<SavingsRange, number> = {
  "$0-100": 50,
  "$100-300": 200,
  "$300-600": 450,
  "$600+": 750,
};

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    paysRent: null as boolean | null,
    rentRange: null as RentRange | null,
    groceryRange: null as GroceryRange | null,
    transportMode: null as "public" | "car" | "walk-bike" | "rideshare" | null,
    transportRange: null as TransportRange | null,
    entertainmentRange: null as EntertainmentRange | null,
    savingsRange: null as SavingsRange | null,
  });

  useEffect(() => {
    // Check if user is authenticated
    const user = getStoredUser();
    if (!user) {
      router.push("/auth/login");
    }
  }, [router]);

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.paysRent !== null && (!formData.paysRent || formData.rentRange !== null);
      case 2:
        return formData.groceryRange !== null;
      case 3:
        return formData.transportMode !== null && 
               (formData.transportMode === "walk-bike" || formData.transportRange !== null);
      case 4:
        return formData.entertainmentRange !== null;
      case 5:
        return formData.savingsRange !== null;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    if (!canProceed()) return;

    const user = getStoredUser();
    const userId = getUserId();
    
    if (!user || !userId) {
      router.push("/auth/login");
      return;
    }

    // Build profile
    const profile: UserProfileV2 = {
      userId,
      email: user.email,
      name: user.name || user.firstName || "",
      living: {
        paysRent: formData.paysRent!,
        rentAmount: formData.paysRent && formData.rentRange ? RENT_MIDPOINTS[formData.rentRange] : undefined,
        rentFrequency: formData.paysRent ? "weekly" : undefined,
      },
      spending: {
        groceriesWeekly: GROCERY_MIDPOINTS[formData.groceryRange!],
        transportMode: formData.transportMode!,
        transportWeekly: formData.transportMode === "walk-bike" ? 0 : TRANSPORT_MIDPOINTS[formData.transportRange!],
        entertainmentMonthly: ENTERTAINMENT_MIDPOINTS[formData.entertainmentRange!],
      },
      savingsTargetMonthly: SAVINGS_MIDPOINTS[formData.savingsRange!],
      preferences: {
        cuisines: [],
        allergies: [],
        religion: "none",
        dietTags: [],
      },
    };

    saveStoredProfile(profile);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <nav className="px-6 py-4 bg-white shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-2">
            <PiggyBank className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold text-gray-900">SaveSmart</span>
          </div>
          <div className="text-sm text-gray-600">
            Step {step} of 5
          </div>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-600 transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Step 1: Living Situation */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Let's start with your living situation
                </h2>
                <p className="text-gray-600">
                  This helps us understand your fixed expenses
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-lg font-medium text-gray-700">
                  Do you pay rent?
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, paysRent: true })}
                    className={`p-4 border-2 rounded-lg font-medium transition-all ${
                      formData.paysRent === true
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, paysRent: false, rentRange: null })}
                    className={`p-4 border-2 rounded-lg font-medium transition-all ${
                      formData.paysRent === false
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {formData.paysRent && (
                <div className="space-y-4 animate-fadeIn">
                  <label className="block text-lg font-medium text-gray-700">
                    Weekly rent range
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {(Object.keys(RENT_MIDPOINTS) as RentRange[]).map((range) => (
                      <button
                        key={range}
                        onClick={() => setFormData({ ...formData, rentRange: range })}
                        className={`p-4 border-2 rounded-lg font-medium transition-all ${
                          formData.rentRange === range
                            ? "border-green-600 bg-green-50 text-green-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Grocery Spend */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  How much do you spend on groceries?
                </h2>
                <p className="text-gray-600">
                  Select your typical weekly grocery budget
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-lg font-medium text-gray-700">
                  Weekly grocery spend
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {(Object.keys(GROCERY_MIDPOINTS) as GroceryRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setFormData({ ...formData, groceryRange: range })}
                      className={`p-4 border-2 rounded-lg font-medium transition-all ${
                        formData.groceryRange === range
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Transport */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  How do you get around?
                </h2>
                <p className="text-gray-600">
                  Tell us about your transportation
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-lg font-medium text-gray-700">
                  Mode of transport
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, transportMode: "public" })}
                    className={`p-4 border-2 rounded-lg font-medium transition-all ${
                      formData.transportMode === "public"
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    Public Transport
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, transportMode: "car" })}
                    className={`p-4 border-2 rounded-lg font-medium transition-all ${
                      formData.transportMode === "car"
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    Car
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, transportMode: "walk-bike", transportRange: null })}
                    className={`p-4 border-2 rounded-lg font-medium transition-all ${
                      formData.transportMode === "walk-bike"
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    Walk/Bike
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, transportMode: "rideshare" })}
                    className={`p-4 border-2 rounded-lg font-medium transition-all ${
                      formData.transportMode === "rideshare"
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    Rideshare
                  </button>
                </div>
              </div>

              {formData.transportMode && formData.transportMode !== "walk-bike" && (
                <div className="space-y-4 animate-fadeIn">
                  <label className="block text-lg font-medium text-gray-700">
                    Weekly transport spend
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {(Object.keys(TRANSPORT_MIDPOINTS) as TransportRange[]).map((range) => (
                      <button
                        key={range}
                        onClick={() => setFormData({ ...formData, transportRange: range })}
                        className={`p-4 border-2 rounded-lg font-medium transition-all ${
                          formData.transportRange === range
                            ? "border-green-600 bg-green-50 text-green-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Entertainment */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  What about entertainment?
                </h2>
                <p className="text-gray-600">
                  Movies, dining out, subscriptions, etc.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-lg font-medium text-gray-700">
                  Monthly entertainment spend
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {(Object.keys(ENTERTAINMENT_MIDPOINTS) as EntertainmentRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setFormData({ ...formData, entertainmentRange: range })}
                      className={`p-4 border-2 rounded-lg font-medium transition-all ${
                        formData.entertainmentRange === range
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Savings Target */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  What's your savings goal?
                </h2>
                <p className="text-gray-600">
                  How much would you like to save each month?
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-lg font-medium text-gray-700">
                  Monthly savings target
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {(Object.keys(SAVINGS_MIDPOINTS) as SavingsRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setFormData({ ...formData, savingsRange: range })}
                      className={`p-4 border-2 rounded-lg font-medium transition-all ${
                        formData.savingsRange === range
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="flex items-center space-x-2 px-6 py-3 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back</span>
            </button>

            {step < 5 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canProceed()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                Complete Setup
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
