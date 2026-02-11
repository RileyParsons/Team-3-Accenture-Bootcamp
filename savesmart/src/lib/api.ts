// API utility functions for SaveSmart

const API_BASE_URL = 'https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod';

export interface UserData {
    userId: string;
    email: string;
    name: string;
    income?: number;
    rent?: number;
    groceryBudget?: number;
    location?: string;
    dietaryPreferences?: string[];
    subscriptions?: string[];
}

export const saveUser = async (userData: UserData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/test_users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userData.userId,
                email: userData.email,
                name: userData.name,
                income: userData.income,
                rent: userData.rent,
                groceryBudget: userData.groceryBudget,
                location: userData.location,
                dietaryPreferences: userData.dietaryPreferences,
                subscriptions: userData.subscriptions
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to save user');
        }

        return data;
    } catch (error) {
        console.error('Error saving user:', error);
        throw error;
    }
};

// Generate a unique user ID
export const generateUserId = () => {
    return `u_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
