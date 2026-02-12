/**
 * Environment Configuration Checker
 *
 * Run this script to verify your .env file is properly configured
 * Usage: node check-env.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
const envPath = join(__dirname, '.env');
dotenv.config({ path: envPath });

console.log('='.repeat(60));
console.log('SaveSmart Backend - Environment Configuration Check');
console.log('='.repeat(60));
console.log();

// Check if .env file exists
if (!existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.error(`   Expected location: ${envPath}`);
  console.error('\n   Please copy .env.example to .env and configure it.');
  process.exit(1);
}

console.log('✓ .env file found');
console.log();

// Required variables
const required = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'DYNAMODB_USERS_TABLE',
  'DYNAMODB_PLANS_TABLE',
  'DYNAMODB_EVENTS_TABLE',
  'DYNAMODB_RECIPES_TABLE',
  'DYNAMODB_FUEL_STATIONS_TABLE',
  'OPENAI_API_KEY',
];

// Optional variables
const optional = [
  'PORT',
  'NODE_ENV',
  'CORS_ORIGIN',
  'EVENTBRITE_API_KEY',
  'FUELCHECK_API_KEY',
  'GROCERY_API_KEY',
];

let hasErrors = false;

console.log('Required Environment Variables:');
console.log('-'.repeat(60));
for (const varName of required) {
  const value = process.env[varName];
  if (!value || value.trim() === '') {
    console.error(`❌ ${varName}: MISSING`);
    hasErrors = true;
  } else if (value === 'test_key' || value === 'test_secret') {
    console.warn(`⚠️  ${varName}: ${value} (placeholder - update with real value)`);
  } else {
    const displayValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`✓ ${varName}: ${displayValue}`);
  }
}

console.log();
console.log('Optional Environment Variables:');
console.log('-'.repeat(60));
for (const varName of optional) {
  const value = process.env[varName];
  if (!value || value.trim() === '') {
    console.log(`  ${varName}: (using default)`);
  } else {
    const displayValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`✓ ${varName}: ${displayValue}`);
  }
}

console.log();
console.log('='.repeat(60));

if (hasErrors) {
  console.error('❌ Configuration has errors!');
  console.error('\nPlease fix the missing variables in your .env file.');
  console.error('See .env.example for reference.\n');
  process.exit(1);
} else {
  console.log('✓ All required variables are configured!');
  console.log('\nNote: If you see placeholder values (test_key, test_secret),');
  console.log('update them with real AWS credentials and OpenAI API key.\n');
  console.log('You can now start the server with: npm run dev\n');
}
