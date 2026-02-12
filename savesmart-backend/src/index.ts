import express from 'express';
import dotenv from 'dotenv';
import { getConfig } from './config/env.js';
import { testConnection, validateTables } from './config/aws.js';
import { corsMiddleware } from './middleware/cors.js';
import { loggerMiddleware } from './middleware/logger.js';

// Load environment variables first
dotenv.config();

const app = express();

// Middleware
app.use(corsMiddleware);
app.use(loggerMiddleware);
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SaveSmart backend is running' });
});

/**
 * Initialize the application
 * Validates configuration and tests database connection before starting server
 */
async function initializeApp() {
  try {
    console.log('\n🚀 Starting SaveSmart Backend Server...\n');

    // Load and validate environment configuration
    console.log('📋 Loading environment configuration...');
    const config = getConfig();
    console.log(`✓ Environment: ${config.nodeEnv}`);
    console.log(`✓ Port: ${config.port}`);
    console.log(`✓ CORS Origin: ${config.corsOrigin}`);
    console.log(`✓ AWS Region: ${config.aws.region}`);
    console.log(`✓ OpenAI API configured: ${config.openai.apiKey ? 'Yes' : 'No'}`);

    // Test DynamoDB connection
    console.log('\n🔌 Testing DynamoDB connection...');
    const connectionSuccess = await testConnection();

    if (!connectionSuccess) {
      console.error('\n❌ Failed to connect to DynamoDB');
      console.error('The server will start but database operations will fail.\n');
    }

    // Validate required tables exist
    console.log('\n📊 Validating DynamoDB tables...');
    await validateTables();

    // Start the Express server
    app.listen(config.port, () => {
      console.log('\n✅ SaveSmart Backend Server is ready!');
      console.log(`\n🌐 Server running at: http://localhost:${config.port}`);
      console.log(`📝 Health check: http://localhost:${config.port}/health\n`);
    });
  } catch (error) {
    console.error('\n❌ Failed to start server:');
    if (error instanceof Error) {
      console.error(error.message);
    }
    console.error('\nThe server cannot start. Please fix the errors above and try again.\n');
    process.exit(1);
  }
}

// Start the application
initializeApp();

export default app;
