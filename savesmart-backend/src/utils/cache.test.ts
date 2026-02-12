import { CacheService, TTL } from './cache';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService();
  });

  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      cache.set('test-key', 'test-value', 1000);
      const result = cache.get('test-key');
      expect(result).toBe('test-value');
    });

    it('should store and retrieve objects', () => {
      const testObject = { id: 1, name: 'Test' };
      cache.set('object-key', testObject, 1000);
      const result = cache.get('object-key');
      expect(result).toEqual(testObject);
    });

    it('should store and retrieve arrays', () => {
      const testArray = [1, 2, 3, 4, 5];
      cache.set('array-key', testArray, 1000);
      const result = cache.get('array-key');
      expect(result).toEqual(testArray);
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should overwrite existing values', () => {
      cache.set('key', 'value1', 1000);
      cache.set('key', 'value2', 1000);
      const result = cache.get('key');
      expect(result).toBe('value2');
    });
  });

  describe('TTL expiration', () => {
    it('should return null for expired entries', async () => {
      cache.set('short-lived', 'value', 50); // 50ms TTL

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = cache.get('short-lived');
      expect(result).toBeNull();
    });

    it('should return value before expiration', async () => {
      cache.set('key', 'value', 200); // 200ms TTL

      // Check immediately
      expect(cache.get('key')).toBe('value');

      // Check after 50ms (still valid)
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(cache.get('key')).toBe('value');
    });

    it('should remove expired entries from cache', async () => {
      cache.set('key', 'value', 50);

      // Initial size
      expect(cache.size()).toBe(1);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      // Access expired entry (triggers deletion)
      cache.get('key');

      // Size should be 0 after deletion
      expect(cache.size()).toBe(0);
    });
  });

  describe('invalidate', () => {
    it('should remove a cache entry', () => {
      cache.set('key', 'value', 1000);
      expect(cache.get('key')).toBe('value');

      cache.invalidate('key');
      expect(cache.get('key')).toBeNull();
    });

    it('should not throw error when invalidating non-existent key', () => {
      expect(() => cache.invalidate('non-existent')).not.toThrow();
    });

    it('should only remove the specified key', () => {
      cache.set('key1', 'value1', 1000);
      cache.set('key2', 'value2', 1000);

      cache.invalidate('key1');

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('clear', () => {
    it('should remove all cache entries', () => {
      cache.set('key1', 'value1', 1000);
      cache.set('key2', 'value2', 1000);
      cache.set('key3', 'value3', 1000);

      expect(cache.size()).toBe(3);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });

    it('should work on empty cache', () => {
      expect(() => cache.clear()).not.toThrow();
      expect(cache.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return 0 for empty cache', () => {
      expect(cache.size()).toBe(0);
    });

    it('should return correct count of entries', () => {
      cache.set('key1', 'value1', 1000);
      expect(cache.size()).toBe(1);

      cache.set('key2', 'value2', 1000);
      expect(cache.size()).toBe(2);

      cache.set('key3', 'value3', 1000);
      expect(cache.size()).toBe(3);
    });

    it('should include expired entries until accessed', async () => {
      cache.set('key', 'value', 50);
      expect(cache.size()).toBe(1);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      // Size still 1 (expired but not removed yet)
      expect(cache.size()).toBe(1);

      // Access triggers removal
      cache.get('key');
      expect(cache.size()).toBe(0);
    });
  });

  describe('TTL constants', () => {
    it('should have correct TTL for events (1 hour)', () => {
      expect(TTL.EVENTS).toBe(60 * 60 * 1000);
    });

    it('should have correct TTL for fuel (30 minutes)', () => {
      expect(TTL.FUEL).toBe(30 * 60 * 1000);
    });

    it('should have correct TTL for recipes (24 hours)', () => {
      expect(TTL.RECIPES).toBe(24 * 60 * 60 * 1000);
    });

    it('should have correct TTL for grocery (24 hours)', () => {
      expect(TTL.GROCERY).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe('real-world scenarios', () => {
    it('should cache events with 1 hour TTL', () => {
      const events = [
        { id: '1', name: 'Event 1' },
        { id: '2', name: 'Event 2' },
      ];

      cache.set('events:sydney:2000', events, TTL.EVENTS);
      const result = cache.get('events:sydney:2000');

      expect(result).toEqual(events);
    });

    it('should cache fuel prices with 30 minute TTL', () => {
      const fuelStations = [
        { id: '1', name: 'Station 1', price: 150 },
        { id: '2', name: 'Station 2', price: 148 },
      ];

      cache.set('fuel:sydney:2000', fuelStations, TTL.FUEL);
      const result = cache.get('fuel:sydney:2000');

      expect(result).toEqual(fuelStations);
    });

    it('should cache recipes with 24 hour TTL', () => {
      const recipes = [
        { id: '1', name: 'Recipe 1', totalCost: 15.50 },
        { id: '2', name: 'Recipe 2', totalCost: 12.00 },
      ];

      cache.set('recipes:all', recipes, TTL.RECIPES);
      const result = cache.get('recipes:all');

      expect(result).toEqual(recipes);
    });

    it('should cache grocery prices with 24 hour TTL', () => {
      const price = 3.50;

      cache.set('grocery:milk', price, TTL.GROCERY);
      const result = cache.get('grocery:milk');

      expect(result).toBe(price);
    });

    it('should handle multiple cache keys independently', () => {
      cache.set('events:sydney', ['event1'], TTL.EVENTS);
      cache.set('fuel:sydney', ['station1'], TTL.FUEL);
      cache.set('recipes:all', ['recipe1'], TTL.RECIPES);

      expect(cache.get('events:sydney')).toEqual(['event1']);
      expect(cache.get('fuel:sydney')).toEqual(['station1']);
      expect(cache.get('recipes:all')).toEqual(['recipe1']);

      cache.invalidate('fuel:sydney');

      expect(cache.get('events:sydney')).toEqual(['event1']);
      expect(cache.get('fuel:sydney')).toBeNull();
      expect(cache.get('recipes:all')).toEqual(['recipe1']);
    });
  });

  describe('edge cases', () => {
    it('should handle zero TTL (immediate expiration)', async () => {
      cache.set('key', 'value', 0);
      // Wait 1ms to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 1));
      const result = cache.get('key');
      expect(result).toBeNull();
    });

    it('should handle negative TTL (immediate expiration)', () => {
      cache.set('key', 'value', -1000);
      const result = cache.get('key');
      expect(result).toBeNull();
    });

    it('should handle very large TTL values', () => {
      const largeValue = 365 * 24 * 60 * 60 * 1000; // 1 year
      cache.set('key', 'value', largeValue);
      expect(cache.get('key')).toBe('value');
    });

    it('should handle null values', () => {
      cache.set('key', null, 1000);
      expect(cache.get('key')).toBeNull();
    });

    it('should handle undefined values', () => {
      cache.set('key', undefined, 1000);
      expect(cache.get('key')).toBeUndefined();
    });

    it('should handle empty string keys', () => {
      cache.set('', 'value', 1000);
      expect(cache.get('')).toBe('value');
    });

    it('should handle special characters in keys', () => {
      const specialKey = 'key:with:colons/and/slashes?and=query&params';
      cache.set(specialKey, 'value', 1000);
      expect(cache.get(specialKey)).toBe('value');
    });
  });
});
