/**
 * Unit tests for LocalStorageManager
 * Tests Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { storageManager } from './storage';

describe('LocalStorageManager', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    describe('isAvailable()', () => {
        it('should return true when localStorage is available', () => {
            expect(storageManager.isAvailable()).toBe(true);
        });
    });

    describe('save() and load()', () => {
        it('should save and load simple data', () => {
            const testData = { name: 'John', age: 30 };
            storageManager.save('test-key', testData);

            const loaded = storageManager.load('test-key');
            expect(loaded).toEqual(testData);
        });

        it('should save and load complex nested objects', () => {
            const complexData = {
                income: {
                    sources: [
                        { id: '1', name: 'Salary', amount: 5000, frequency: 'monthly' },
                        { id: '2', name: 'Freelance', amount: 1000, frequency: 'monthly' }
                    ]
                },
                expenses: {
                    selectedCategories: ['housing', 'food', 'transportation'],
                    customCategories: ['pets', 'hobbies']
                },
                goals: [
                    { id: '1', description: 'Emergency fund', targetAmount: 10000 }
                ]
            };

            storageManager.save('profile', complexData);
            const loaded = storageManager.load('profile');
            expect(loaded).toEqual(complexData);
        });

        it('should save and load arrays', () => {
            const arrayData = [1, 2, 3, 4, 5];
            storageManager.save('array-test', arrayData);

            const loaded = storageManager.load('array-test');
            expect(loaded).toEqual(arrayData);
        });

        it('should save and load strings', () => {
            const stringData = 'Hello, World!';
            storageManager.save('string-test', stringData);

            const loaded = storageManager.load('string-test');
            expect(loaded).toBe(stringData);
        });

        it('should save and load numbers', () => {
            const numberData = 42;
            storageManager.save('number-test', numberData);

            const loaded = storageManager.load('number-test');
            expect(loaded).toBe(numberData);
        });

        it('should save and load booleans', () => {
            storageManager.save('bool-true', true);
            storageManager.save('bool-false', false);

            expect(storageManager.load('bool-true')).toBe(true);
            expect(storageManager.load('bool-false')).toBe(false);
        });

        it('should save and load null values', () => {
            storageManager.save('null-test', null);
            const loaded = storageManager.load('null-test');
            expect(loaded).toBeNull();
        });

        it('should return null for non-existent keys', () => {
            const loaded = storageManager.load('non-existent-key');
            expect(loaded).toBeNull();
        });

        it('should use key prefix to avoid conflicts', () => {
            // Save with our manager
            storageManager.save('test', { value: 'manager' });

            // Save directly to localStorage without prefix
            localStorage.setItem('test', JSON.stringify({ value: 'direct' }));

            // Our manager should load its own prefixed value
            const loaded = storageManager.load('test');
            expect(loaded).toEqual({ value: 'manager' });

            // Direct access should still have the unprefixed value
            const direct = JSON.parse(localStorage.getItem('test')!);
            expect(direct).toEqual({ value: 'direct' });
        });
    });

    describe('clear()', () => {
        it('should clear specific key', () => {
            storageManager.save('key1', { data: 'value1' });
            storageManager.save('key2', { data: 'value2' });

            storageManager.clear('key1');

            expect(storageManager.load('key1')).toBeNull();
            expect(storageManager.load('key2')).toEqual({ data: 'value2' });
        });

        it('should not throw error when clearing non-existent key', () => {
            expect(() => {
                storageManager.clear('non-existent');
            }).not.toThrow();
        });
    });

    describe('Error handling', () => {
        it('should handle invalid JSON gracefully', () => {
            // Manually set invalid JSON in localStorage
            localStorage.setItem('budgeting-profile-invalid', 'not valid json {');

            const loaded = storageManager.load('invalid');
            expect(loaded).toBeNull();
        });

        it('should handle circular references gracefully', () => {
            const circular: any = { name: 'test' };
            circular.self = circular;

            // Should not throw, but will log error
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            storageManager.save('circular', circular);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Storage unavailable scenarios', () => {
        it('should handle save gracefully when storage is unavailable', () => {
            // Mock localStorage to throw error
            const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')
                .mockImplementation(() => {
                    throw new Error('Storage unavailable');
                });

            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            // Should not throw
            expect(() => {
                storageManager.save('test', { data: 'value' });
            }).not.toThrow();

            setItemSpy.mockRestore();
            consoleWarnSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });

        it('should return null when loading from unavailable storage', () => {
            const getItemSpy = jest.spyOn(Storage.prototype, 'getItem')
                .mockImplementation(() => {
                    throw new Error('Storage unavailable');
                });

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = storageManager.load('test');
            expect(result).toBeNull();

            getItemSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });
    });

    describe('Storage quota exceeded', () => {
        it('should handle quota exceeded error', () => {
            let callCount = 0;
            const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')
                .mockImplementation(() => {
                    callCount++;
                    const error: any = new Error('QuotaExceededError');
                    error.name = 'QuotaExceededError';
                    throw error;
                });

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            storageManager.save('test', { data: 'value' });

            // Should attempt to save, clear old data, then retry
            expect(callCount).toBeGreaterThan(1);
            expect(consoleErrorSpy).toHaveBeenCalled();

            setItemSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });
    });

    describe('Integration scenarios', () => {
        it('should handle complete form data lifecycle', () => {
            // Simulate saving form data
            const formData = {
                currentSection: 2,
                income: {
                    sources: [
                        { id: '1', name: 'Salary', amount: 5000, frequency: 'monthly' }
                    ]
                },
                expenses: {
                    selectedCategories: ['housing', 'food'],
                    customCategories: []
                }
            };

            // Save
            storageManager.save('form-state', formData);

            // Load
            const loaded = storageManager.load('form-state');
            expect(loaded).toEqual(formData);

            // Update
            const updatedData = {
                ...loaded,
                currentSection: 3,
                expenses: {
                    ...loaded.expenses,
                    selectedCategories: ['housing', 'food', 'transportation']
                }
            };
            storageManager.save('form-state', updatedData);

            // Verify update
            const reloaded = storageManager.load('form-state');
            expect(reloaded.currentSection).toBe(3);
            expect(reloaded.expenses.selectedCategories).toHaveLength(3);

            // Clear after submission
            storageManager.clear('form-state');
            expect(storageManager.load('form-state')).toBeNull();
        });
    });
});
