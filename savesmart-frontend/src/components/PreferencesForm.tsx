'use client';

import { useState } from 'react';

export interface MealPlanPreferences {
  allergies: string[];
  calorieGoal: number;
  culturalPreference: string;
  dietType: string;
  notes: string;
}

interface PreferencesFormProps {
  initialPreferences?: MealPlanPreferences;
  onSubmit: (preferences: MealPlanPreferences) => void;
  onCancel?: () => void;
}

const ALLERGY_OPTIONS = ['Dairy', 'Gluten', 'Nuts', 'Shellfish', 'Eggs', 'Soy'];
const CALORIE_OPTIONS = [1500, 2000, 2500, 3000];
const CULTURAL_OPTIONS = ['Mediterranean', 'Asian', 'Mexican', 'Indian', 'Italian', 'Australian'];
const DIET_OPTIONS = ['Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo'];

export default function PreferencesForm({ initialPreferences, onSubmit, onCancel }: PreferencesFormProps) {
  const [allergies, setAllergies] = useState<string[]>(initialPreferences?.allergies || []);
  const [calorieGoal, setCalorieGoal] = useState<number>(initialPreferences?.calorieGoal || 2000);
  const [culturalPreference, setCulturalPreference] = useState<string>(initialPreferences?.culturalPreference || '');
  const [dietType, setDietType] = useState<string>(initialPreferences?.dietType || '');
  const [notes, setNotes] = useState<string>(initialPreferences?.notes || '');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const toggleAllergy = (allergy: string) => {
    setAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!calorieGoal) {
      newErrors.calorieGoal = 'Please select a calorie goal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      allergies,
      calorieGoal,
      culturalPreference,
      dietType,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Meal Plan Preferences</h2>

      {/* Allergies Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Food Allergies & Restrictions
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ALLERGY_OPTIONS.map((allergy) => (
            <label
              key={allergy}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={allergies.includes(allergy)}
                onChange={() => toggleAllergy(allergy)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-900">{allergy}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Calorie Goal Section */}
      <div className="mb-6">
        <label htmlFor="calorieGoal" className="block text-sm font-medium text-gray-900 mb-2">
          Daily Calorie Goal <span className="text-red-500">*</span>
        </label>
        <select
          id="calorieGoal"
          value={calorieGoal}
          onChange={(e) => setCalorieGoal(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          {CALORIE_OPTIONS.map((calories) => (
            <option key={calories} value={calories}>
              {calories} calories
            </option>
          ))}
        </select>
        {errors.calorieGoal && (
          <p className="mt-1 text-sm text-red-600">{errors.calorieGoal}</p>
        )}
      </div>

      {/* Cultural Preference Section */}
      <div className="mb-6">
        <label htmlFor="culturalPreference" className="block text-sm font-medium text-gray-900 mb-2">
          Cultural Preference
        </label>
        <select
          id="culturalPreference"
          value={culturalPreference}
          onChange={(e) => setCulturalPreference(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">No preference</option>
          {CULTURAL_OPTIONS.map((culture) => (
            <option key={culture} value={culture}>
              {culture}
            </option>
          ))}
        </select>
      </div>

      {/* Diet Type Section */}
      <div className="mb-6">
        <label htmlFor="dietType" className="block text-sm font-medium text-gray-900 mb-2">
          Diet Type
        </label>
        <select
          id="dietType"
          value={dietType}
          onChange={(e) => setDietType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">No preference</option>
          {DIET_OPTIONS.map((diet) => (
            <option key={diet} value={diet}>
              {diet}
            </option>
          ))}
        </select>
      </div>

      {/* Notes Section */}
      <div className="mb-6">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-900 mb-2">
          Additional Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Tell us about your likes, dislikes, or any other preferences..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Generate Meal Plan
        </button>
      </div>
    </form>
  );
}
