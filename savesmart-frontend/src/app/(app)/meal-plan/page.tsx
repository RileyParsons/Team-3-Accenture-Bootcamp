"use client";

import { useState } from "react";
import { ChevronRight, ShoppingCart, DollarSign, Calendar, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface MealPlanItem {
    day: string;
    breakfast: string;
    lunch: string;
    dinner: string;
    snack: string;
}

interface Ingredient {
    name: string;
    quantity: string;
    store: string;
    price: number;
}

export default function MealPlan() {
    const router = useRouter();
    const [step, setStep] = useState<'preferences' | 'plan'>('preferences');
    const [preferences, setPreferences] = useState({
        allergies: [] as string[],
        calorieGoal: "2000",
        culturalPreference: "",
        dietType: ""
    });

    // Dummy meal plan data
    const weeklyMealPlan: MealPlanItem[] = [
        {
            day: "Monday",
            breakfast: "Oatmeal with berries and honey",
            lunch: "Grilled chicken salad with quinoa",
            dinner: "Baked salmon with roasted vegetables",
            snack: "Greek yogurt with almonds"
        },
        {
            day: "Tuesday",
            breakfast: "Scrambled eggs with whole grain toast",
            lunch: "Turkey and avocado wrap",
            dinner: "Stir-fried tofu with brown rice",
            snack: "Apple slices with peanut butter"
        },
        {
            day: "Wednesday",
            breakfast: "Smoothie bowl with granola",
            lunch: "Lentil soup with crusty bread",
            dinner: "Grilled chicken breast with sweet potato",
            snack: "Carrot sticks with hummus"
        },
        {
            day: "Thursday",
            breakfast: "Whole grain pancakes with maple syrup",
            lunch: "Tuna salad sandwich",
            dinner: "Beef stir-fry with vegetables",
            snack: "Mixed nuts and dried fruit"
        },
        {
            day: "Friday",
            breakfast: "Avocado toast with poached egg",
            lunch: "Chicken Caesar salad",
            dinner: "Baked cod with quinoa and broccoli",
            snack: "Protein shake"
        },
        {
            day: "Saturday",
            breakfast: "French toast with fresh berries",
            lunch: "Vegetable pasta with marinara",
            dinner: "Grilled steak with mashed potatoes",
            snack: "Cheese and crackers"
        },
        {
            day: "Sunday",
            breakfast: "Breakfast burrito with salsa",
            lunch: "Roast chicken with vegetables",
            dinner: "Homemade pizza with salad",
            snack: "Dark chocolate and strawberries"
        }
    ];

    // Dummy shopping list grouped by store
    const shoppingList: { store: string; items: Ingredient[] }[] = [
        {
            store: "Woolworths",
            items: [
                { name: "Rolled oats (1kg)", quantity: "1 pack", store: "Woolworths", price: 4.50 },
                { name: "Mixed berries (500g)", quantity: "2 packs", store: "Woolworths", price: 8.00 },
                { name: "Chicken breast (1kg)", quantity: "1 pack", store: "Woolworths", price: 12.00 },
                { name: "Salmon fillets (400g)", quantity: "1 pack", store: "Woolworths", price: 15.00 },
                { name: "Greek yogurt (1kg)", quantity: "1 tub", store: "Woolworths", price: 6.50 },
                { name: "Eggs (dozen)", quantity: "2 cartons", store: "Woolworths", price: 10.00 },
                { name: "Whole grain bread", quantity: "2 loaves", store: "Woolworths", price: 7.00 },
                { name: "Avocados", quantity: "4 pieces", store: "Woolworths", price: 8.00 }
            ]
        },
        {
            store: "Coles",
            items: [
                { name: "Brown rice (2kg)", quantity: "1 bag", store: "Coles", price: 6.00 },
                { name: "Quinoa (500g)", quantity: "1 pack", store: "Coles", price: 7.50 },
                { name: "Tofu (300g)", quantity: "2 packs", store: "Coles", price: 6.00 },
                { name: "Sweet potatoes (1kg)", quantity: "1 bag", store: "Coles", price: 4.00 },
                { name: "Broccoli", quantity: "2 heads", store: "Coles", price: 5.00 },
                { name: "Mixed vegetables (frozen)", quantity: "2 bags", store: "Coles", price: 8.00 }
            ]
        },
        {
            store: "Aldi",
            items: [
                { name: "Almonds (500g)", quantity: "1 pack", store: "Aldi", price: 8.50 },
                { name: "Peanut butter", quantity: "1 jar", store: "Aldi", price: 4.50 },
                { name: "Hummus (200g)", quantity: "2 tubs", store: "Aldi", price: 6.00 },
                { name: "Pasta (500g)", quantity: "2 packs", store: "Aldi", price: 3.00 },
                { name: "Marinara sauce", quantity: "2 jars", store: "Aldi", price: 5.00 },
                { name: "Cheese (500g)", quantity: "1 block", store: "Aldi", price: 7.00 }
            ]
        }
    ];

    const totalCost = shoppingList.reduce((total, store) =>
        total + store.items.reduce((storeTotal, item) => storeTotal + item.price, 0), 0
    );

    const handleAllergyToggle = (allergy: string) => {
        setPreferences(prev => ({
            ...prev,
            allergies: prev.allergies.includes(allergy)
                ? prev.allergies.filter(a => a !== allergy)
                : [...prev.allergies, allergy]
        }));
    };

    const handleGeneratePlan = () => {
        setStep('plan');
    };

    const handleContinueToChat = () => {
        // Save preferences to localStorage
        const storedUser = localStorage.getItem('savesmart_user');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            userData.mealPreferences = preferences;
            localStorage.setItem('savesmart_user', JSON.stringify(userData));
        }
        router.push('/dashboard');
    };

    if (step === 'plan') {
        return (
            <div className="min-h-screen bg-gray-50">
                <main className="max-w-6xl mx-auto px-6 py-8">
                    {/* Summary Header */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Weekly Meal Plan</h1>
                        <p className="text-gray-900 mb-4">
                            Based on your preferences: {preferences.calorieGoal} calories/day
                            {preferences.allergies.length > 0 && `, avoiding ${preferences.allergies.join(', ')}`}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    <span className="font-semibold text-gray-900">Total Cost</span>
                                </div>
                                <p className="text-2xl font-bold text-green-600">${totalCost.toFixed(2)}</p>
                                <p className="text-sm text-gray-900">for the week</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Calendar className="h-5 w-5 text-blue-600" />
                                    <span className="font-semibold text-gray-900">Meals Planned</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-600">28</p>
                                <p className="text-sm text-gray-900">7 days × 4 meals</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <ShoppingCart className="h-5 w-5 text-purple-600" />
                                    <span className="font-semibold text-gray-900">Stores</span>
                                </div>
                                <p className="text-2xl font-bold text-purple-600">{shoppingList.length}</p>
                                <p className="text-sm text-gray-900">Woolworths, Coles, Aldi</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Weekly Meal Plan */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <Calendar className="h-6 w-6 mr-2 text-green-600" />
                                Weekly Menu
                            </h2>
                            <div className="space-y-4">
                                {weeklyMealPlan.map((day, index) => (
                                    <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                                        <h3 className="font-bold text-lg text-gray-900 mb-2">{day.day}</h3>
                                        <div className="space-y-1 text-sm">
                                            <p className="text-gray-900"><span className="font-semibold text-gray-900">Breakfast:</span> {day.breakfast}</p>
                                            <p className="text-gray-900"><span className="font-semibold text-gray-900">Lunch:</span> {day.lunch}</p>
                                            <p className="text-gray-900"><span className="font-semibold text-gray-900">Dinner:</span> {day.dinner}</p>
                                            <p className="text-gray-900"><span className="font-semibold text-gray-900">Snack:</span> {day.snack}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shopping List */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <ShoppingCart className="h-6 w-6 mr-2 text-green-600" />
                                Shopping List
                            </h2>
                            <div className="space-y-6">
                                {shoppingList.map((store, storeIndex) => (
                                    <div key={storeIndex} className="border-b pb-4 last:border-b-0">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-lg text-gray-900">{store.store}</h3>
                                            <span className="text-sm font-semibold text-green-600">
                                                ${store.items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {store.items.map((item, itemIndex) => (
                                                <div key={itemIndex} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <Check className="h-4 w-4 text-gray-400" />
                                                        <span className="text-gray-900">{item.name}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <span className="text-gray-900">{item.quantity}</span>
                                                        <span className="font-semibold text-gray-900">${item.price.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                                <div className="mt-6 pt-4 border-t-2 border-gray-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-bold text-gray-900">Weekly Total</span>
                                    <span className="text-2xl font-bold text-green-600">${totalCost.toFixed(2)}</span>
                                </div>
                                <p className="text-sm text-gray-900 mt-1">
                                    Average ${(totalCost / 7).toFixed(2)} per day
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Continue Button */}
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={handleContinueToChat}
                            className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2 text-lg"
                        >
                            <span>Continue to Dashboard</span>
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-2xl mx-auto px-6 py-12">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Let's Plan Your Meals
                        </h1>
                        <p className="text-gray-900">
                            Tell us your dietary preferences and we'll create a personalized weekly meal plan
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Allergies */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-3">
                                Do you have any food allergies or intolerances?
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Dairy', 'Gluten', 'Nuts', 'Shellfish', 'Eggs', 'Soy'].map((allergy) => (
                                    <button
                                        key={allergy}
                                        onClick={() => handleAllergyToggle(allergy)}
                                        className={`p-3 rounded-lg border-2 transition-colors text-gray-900 font-medium ${preferences.allergies.includes(allergy)
                                                ? 'border-green-500 bg-green-50 text-green-700'
                                                : 'border-gray-200 hover:border-green-300'
                                            }`}
                                    >
                                        {allergy}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Calorie Goal */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Daily Calorie Goal
                            </label>
                            <select
                                value={preferences.calorieGoal}
                                onChange={(e) => setPreferences(prev => ({ ...prev, calorieGoal: e.target.value }))}
                                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-gray-900"
                            >
                                <option value="1500">1500 calories (Weight loss)</option>
                                <option value="2000">2000 calories (Maintenance)</option>
                                <option value="2500">2500 calories (Muscle gain)</option>
                                <option value="3000">3000 calories (High activity)</option>
                            </select>
                        </div>

                        {/* Cultural Preference */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Cultural or Regional Preference
                            </label>
                            <select
                                value={preferences.culturalPreference}
                                onChange={(e) => setPreferences(prev => ({ ...prev, culturalPreference: e.target.value }))}
                                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-gray-900"
                            >
                                <option value="">No preference</option>
                                <option value="mediterranean">Mediterranean</option>
                                <option value="asian">Asian</option>
                                <option value="mexican">Mexican</option>
                                <option value="indian">Indian</option>
                                <option value="italian">Italian</option>
                                <option value="australian">Australian</option>
                            </select>
                        </div>

                        {/* Diet Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Diet Type
                            </label>
                            <select
                                value={preferences.dietType}
                                onChange={(e) => setPreferences(prev => ({ ...prev, dietType: e.target.value }))}
                                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-gray-900"
                            >
                                <option value="">No restriction</option>
                                <option value="vegetarian">Vegetarian</option>
                                <option value="vegan">Vegan</option>
                                <option value="pescatarian">Pescatarian</option>
                                <option value="keto">Keto</option>
                                <option value="paleo">Paleo</option>
                            </select>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGeneratePlan}
                            className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                        >
                            <span>Generate My Meal Plan</span>
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
