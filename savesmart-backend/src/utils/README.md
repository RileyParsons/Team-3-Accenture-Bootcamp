# Utils Module

## Cache Service

The `CacheService` provides in-memory caching with automatic TTL (Time-To-Live) expiration support.

### Features

- **TTL Support**: Automatic expiration of cached entries
- **Type-Safe**: Generic methods for type safety
- **Simple API**: Easy-to-use set, get, invalidate methods
- **Predefined TTLs**: Constants for different data types (events, fuel, recipes, grocery)

### Usage

```typescript
import { cacheService, TTL } from './utils/cache';

// Cache events data (1 hour TTL)
const events = await fetchEventsFromAPI();
cacheService.set('events:sydney:2000', events, TTL.EVENTS);

// Retrieve cached events
const cachedEvents = cacheService.get('events:sydney:2000');
if (cachedEvents) {
  return cachedEvents; // Use cached data
}

// Cache fuel prices (30 minutes TTL)
const fuelPrices = await fetchFuelPrices();
cacheService.set('fuel:sydney:2000', fuelPrices, TTL.FUEL);

// Cache recipes (24 hours TTL)
const recipes = await fetchRecipes();
cacheService.set('recipes:all', recipes, TTL.RECIPES);

// Cache grocery prices (24 hours TTL)
const price = await fetchGroceryPrice('milk');
cacheService.set('grocery:milk', price, TTL.GROCERY);

// Invalidate specific cache entry
cacheService.invalidate('events:sydney:2000');

// Clear all cache
cacheService.clear();
```

### TTL Constants

- `TTL.EVENTS`: 1 hour (3,600,000 ms)
- `TTL.FUEL`: 30 minutes (1,800,000 ms)
- `TTL.RECIPES`: 24 hours (86,400,000 ms)
- `TTL.GROCERY`: 24 hours (86,400,000 ms)

### API Reference

#### `set<T>(key: string, value: T, ttl: number): void`
Store a value in the cache with a TTL in milliseconds.

#### `get<T>(key: string): T | null`
Retrieve a value from the cache. Returns `null` if the key doesn't exist or has expired.

#### `invalidate(key: string): void`
Remove a specific cache entry.

#### `clear(): void`
Remove all cache entries.

#### `size(): number`
Get the number of entries in the cache (including expired ones).

### Cache Key Patterns

For consistency, use these key patterns:

- Events: `events:{suburb}:{postcode}`
- Fuel: `fuel:{suburb}:{postcode}`
- Recipes: `recipes:all` or `recipes:{dietaryTag}`
- Grocery: `grocery:{productName}`

### Testing

The cache service includes comprehensive unit tests covering:
- Basic set/get operations
- TTL expiration behavior
- Invalidation and clearing
- Edge cases (zero TTL, negative TTL, special characters)
- Real-world scenarios for all data types

Run tests with:
```bash
npm test -- cache.test.ts
```
