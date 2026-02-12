/**
 * Cache Service with TTL (Time-To-Live) support
 *
 * Provides in-memory caching with automatic expiration for different data types:
 * - Events: 1 hour TTL
 * - Fuel prices: 30 minutes TTL
 * - Recipes/Grocery prices: 24 hours TTL
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry<any>>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Store a value in the cache with a TTL (in milliseconds)
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time-to-live in milliseconds
   */
  set<T>(key: string, value: T, ttl: number): void {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Retrieve a value from the cache
   * Returns null if the key doesn't exist or has expired
   * @param key - Cache key
   * @returns Cached value or null
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Invalidate (remove) a cache entry
   * @param key - Cache key to invalidate
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the number of entries in the cache (including expired ones)
   */
  size(): number {
    return this.cache.size;
  }
}

// TTL constants for different data types (in milliseconds)
export const TTL = {
  EVENTS: 60 * 60 * 1000,      // 1 hour
  FUEL: 30 * 60 * 1000,        // 30 minutes
  RECIPES: 24 * 60 * 60 * 1000, // 24 hours
  GROCERY: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Singleton instance
export const cacheService = new CacheService();
