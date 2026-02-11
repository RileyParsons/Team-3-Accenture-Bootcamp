/**
 * LocalStorageManager - Handles persistence of form data to browser local storage
 * 
 * Features:
 * - JSON serialization/deserialization
 * - Storage quota exceeded error handling
 * - Graceful fallback when storage unavailable
 * - Key prefix to avoid conflicts: 'budgeting-profile-'
 */

const KEY_PREFIX = 'budgeting-profile-';

export interface StorageManager {
    save(key: string, data: any): void;
    load(key: string): any | null;
    clear(key: string): void;
    isAvailable(): boolean;
}

class LocalStorageManager implements StorageManager {
    private available: boolean;

    constructor() {
        this.available = this.checkAvailability();
    }

    /**
     * Check if localStorage is available and functional
     */
    private checkAvailability(): boolean {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Check if localStorage is available
     */
    isAvailable(): boolean {
        return this.available;
    }

    /**
     * Get the full key with prefix
     */
    private getFullKey(key: string): string {
        return `${KEY_PREFIX}${key}`;
    }

    /**
     * Save data to localStorage with JSON serialization
     * Handles storage quota exceeded errors gracefully
     */
    save(key: string, data: any): void {
        if (!this.available) {
            console.warn('LocalStorage is not available. Data will not be persisted.');
            return;
        }

        try {
            const serialized = JSON.stringify(data);
            const fullKey = this.getFullKey(key);
            localStorage.setItem(fullKey, serialized);
        } catch (e) {
            if (e instanceof Error && e.name === 'QuotaExceededError') {
                console.error('Storage quota exceeded. Unable to save data.');
                // Attempt to clear old data to make space
                this.clearOldData();
                // Try one more time after clearing
                try {
                    const serialized = JSON.stringify(data);
                    const fullKey = this.getFullKey(key);
                    localStorage.setItem(fullKey, serialized);
                } catch (retryError) {
                    console.error('Still unable to save data after clearing old data.');
                }
            } else {
                console.error('Error saving to localStorage:', e);
            }
        }
    }

    /**
     * Load data from localStorage with JSON deserialization
     * Returns null if key doesn't exist or data is invalid
     */
    load(key: string): any | null {
        if (!this.available) {
            return null;
        }

        try {
            const fullKey = this.getFullKey(key);
            const serialized = localStorage.getItem(fullKey);

            if (serialized === null) {
                return null;
            }

            return JSON.parse(serialized);
        } catch (e) {
            console.error('Error loading from localStorage:', e);
            return null;
        }
    }

    /**
     * Clear specific key from localStorage
     */
    clear(key: string): void {
        if (!this.available) {
            return;
        }

        try {
            const fullKey = this.getFullKey(key);
            localStorage.removeItem(fullKey);
        } catch (e) {
            console.error('Error clearing localStorage:', e);
        }
    }

    /**
     * Clear old data with our prefix to free up space
     * This is called when quota is exceeded
     */
    private clearOldData(): void {
        try {
            const keysToRemove: string[] = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(KEY_PREFIX)) {
                    keysToRemove.push(key);
                }
            }

            // Remove all keys with our prefix
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
        } catch (e) {
            console.error('Error clearing old data:', e);
        }
    }
}

// Export singleton instance
export const storageManager = new LocalStorageManager();
