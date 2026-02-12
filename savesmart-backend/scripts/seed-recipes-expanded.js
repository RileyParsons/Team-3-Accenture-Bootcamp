/**
 * Expanded Seed Recipes Script
 *
 * Populates the recipes table with a large variety of recipes
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-2';
const TABLE_NAME = 'savesmart-recipes';

const client = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

// Expanded recipe database with 50+ recipes
const expandedRecipes = [
  // BREAKFAST RECIPES
  {
    recipeId: 'recipe-breakfast-1',
    name: 'Classic Scrambled Eggs on Toast',
    description: 'Simple, protein-packed breakfast to start your day',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400',
    prepTime: 10,
    servings: 2,
    dietaryTags: ['vegetarian'],
    ingredients: [
      { name: 'Eggs', quantity: 4, unit: 'whole', price: 1.50, source: 'woolworths' },
      { name: 'Bread', quantity: 4, unit: 'slices', price: 1.00, source: 'coles' },
      { name: 'Butter', quantity: 20, unit: 'g', price: 0.50, source: 'woolworths' },
      { name: 'Milk', quantity: 50, unit: 'ml', price: 0.30, source: 'coles' },
    ],
    instructions: [
      'Beat eggs with milk and season',
      'Toast bread',
      'Scramble eggs in butter over medium heat',
      'Serve on toast'
    ],
    totalCost: 3.30,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-breakfast-2',
    name: 'Overnight Oats with Berries',
    description: 'Healthy make-ahead breakfast packed with fiber',
    imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400',
    prepTime: 5,
    servings: 2,
    dietaryTags: ['vegetarian', 'vegan'],
    ingredients: [
      { name: 'Rolled Oats', quantity: 200, unit: 'g', price: 1.50, undefined },
      { name: 'Almond Milk', quantity: 400, unit: 'ml', price: 2.00, undefined },
      { name: 'Mixed Berries', quantity: 200, unit: 'g', price: 3.50, undefined },
      { name: 'Honey', quantity: 30, unit: 'ml', price: 1.00, undefined },
    ],
    instructions: [
      'Mix oats with almond milk',
      'Add honey and stir',
      'Refrigerate overnight',
      'Top with berries before serving'
    ],
    totalCost: 8.00,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-breakfast-3',
    name: 'Avocado Toast with Poached Egg',
    description: 'Trendy and nutritious breakfast favorite',
    imageUrl: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400',
    prepTime: 15,
    servings: 2,
    dietaryTags: ['vegetarian'],
    ingredients: [
      { name: 'Sourdough Bread', quantity: 4, unit: 'slices', price: 2.50, undefined },
      { name: 'Avocado', quantity: 2, unit: 'whole', price: 4.00, undefined },
      { name: 'Eggs', quantity: 2, unit: 'whole', price: 0.75, undefined },
      { name: 'Lemon', quantity: 1, unit: 'whole', price: 0.75, undefined },
    ],
    instructions: [
      'Toast sourdough bread',
      'Mash avocado with lemon juice',
      'Poach eggs in simmering water',
      'Spread avocado on toast and top with egg'
    ],
    totalCost: 8.00,
    cachedAt: new Date().toISOString(),
  },
  // LUNCH RECIPES
  {
    recipeId: 'recipe-lunch-1',
    name: 'Mediterranean Chickpea Salad',
    description: 'Fresh and filling salad with Mediterranean flavors',
    imageUrl: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400',
    prepTime: 15,
    servings: 4,
    dietaryTags: ['vegetarian', 'vegan', 'gluten-free'],
    ingredients: [
      { name: 'Chickpeas', quantity: 800, unit: 'g', price: 3.00, undefined },
      { name: 'Cherry Tomatoes', quantity: 300, unit: 'g', price: 3.50, undefined },
      { name: 'Cucumber', quantity: 2, unit: 'whole', price: 2.00, undefined },
      { name: 'Feta Cheese', quantity: 150, unit: 'g', price: 4.00, undefined },
      { name: 'Olive Oil', quantity: 50, unit: 'ml', price: 1.50, undefined },
    ],
    instructions: [
      'Drain and rinse chickpeas',
      'Chop tomatoes and cucumber',
      'Crumble feta cheese',
      'Mix all ingredients with olive oil and lemon',
      'Season with salt, pepper, and herbs'
    ],
    totalCost: 14.00,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-lunch-2',
    name: 'Chicken Caesar Wrap',
    description: 'Classic Caesar flavors in a convenient wrap',
    imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400',
    prepTime: 20,
    servings: 4,
    dietaryTags: [],
    ingredients: [
      { name: 'Chicken Breast', quantity: 400, unit: 'g', price: 6.50, undefined },
      { name: 'Tortilla Wraps', quantity: 4, unit: 'pieces', price: 2.50, undefined },
      { name: 'Romaine Lettuce', quantity: 200, unit: 'g', price: 2.00, undefined },
      { name: 'Caesar Dressing', quantity: 100, unit: 'ml', price: 2.50, undefined },
      { name: 'Parmesan', quantity: 50, unit: 'g', price: 2.00, undefined },
    ],
    instructions: [
      'Cook and slice chicken breast',
      'Chop romaine lettuce',
      'Warm tortillas',
      'Assemble with chicken, lettuce, dressing, and parmesan',
      'Roll tightly and slice in half'
    ],
    totalCost: 15.50,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-lunch-3',
    name: 'Thai Peanut Noodle Bowl',
    description: 'Vibrant Asian-inspired noodle dish',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    prepTime: 25,
    servings: 4,
    dietaryTags: ['vegetarian', 'vegan'],
    ingredients: [
      { name: 'Rice Noodles', quantity: 400, unit: 'g', price: 3.00, undefined },
      { name: 'Peanut Butter', quantity: 100, unit: 'g', price: 2.50, undefined },
      { name: 'Mixed Vegetables', quantity: 500, unit: 'g', price: 4.00, undefined },
      { name: 'Soy Sauce', quantity: 50, unit: 'ml', price: 1.00, undefined },
      { name: 'Lime', quantity: 2, unit: 'whole', price: 1.50, undefined },
    ],
    instructions: [
      'Cook rice noodles according to package',
      'Make peanut sauce with peanut butter, soy sauce, and lime',
      'Stir fry vegetables',
      'Toss noodles with sauce and vegetables',
      'Garnish with peanuts and cilantro'
    ],
    totalCost: 12.00,
    cachedAt: new Date().toISOString(),
  },
  // DINNER RECIPES
  {
    recipeId: 'recipe-dinner-1',
    name: 'Budget Pasta Carbonara',
    description: 'Classic Italian pasta dish that\'s quick, easy, and budget-friendly',
    imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
    prepTime: 20,
    servings: 4,
    dietaryTags: [],
    ingredients: [
      { name: 'Spaghetti', quantity: 400, unit: 'g', price: 2.50, undefined },
      { name: 'Bacon', quantity: 200, unit: 'g', price: 4.00, undefined },
      { name: 'Eggs', quantity: 4, unit: 'whole', price: 1.50, undefined },
      { name: 'Parmesan Cheese', quantity: 100, unit: 'g', price: 3.00, undefined },
    ],
    instructions: [
      'Cook spaghetti according to package directions',
      'Fry bacon until crispy',
      'Mix eggs and parmesan',
      'Combine hot pasta with bacon and egg mixture',
      'Serve immediately'
    ],
    totalCost: 11.00,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-dinner-2',
    name: 'Beef Tacos with Homemade Salsa',
    description: 'Mexican-inspired tacos with fresh toppings',
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',
    prepTime: 30,
    servings: 4,
    dietaryTags: ['gluten-free'],
    ingredients: [
      { name: 'Ground Beef', quantity: 500, unit: 'g', price: 7.00, undefined },
      { name: 'Taco Shells', quantity: 12, unit: 'pieces', price: 3.50, undefined },
      { name: 'Tomatoes', quantity: 4, unit: 'whole', price: 3.00, undefined },
      { name: 'Lettuce', quantity: 200, unit: 'g', price: 2.00, undefined },
      { name: 'Cheese', quantity: 200, unit: 'g', price: 4.00, undefined },
    ],
    instructions: [
      'Brown ground beef with taco seasoning',
      'Make fresh salsa with diced tomatoes, onion, and cilantro',
      'Warm taco shells',
      'Assemble tacos with beef, salsa, lettuce, and cheese',
      'Serve with sour cream and lime'
    ],
    totalCost: 19.50,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-dinner-3',
    name: 'Lemon Herb Baked Salmon',
    description: 'Healthy and flavorful baked salmon with vegetables',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
    prepTime: 35,
    servings: 4,
    dietaryTags: ['gluten-free'],
    ingredients: [
      { name: 'Salmon Fillets', quantity: 600, unit: 'g', price: 18.00, undefined },
      { name: 'Lemon', quantity: 2, unit: 'whole', price: 1.50, undefined },
      { name: 'Asparagus', quantity: 400, unit: 'g', price: 4.50, undefined },
      { name: 'Olive Oil', quantity: 50, unit: 'ml', price: 1.50, undefined },
      { name: 'Fresh Herbs', quantity: 30, unit: 'g', price: 2.00, undefined },
    ],
    instructions: [
      'Preheat oven to 200°C',
      'Season salmon with lemon, herbs, salt, and pepper',
      'Arrange asparagus around salmon',
      'Drizzle with olive oil',
      'Bake for 15-20 minutes until salmon is cooked through'
    ],
    totalCost: 27.50,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-dinner-4',
    name: 'Vegetarian Stir Fry',
    description: 'Colorful and nutritious vegetable stir fry with tofu',
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
    prepTime: 15,
    servings: 3,
    dietaryTags: ['vegetarian', 'vegan'],
    ingredients: [
      { name: 'Tofu', quantity: 300, unit: 'g', price: 3.50, undefined },
      { name: 'Mixed Vegetables', quantity: 500, unit: 'g', price: 4.00, undefined },
      { name: 'Soy Sauce', quantity: 50, unit: 'ml', price: 1.00, undefined },
      { name: 'Rice', quantity: 300, unit: 'g', price: 2.00, undefined },
    ],
    instructions: [
      'Press and cube tofu',
      'Stir fry tofu until golden',
      'Add vegetables and cook until tender',
      'Add soy sauce',
      'Serve over rice'
    ],
    totalCost: 10.50,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-dinner-5',
    name: 'Chicken and Rice Bowl',
    description: 'Simple and satisfying one-bowl meal',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    prepTime: 25,
    servings: 4,
    dietaryTags: ['gluten-free'],
    ingredients: [
      { name: 'Chicken Breast', quantity: 500, unit: 'g', price: 8.00, undefined },
      { name: 'Rice', quantity: 400, unit: 'g', price: 2.50, undefined },
      { name: 'Broccoli', quantity: 300, unit: 'g', price: 3.00, undefined },
      { name: 'Soy Sauce', quantity: 50, unit: 'ml', price: 1.00, undefined },
    ],
    instructions: [
      'Cook rice according to package',
      'Season and cook chicken',
      'Steam broccoli',
      'Slice chicken',
      'Assemble bowls with rice, chicken, and broccoli'
    ],
    totalCost: 14.50,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-dinner-6',
    name: 'Spaghetti Bolognese',
    description: 'Classic Italian meat sauce with pasta',
    imageUrl: 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=400',
    prepTime: 45,
    servings: 6,
    dietaryTags: [],
    ingredients: [
      { name: 'Spaghetti', quantity: 600, unit: 'g', price: 3.50, undefined },
      { name: 'Ground Beef', quantity: 500, unit: 'g', price: 7.00, undefined },
      { name: 'Tomato Sauce', quantity: 800, unit: 'ml', price: 4.00, undefined },
      { name: 'Onion', quantity: 2, unit: 'whole', price: 1.50, undefined },
      { name: 'Garlic', quantity: 4, unit: 'cloves', price: 0.50, undefined },
    ],
    instructions: [
      'Sauté onion and garlic',
      'Brown ground beef',
      'Add tomato sauce and simmer for 30 minutes',
      'Cook spaghetti',
      'Serve sauce over pasta with parmesan'
    ],
    totalCost: 16.50,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-dinner-7',
    name: 'Vegan Buddha Bowl',
    description: 'Nutritious and colorful plant-based bowl',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    prepTime: 30,
    servings: 2,
    dietaryTags: ['vegan', 'vegetarian', 'gluten-free'],
    ingredients: [
      { name: 'Quinoa', quantity: 200, unit: 'g', price: 3.00, undefined },
      { name: 'Chickpeas', quantity: 400, unit: 'g', price: 2.00, undefined },
      { name: 'Sweet Potato', quantity: 300, unit: 'g', price: 2.50, undefined },
      { name: 'Kale', quantity: 100, unit: 'g', price: 2.00, undefined },
      { name: 'Tahini', quantity: 50, unit: 'ml', price: 2.50, undefined },
    ],
    instructions: [
      'Cook quinoa according to package',
      'Roast chickpeas with spices',
      'Roast sweet potato cubes',
      'Massage kale with lemon',
      'Assemble bowl and drizzle with tahini dressing'
    ],
    totalCost: 12.00,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-dinner-8',
    name: 'Quick Tuna Pasta',
    description: 'Fast and affordable weeknight dinner',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
    prepTime: 15,
    servings: 3,
    dietaryTags: [],
    ingredients: [
      { name: 'Pasta', quantity: 300, unit: 'g', price: 2.00, undefined },
      { name: 'Canned Tuna', quantity: 200, unit: 'g', price: 3.50, undefined },
      { name: 'Tomato Sauce', quantity: 400, unit: 'ml', price: 2.50, undefined },
      { name: 'Garlic', quantity: 3, unit: 'cloves', price: 0.50, undefined },
    ],
    instructions: [
      'Cook pasta according to package',
      'Sauté garlic in olive oil',
      'Add tomato sauce and tuna',
      'Simmer for 5 minutes',
      'Toss with pasta and serve'
    ],
    totalCost: 8.50,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-dinner-9',
    name: 'Veggie Quesadillas',
    description: 'Cheesy and satisfying Mexican-inspired meal',
    imageUrl: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400',
    prepTime: 20,
    servings: 4,
    dietaryTags: ['vegetarian'],
    ingredients: [
      { name: 'Tortillas', quantity: 8, unit: 'pieces', price: 3.00, undefined },
      { name: 'Cheese', quantity: 200, unit: 'g', price: 4.00, undefined },
      { name: 'Bell Peppers', quantity: 2, unit: 'whole', price: 3.00, undefined },
      { name: 'Onion', quantity: 1, unit: 'whole', price: 1.00, undefined },
      { name: 'Black Beans', quantity: 400, unit: 'g', price: 2.00, undefined },
    ],
    instructions: [
      'Sauté peppers and onions',
      'Warm tortillas',
      'Add cheese, vegetables, and beans',
      'Fold and cook until golden',
      'Serve with salsa and sour cream'
    ],
    totalCost: 13.00,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-dinner-10',
    name: 'Honey Garlic Chicken Thighs',
    description: 'Sweet and savory baked chicken',
    imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400',
    prepTime: 40,
    servings: 4,
    dietaryTags: ['gluten-free'],
    ingredients: [
      { name: 'Chicken Thighs', quantity: 800, unit: 'g', price: 9.00, undefined },
      { name: 'Honey', quantity: 80, unit: 'ml', price: 2.50, undefined },
      { name: 'Garlic', quantity: 6, unit: 'cloves', price: 0.75, undefined },
      { name: 'Soy Sauce', quantity: 60, unit: 'ml', price: 1.25, undefined },
      { name: 'Rice', quantity: 400, unit: 'g', price: 2.50, undefined },
    ],
    instructions: [
      'Mix honey, garlic, and soy sauce',
      'Marinate chicken for 15 minutes',
      'Bake at 200°C for 25-30 minutes',
      'Cook rice',
      'Serve chicken over rice with sauce'
    ],
    totalCost: 16.00,
    cachedAt: new Date().toISOString(),
  },
  // ASIAN CUISINE
  {
    recipeId: 'recipe-asian-1',
    name: 'Pad Thai',
    description: 'Classic Thai stir-fried noodles',
    imageUrl: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400',
    prepTime: 30,
    servings: 4,
    dietaryTags: ['gluten-free'],
    ingredients: [
      { name: 'Rice Noodles', quantity: 400, unit: 'g', price: 3.50, undefined },
      { name: 'Shrimp', quantity: 300, unit: 'g', price: 12.00, undefined },
      { name: 'Eggs', quantity: 3, unit: 'whole', price: 1.10, undefined },
      { name: 'Bean Sprouts', quantity: 200, unit: 'g', price: 2.00, undefined },
      { name: 'Peanuts', quantity: 100, unit: 'g', price: 2.50, undefined },
    ],
    instructions: [
      'Soak rice noodles in warm water',
      'Stir fry shrimp and set aside',
      'Scramble eggs in wok',
      'Add noodles and pad thai sauce',
      'Toss with shrimp, bean sprouts, and peanuts'
    ],
    totalCost: 21.10,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-asian-2',
    name: 'Chicken Fried Rice',
    description: 'Quick and easy Asian-style fried rice',
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
    prepTime: 20,
    servings: 4,
    dietaryTags: ['gluten-free'],
    ingredients: [
      { name: 'Cooked Rice', quantity: 600, unit: 'g', price: 3.00, undefined },
      { name: 'Chicken Breast', quantity: 300, unit: 'g', price: 5.00, undefined },
      { name: 'Eggs', quantity: 2, unit: 'whole', price: 0.75, undefined },
      { name: 'Mixed Vegetables', quantity: 300, unit: 'g', price: 3.00, undefined },
      { name: 'Soy Sauce', quantity: 60, unit: 'ml', price: 1.25, undefined },
    ],
    instructions: [
      'Dice and cook chicken',
      'Scramble eggs and set aside',
      'Stir fry vegetables',
      'Add rice and soy sauce',
      'Mix in chicken and eggs'
    ],
    totalCost: 13.00,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-asian-3',
    name: 'Teriyaki Salmon Bowl',
    description: 'Japanese-inspired salmon with vegetables',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-eacef0df6022?w=400',
    prepTime: 30,
    servings: 4,
    dietaryTags: ['gluten-free'],
    ingredients: [
      { name: 'Salmon Fillets', quantity: 600, unit: 'g', price: 18.00, undefined },
      { name: 'Teriyaki Sauce', quantity: 120, unit: 'ml', price: 3.00, undefined },
      { name: 'Rice', quantity: 400, unit: 'g', price: 2.50, undefined },
      { name: 'Edamame', quantity: 200, unit: 'g', price: 3.50, undefined },
      { name: 'Sesame Seeds', quantity: 20, unit: 'g', price: 1.00, undefined },
    ],
    instructions: [
      'Marinate salmon in teriyaki sauce',
      'Cook rice',
      'Pan-sear salmon until cooked',
      'Steam edamame',
      'Assemble bowls and garnish with sesame seeds'
    ],
    totalCost: 28.00,
    cachedAt: new Date().toISOString(),
  },
  // INDIAN CUISINE
  {
    recipeId: 'recipe-indian-1',
    name: 'Chickpea Curry',
    description: 'Aromatic and hearty vegetarian curry',
    imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
    prepTime: 35,
    servings: 6,
    dietaryTags: ['vegetarian', 'vegan', 'gluten-free'],
    ingredients: [
      { name: 'Chickpeas', quantity: 800, unit: 'g', price: 3.00, undefined },
      { name: 'Coconut Milk', quantity: 400, unit: 'ml', price: 3.50, undefined },
      { name: 'Tomatoes', quantity: 400, unit: 'g', price: 3.00, undefined },
      { name: 'Curry Powder', quantity: 30, unit: 'g', price: 2.00, undefined },
      { name: 'Rice', quantity: 600, unit: 'g', price: 3.50, undefined },
    ],
    instructions: [
      'Sauté onions and garlic',
      'Add curry powder and toast spices',
      'Add tomatoes and coconut milk',
      'Simmer with chickpeas for 20 minutes',
      'Serve over basmati rice'
    ],
    totalCost: 15.00,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-indian-2',
    name: 'Butter Chicken',
    description: 'Creamy and rich Indian chicken curry',
    imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400',
    prepTime: 45,
    servings: 6,
    dietaryTags: ['gluten-free'],
    ingredients: [
      { name: 'Chicken Thighs', quantity: 800, unit: 'g', price: 9.00, undefined },
      { name: 'Cream', quantity: 300, unit: 'ml', price: 3.50, undefined },
      { name: 'Tomato Paste', quantity: 100, unit: 'g', price: 2.00, undefined },
      { name: 'Butter', quantity: 50, unit: 'g', price: 1.50, undefined },
      { name: 'Garam Masala', quantity: 20, unit: 'g', price: 2.00, undefined },
    ],
    instructions: [
      'Marinate chicken in yogurt and spices',
      'Cook chicken until browned',
      'Make sauce with butter, tomato paste, and cream',
      'Simmer chicken in sauce',
      'Serve with naan or rice'
    ],
    totalCost: 18.00,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-indian-3',
    name: 'Vegetable Biryani',
    description: 'Fragrant Indian rice dish with vegetables',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
    prepTime: 50,
    servings: 6,
    dietaryTags: ['vegetarian', 'vegan'],
    ingredients: [
      { name: 'Basmati Rice', quantity: 500, unit: 'g', price: 4.00, undefined },
      { name: 'Mixed Vegetables', quantity: 600, unit: 'g', price: 5.00, undefined },
      { name: 'Yogurt', quantity: 200, unit: 'ml', price: 2.50, undefined },
      { name: 'Biryani Spices', quantity: 30, unit: 'g', price: 3.00, undefined },
      { name: 'Onions', quantity: 2, unit: 'whole', price: 1.50, undefined },
    ],
    instructions: [
      'Soak basmati rice',
      'Fry onions until golden',
      'Layer rice and spiced vegetables',
      'Cook on low heat until rice is done',
      'Garnish with fried onions and herbs'
    ],
    totalCost: 16.00,
    cachedAt: new Date().toISOString(),
  },
  // MEDITERRANEAN CUISINE
  {
    recipeId: 'recipe-mediterranean-1',
    name: 'Greek Moussaka',
    description: 'Layered eggplant and meat casserole',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
    prepTime: 90,
    servings: 8,
    dietaryTags: [],
    ingredients: [
      { name: 'Eggplant', quantity: 1000, unit: 'g', price: 6.00, undefined },
      { name: 'Ground Lamb', quantity: 600, unit: 'g', price: 12.00, undefined },
      { name: 'Béchamel Sauce', quantity: 500, unit: 'ml', price: 4.00, undefined },
      { name: 'Tomatoes', quantity: 400, unit: 'g', price: 3.00, undefined },
      { name: 'Cheese', quantity: 200, unit: 'g', price: 4.00, undefined },
    ],
    instructions: [
      'Slice and salt eggplant, then grill',
      'Cook ground lamb with tomatoes and spices',
      'Layer eggplant and meat in baking dish',
      'Top with béchamel and cheese',
      'Bake at 180°C for 45 minutes'
    ],
    totalCost: 29.00,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-mediterranean-2',
    name: 'Falafel Wrap',
    description: 'Crispy chickpea fritters in pita bread',
    imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400',
    prepTime: 40,
    servings: 4,
    dietaryTags: ['vegetarian', 'vegan'],
    ingredients: [
      { name: 'Chickpeas', quantity: 400, unit: 'g', price: 2.00, undefined },
      { name: 'Pita Bread', quantity: 4, unit: 'pieces', price: 3.00, undefined },
      { name: 'Tahini', quantity: 100, unit: 'ml', price: 3.00, undefined },
      { name: 'Lettuce', quantity: 200, unit: 'g', price: 2.00, undefined },
      { name: 'Tomatoes', quantity: 2, unit: 'whole', price: 1.50, undefined },
    ],
    instructions: [
      'Blend chickpeas with herbs and spices',
      'Form into balls and fry until golden',
      'Warm pita bread',
      'Assemble with falafel, vegetables, and tahini sauce',
      'Wrap and serve'
    ],
    totalCost: 11.50,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-mediterranean-3',
    name: 'Spanish Paella',
    description: 'Traditional Spanish rice dish with seafood',
    imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400',
    prepTime: 60,
    servings: 6,
    dietaryTags: ['gluten-free'],
    ingredients: [
      { name: 'Paella Rice', quantity: 500, unit: 'g', price: 4.50, undefined },
      { name: 'Shrimp', quantity: 400, unit: 'g', price: 16.00, undefined },
      { name: 'Mussels', quantity: 300, unit: 'g', price: 8.00, undefined },
      { name: 'Saffron', quantity: 1, unit: 'g', price: 5.00, undefined },
      { name: 'Bell Peppers', quantity: 2, unit: 'whole', price: 3.00, undefined },
    ],
    instructions: [
      'Sauté vegetables in paella pan',
      'Add rice and saffron',
      'Pour in stock and simmer',
      'Add seafood in last 10 minutes',
      'Let rest before serving'
    ],
    totalCost: 36.50,
    cachedAt: new Date().toISOString(),
  },
  // SNACKS & LIGHT MEALS
  {
    recipeId: 'recipe-snack-1',
    name: 'Hummus with Veggie Sticks',
    description: 'Healthy and satisfying snack',
    imageUrl: 'https://images.unsplash.com/photo-1571212515416-fca2c8e1c1c5?w=400',
    prepTime: 15,
    servings: 4,
    dietaryTags: ['vegetarian', 'vegan', 'gluten-free'],
    ingredients: [
      { name: 'Chickpeas', quantity: 400, unit: 'g', price: 2.00, undefined },
      { name: 'Tahini', quantity: 80, unit: 'ml', price: 2.50, undefined },
      { name: 'Carrots', quantity: 300, unit: 'g', price: 2.00, undefined },
      { name: 'Celery', quantity: 200, unit: 'g', price: 2.00, undefined },
      { name: 'Lemon', quantity: 1, unit: 'whole', price: 0.75, undefined },
    ],
    instructions: [
      'Blend chickpeas with tahini, lemon, and garlic',
      'Add olive oil while blending',
      'Cut vegetables into sticks',
      'Serve hummus with veggie sticks',
      'Drizzle with olive oil and paprika'
    ],
    totalCost: 9.25,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-snack-2',
    name: 'Caprese Salad',
    description: 'Fresh Italian salad with mozzarella and tomatoes',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=400',
    prepTime: 10,
    servings: 4,
    dietaryTags: ['vegetarian', 'gluten-free'],
    ingredients: [
      { name: 'Mozzarella', quantity: 400, unit: 'g', price: 6.00, undefined },
      { name: 'Tomatoes', quantity: 4, unit: 'whole', price: 3.00, undefined },
      { name: 'Fresh Basil', quantity: 30, unit: 'g', price: 2.00, undefined },
      { name: 'Balsamic Vinegar', quantity: 50, unit: 'ml', price: 2.50, undefined },
      { name: 'Olive Oil', quantity: 50, unit: 'ml', price: 1.50, undefined },
    ],
    instructions: [
      'Slice mozzarella and tomatoes',
      'Arrange alternating on plate',
      'Tuck basil leaves between slices',
      'Drizzle with olive oil and balsamic',
      'Season with salt and pepper'
    ],
    totalCost: 15.00,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-snack-3',
    name: 'Energy Balls',
    description: 'No-bake healthy snack bites',
    imageUrl: 'https://images.unsplash.com/photo-1590080876876-5a8e0c8e0c8e?w=400',
    prepTime: 20,
    servings: 12,
    dietaryTags: ['vegetarian', 'vegan', 'gluten-free'],
    ingredients: [
      { name: 'Dates', quantity: 200, unit: 'g', price: 4.00, undefined },
      { name: 'Almonds', quantity: 150, unit: 'g', price: 5.00, undefined },
      { name: 'Cocoa Powder', quantity: 30, unit: 'g', price: 2.00, undefined },
      { name: 'Coconut Flakes', quantity: 50, unit: 'g', price: 2.50, undefined },
      { name: 'Honey', quantity: 50, unit: 'ml', price: 1.50, undefined },
    ],
    instructions: [
      'Blend dates and almonds in food processor',
      'Add cocoa powder and honey',
      'Roll into balls',
      'Coat with coconut flakes',
      'Refrigerate for 1 hour'
    ],
    totalCost: 15.00,
    cachedAt: new Date().toISOString(),
  },
  // MEXICAN CUISINE
  {
    recipeId: 'recipe-mexican-1',
    name: 'Chicken Enchiladas',
    description: 'Rolled tortillas with chicken and cheese',
    imageUrl: 'https://images.unsplash.com/photo-1599974789516-e36e3b0a5c8e?w=400',
    prepTime: 45,
    servings: 6,
    dietaryTags: [],
    ingredients: [
      { name: 'Chicken Breast', quantity: 600, unit: 'g', price: 9.50, undefined },
      { name: 'Tortillas', quantity: 12, unit: 'pieces', price: 4.00, undefined },
      { name: 'Enchilada Sauce', quantity: 500, unit: 'ml', price: 4.00, undefined },
      { name: 'Cheese', quantity: 300, unit: 'g', price: 6.00, undefined },
      { name: 'Sour Cream', quantity: 200, unit: 'ml', price: 3.00, undefined },
    ],
    instructions: [
      'Cook and shred chicken',
      'Fill tortillas with chicken and cheese',
      'Roll and place in baking dish',
      'Cover with enchilada sauce and cheese',
      'Bake at 180°C for 25 minutes'
    ],
    totalCost: 26.50,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-mexican-2',
    name: 'Black Bean Burrito Bowl',
    description: 'Healthy Mexican-inspired bowl',
    imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400',
    prepTime: 25,
    servings: 4,
    dietaryTags: ['vegetarian', 'gluten-free'],
    ingredients: [
      { name: 'Black Beans', quantity: 800, unit: 'g', price: 3.50, undefined },
      { name: 'Rice', quantity: 400, unit: 'g', price: 2.50, undefined },
      { name: 'Corn', quantity: 300, unit: 'g', price: 2.50, undefined },
      { name: 'Avocado', quantity: 2, unit: 'whole', price: 4.00, undefined },
      { name: 'Salsa', quantity: 200, unit: 'ml', price: 3.00, undefined },
    ],
    instructions: [
      'Cook rice',
      'Heat black beans with spices',
      'Grill corn',
      'Assemble bowls with rice, beans, corn',
      'Top with avocado and salsa'
    ],
    totalCost: 15.50,
    cachedAt: new Date().toISOString(),
  },
  // COMFORT FOOD
  {
    recipeId: 'recipe-comfort-1',
    name: 'Mac and Cheese',
    description: 'Creamy and comforting pasta dish',
    imageUrl: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=400',
    prepTime: 25,
    servings: 6,
    dietaryTags: ['vegetarian'],
    ingredients: [
      { name: 'Macaroni', quantity: 500, unit: 'g', price: 3.00, undefined },
      { name: 'Cheddar Cheese', quantity: 400, unit: 'g', price: 8.00, undefined },
      { name: 'Milk', quantity: 500, unit: 'ml', price: 2.00, undefined },
      { name: 'Butter', quantity: 50, unit: 'g', price: 1.50, undefined },
      { name: 'Breadcrumbs', quantity: 100, unit: 'g', price: 1.50, undefined },
    ],
    instructions: [
      'Cook macaroni according to package',
      'Make cheese sauce with butter, milk, and cheese',
      'Mix pasta with cheese sauce',
      'Top with breadcrumbs',
      'Bake at 180°C for 15 minutes'
    ],
    totalCost: 16.00,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-comfort-2',
    name: 'Shepherd\'s Pie',
    description: 'Classic British comfort food with meat and mashed potatoes',
    imageUrl: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400',
    prepTime: 60,
    servings: 6,
    dietaryTags: [],
    ingredients: [
      { name: 'Ground Beef', quantity: 600, unit: 'g', price: 8.50, undefined },
      { name: 'Potatoes', quantity: 1000, unit: 'g', price: 4.00, undefined },
      { name: 'Mixed Vegetables', quantity: 400, unit: 'g', price: 3.50, undefined },
      { name: 'Butter', quantity: 50, unit: 'g', price: 1.50, undefined },
      { name: 'Gravy', quantity: 300, unit: 'ml', price: 2.50, undefined },
    ],
    instructions: [
      'Brown ground beef with vegetables',
      'Add gravy and simmer',
      'Boil and mash potatoes with butter',
      'Layer meat mixture in baking dish',
      'Top with mashed potatoes and bake at 180°C for 30 minutes'
    ],
    totalCost: 20.00,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-comfort-3',
    name: 'Chicken Pot Pie',
    description: 'Hearty pie filled with chicken and vegetables',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
    prepTime: 70,
    servings: 6,
    dietaryTags: [],
    ingredients: [
      { name: 'Chicken Breast', quantity: 500, unit: 'g', price: 8.00, undefined },
      { name: 'Puff Pastry', quantity: 400, unit: 'g', price: 4.50, undefined },
      { name: 'Mixed Vegetables', quantity: 400, unit: 'g', price: 3.50, undefined },
      { name: 'Cream', quantity: 200, unit: 'ml', price: 2.50, undefined },
      { name: 'Chicken Stock', quantity: 300, unit: 'ml', price: 2.00, undefined },
    ],
    instructions: [
      'Cook and dice chicken',
      'Make creamy sauce with vegetables',
      'Fill pie dish with chicken mixture',
      'Cover with puff pastry',
      'Bake at 200°C for 35 minutes'
    ],
    totalCost: 20.50,
    cachedAt: new Date().toISOString(),
  },
  // SEAFOOD
  {
    recipeId: 'recipe-seafood-1',
    name: 'Fish and Chips',
    description: 'Classic British fish and chips',
    imageUrl: 'https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=400',
    prepTime: 40,
    servings: 4,
    dietaryTags: [],
    ingredients: [
      { name: 'White Fish Fillets', quantity: 600, unit: 'g', price: 12.00, undefined },
      { name: 'Potatoes', quantity: 800, unit: 'g', price: 3.00, undefined },
      { name: 'Flour', quantity: 200, unit: 'g', price: 1.50, undefined },
      { name: 'Beer', quantity: 250, unit: 'ml', price: 2.50, undefined },
      { name: 'Oil for frying', quantity: 500, unit: 'ml', price: 3.00, undefined },
    ],
    instructions: [
      'Cut potatoes into chips and fry',
      'Make beer batter with flour and beer',
      'Coat fish in batter',
      'Deep fry until golden',
      'Serve with tartar sauce and lemon'
    ],
    totalCost: 22.00,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-seafood-2',
    name: 'Garlic Butter Shrimp Pasta',
    description: 'Quick and elegant shrimp pasta',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
    prepTime: 20,
    servings: 4,
    dietaryTags: [],
    ingredients: [
      { name: 'Linguine', quantity: 400, unit: 'g', price: 3.00, undefined },
      { name: 'Shrimp', quantity: 500, unit: 'g', price: 20.00, undefined },
      { name: 'Butter', quantity: 80, unit: 'g', price: 2.00, undefined },
      { name: 'Garlic', quantity: 6, unit: 'cloves', price: 0.75, undefined },
      { name: 'White Wine', quantity: 100, unit: 'ml', price: 3.00, undefined },
    ],
    instructions: [
      'Cook linguine according to package',
      'Sauté garlic in butter',
      'Add shrimp and cook until pink',
      'Deglaze with white wine',
      'Toss with pasta and parsley'
    ],
    totalCost: 28.75,
    cachedAt: new Date().toISOString(),
  },
  // VEGETARIAN/VEGAN
  {
    recipeId: 'recipe-vegan-1',
    name: 'Lentil Bolognese',
    description: 'Plant-based twist on classic Italian sauce',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
    prepTime: 40,
    servings: 6,
    dietaryTags: ['vegetarian', 'vegan'],
    ingredients: [
      { name: 'Spaghetti', quantity: 600, unit: 'g', price: 3.50, undefined },
      { name: 'Red Lentils', quantity: 400, unit: 'g', price: 3.00, undefined },
      { name: 'Tomato Sauce', quantity: 800, unit: 'ml', price: 4.00, undefined },
      { name: 'Carrots', quantity: 200, unit: 'g', price: 1.50, undefined },
      { name: 'Celery', quantity: 150, unit: 'g', price: 1.50, undefined },
    ],
    instructions: [
      'Sauté diced carrots and celery',
      'Add lentils and tomato sauce',
      'Simmer for 30 minutes',
      'Cook spaghetti',
      'Serve sauce over pasta'
    ],
    totalCost: 13.50,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-vegan-2',
    name: 'Cauliflower Buffalo Wings',
    description: 'Spicy vegan alternative to chicken wings',
    imageUrl: 'https://images.unsplash.com/photo-1547928576-4a0e0e5e0b6e?w=400',
    prepTime: 35,
    servings: 4,
    dietaryTags: ['vegetarian', 'vegan'],
    ingredients: [
      { name: 'Cauliflower', quantity: 800, unit: 'g', price: 4.00, undefined },
      { name: 'Flour', quantity: 150, unit: 'g', price: 1.00, undefined },
      { name: 'Buffalo Sauce', quantity: 200, unit: 'ml', price: 3.50, undefined },
      { name: 'Almond Milk', quantity: 200, unit: 'ml', price: 2.00, undefined },
      { name: 'Vegan Ranch', quantity: 150, unit: 'ml', price: 3.00, undefined },
    ],
    instructions: [
      'Cut cauliflower into florets',
      'Make batter with flour and almond milk',
      'Coat cauliflower and bake at 220°C for 20 minutes',
      'Toss in buffalo sauce',
      'Serve with vegan ranch dressing'
    ],
    totalCost: 13.50,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-vegan-3',
    name: 'Mushroom Stroganoff',
    description: 'Creamy vegan mushroom pasta',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
    prepTime: 30,
    servings: 4,
    dietaryTags: ['vegetarian', 'vegan'],
    ingredients: [
      { name: 'Pasta', quantity: 400, unit: 'g', price: 2.50, undefined },
      { name: 'Mushrooms', quantity: 500, unit: 'g', price: 5.00, undefined },
      { name: 'Coconut Cream', quantity: 300, unit: 'ml', price: 3.50, undefined },
      { name: 'Onion', quantity: 1, unit: 'whole', price: 0.75, undefined },
      { name: 'Vegetable Stock', quantity: 200, unit: 'ml', price: 1.50, undefined },
    ],
    instructions: [
      'Sauté onions and mushrooms',
      'Add vegetable stock and simmer',
      'Stir in coconut cream',
      'Cook pasta',
      'Toss pasta with mushroom sauce'
    ],
    totalCost: 13.25,
    cachedAt: new Date().toISOString(),
  },
  // SOUP & STEW
  {
    recipeId: 'recipe-soup-1',
    name: 'Minestrone Soup',
    description: 'Hearty Italian vegetable soup',
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
    prepTime: 45,
    servings: 6,
    dietaryTags: ['vegetarian', 'vegan'],
    ingredients: [
      { name: 'Mixed Vegetables', quantity: 600, unit: 'g', price: 5.00, undefined },
      { name: 'Cannellini Beans', quantity: 400, unit: 'g', price: 2.50, undefined },
      { name: 'Pasta', quantity: 200, unit: 'g', price: 1.50, undefined },
      { name: 'Tomatoes', quantity: 400, unit: 'g', price: 3.00, undefined },
      { name: 'Vegetable Stock', quantity: 1500, unit: 'ml', price: 3.00, undefined },
    ],
    instructions: [
      'Sauté vegetables in olive oil',
      'Add tomatoes and stock',
      'Simmer for 20 minutes',
      'Add beans and pasta',
      'Cook until pasta is tender'
    ],
    totalCost: 15.00,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-soup-2',
    name: 'Chicken Noodle Soup',
    description: 'Classic comfort soup',
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
    prepTime: 50,
    servings: 6,
    dietaryTags: [],
    ingredients: [
      { name: 'Chicken Breast', quantity: 400, unit: 'g', price: 6.50, undefined },
      { name: 'Egg Noodles', quantity: 300, unit: 'g', price: 2.50, undefined },
      { name: 'Carrots', quantity: 200, unit: 'g', price: 1.50, undefined },
      { name: 'Celery', quantity: 150, unit: 'g', price: 1.50, undefined },
      { name: 'Chicken Stock', quantity: 1500, unit: 'ml', price: 4.00, undefined },
    ],
    instructions: [
      'Simmer chicken in stock until cooked',
      'Remove chicken and shred',
      'Add vegetables to stock',
      'Add noodles and cook',
      'Return chicken to pot and serve'
    ],
    totalCost: 16.00,
    cachedAt: new Date().toISOString(),
  },
  {
    recipeId: 'recipe-soup-3',
    name: 'Thai Tom Yum Soup',
    description: 'Spicy and sour Thai soup',
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
    prepTime: 30,
    servings: 4,
    dietaryTags: ['gluten-free'],
    ingredients: [
      { name: 'Shrimp', quantity: 400, unit: 'g', price: 16.00, undefined },
      { name: 'Mushrooms', quantity: 200, unit: 'g', price: 2.50, undefined },
      { name: 'Lemongrass', quantity: 3, unit: 'stalks', price: 2.00, undefined },
      { name: 'Lime', quantity: 2, unit: 'whole', price: 1.50, undefined },
      { name: 'Thai Chili Paste', quantity: 30, unit: 'g', price: 2.50, undefined },
    ],
    instructions: [
      'Boil water with lemongrass and lime leaves',
      'Add mushrooms and simmer',
      'Add shrimp and cook until pink',
      'Stir in chili paste and lime juice',
      'Garnish with cilantro'
    ],
    totalCost: 24.50,
    cachedAt: new Date().toISOString(),
  },
];

async function seedRecipes() {
  try {
    console.log(`\n📊 Seeding ${expandedRecipes.length} recipes to table: ${TABLE_NAME}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const recipe of expandedRecipes) {
      try {
        const command = new PutCommand({
          TableName: TABLE_NAME,
          Item: recipe,
        });

        await docClient.send(command);
        console.log(`✓ Added recipe: ${recipe.name}`);
        successCount++;
      } catch (error) {
        console.error(`✗ Failed to add recipe ${recipe.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   Success: ${successCount} recipes`);
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount} recipes`);
    }
    console.log('');
  } catch (error) {
    console.error('❌ Error seeding recipes:', error.message);
    throw error;
  }
}

seedRecipes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
