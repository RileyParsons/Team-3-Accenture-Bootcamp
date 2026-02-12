/**
 * Grocery API Service
 *
 * Integrates with Coles/Woolworths API for product pricing.
 * Falls back to mock data when API is unavailable or API key is not configured.
 *
 * Requirements: 10.6, 10.7, 14.5
 */

import { getConfig } from '../config/env';

export interface Product {
  productId: string;
  name: string;
  price: number;
  unit: string;
  brand?: string;
  imageUrl?: string;
  source: 'coles' | 'woolworths' | 'mock';
}

export class GroceryService {
  private apiKey: string | undefined;
  private baseUrl = 'https://api.grocery.example.com/v1'; // Placeholder URL

  constructor() {
    const config = getConfig();
    this.apiKey = config.externalApis.groceryApiKey;
  }

  /**
   * Get the price of a specific product by name
   * Falls back to mock data if API key is not configured or API call fails
   *
   * @param productName - Name of the product to search for
   * @returns Price of the product
   */
  async getProductPrice(productName: string): Promise<number> {
    // If no API key configured, use mock data
    if (!this.apiKey) {
      console.log('Grocery API key not configured, using mock data');
      return this.getMockPrice(productName);
    }

    try {
      // Attempt to fetch from Grocery API
      const products = await this.fetchFromGroceryAPI(productName);
      if (products.length > 0) {
        return products[0].price;
      }
      // If no products found, fall back to mock
      console.log(`No products found for "${productName}", using mock price`);
      return this.getMockPrice(productName);
    } catch (error) {
      // Log the error and fall back to mock data
      console.error('Grocery API call failed:', error instanceof Error ? error.message : 'Unknown error');
      console.log('Falling back to mock pricing data');
      return this.getMockPrice(productName);
    }
  }

  /**
   * Search for products by query string
   * Falls back to mock data if API key is not configured or API call fails
   *
   * @param query - Search query string
   * @returns Array of matching products
   */
  async searchProducts(query: string): Promise<Product[]> {
    // If no API key configured, use mock data
    if (!this.apiKey) {
      console.log('Grocery API key not configured, using mock data');
      return this.getMockProducts(query);
    }

    try {
      // Attempt to fetch from Grocery API
      const products = await this.fetchFromGroceryAPI(query);
      return products;
    } catch (error) {
      // Log the error and fall back to mock data
      console.error('Grocery API call failed:', error instanceof Error ? error.message : 'Unknown error');
      console.log('Falling back to mock product data');
      return this.getMockProducts(query);
    }
  }

  /**
   * Fetch products from Grocery API
   * @private
   */
  private async fetchFromGroceryAPI(query: string): Promise<Product[]> {
    const url = `${this.baseUrl}/products/search?q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Grocery API returned status ${response.status}`);
    }

    const data = await response.json();
    return this.transformGroceryResponse(data);
  }

  /**
   * Transform Grocery API response to our Product model
   * @private
   */
  private transformGroceryResponse(data: any): Product[] {
    if (!data.products || !Array.isArray(data.products)) {
      return [];
    }

    return data.products.map((product: any) => ({
      productId: product.id || `product-${Date.now()}`,
      name: product.name || 'Unknown Product',
      price: parseFloat(product.price) || 0,
      unit: product.unit || 'each',
      brand: product.brand,
      imageUrl: product.image_url,
      source: product.source === 'woolworths' ? 'woolworths' : 'coles',
    }));
  }

  /**
   * Get mock price for a product
   * @private
   */
  private getMockPrice(productName: string): number {
    // Generate consistent mock prices based on product name
    const mockPrices: Record<string, number> = {
      // Common ingredients
      'spaghetti': 2.50,
      'pasta': 2.50,
      'bacon': 6.00,
      'eggs': 3.20,
      'parmesan cheese': 4.50,
      'cheese': 4.50,
      'black pepper': 0.50,
      'pepper': 0.50,
      'broccoli': 3.00,
      'carrots': 1.50,
      'bell peppers': 4.00,
      'soy sauce': 1.00,
      'garlic': 0.30,
      'ginger': 0.80,
      'rice': 2.00,
      'chicken breast': 8.00,
      'chicken': 8.00,
      'romaine lettuce': 3.50,
      'lettuce': 3.50,
      'caesar dressing': 3.50,
      'cherry tomatoes': 2.00,
      'tomatoes': 2.00,
      'red lentils': 2.50,
      'lentils': 2.50,
      'onion': 0.80,
      'celery': 1.50,
      'vegetable stock': 2.00,
      'cumin': 0.50,
      'turmeric': 0.40,
      'ground beef': 10.00,
      'beef': 10.00,
      'taco shells': 4.00,
      'sour cream': 2.50,
      'taco seasoning': 1.50,
      'milk': 3.50,
      'bread': 3.00,
      'butter': 4.00,
      'flour': 2.50,
      'sugar': 2.00,
      'salt': 1.00,
      'olive oil': 8.00,
      'oil': 5.00,
    };

    // Normalize product name for lookup
    const normalizedName = productName.toLowerCase().trim();

    // Return default price for empty string
    if (!normalizedName) {
      return 5.00;
    }

    // Check for exact match
    if (mockPrices[normalizedName]) {
      return mockPrices[normalizedName];
    }

    // Check for partial match
    for (const [key, price] of Object.entries(mockPrices)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return price;
      }
    }

    // Default price if no match found
    return 5.00;
  }

  /**
   * Get mock products for a search query
   * @private
   */
  private getMockProducts(query: string): Product[] {
    const normalizedQuery = query.toLowerCase().trim();

    // Mock product database
    const allMockProducts: Product[] = [
      { productId: 'mock-1', name: 'Spaghetti 500g', price: 2.50, unit: 'pack', brand: 'San Remo', source: 'mock' },
      { productId: 'mock-2', name: 'Penne Pasta 500g', price: 2.50, unit: 'pack', brand: 'San Remo', source: 'mock' },
      { productId: 'mock-3', name: 'Bacon 200g', price: 6.00, unit: 'pack', brand: 'Don', source: 'mock' },
      { productId: 'mock-3', name: 'Bacon 200g', price: 6.00, unit: 'pack', brand: 'Don', source: 'mock' },
      { productId: 'mock-4', name: 'Free Range Eggs 12pk', price: 6.40, unit: 'dozen', brand: 'Sunny Queen', source: 'mock' },
      { productId: 'mock-5', name: 'Parmesan Cheese 100g', price: 4.50, unit: 'pack', brand: 'Mainland', source: 'mock' },
      { productId: 'mock-6', name: 'Black Pepper 50g', price: 2.50, unit: 'jar', brand: 'MasterFoods', source: 'mock' },
      { productId: 'mock-7', name: 'Broccoli', price: 3.00, unit: 'kg', source: 'mock' },
      { productId: 'mock-8', name: 'Carrots 1kg', price: 1.50, unit: 'bag', source: 'mock' },
      { productId: 'mock-9', name: 'Bell Peppers', price: 2.00, unit: 'each', source: 'mock' },
      { productId: 'mock-10', name: 'Soy Sauce 250ml', price: 3.00, unit: 'bottle', brand: 'Kikkoman', source: 'mock' },
      { productId: 'mock-11', name: 'Garlic', price: 0.60, unit: 'bulb', source: 'mock' },
      { productId: 'mock-12', name: 'Ginger', price: 4.00, unit: 'kg', source: 'mock' },
      { productId: 'mock-13', name: 'White Rice 1kg', price: 2.00, unit: 'bag', brand: 'SunRice', source: 'mock' },
      { productId: 'mock-14', name: 'Chicken Breast 500g', price: 8.00, unit: 'pack', source: 'mock' },
      { productId: 'mock-15', name: 'Romaine Lettuce', price: 3.50, unit: 'each', source: 'mock' },
      { productId: 'mock-16', name: 'Caesar Dressing 250ml', price: 3.50, unit: 'bottle', brand: 'Praise', source: 'mock' },
      { productId: 'mock-17', name: 'Cherry Tomatoes 250g', price: 4.00, unit: 'punnet', source: 'mock' },
      { productId: 'mock-18', name: 'Red Lentils 500g', price: 2.50, unit: 'pack', source: 'mock' },
      { productId: 'mock-19', name: 'Brown Onions 1kg', price: 2.00, unit: 'bag', source: 'mock' },
      { productId: 'mock-20', name: 'Celery', price: 3.00, unit: 'bunch', source: 'mock' },
      { productId: 'mock-21', name: 'Vegetable Stock 1L', price: 2.00, unit: 'carton', brand: 'Massel', source: 'mock' },
      { productId: 'mock-22', name: 'Ground Cumin 40g', price: 2.50, unit: 'jar', brand: 'MasterFoods', source: 'mock' },
      { productId: 'mock-23', name: 'Turmeric 40g', price: 2.00, unit: 'jar', brand: 'MasterFoods', source: 'mock' },
      { productId: 'mock-24', name: 'Ground Beef 500g', price: 10.00, unit: 'pack', source: 'mock' },
      { productId: 'mock-25', name: 'Taco Shells 12pk', price: 4.00, unit: 'box', brand: 'Old El Paso', source: 'mock' },
      { productId: 'mock-26', name: 'Sour Cream 300ml', price: 2.50, unit: 'tub', brand: 'Bulla', source: 'mock' },
      { productId: 'mock-27', name: 'Taco Seasoning 30g', price: 1.50, unit: 'pack', brand: 'Old El Paso', source: 'mock' },
    ];

    // Filter products based on query
    if (!normalizedQuery) {
      return allMockProducts.slice(0, 10); // Return first 10 if no query
    }

    const matchedProducts = allMockProducts.filter(product =>
      product.name.toLowerCase().includes(normalizedQuery)
    );

    return matchedProducts.length > 0 ? matchedProducts : [];
  }
}
