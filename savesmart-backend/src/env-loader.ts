/**
 * Environment Loader
 *
 * This file MUST be imported first before any other modules
 * to ensure environment variables are loaded from .env file
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (one level up from src/)
const envPath = join(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('⚠️  Warning: Could not load .env file');
  console.error(`   Tried: ${envPath}`);
  console.error(`   Error: ${result.error.message}`);
  console.error('\n   Environment variables must be set manually or via system environment.\n');
}

// Export a flag to indicate env is loaded
export const envLoaded = true;
