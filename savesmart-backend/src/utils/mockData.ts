/**
 * Mock data generators for SaveSmart application
 * Used as fallback when external APIs are unavailable
 *
 * Requirements: 8.4, 9.6, 10.7
 */

import { Event, EventLocation, EventDiscount } from '../models/Event';
import { FuelStation, FuelStationLocation, FuelPrice } from '../models/FuelStation';
import { Recipe, Ingredient } from '../models/Recipe';

/**
 * Generate mock events for a given location
 */
export function generateMockEvents(suburb?: string, postcode?: string): Event[] {
  const now = new Date();
  const locations: EventLocation[] = [
    {
      venue: 'Sydney Opera House',
      suburb: suburb || 'Sydney',
      postcode: postcode || '2000',
      coordinates: { lat: -33.8568, lng: 151.2153 }
    },
    {
      venue: 'Bondi Pavilion',
      suburb: suburb || 'Bondi Beach',
      postcode: postcode || '2026',
      coordinates: { lat: -33.8915, lng: 151.2767 }
    },
    {
      venue: 'Parramatta Park',
      suburb: suburb || 'Parramatta',
      postcode: postcode || '2150',
      coordinates: { lat: -33.8151, lng: 151.0037 }
    }
  ];

  const eventTemplates = [
    {
      name: 'Community Markets',
      description: 'Local artisan markets with fresh produce and handmade goods',
      discount: { description: 'Free entry, 10% off with SaveSmart app', percentage: 10 }
    },
    {
      name: 'Outdoor Cinema Night',
      description: 'Classic movies under the stars with food trucks',
      discount: { description: '$5 off tickets', amount: 5 }
    },
    {
      name: 'Food Festival',
      description: 'Taste cuisines from around the world',
      discount: { description: '20% off food vouchers', percentage: 20 }
    },
    {
      name: 'Fitness Bootcamp',
      description: 'Free outdoor fitness session for all levels',
      discount: { description: 'Free entry', percentage: 100 }
    },
    {
      name: 'Art Exhibition',
      description: 'Local artists showcase their latest works',
      discount: { description: '$10 off entry', amount: 10 }
    }
  ];

  return eventTemplates.map((template, index) => {
    const location = locations[index % locations.length];
    const daysAhead = index + 1;
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() + daysAhead);

    return {
      eventId: `mock-event-${index + 1}`,
      name: template.name,
      description: template.description,
      date: eventDate.toISOString(),
      location,
      discount: template.discount,
      externalUrl: `https://example.com/events/${index + 1}`,
      source: 'mock' as const,
      cachedAt: now.toISOString()
    };
  });
}

/**
 * Generate mock fuel stations for a given location
 */
export function generateMockFuelStations(suburb?: string, postcode?: string): FuelStation[] {
  const now = new Date();
  const brands = ['Shell', 'Caltex', 'BP', '7-Eleven', 'Ampol'];

  const locations: FuelStationLocation[] = [
    {
      address: '123 George Street',
      suburb: suburb || 'Sydney',
      postcode: postcode || '2000',
      coordinates: { lat: -33.8688, lng: 151.2093 }
    },
    {
      address: '456 Oxford Street',
      suburb: suburb || 'Bondi Junction',
      postcode: postcode || '2022',
      coordinates: { lat: -33.8915, lng: 151.2501 }
    },
    {
      address: '789 Parramatta Road',
      suburb: suburb || 'Parramatta',
      postcode: postcode || '2150',
      coordinates: { lat: -33.8151, lng: 151.0037 }
    },
    {
      address: '321 Victoria Road',
      suburb: suburb || 'Ryde',
      postcode: postcode || '2112',
      coordinates: { lat: -33.8176, lng: 151.1027 }
    },
    {
      address: '654 Pacific Highway',
      suburb: suburb || 'Chatswood',
      postcode: postcode || '2067',
      coordinates: { lat: -33.7969, lng: 151.1835 }
    }
  ];

  return locations.map((location, index) => {
    const brand = brands[index % brands.length];
    const basePrices = {
      E10: 165 + Math.random() * 20,
      U91: 175 + Math.random() * 20,
      U95: 185 + Math.random() * 20,
      U98: 195 + Math.random() * 20,
      Diesel: 170 + Math.random() * 20
    };

    const prices: FuelPrice[] = Object.entries(basePrices).map(([fuelType, price]) => ({
      fuelType: fuelType as FuelPrice['fuelType'],
      price: Math.round(price * 10) / 10,
      lastUpdated: now.toISOString()
    }));

    return {
      stationId: `mock-station-${index + 1}`,
      name: `${brand} ${location.suburb}`,
      brand,
      location,
      prices,
      source: 'mock' as const,
      updatedAt: now.toISOString()
    };
  });
}

/**
 * Generate mock recipes with realistic pricing
 */
export function generateMockRecipes(dietaryTags?: string[]): Recipe[] {
  const now = new Date();

  const recipeTemplates = [
    {
      name: 'Spaghetti Carbonara',
      description: 'Classic Italian pasta with creamy egg sauce and bacon',
      prepTime: 25,
      servings: 4,
      dietaryTags: [],
      imageUrl: 'https://example.com/images/carbonara.jpg',
      ingredients: [
        { name: 'Spaghetti', quantity: 400, unit: 'g', price: 2.50 },
        { name: 'Bacon', quantity: 200, unit: 'g', price: 6.00 },
        { name: 'Eggs', quantity: 4, unit: 'pieces', price: 3.20 },
        { name: 'Parmesan cheese', quantity: 100, unit: 'g', price: 4.50 },
        { name: 'Black pepper', quantity: 5, unit: 'g', price: 0.50 }
      ],
      instructions: [
        'Cook spaghetti according to package directions',
        'Fry bacon until crispy',
        'Beat eggs with grated parmesan',
        'Drain pasta and mix with bacon',
        'Remove from heat and stir in egg mixture',
        'Season with black pepper and serve'
      ]
    },
    {
      name: 'Vegetable Stir Fry',
      description: 'Colorful mix of fresh vegetables in savory sauce',
      prepTime: 20,
      servings: 4,
      dietaryTags: ['vegetarian', 'vegan'],
      imageUrl: 'https://example.com/images/stirfry.jpg',
      ingredients: [
        { name: 'Broccoli', quantity: 200, unit: 'g', price: 3.00 },
        { name: 'Carrots', quantity: 150, unit: 'g', price: 1.50 },
        { name: 'Bell peppers', quantity: 200, unit: 'g', price: 4.00 },
        { name: 'Soy sauce', quantity: 50, unit: 'ml', price: 1.00 },
        { name: 'Garlic', quantity: 3, unit: 'cloves', price: 0.30 },
        { name: 'Ginger', quantity: 20, unit: 'g', price: 0.80 },
        { name: 'Rice', quantity: 300, unit: 'g', price: 2.00 }
      ],
      instructions: [
        'Cook rice according to package directions',
        'Chop all vegetables into bite-sized pieces',
        'Heat oil in wok or large pan',
        'Stir fry vegetables starting with hardest first',
        'Add minced garlic and ginger',
        'Pour in soy sauce and toss to coat',
        'Serve over rice'
      ]
    },
    {
      name: 'Chicken Caesar Salad',
      description: 'Fresh romaine lettuce with grilled chicken and Caesar dressing',
      prepTime: 30,
      servings: 2,
      dietaryTags: ['gluten-free'],
      imageUrl: 'https://example.com/images/caesar.jpg',
      ingredients: [
        { name: 'Chicken breast', quantity: 300, unit: 'g', price: 8.00 },
        { name: 'Romaine lettuce', quantity: 200, unit: 'g', price: 3.50 },
        { name: 'Parmesan cheese', quantity: 50, unit: 'g', price: 2.25 },
        { name: 'Caesar dressing', quantity: 100, unit: 'ml', price: 3.50 },
        { name: 'Cherry tomatoes', quantity: 100, unit: 'g', price: 2.00 }
      ],
      instructions: [
        'Season and grill chicken breast until cooked through',
        'Let chicken rest, then slice',
        'Wash and chop romaine lettuce',
        'Halve cherry tomatoes',
        'Toss lettuce with Caesar dressing',
        'Top with sliced chicken, tomatoes, and shaved parmesan'
      ]
    },
    {
      name: 'Lentil Soup',
      description: 'Hearty and nutritious soup with red lentils and vegetables',
      prepTime: 45,
      servings: 6,
      dietaryTags: ['vegetarian', 'vegan', 'gluten-free'],
      imageUrl: 'https://example.com/images/lentil-soup.jpg',
      ingredients: [
        { name: 'Red lentils', quantity: 300, unit: 'g', price: 2.50 },
        { name: 'Onion', quantity: 150, unit: 'g', price: 0.80 },
        { name: 'Carrots', quantity: 200, unit: 'g', price: 2.00 },
        { name: 'Celery', quantity: 100, unit: 'g', price: 1.50 },
        { name: 'Vegetable stock', quantity: 1500, unit: 'ml', price: 2.00 },
        { name: 'Cumin', quantity: 5, unit: 'g', price: 0.50 },
        { name: 'Turmeric', quantity: 3, unit: 'g', price: 0.40 }
      ],
      instructions: [
        'Dice onion, carrots, and celery',
        'Sauté vegetables in large pot until softened',
        'Add spices and cook for 1 minute',
        'Add lentils and vegetable stock',
        'Bring to boil, then simmer for 30 minutes',
        'Blend partially for creamy texture',
        'Season to taste and serve'
      ]
    },
    {
      name: 'Beef Tacos',
      description: 'Seasoned ground beef in crispy taco shells with fresh toppings',
      prepTime: 30,
      servings: 4,
      dietaryTags: [],
      imageUrl: 'https://example.com/images/tacos.jpg',
      ingredients: [
        { name: 'Ground beef', quantity: 500, unit: 'g', price: 10.00 },
        { name: 'Taco shells', quantity: 8, unit: 'pieces', price: 4.00 },
        { name: 'Lettuce', quantity: 100, unit: 'g', price: 2.00 },
        { name: 'Tomatoes', quantity: 200, unit: 'g', price: 3.00 },
        { name: 'Cheese', quantity: 150, unit: 'g', price: 4.50 },
        { name: 'Sour cream', quantity: 100, unit: 'ml', price: 2.50 },
        { name: 'Taco seasoning', quantity: 30, unit: 'g', price: 1.50 }
      ],
      instructions: [
        'Brown ground beef in large pan',
        'Add taco seasoning and water, simmer',
        'Warm taco shells in oven',
        'Shred lettuce and dice tomatoes',
        'Grate cheese',
        'Fill taco shells with beef',
        'Top with lettuce, tomatoes, cheese, and sour cream'
      ]
    }
  ];

  // Filter by dietary tags if provided
  let filteredRecipes = recipeTemplates;
  if (dietaryTags && dietaryTags.length > 0) {
    filteredRecipes = recipeTemplates.filter(recipe =>
      dietaryTags.some(tag => recipe.dietaryTags.includes(tag))
    );
  }

  return filteredRecipes.map((template, index) => {
    const ingredients: Ingredient[] = template.ingredients.map(ing => ({
      ...ing,
      source: 'mock' as const
    }));

    const totalCost = ingredients.reduce((sum, ing) => sum + ing.price, 0);

    return {
      recipeId: `mock-recipe-${index + 1}`,
      name: template.name,
      description: template.description,
      imageUrl: template.imageUrl,
      prepTime: template.prepTime,
      servings: template.servings,
      dietaryTags: template.dietaryTags,
      ingredients,
      instructions: template.instructions,
      totalCost: Math.round(totalCost * 100) / 100,
      cachedAt: now.toISOString()
    };
  });
}
