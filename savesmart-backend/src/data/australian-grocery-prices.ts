/**
 * Australian Grocery Price Database
 *
 * Realistic prices based on average Australian supermarket prices (Coles, Woolworths)
 * Last updated: February 2026
 *
 * To update prices:
 * 1. Check current prices at Coles.com.au or Woolworths.com.au
 * 2. Update the prices below
 * 3. Update the LAST_UPDATED date
 */

export const LAST_UPDATED = '2026-02-12';

export interface PriceData {
  colesPrice: number;
  woolworthsPrice: number;
  unit: string;
}

export const AUSTRALIAN_GROCERY_PRICES: Record<string, PriceData> = {
  // Pasta & Grains
  'spaghetti': { colesPrice: 2.50, woolworthsPrice: 2.70, unit: '500g' },
  'pasta': { colesPrice: 2.50, woolworthsPrice: 2.70, unit: '500g' },
  'penne': { colesPrice: 2.50, woolworthsPrice: 2.60, unit: '500g' },
  'linguine': { colesPrice: 3.00, woolworthsPrice: 3.20, unit: '500g' },
  'rice': { colesPrice: 4.00, woolworthsPrice: 3.80, unit: '1kg' },
  'basmati rice': { colesPrice: 5.00, woolworthsPrice: 5.20, unit: '1kg' },
  'rice noodles': { colesPrice: 3.50, woolworthsPrice: 3.70, unit: '400g' },
  'egg noodles': { colesPrice: 2.50, woolworthsPrice: 2.40, unit: '300g' },
  'quinoa': { colesPrice: 6.00, woolworthsPrice: 6.50, unit: '400g' },
  'rolled oats': { colesPrice: 3.00, woolworthsPrice: 2.90, unit: '1kg' },

  // Proteins - Meat
  'chicken breast': { colesPrice: 12.00, woolworthsPrice: 11.50, unit: '1kg' },
  'chicken thighs': { colesPrice: 10.00, woolworthsPrice: 10.50, unit: '1kg' },
  'ground beef': { colesPrice: 14.00, woolworthsPrice: 13.50, unit: '1kg' },
  'beef': { colesPrice: 18.00, woolworthsPrice: 18.50, unit: '1kg' },
  'bacon': { colesPrice: 8.00, woolworthsPrice: 7.80, unit: '250g' },
  'ground lamb': { colesPrice: 16.00, woolworthsPrice: 16.50, unit: '1kg' },

  // Proteins - Seafood
  'salmon fillets': { colesPrice: 30.00, woolworthsPrice: 29.00, unit: '1kg' },
  'white fish fillets': { colesPrice: 20.00, woolworthsPrice: 21.00, unit: '1kg' },
  'shrimp': { colesPrice: 40.00, woolworthsPrice: 38.50, unit: '1kg' },
  'prawns': { colesPrice: 40.00, woolworthsPrice: 38.50, unit: '1kg' },
  'mussels': { colesPrice: 12.00, woolworthsPrice: 12.50, unit: '500g' },
  'canned tuna': { colesPrice: 3.50, woolworthsPrice: 3.30, unit: '185g' },

  // Proteins - Vegetarian
  'tofu': { colesPrice: 3.50, woolworthsPrice: 3.70, unit: '300g' },
  'chickpeas': { colesPrice: 2.00, woolworthsPrice: 1.90, unit: '400g can' },
  'black beans': { colesPrice: 2.00, woolworthsPrice: 2.10, unit: '400g can' },
  'cannellini beans': { colesPrice: 2.00, woolworthsPrice: 2.20, unit: '400g can' },
  'red lentils': { colesPrice: 3.00, woolworthsPrice: 2.90, unit: '500g' },
  'lentils': { colesPrice: 3.00, woolworthsPrice: 2.90, unit: '500g' },

  // Dairy & Eggs
  'eggs': { colesPrice: 6.00, woolworthsPrice: 5.80, unit: '12 pack' },
  'milk': { colesPrice: 3.50, woolworthsPrice: 3.40, unit: '2L' },
  'almond milk': { colesPrice: 4.00, woolworthsPrice: 4.20, unit: '1L' },
  'butter': { colesPrice: 5.00, woolworthsPrice: 5.20, unit: '500g' },
  'cheese': { colesPrice: 10.00, woolworthsPrice: 9.80, unit: '500g' },
  'cheddar cheese': { colesPrice: 10.00, woolworthsPrice: 9.80, unit: '500g' },
  'parmesan cheese': { colesPrice: 8.00, woolworthsPrice: 8.50, unit: '200g' },
  'mozzarella': { colesPrice: 9.00, woolworthsPrice: 9.20, unit: '500g' },
  'feta cheese': { colesPrice: 8.00, woolworthsPrice: 7.80, unit: '200g' },
  'cream': { colesPrice: 4.00, woolworthsPrice: 4.20, unit: '300ml' },
  'coconut cream': { colesPrice: 3.50, woolworthsPrice: 3.30, unit: '400ml' },
  'coconut milk': { colesPrice: 3.50, woolworthsPrice: 3.30, unit: '400ml' },
  'yogurt': { colesPrice: 5.00, woolworthsPrice: 5.20, unit: '1kg' },
  'sour cream': { colesPrice: 3.00, woolworthsPrice: 3.10, unit: '300ml' },

  // Vegetables
  'tomatoes': { colesPrice: 5.00, woolworthsPrice: 4.80, unit: '1kg' },
  'cherry tomatoes': { colesPrice: 5.00, woolworthsPrice: 5.20, unit: '250g' },
  'onion': { colesPrice: 3.00, woolworthsPrice: 2.90, unit: '1kg' },
  'onions': { colesPrice: 3.00, woolworthsPrice: 2.90, unit: '1kg' },
  'garlic': { colesPrice: 2.00, woolworthsPrice: 2.10, unit: '100g' },
  'carrots': { colesPrice: 2.50, woolworthsPrice: 2.40, unit: '1kg' },
  'broccoli': { colesPrice: 4.00, woolworthsPrice: 4.20, unit: '500g' },
  'bell peppers': { colesPrice: 4.00, woolworthsPrice: 3.80, unit: 'each' },
  'capsicum': { colesPrice: 4.00, woolworthsPrice: 3.80, unit: 'each' },
  'lettuce': { colesPrice: 3.50, woolworthsPrice: 3.30, unit: 'each' },
  'romaine lettuce': { colesPrice: 3.50, woolworthsPrice: 3.30, unit: 'each' },
  'cucumber': { colesPrice: 2.50, woolworthsPrice: 2.60, unit: 'each' },
  'celery': { colesPrice: 3.00, woolworthsPrice: 3.20, unit: 'bunch' },
  'mushrooms': { colesPrice: 6.00, woolworthsPrice: 5.80, unit: '500g' },
  'sweet potato': { colesPrice: 4.00, woolworthsPrice: 4.20, unit: '1kg' },
  'potatoes': { colesPrice: 4.00, woolworthsPrice: 3.80, unit: '2kg' },
  'kale': { colesPrice: 4.00, woolworthsPrice: 4.20, unit: 'bunch' },
  'spinach': { colesPrice: 4.00, woolworthsPrice: 3.80, unit: '120g' },
  'eggplant': { colesPrice: 5.00, woolworthsPrice: 5.20, unit: '1kg' },
  'zucchini': { colesPrice: 4.00, woolworthsPrice: 3.90, unit: '1kg' },
  'cauliflower': { colesPrice: 5.00, woolworthsPrice: 4.80, unit: 'each' },
  'asparagus': { colesPrice: 8.00, woolworthsPrice: 8.50, unit: '250g' },
  'corn': { colesPrice: 3.00, woolworthsPrice: 3.20, unit: '400g' },
  'avocado': { colesPrice: 3.00, woolworthsPrice: 2.80, unit: 'each' },
  'bean sprouts': { colesPrice: 2.50, woolworthsPrice: 2.60, unit: '250g' },
  'edamame': { colesPrice: 5.00, woolworthsPrice: 5.20, unit: '400g' },
  'mixed vegetables': { colesPrice: 5.00, woolworthsPrice: 4.80, unit: '1kg frozen' },

  // Fruits
  'lemon': { colesPrice: 1.00, woolworthsPrice: 0.90, unit: 'each' },
  'lime': { colesPrice: 1.00, woolworthsPrice: 1.10, unit: 'each' },
  'mixed berries': { colesPrice: 6.00, woolworthsPrice: 6.50, unit: '300g' },
  'dates': { colesPrice: 8.00, woolworthsPrice: 7.80, unit: '400g' },

  // Pantry Staples
  'flour': { colesPrice: 3.00, woolworthsPrice: 2.90, unit: '1kg' },
  'sugar': { colesPrice: 3.00, woolworthsPrice: 3.10, unit: '1kg' },
  'salt': { colesPrice: 1.50, woolworthsPrice: 1.40, unit: '500g' },
  'olive oil': { colesPrice: 12.00, woolworthsPrice: 11.50, unit: '1L' },
  'oil': { colesPrice: 8.00, woolworthsPrice: 7.80, unit: '1L' },
  'vegetable oil': { colesPrice: 8.00, woolworthsPrice: 7.80, unit: '1L' },
  'sesame oil': { colesPrice: 6.00, woolworthsPrice: 6.20, unit: '250ml' },
  'soy sauce': { colesPrice: 3.50, woolworthsPrice: 3.30, unit: '250ml' },
  'tomato sauce': { colesPrice: 4.00, woolworthsPrice: 4.20, unit: '500g' },
  'tomato paste': { colesPrice: 2.50, woolworthsPrice: 2.40, unit: '200g' },
  'honey': { colesPrice: 8.00, woolworthsPrice: 8.50, unit: '500g' },
  'peanut butter': { colesPrice: 5.00, woolworthsPrice: 4.80, unit: '375g' },
  'tahini': { colesPrice: 6.00, woolworthsPrice: 6.20, unit: '375g' },
  'bread': { colesPrice: 3.50, woolworthsPrice: 3.30, unit: 'loaf' },
  'sourdough bread': { colesPrice: 5.00, woolworthsPrice: 5.20, unit: 'loaf' },
  'tortillas': { colesPrice: 4.00, woolworthsPrice: 4.20, unit: '8 pack' },
  'pita bread': { colesPrice: 4.00, woolworthsPrice: 3.80, unit: '6 pack' },
  'taco shells': { colesPrice: 4.50, woolworthsPrice: 4.70, unit: '12 pack' },
  'breadcrumbs': { colesPrice: 3.00, woolworthsPrice: 2.90, unit: '300g' },
  'puff pastry': { colesPrice: 4.50, woolworthsPrice: 4.70, unit: '400g' },

  // Sauces & Condiments
  'caesar dressing': { colesPrice: 4.00, woolworthsPrice: 4.20, unit: '250ml' },
  'balsamic vinegar': { colesPrice: 5.00, woolworthsPrice: 5.20, unit: '250ml' },
  'teriyaki sauce': { colesPrice: 4.00, woolworthsPrice: 3.80, unit: '250ml' },
  'enchilada sauce': { colesPrice: 4.00, woolworthsPrice: 4.20, unit: '400g' },
  'buffalo sauce': { colesPrice: 4.50, woolworthsPrice: 4.70, unit: '250ml' },
  'salsa': { colesPrice: 4.00, woolworthsPrice: 3.80, unit: '300g' },
  'vegan ranch': { colesPrice: 5.00, woolworthsPrice: 5.20, unit: '250ml' },
  'gravy': { colesPrice: 3.00, woolworthsPrice: 3.10, unit: '300ml' },
  'white wine': { colesPrice: 12.00, woolworthsPrice: 11.50, unit: '750ml' },
  'beer': { colesPrice: 5.00, woolworthsPrice: 5.20, unit: '375ml' },

  // Spices & Herbs
  'black pepper': { colesPrice: 3.00, woolworthsPrice: 3.10, unit: '50g' },
  'pepper': { colesPrice: 3.00, woolworthsPrice: 3.10, unit: '50g' },
  'cumin': { colesPrice: 3.00, woolworthsPrice: 3.20, unit: '40g' },
  'turmeric': { colesPrice: 3.00, woolworthsPrice: 2.90, unit: '40g' },
  'curry powder': { colesPrice: 3.50, woolworthsPrice: 3.70, unit: '50g' },
  'garam masala': { colesPrice: 4.00, woolworthsPrice: 4.20, unit: '50g' },
  'paprika': { colesPrice: 3.00, woolworthsPrice: 3.10, unit: '50g' },
  'taco seasoning': { colesPrice: 2.00, woolworthsPrice: 2.10, unit: '30g' },
  'biryani spices': { colesPrice: 4.00, woolworthsPrice: 4.20, unit: '50g' },
  'fresh basil': { colesPrice: 4.00, woolworthsPrice: 3.80, unit: 'bunch' },
  'fresh herbs': { colesPrice: 4.00, woolworthsPrice: 3.80, unit: 'bunch' },
  'lemongrass': { colesPrice: 3.00, woolworthsPrice: 3.20, unit: '3 stalks' },
  'thai chili paste': { colesPrice: 4.00, woolworthsPrice: 4.20, unit: '100g' },
  'saffron': { colesPrice: 15.00, woolworthsPrice: 15.50, unit: '1g' },
  'cocoa powder': { colesPrice: 5.00, woolworthsPrice: 5.20, unit: '125g' },

  // Nuts & Seeds
  'almonds': { colesPrice: 12.00, woolworthsPrice: 11.50, unit: '500g' },
  'peanuts': { colesPrice: 6.00, woolworthsPrice: 6.20, unit: '500g' },
  'coconut flakes': { colesPrice: 5.00, woolworthsPrice: 5.20, unit: '250g' },
  'sesame seeds': { colesPrice: 4.00, woolworthsPrice: 4.20, unit: '150g' },

  // Stock & Broth
  'chicken stock': { colesPrice: 3.00, woolworthsPrice: 2.90, unit: '1L' },
  'vegetable stock': { colesPrice: 3.00, woolworthsPrice: 2.90, unit: '1L' },
  'beef stock': { colesPrice: 3.00, woolworthsPrice: 3.10, unit: '1L' },

  // Specialty Items
  'paella rice': { colesPrice: 5.00, woolworthsPrice: 5.20, unit: '500g' },
  'macaroni': { colesPrice: 2.50, woolworthsPrice: 2.60, unit: '500g' },
  'béchamel sauce': { colesPrice: 4.00, woolworthsPrice: 4.20, unit: '500ml' },
};

/**
 * Get price for a product with fuzzy matching
 */
export function getAustralianPrice(productName: string): PriceData {
  const normalizedName = productName.toLowerCase().trim();

  // Exact match
  if (AUSTRALIAN_GROCERY_PRICES[normalizedName]) {
    return AUSTRALIAN_GROCERY_PRICES[normalizedName];
  }

  // Partial match
  for (const [key, priceData] of Object.entries(AUSTRALIAN_GROCERY_PRICES)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return priceData;
    }
  }

  // Default fallback
  return { colesPrice: 5.00, woolworthsPrice: 5.20, unit: 'item' };
}
