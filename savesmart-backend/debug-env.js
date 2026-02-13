/**
 * Debug Environment Variables
 *
 * This script helps debug environment variable loading issues
 * Run with: node debug-env.js
 */

import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('='.repeat(70));
console.log('Environment Variables Debug Tool');
console.log('='.repeat(70));
console.log();

// Check .env file
const envPath = join(__dirname, '.env');
console.log('1. Checking .env file location:');
console.log(`   Path: ${envPath}`);
console.log(`   Exists: ${existsSync(envPath) ? '✓ YES' : '✗ NO'}`);
console.log();

if (!existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.error('\n   Please create .env file by copying .env.example:');
  console.error('   cp .env.example .env\n');
  process.exit(1);
}

// Read .env file content
console.log('2. Reading .env file content:');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n').filter(line =>
    line.trim() && !line.trim().startsWith('#')
  );
  console.log(`   Found ${lines.length} non-comment lines`);
  console.log();

  // Show first few characters of each variable
  console.log('   Variables in .env file:');
  lines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      const displayValue = value.length > 30 ? value.substring(0, 30) + '...' : value;
      console.log(`   - ${key.trim()}: ${displayValue}`);
    }
  });
} catch (error) {
  console.error(`   ✗ Error reading file: ${error.message}`);
}
console.log();

// Load with dotenv
console.log('3. Loading with dotenv:');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error(`   ✗ Error: ${result.error.message}`);
  process.exit(1);
} else {
  console.log('   ✓ Loaded successfully');
}
console.log();

// Check specific variables
console.log('4. Checking process.env after loading:');
const checkVars = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'OPENAI_API_KEY',
  'PORT',
  'NODE_ENV',
];

checkVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = value.length > 30 ? value.substring(0, 30) + '...' : value;
    console.log(`   ✓ ${varName}: ${displayValue}`);
  } else {
    console.log(`   ✗ ${varName}: NOT SET`);
  }
});

console.log();
console.log('='.repeat(70));
console.log('Debug complete!');
console.log();

if (!process.env.AWS_REGION) {
  console.error('❌ AWS_REGION is still not set after loading .env');
  console.error('\nPossible issues:');
  console.error('1. .env file has incorrect format (check for spaces around =)');
  console.error('2. .env file has Windows line endings (try dos2unix)');
  console.error('3. Variable is commented out in .env');
  console.error('\nTry running: npm run check-env\n');
} else {
  console.log('✓ Environment variables loaded correctly!');
  console.log('  You can now run: npm run dev\n');
}
