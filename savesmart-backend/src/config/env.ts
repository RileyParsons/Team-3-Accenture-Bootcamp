/**
 * Environment Configuration Module
 *
 * Loads and validates environment variables required for the application.
 * Fails gracefully with descriptive errors if required variables are missing.
 */

// Ensure env-loader runs first
import '../env-loader.js';

interface EnvironmentConfig {
  // Server Configuration
  port: number;
  nodeEnv: string;
  corsOrigin: string;

  // AWS Configuration
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };

  // DynamoDB Table Names
  dynamodb: {
    usersTable: string;
    plansTable: string;
    eventsTable: string;
    recipesTable: string;
    fuelStationsTable: string;
    transactionsTable: string;
  };

  // OpenAI API Configuration
  openai: {
    apiKey: string;
  };

  // External API Keys (Optional)
  externalApis: {
    eventbriteApiKey?: string;
    fuelcheckApiKey?: string;
    groceryApiKey?: string;
  };
}

/**
 * Validates that a required environment variable is present
 * @param name - The name of the environment variable
 * @param value - The value of the environment variable
 * @throws Error if the variable is missing or empty
 */
function requireEnvVar(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Please ensure ${name} is set in your .env file.\n` +
      `See .env.example for reference.`
    );
  }
  return value.trim();
}

/**
 * Gets an optional environment variable
 * @param name - The name of the environment variable
 * @param defaultValue - The default value if not set
 */
function getEnvVar(name: string, defaultValue: string = ''): string {
  return process.env[name]?.trim() || defaultValue;
}

/**
 * Loads and validates all environment variables
 * @returns Validated environment configuration object
 * @throws Error if any required variables are missing
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  try {
    // Server Configuration
    const port = parseInt(getEnvVar('PORT', '3001'), 10);
    const nodeEnv = getEnvVar('NODE_ENV', 'development');
    const corsOrigin = getEnvVar('CORS_ORIGIN', 'http://localhost:3000');

    // AWS Configuration - All required
    const awsRegion = requireEnvVar('AWS_REGION', process.env.AWS_REGION);
    const awsAccessKeyId = requireEnvVar('AWS_ACCESS_KEY_ID', process.env.AWS_ACCESS_KEY_ID);
    const awsSecretAccessKey = requireEnvVar('AWS_SECRET_ACCESS_KEY', process.env.AWS_SECRET_ACCESS_KEY);

    // DynamoDB Table Names - All required
    const usersTable = requireEnvVar('DYNAMODB_USERS_TABLE', process.env.DYNAMODB_USERS_TABLE);
    const plansTable = requireEnvVar('DYNAMODB_PLANS_TABLE', process.env.DYNAMODB_PLANS_TABLE);
    const eventsTable = requireEnvVar('DYNAMODB_EVENTS_TABLE', process.env.DYNAMODB_EVENTS_TABLE);
    const recipesTable = requireEnvVar('DYNAMODB_RECIPES_TABLE', process.env.DYNAMODB_RECIPES_TABLE);
    const fuelStationsTable = requireEnvVar('DYNAMODB_FUEL_STATIONS_TABLE', process.env.DYNAMODB_FUEL_STATIONS_TABLE);
    const transactionsTable = getEnvVar('DYNAMODB_TRANSACTIONS_TABLE', 'savesmart-transactions');

    // OpenAI API Key - Required (replacing n8n webhooks temporarily)
    const openaiApiKey = requireEnvVar('OPENAI_API_KEY', process.env.OPENAI_API_KEY);

    // External API Keys - Optional
    const eventbriteApiKey = getEnvVar('EVENTBRITE_API_KEY');
    const fuelcheckApiKey = getEnvVar('FUELCHECK_API_KEY');
    const groceryApiKey = getEnvVar('GROCERY_API_KEY');

    return {
      port,
      nodeEnv,
      corsOrigin,
      aws: {
        region: awsRegion,
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
      dynamodb: {
        usersTable,
        plansTable,
        eventsTable,
        recipesTable,
        fuelStationsTable,
        transactionsTable,
      },
      openai: {
        apiKey: openaiApiKey,
      },
      externalApis: {
        eventbriteApiKey: eventbriteApiKey || undefined,
        fuelcheckApiKey: fuelcheckApiKey || undefined,
        groceryApiKey: groceryApiKey || undefined,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('\n❌ Environment Configuration Error:');
      console.error(error.message);
      console.error('\nResolution Steps:');
      console.error('1. Copy .env.example to .env');
      console.error('2. Fill in all required environment variables');
      console.error('3. Ensure AWS credentials are valid');
      console.error('4. Restart the server\n');
    }
    throw error;
  }
}

// Export singleton instance
let config: EnvironmentConfig | null = null;

/**
 * Gets the environment configuration singleton
 * Loads configuration on first call
 */
export function getConfig(): EnvironmentConfig {
  if (!config) {
    config = loadEnvironmentConfig();
  }
  return config;
}

export type { EnvironmentConfig };
