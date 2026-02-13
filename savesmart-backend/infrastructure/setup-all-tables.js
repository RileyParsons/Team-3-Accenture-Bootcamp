/**
 * Setup All DynamoDB Tables Script
 *
 * Creates all required DynamoDB tables for SaveSmart application.
 *
 * Usage: node setup-all-tables.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tables = [
  'setup-transactions-table.js',
  'setup-events-table.js',
  'setup-recipes-table.js',
  'setup-fuel-stations-table.js',
];

console.log('\n🚀 Setting up all DynamoDB tables for SaveSmart...\n');

/**
 * Run a setup script
 */
function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const scriptPath = join(__dirname, scriptName);
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script ${scriptName} exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Run all setup scripts sequentially
 */
async function setupAllTables() {
  for (const script of tables) {
    try {
      await runScript(script);
    } catch (error) {
      console.error(`\n❌ Failed to run ${script}:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n✅ All tables have been set up successfully!\n');
  console.log('Tables created:');
  console.log('  ✓ savesmart-transactions');
  console.log('  ✓ savesmart-events');
  console.log('  ✓ savesmart-recipes');
  console.log('  ✓ savesmart-fuel-stations');
  console.log('\nYou can now restart your backend server.\n');
}

// Run the setup
setupAllTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
