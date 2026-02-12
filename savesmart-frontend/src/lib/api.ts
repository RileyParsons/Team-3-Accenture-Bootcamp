// API utility functions for SaveSmart

// Use local backend instead of AWS Lambda
const API_BASE_URL = 'http://localhost:3001/api';

// Simple password hashing using Web Crypto API (for demo purposes)
// In production, this should be done on the backend
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export interface RecurringExpense {
    name: string;
    amount: number;
    isFixed: boolean;
    frequency: 'weekly' | 'fortnightly' | 'monthly' | 'yearly';
}

export interface UserData {
    userId: string;
    email: string;
    name: string;
    hashedPassword?: string;
    income?: number;
    incomeFrequency?: 'weekly' | 'monthly' | 'yearly';
    savings?: number;
    location?: string;
    postcode?: string | null;
    recurringExpenses?: RecurringExpense[];
    createdAt?: string;
    // Legacy fields for backward compatibility
    rent?: number;
    groceryBudget?: number;
    dietaryPreferences?: string[];
    subscriptions?: string[];
}

// Optional: define response shape
export interface SaveUserResponse {
    message?: string;
    userId?: string;
    user?: UserData;
}

export const saveUser = async (
    userData: UserData
): Promise<SaveUserResponse | null> => {
    const response = await fetch(`${API_BASE_URL}/test_users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId: userData.userId,
            email: userData.email,
            name: userData.name,
            hashedPassword: userData.hashedPassword, // Include hashed password
            income: userData.income || 0,
            incomeFrequency: userData.incomeFrequency || 'monthly',
            savings: userData.savings || 0,
            location: userData.location || '',
            postcode: userData.postcode || null,
            recurringExpenses: userData.recurringExpenses || [],
            createdAt: userData.createdAt || new Date().toISOString(),
            // Legacy fields for backward compatibility
            rent: userData.rent || 0,
            groceryBudget: userData.groceryBudget || 0,
            dietaryPreferences: userData.dietaryPreferences || [],
            subscriptions: userData.subscriptions || []
        }),
    });

    let data: any = null;

    // Safely parse JSON if present
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
        data = await response.json();
    }

    if (!response.ok) {
        throw new Error(
            data?.error || data?.message || 'Failed to save user'
        );
    }

    // Handle Lambda proxy response format
    if (data && data.body && typeof data.body === 'string') {
        try {
            data = JSON.parse(data.body);
        } catch (e) {
            console.error('Failed to parse response body:', e);
        }
    }

    return data;
};

// Register user with password (hashes password before sending)
export const registerUser = async (
    email: string,
    password: string,
    name: string
): Promise<SaveUserResponse | null> => {
    try {
        const userId = generateUserId();
        const hashedPassword = await hashPassword(password);

        console.log('Registering user:', { userId, email, name });

        const result = await saveUser({
            userId,
            email,
            name,
            hashedPassword
        });

        console.log('Registration result:', result);

        // Ensure userId is in the response
        if (result && !result.userId) {
            result.userId = userId;
        }

        return result;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
};

// Login user (verifies password by fetching user and comparing hash)
export const loginUser = async (
    email: string,
    password: string
): Promise<UserData | null> => {
    try {
        // First, we need to get userId from email
        // Since we don't have an email lookup endpoint, we'll use localStorage
        const storedUser = localStorage.getItem('savesmart_user');
        if (!storedUser) {
            throw new Error('No account found');
        }

        const localUserData = JSON.parse(storedUser);
        if (localUserData.email !== email) {
            throw new Error('Invalid credentials');
        }

        // Get user from backend
        const userData = await getUser(localUserData.userId);

        if (!userData) {
            throw new Error('User not found');
        }

        // Verify password
        const hashedPassword = await hashPassword(password);
        if (userData.hashedPassword !== hashedPassword) {
            throw new Error('Invalid credentials');
        }

        return userData;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

// Get user by ID
export const getUser = async (userId: string): Promise<UserData | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/test_users/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        let data: any = null;

        // Safely parse JSON if present
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            data = await response.json();
        }

        if (!response.ok) {
            throw new Error(
                data?.error || data?.message || 'Failed to get user'
            );
        }

        // Handle Lambda proxy response format
        if (data && data.body && typeof data.body === 'string') {
            try {
                data = JSON.parse(data.body);
            } catch (e) {
                console.error('Failed to parse response body:', e);
            }
        }

        return data;
    } catch (error) {
        console.error('Error getting user:', error);
        throw error;
    }
};

// Generate a unique user ID
export const generateUserId = (): string => {
    return `u_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 11)}`;
};

// Chat API interfaces
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
}

export interface ChatRequest {
    userId: string;
    message: string;
    conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
    reply: string;
    savings?: number;
    plan?: any;
    conversationId?: string;
}

// Send chat message to AI agent
export const sendChatMessage = async (
    userId: string,
    message: string,
    conversationHistory?: ChatMessage[]
): Promise<ChatResponse | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                message,
                conversationHistory: conversationHistory || []
            }),
        });

        let data: any = null;

        // Safely parse JSON if present
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            data = await response.json();
        }

        if (!response.ok) {
            throw new Error(
                data?.error || data?.message || 'Failed to send message'
            );
        }

        // Handle Lambda proxy response format
        if (data && data.body && typeof data.body === 'string') {
            try {
                data = JSON.parse(data.body);
            } catch (e) {
                console.error('Failed to parse response body:', e);
            }
        }

        return data;
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};

// New backend API functions for local Express server

export interface Ingredient {
    name: string;
    quantity: number;
    unit: string;
    price: number;
    source: 'coles' | 'woolworths' | 'mock';
    colesPrice?: number;
    woolworthsPrice?: number;
}

export interface StorePricing {
    coles: number;
    woolworths: number;
    cheapest: 'coles' | 'woolworths';
    savings: number;
}

export interface Recipe {
    recipeId: string;
    name: string;
    description: string;
    imageUrl: string;
    prepTime: number;
    servings: number;
    dietaryTags: string[];
    ingredients: Ingredient[];
    instructions: string[];
    totalCost: number;
    storePricing?: StorePricing;
    cachedAt: string;
}

export interface Event {
    eventId: string;
    name: string;
    description: string;
    date: string;
    location: {
        venue: string;
        suburb: string;
        postcode: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    discount: {
        description: string;
        amount?: number;
        percentage?: number;
    };
    externalUrl: string;
    source: 'eventbrite' | 'mock';
    cachedAt: string;
}

// Get recipes with optional dietary filtering
export const getRecipes = async (dietaryTags?: string[]): Promise<Recipe[]> => {
    try {
        const params = new URLSearchParams();
        if (dietaryTags && dietaryTags.length > 0) {
            params.append('dietaryTags', dietaryTags.join(','));
        }

        const url = `${API_BASE_URL}/recipes${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch recipes');
        }

        const data = await response.json();
        return data.recipes || [];
    } catch (error) {
        console.error('Error fetching recipes:', error);
        throw error;
    }
};

// Get single recipe by ID
export const getRecipe = async (recipeId: string): Promise<Recipe> => {
    try {
        const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch recipe');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching recipe:', error);
        throw error;
    }
};

// Get events with optional location filtering
export const getEvents = async (suburb?: string, postcode?: string): Promise<Event[]> => {
    try {
        const params = new URLSearchParams();
        if (suburb) params.append('suburb', suburb);
        if (postcode) params.append('postcode', postcode);

        const url = `${API_BASE_URL}/events${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch events');
        }

        const data = await response.json();
        return data.events || [];
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
};

// Update user profile
export const updateProfile = async (userId: string, updates: Partial<UserData>): Promise<UserData> => {
    try {
        const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update profile');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};

// Get user profile
export const getProfile = async (userId: string): Promise<UserData> => {
    try {
        const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }
};

// Send chat message with context
export interface ChatContextData {
    pageType?: 'dashboard' | 'recipe' | 'event' | 'fuel' | 'profile';
    dataId?: string;
    dataName?: string;
}

export const sendContextualChatMessage = async (
    userId: string,
    message: string,
    context?: ChatContextData
): Promise<{ response: string; timestamp: string }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                message,
                context,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send message');
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};


// Transaction tracking interfaces
export type TransactionType = 'income' | 'expense' | 'savings';
export type TransactionCategory =
  | 'salary' | 'allowance' | 'other-income'
  | 'rent' | 'groceries' | 'fuel' | 'entertainment' | 'utilities' | 'other-expense'
  | 'savings-deposit' | 'savings-withdrawal';

export interface Transaction {
  transactionId: string;
  userId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description?: string;
  date: string;
  createdAt: string;
}

export interface TransactionSummary {
  summary: {
    date: string;
    income: number;
    expenses: number;
    savings: number;
  }[];
  totals: {
    income: number;
    expenses: number;
    savings: number;
  };
}

// Create a new transaction
export const createTransaction = async (
  userId: string,
  type: TransactionType,
  category: TransactionCategory,
  amount: number,
  description?: string,
  date?: string
): Promise<Transaction> => {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        type,
        category,
        amount,
        description,
        date: date || new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create transaction');
    }

    const data = await response.json();
    return data.transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

// Get user transactions
export const getTransactions = async (
  userId: string,
  startDate?: string,
  endDate?: string,
  type?: TransactionType
): Promise<Transaction[]> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (type) params.append('type', type);

    const url = `${API_BASE_URL}/transactions/${userId}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    const data = await response.json();
    return data.transactions || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

// Get transaction summary
export const getTransactionSummary = async (
  userId: string,
  startDate?: string,
  endDate?: string,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<TransactionSummary> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('groupBy', groupBy);

    const url = `${API_BASE_URL}/transactions/${userId}/summary?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transaction summary');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching transaction summary:', error);
    throw error;
  }
};

// Delete a transaction
export const deleteTransaction = async (transactionId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete transaction');
    }
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

// AI-Powered Meal Plan interfaces
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlanPreferences {
  allergies: string[];
  calorieGoal: number;
  culturalPreference: string;
  dietType: string;
  notes: string;
}

export interface Meal {
  mealType: MealType;
  name: string;
  description: string;
  recipeId: string | null;
  estimatedCalories: number;
  estimatedCost: number;
}

export interface MealPlanDay {
  day: string;
  meals: Meal[];
}

export interface NutritionSummary {
  averageDailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  recipeIds: string[];
}

export interface ShoppingListStore {
  storeName: string;
  items: ShoppingListItem[];
  subtotal: number;
}

export interface ShoppingList {
  stores: ShoppingListStore[];
  totalCost: number;
}

export interface MealPlan {
  preferences: MealPlanPreferences;
  days: MealPlanDay[];
  totalWeeklyCost: number;
  nutritionSummary: NutritionSummary;
  shoppingList: ShoppingList;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Generate AI-powered meal plan from preferences
export const generateMealPlan = async (
  userId: string,
  preferences: MealPlanPreferences
): Promise<MealPlan> => {
  try {
    const response = await fetch(`${API_BASE_URL}/meal-plan/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        preferences,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate meal plan');
    }

    const data = await response.json();
    return data.mealPlan;
  } catch (error) {
    console.error('Error generating meal plan:', error);
    throw error;
  }
};

// Get user's current meal plan
export const getMealPlan = async (userId: string): Promise<MealPlan | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/meal-plan/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch meal plan');
    }

    const data = await response.json();
    return data.mealPlan;
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    throw error;
  }
};

// Update user's meal plan
export const updateMealPlan = async (
  userId: string,
  mealPlan: MealPlan
): Promise<MealPlan> => {
  try {
    const response = await fetch(`${API_BASE_URL}/meal-plan/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mealPlan }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update meal plan');
    }

    const data = await response.json();
    return data.mealPlan;
  } catch (error) {
    console.error('Error updating meal plan:', error);
    throw error;
  }
};

// Add a meal to a specific slot in the meal plan
export const addMealToSlot = async (
  userId: string,
  day: string,
  mealType: MealType,
  recipeId: string
): Promise<MealPlan> => {
  try {
    const response = await fetch(`${API_BASE_URL}/meal-plan/${userId}/meal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        day,
        mealType,
        recipeId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add meal to plan');
    }

    const data = await response.json();
    return data.mealPlan;
  } catch (error) {
    console.error('Error adding meal to plan:', error);
    throw error;
  }
};

// Remove a meal from a specific slot in the meal plan
export const removeMealFromSlot = async (
  userId: string,
  day: string,
  mealType: MealType
): Promise<MealPlan> => {
  try {
    const response = await fetch(`${API_BASE_URL}/meal-plan/${userId}/meal`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        day,
        mealType,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove meal from plan');
    }

    const data = await response.json();
    return data.mealPlan;
  } catch (error) {
    console.error('Error removing meal from plan:', error);
    throw error;
  }
};
