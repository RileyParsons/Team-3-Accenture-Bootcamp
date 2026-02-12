/**
 * User data model for SaveSmart application
 * Represents a user with profile information and savings goals
 */

import type { MealPlanPreferences, MealPlan } from './MealPlan.js';

export interface UserLocation {
  suburb: string;
  postcode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface User {
  userId: string;              // Partition key
  email: string;
  name: string;
  location: UserLocation;
  savingsGoal: number;
  createdAt: string;           // ISO 8601 timestamp
  updatedAt: string;
  mealPlan?: {                 // Optional meal plan data
    preferences: MealPlanPreferences;
    plan: MealPlan;
    createdAt: string;
    updatedAt: string;
  };
}
