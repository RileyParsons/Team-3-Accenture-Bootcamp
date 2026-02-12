/**
 * Seed Recipes Script
 *
 * Populates the recipes table with sample recipe data
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-2';
const TABLE_NAME = 'savesmart-recipes';

const client = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const mockRecipes = [
  {
    recipeId: 'recipe-1',
    name: 'Budget Pasta Carbonara',
    description: 'A classic Italian pasta dish that\'s quick, easy, and budget-friendly',
    imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
    prepTime: 20,
    servings: 4,
    dietaryTags: [],
    ingredients: [
      { name: 'Spaghetti', quantity: 400, unit: 'g', price: 2.50, source: 'mock' },
      { name: 'Bacon', quantity: 200, unit: 'g', price: 4.00, source: 'mock' },
      { name: 'Eggs', quantity: 4, unit: 'whole', price: 1.50, source: 'mock' },
      { name: 'Parmesan Cheese', quantity: 100, unit: 'g', price: 3.00, source: 'mock' },
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
    recipeId: 'recipe-2',
    name: 'Vegetarian Stir Fry',
    description: 'Colorful and nutritious vegetable stir fry with tofu',
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
    prepTime: 15,
    servings: 3,
    dietaryTags: ['vegetarian', 'vegan'],
    ingredients: [
      { name: 'Tofu', quantity: 300, unit: 'g', price: 3.50, source: 'mock' },
      { name: 'Mixed Vegetables', quantity: 500, unit: 'g', price: 4.00, source: 'mock' },
      { name: 'Soy Sauce', quantity: 50, unit: 'ml', price: 1.00, source: 'mock' },
      { name: 'Rice', quantity: 300, unit: 'g', price: 2.00, source: 'mock' },
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
    recipeId: 'recipe-3',
    name: 'Chicken and Rice Bowl',
    description: 'Simple and satisfying one-bowl meal',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    prepTime: 25,
    servings: 4,
    dietaryTags: ['gluten-free'],
    ingredients: [
      { name: 'Chicken Breast', quantity: 500, unit: 'g', price: 8.00, source: 'mock' },
      { name: 'Rice', quantity: 400, unit: 'g', price: 2.50, source: 'mock' },
      { name: 'Broccoli', quantity: 300, unit: 'g', price: 3.00, source: 'mock' },
      { name: 'Soy Sauce', quantity: 50, unit: 'ml', price: 1.00, source: 'mock' },
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
    recipeId: 'recipe-4',
    name: 'Vegan Buddha Bowl',
    description: 'Nutritious and colorful plant-based bowl',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    prepTime: 30,
    servings: 2,
    dietaryTags: ['vegan', 'vegetarian', 'gluten-free'],
    ingredients: [
      { name: 'Quinoa', quantity: 200, unit: 'g', price: 3.00, source: 'mock' },
      { name: 'Chickpeas', quantity: 400, unit: 'g', price: 2.00, source: 'mock' },
      { name: 'Sweet Potato', quantity: 300, unit: 'g', price: 2.50, source: 'mock' },
      { name: 'Kale', quantity: 100, unit: 'g', price: 2.00, source: 'mock' },
      { name: 'Tahini', quantity: 50, unit: 'ml', price: 2.50, source: 'mock' },
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
    recipeId: 'recipe-5',
    name: 'Quick Tuna Pasta',
    description: 'Fast and affordable weeknight dinner',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
    prepTime: 15,
    servings: 3,
    dietaryTags: [],
    ingredients: [
      { name: 'Pasta', quantity: 300, unit: 'g', price: 2.00, source: 'mock' },
      { name: 'Canned Tuna', quantity: 200, unit: 'g', price: 3.50, source: 'mock' },
      { name: 'Tomato Sauce', quantity: 400, unit: 'ml', price: 2.50, source: 'mock' },
      { name: 'Garlic', quantity: 3, unit: 'cloves', price: 0.50, source: 'mock' },
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
    recipeId: 'recipe-6',
    name: 'Veggie Quesadillas',
    description: 'Cheesy and satisfying Mexican-inspired meal',
    imageUrl: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400',
    prepTime: 20,
    servings: 4,
    dietaryTags: ['vegetarian'],
    ingredients: [
      { name: 'Tortillas', quantity: 8, unit: 'pieces', price: 3.00, source: 'mock' },
      { name: 'Cheese', quantity: 200, unit: 'g', price: 4.00, source: 'mock' },
      { name: 'Bell Peppers', quantity: 2, unit: 'whole', price: 3.00, source: 'mock' },
      { name: 'Onion', quantity: 1, unit: 'whole', price: 1.00, source: 'mock' },
      { name: 'Black Beans', quantity: 400, unit: 'g', price: 2.00, source: 'mock' },
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
];

async function seedRecipes() {
  try {
    console.log(`\n📊 Seeding recipes to table: ${TABLE_NAME}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const recipe of mockRecipes) {
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
