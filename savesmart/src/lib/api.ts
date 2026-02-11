// API utility functions for SaveSmart

const API_BASE_URL =
    'https://lmj3rtgsbe.execute-api.ap-southeast-2.amazonaws.com/prod';

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

// Optional: define response shape
export interface SaveUserResponse {
    message?: string;
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
            body: JSON.stringify({
                userId: userData.userId,
                email: userData.email,
                name: userData.name,
                income: userData.income || 0,
                rent: userData.rent || 0,
                groceryBudget: userData.groceryBudget || 0,
                savings: 0,
                hasCar: false,
                location: userData.location || '',
                dietaryPreferences: userData.dietaryPreferences || [],
                subscriptions: userData.subscriptions || []
            })
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

    return data;
};

// Generate a unique user ID
export const generateUserId = (): string => {
    return `u_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 11)}`;
};
