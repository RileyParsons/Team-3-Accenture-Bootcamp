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
    cachedAt: string;
}

export interface Ingredient {
    name: string;
    quantity: number;
    unit: string;
    price: number;
    source: 'coles' | 'woolworths' | 'mock';
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
