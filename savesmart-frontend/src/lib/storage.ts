// Local storage helpers for SaveSmart

import { UserProfileV2 } from "@/types/profile";

const USER_KEY = "savesmart_user";
const PROFILE_KEY = "savesmart_profile_v2";

interface StoredUser {
  userId: string;
  email: string;
  name?: string;
  firstName?: string;
  token?: string;
}

// User authentication helpers
export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function getUserId(): string | null {
  const user = getStoredUser();
  return user?.userId || null;
}

// Profile helpers
export function saveStoredProfile(profile: UserProfileV2): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getStoredProfile(): UserProfileV2 | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? JSON.parse(data) : null;
}

export function clearStoredProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_KEY);
}
