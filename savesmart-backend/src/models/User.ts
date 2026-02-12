/**
 * User data model for SaveSmart application
 * Represents a user with profile information and savings goals
 */

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
}
