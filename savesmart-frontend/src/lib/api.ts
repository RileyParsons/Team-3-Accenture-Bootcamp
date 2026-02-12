// API utility functions for SaveSmart

const API_BASE_URL = 'https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod';

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
    name: string,
    profileData?: {
        income?: number;
        incomeFrequency?: string;
        savings?: number;
        location?: string | null;
        postcode?: string | null;
        recurringExpenses?: any[];
    }
): Promise<SaveUserResponse | null> => {
    try {
        // Use email-based userId for consistent lookup
        const userId = email.replace('@', '-').replace(/\./g, '-');
        const hashedPassword = await hashPassword(password);

        console.log('Registering user:', { userId, email, name });

        const userData: any = {
            userId,
            email,
            name,
            hashedPassword
        };

        // Add profile data if provided (from onboarding)
        if (profileData) {
            userData.income = profileData.income || 0;
            userData.incomeFrequency = profileData.incomeFrequency || 'monthly';
            userData.savings = profileData.savings || 0;
            userData.location = profileData.location || null;
            userData.postcode = profileData.postcode || null;
            userData.recurringExpenses = profileData.recurringExpenses || [];
        }

        const result = await saveUser(userData);

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
