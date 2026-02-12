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
      venue: 'RMIT University',
      suburb: suburb || 'Melbourne',
      postcode: postcode || '3000',
      coordinates: { lat: -37.8136, lng: 144.9631 }
    },
    {
      venue: 'State Library Victoria',
      suburb: suburb || 'Melbourne',
      postcode: postcode || '3000',
      coordinates: { lat: -37.8098, lng: 144.9652 }
    },
    {
      venue: 'Melbourne Connect',
      suburb: suburb || 'Carlton',
      postcode: postcode || '3053',
      coordinates: { lat: -37.7963, lng: 144.9614 }
    },
    {
      venue: 'Monash University',
      suburb: suburb || 'Clayton',
      postcode: postcode || '3800',
      coordinates: { lat: -37.9105, lng: 145.1362 }
    },
    {
      venue: 'The Commons',
      suburb: suburb || 'South Melbourne',
      postcode: postcode || '3205',
      coordinates: { lat: -37.8314, lng: 144.9631 }
    }
  ];

  const eventTemplates = [
    {
      name: 'Melbourne Tech Meetup',
      description: 'Monthly networking event for tech professionals and developers. Connect with local startups, share ideas, and learn about the latest in software development and innovation.',
      discount: { description: 'Free entry', percentage: 100 }
    },
    {
      name: 'Student Career Fair',
      description: 'Free career fair for university students and recent graduates. Meet employers from tech, finance, and consulting. Bring your resume and network with industry professionals.',
      discount: { description: 'Free entry for students', percentage: 100 }
    },
    {
      name: 'Coding Workshop: Python for Beginners',
      description: 'Learn Python programming basics in this hands-on workshop. Perfect for students and young professionals looking to start their coding journey. Laptops provided.',
      discount: { description: 'Free for students, $10 for others', amount: 10 }
    },
    {
      name: 'Startup Pitch Night',
      description: 'Watch local startups pitch their ideas to investors and the community. Great networking opportunity for entrepreneurs, developers, and tech enthusiasts.',
      discount: { description: 'Free entry', percentage: 100 }
    },
    {
      name: 'University Open Day',
      description: 'Explore campus, meet current students, and learn about courses. Free food, campus tours, and information sessions about student life and career opportunities.',
      discount: { description: 'Free entry', percentage: 100 }
    },
    {
      name: 'Women in Tech Networking',
      description: 'Networking event for women in technology and STEM fields. Connect with mentors, share experiences, and build your professional network in a supportive environment.',
      discount: { description: 'Free entry', percentage: 100 }
    },
    {
      name: 'Hackathon: Build for Good',
      description: '24-hour hackathon focused on creating tech solutions for social impact. Form teams, code together, and compete for prizes. Free pizza and energy drinks provided!',
      discount: { description: 'Free entry, prizes worth $5000', percentage: 100 }
    },
    {
      name: 'Graduate Recruitment Session',
      description: 'Learn about graduate programs at leading tech companies. Hear from recent graduates about their experiences and get tips for applications and interviews.',
      discount: { description: 'Free entry', percentage: 100 }
    },
    {
      name: 'AI & Machine Learning Workshop',
      description: 'Introduction to artificial intelligence and machine learning for students and professionals. Hands-on exercises with real datasets. No prior experience required.',
      discount: { description: '$15 off for students', amount: 15 }
    },
    {
      name: 'Student Entrepreneur Meetup',
      description: 'Monthly meetup for student entrepreneurs and aspiring founders. Share your startup ideas, get feedback, and connect with like-minded students building businesses.',
      discount: { description: 'Free entry', percentage: 100 }
    }
  ];

  return eventTemplates.map((template, index) => {
    const location = locations[index % locations.length];
    const daysAhead = index + 1;
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() + daysAhead);
    eventDate.setHours(18 + (index % 4), 0, 0, 0); // Events between 6pm-10pm

    return {
      eventId: `mock-event-${index + 1}`,
      name: template.name,
      description: template.description,
      date: eventDate.toISOString(),
      location,
      discount: template.discount,
      externalUrl: `https://www.eventbrite.com.au/e/mock-event-${index + 1}`,
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
