// User profile types for onboarding v2

export interface UserProfileV2 {
  userId: string;
  email: string;
  name: string;
  living: {
    paysRent: boolean;
    rentAmount?: number; // weekly amount (midpoint)
    rentFrequency?: "weekly";
  };
  spending: {
    groceriesWeekly: number; // midpoint
    transportMode: "public" | "car" | "walk-bike" | "rideshare";
    transportWeekly: number; // midpoint (0 for walk-bike)
    entertainmentMonthly: number; // midpoint
  };
  savingsTargetMonthly: number; // midpoint
  preferences: {
    cuisines: string[];
    allergies: string[];
    religion: "none" | "halal" | "kosher" | "vegetarian" | "vegan";
    dietTags: string[];
  };
}
