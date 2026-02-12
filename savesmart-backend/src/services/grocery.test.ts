/**
 * Unit Tests for Grocery Service
 *
 * Tests the GroceryService class with mock data fallback
 */

import { GroceryService, Product } from './grocery.js';

// Mock config
jest.mock('../config/env.js', () => ({
  getConfig: jest.fn(() => ({
    externalApis: {
      groceryApiKey: undefined, // No API key configured for tests
    },
  })),
}));

describe('GroceryService', () => {
  let groceryService: GroceryService;

  beforeEach(() => {
    jest.clearAllMocks();
    groceryService = new GroceryService();
  });

  describe('getProductPrice', () => {
    it('should return mock price for common products', async () => {
      const price = await groceryService.getProductPrice('spaghetti');
      expect(price).toBe(2.50);
    });

    it('should return mock price for eggs', async () => {
      const price = await groceryService.getProductPrice('eggs');
      expect(price).toBe(3.20);
    });

    it('should return mock price for bacon', async () => {
      const price = await groceryService.getProductPrice('bacon');
      expect(price).toBe(6.00);
    });

    it('should handle case-insensitive product names', async () => {
      const price1 = await groceryService.getProductPrice('SPAGHETTI');
      const price2 = await groceryService.getProductPrice('Spaghetti');
      const price3 = await groceryService.getProductPrice('spaghetti');

      expect(price1).toBe(2.50);
      expect(price2).toBe(2.50);
      expect(price3).toBe(2.50);
    });

    it('should handle partial matches', async () => {
      const price = await groceryService.getProductPrice('parmesan cheese');
      expect(price).toBeGreaterThan(0);
    });

    it('should return default price for unknown products', async () => {
      const price = await groceryService.getProductPrice('unknown-product-xyz');
      expect(price).toBe(5.00);
    });

    it('should handle empty product name', async () => {
      const price = await groceryService.getProductPrice('');
      expect(price).toBe(5.00);
    });
  });

  describe('searchProducts', () => {
    it('should return matching products for pasta query', async () => {
      const products = await groceryService.searchProducts('pasta');

      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);

      const hasMatchingProduct = products.some(p =>
        p.name.toLowerCase().includes('pasta') ||
        p.name.toLowerCase().includes('spaghetti')
      );
      expect(hasMatchingProduct).toBe(true);
    });

    it('should return matching products for egg query', async () => {
      const products = await groceryService.searchProducts('egg');

      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);

      const hasEggs = products.some(p => p.name.toLowerCase().includes('egg'));
      expect(hasEggs).toBe(true);
    });

    it('should return products with correct structure', async () => {
      const products = await groceryService.searchProducts('bacon');

      expect(products.length).toBeGreaterThan(0);

      const product = products[0];
      expect(product).toHaveProperty('productId');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('unit');
      expect(product).toHaveProperty('source');
      expect(product.source).toBe('mock');
    });

    it('should handle case-insensitive search', async () => {
      const products1 = await groceryService.searchProducts('CHICKEN');
      const products2 = await groceryService.searchProducts('chicken');

      expect(products1.length).toBe(products2.length);
    });

    it('should return empty array for no matches', async () => {
      const products = await groceryService.searchProducts('xyz-nonexistent-product-123');

      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBe(0);
    });

    it('should return limited results for empty query', async () => {
      const products = await groceryService.searchProducts('');

      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeLessThanOrEqual(10);
    });

    it('should return products with valid prices', async () => {
      const products = await groceryService.searchProducts('cheese');

      products.forEach(product => {
        expect(typeof product.price).toBe('number');
        expect(product.price).toBeGreaterThan(0);
      });
    });
  });

  describe('mock data consistency', () => {
    it('should return consistent prices for the same product', async () => {
      const price1 = await groceryService.getProductPrice('rice');
      const price2 = await groceryService.getProductPrice('rice');
      const price3 = await groceryService.getProductPrice('rice');

      expect(price1).toBe(price2);
      expect(price2).toBe(price3);
    });

    it('should return consistent search results', async () => {
      const products1 = await groceryService.searchProducts('tomato');
      const products2 = await groceryService.searchProducts('tomato');

      expect(products1.length).toBe(products2.length);
      expect(products1[0]?.name).toBe(products2[0]?.name);
    });
  });

  describe('API key not configured', () => {
    it('should log message when API key is not configured', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await groceryService.getProductPrice('test');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Grocery API key not configured, using mock data'
      );

      consoleSpy.mockRestore();
    });

    it('should use mock data when API key is not configured', async () => {
      const price = await groceryService.getProductPrice('spaghetti');

      // Should return mock price
      expect(price).toBe(2.50);
    });
  });
});
