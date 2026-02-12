# SaveSmart Backend

A local Express.js backend server for the SaveSmart application, providing AI-powered financial advice, recipe browsing, event discovery, and fuel price tracking.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Starting the Server](#starting-the-server)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Architecture](#architecture)

## Overview

The SaveSmart backend runs locally on **localhost:3001** and provides:

- **AI Chat Interface**: Conversational financial advice powered by OpenAI
- **Profile Management**: User profile CRUD operations
- **Savings Dashboard**: Track savings statistics and progress
- **Recipe Browser**: Browse recipes with real-time ingredient pricing
- **Events Discovery**: Find local events with deals and discounts
- **Fuel Prices**: View fuel prices from nearby stations

The backend integrates with:
- **AWS DynamoDB** for data persistence
- **OpenAI API** for AI chat functionality
- **External APIs** (Eventbrite, FuelCheck, Grocery) with automatic fallback to mock data

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **AWS Account** with DynamoDB access
- **AWS CLI** configured with credentials ([Setup Guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html))

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   cd savesmart-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the TypeScript code**:
   ```bash
   npm run build
   ```

## Environment Configuration

### 1. Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### 2. Configure Required Variables

Open `.env` and configure the following **required** variables:

#### Server Configuration
```env
PORT=3001
NODE_ENV=development
```

#### AWS Configuration
```env
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
```

**How to get AWS credentials:**
1. Log in to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to IAM → Users → Your User → Security Credentials
3. Create an access key if you don't have one
4. Copy the Access Key ID and Secret Access Key

**Required IAM Permissions:**
- `dynamodb:PutItem`
- `dynamodb:GetItem`
- `dynamodb:UpdateItem`
- `dynamodb:Query`
- `dynamodb:Scan`
- `dynamodb:DescribeTable`

#### DynamoDB Table Names
```env
DYNAMODB_USERS_TABLE=savesmart-users
DYNAMODB_PLANS_TABLE=savesmart-plans
DYNAMODB_EVENTS_TABLE=savesmart-events
DYNAMODB_RECIPES_TABLE=savesmart-recipes
DYNAMODB_FUEL_STATIONS_TABLE=savesmart-fuel-stations
```

#### OpenAI API Configuration
```env
OPENAI_API_KEY=your_openai_api_key_here
```

**How to get OpenAI API key:**
1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Navigate to API Keys section
3. Create a new API key
4. Copy and paste it into your `.env` file

#### CORS Configuration
```env
CORS_ORIGIN=http://localhost:3000
```

### 3. Optional External API Keys

These are **optional**. If not provided, the backend will automatically use mock data:

```env
# Optional - for real event data
EVENTBRITE_API_KEY=

# Optional - for real fuel price data (NSW only)
FUELCHECK_API_KEY=

# Optional - for real grocery pricing
GROCERY_API_KEY=
```

### 4. Set Up DynamoDB Tables

The backend requires the following DynamoDB tables. You can create them using the AWS Console or AWS CLI:

#### Using AWS Console:

1. Go to [DynamoDB Console](https://console.aws.amazon.com/dynamodb/)
2. Click "Create table" for each table below:

**Table 1: savesmart-users**
- Table name: `savesmart-users`
- Partition key: `userId` (String)
- Leave other settings as default

**Table 2: savesmart-plans**
- Table name: `savesmart-plans`
- Partition key: `planId` (String)
- Sort key: `userId` (String)

**Table 3: savesmart-events**
- Table name: `savesmart-events`
- Partition key: `eventId` (String)

**Table 4: savesmart-recipes**
- Table name: `savesmart-recipes`
- Partition key: `recipeId` (String)

**Table 5: savesmart-fuel-stations**
- Table name: `savesmart-fuel-stations`
- Partition key: `stationId` (String)

#### Using AWS CLI:

```bash
# Create users table
aws dynamodb create-table \
  --table-name savesmart-users \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-2

# Create plans table
aws dynamodb create-table \
  --table-name savesmart-plans \
  --attribute-definitions AttributeName=planId,AttributeType=S AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=planId,KeyType=HASH AttributeName=userId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-2

# Create events table
aws dynamodb create-table \
  --table-name savesmart-events \
  --attribute-definitions AttributeName=eventId,AttributeType=S \
  --key-schema AttributeName=eventId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-2

# Create recipes table
aws dynamodb create-table \
  --table-name savesmart-recipes \
  --attribute-definitions AttributeName=recipeId,AttributeType=S \
  --key-schema AttributeName=recipeId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-2

# Create fuel-stations table
aws dynamodb create-table \
  --table-name savesmart-fuel-stations \
  --attribute-definitions AttributeName=stationId,AttributeType=S \
  --key-schema AttributeName=stationId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-2
```

## Starting the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

This starts the server with hot-reload enabled. Any changes to TypeScript files will automatically restart the server.

### Production Mode

```bash
npm start
```

This runs the compiled JavaScript from the `dist/` directory.

### Verify Server is Running

Once started, you should see:

```
🚀 Starting SaveSmart Backend Server...

📋 Loading environment configuration...
✓ Environment: development
✓ Port: 3001
✓ CORS Origin: http://localhost:3000
✓ AWS Region: ap-southeast-2
✓ OpenAI API configured: Yes

🔌 Testing DynamoDB connection...
✓ DynamoDB connection successful

📊 Validating DynamoDB tables...
✓ Table savesmart-users exists
✓ Table savesmart-plans exists
✓ Table savesmart-events exists
✓ Table savesmart-recipes exists
✓ Table savesmart-fuel-stations exists

✅ SaveSmart Backend Server is ready!

🌐 Server running at: http://localhost:3001
📝 Health check: http://localhost:3001/health
```

### Health Check

Test the server is running:

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "SaveSmart backend is running"
}
```

## API Endpoints

### Chat
- `POST /api/chat` - Send a message to the AI chat agent

### Profile
- `GET /api/profile/:userId` - Get user profile
- `PUT /api/profile/:userId` - Update user profile

### Recipes
- `GET /api/recipes` - List all recipes (supports dietary filtering)
- `GET /api/recipes/:recipeId` - Get recipe details with pricing

### Events
- `GET /api/events` - List local events (supports location filtering)

### Fuel Prices
- `GET /api/fuel-prices` - Get fuel station prices (supports location and fuel type filtering)

### Dashboard
- `GET /api/dashboard/:userId` - Get savings statistics and dashboard data

For detailed API documentation, see the [Design Document](.kiro/specs/local-backend-expansion/design.md).

## Testing

### Run All Tests

```bash
npm test
```

### Run Unit Tests Only

```bash
npm run test:unit
```

### Run Property-Based Tests Only

```bash
npm run test:property
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Watch Mode (for development)

```bash
npm run test:watch
```

## Troubleshooting

### Issue: Server fails to start with "Missing required environment variables"

**Solution:**
1. Ensure you have created a `.env` file in the `savesmart-backend` directory
2. Copy all variables from `.env.example` to `.env`
3. Fill in the required values (AWS credentials, OpenAI API key)

### Issue: "Failed to connect to DynamoDB"

**Possible causes and solutions:**

1. **Invalid AWS credentials**
   - Verify your `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in `.env`
   - Test credentials: `aws sts get-caller-identity`

2. **Wrong AWS region**
   - Ensure `AWS_REGION` matches where your DynamoDB tables are located
   - Default is `ap-southeast-2` (Sydney)

3. **Missing IAM permissions**
   - Your AWS user needs DynamoDB permissions
   - Attach the `AmazonDynamoDBFullAccess` policy or create a custom policy

4. **AWS CLI not configured**
   - Run `aws configure` to set up credentials
   - Or use environment variables in `.env`

### Issue: "Table [table-name] does not exist"

**Solution:**
1. Create the missing DynamoDB table (see [Environment Configuration](#4-set-up-dynamodb-tables))
2. Verify table names in `.env` match your actual table names
3. Check tables exist: `aws dynamodb list-tables --region ap-southeast-2`

### Issue: "OpenAI API error" or chat not working

**Possible causes and solutions:**

1. **Missing or invalid API key**
   - Verify `OPENAI_API_KEY` in `.env`
   - Test key at [OpenAI Platform](https://platform.openai.com/)

2. **Insufficient credits**
   - Check your OpenAI account has available credits
   - Add payment method if needed

3. **Rate limiting**
   - You may be hitting OpenAI rate limits
   - Wait a few minutes and try again
   - Consider upgrading your OpenAI plan

### Issue: External APIs returning mock data

**This is expected behavior!**

The backend automatically falls back to mock data when external APIs are unavailable or not configured. This ensures the application works even without:
- Eventbrite API key
- FuelCheck API key
- Grocery API key

To use real data, add the respective API keys to your `.env` file.

### Issue: Port 3001 already in use

**Solution:**
1. Find the process using port 3001:
   ```bash
   # On macOS/Linux
   lsof -i :3001

   # On Windows
   netstat -ano | findstr :3001
   ```

2. Kill the process or change the port in `.env`:
   ```env
   PORT=3002
   ```

### Issue: CORS errors from frontend

**Solution:**
1. Ensure `CORS_ORIGIN` in `.env` matches your frontend URL
2. Default is `http://localhost:3000`
3. If frontend runs on a different port, update accordingly:
   ```env
   CORS_ORIGIN=http://localhost:3001
   ```

### Issue: TypeScript compilation errors

**Solution:**
1. Ensure you're using Node.js >= 20.0.0:
   ```bash
   node --version
   ```

2. Clean and rebuild:
   ```bash
   rm -rf dist node_modules
   npm install
   npm run build
   ```

### Getting Help

If you encounter issues not covered here:

1. Check the [Design Document](.kiro/specs/local-backend-expansion/design.md) for architecture details
2. Check the [Requirements Document](.kiro/specs/local-backend-expansion/requirements.md) for feature specifications
3. Review server logs for detailed error messages
4. Contact the development team

## Architecture

### Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: AWS DynamoDB
- **AI Integration**: OpenAI API
- **Testing**: Jest + fast-check (property-based testing)

### Project Structure

```
savesmart-backend/
├── src/
│   ├── index.ts              # Server entry point
│   ├── config/
│   │   ├── env.ts           # Environment configuration
│   │   └── aws.ts           # DynamoDB client setup
│   ├── routes/
│   │   ├── chat.ts          # Chat endpoints
│   │   ├── profile.ts       # Profile endpoints
│   │   ├── recipes.ts       # Recipe endpoints
│   │   ├── events.ts        # Events endpoints
│   │   └── fuel.ts          # Fuel price endpoints
│   ├── services/
│   │   ├── dynamodb.ts      # DynamoDB operations
│   │   ├── openai.ts        # OpenAI integration
│   │   ├── eventbrite.ts    # Eventbrite API
│   │   ├── fuelcheck.ts     # FuelCheck API
│   │   └── grocery.ts       # Grocery pricing API
│   ├── models/
│   │   ├── User.ts          # User data model
│   │   ├── SavingsPlan.ts   # Savings plan model
│   │   ├── Event.ts         # Event model
│   │   ├── Recipe.ts        # Recipe model
│   │   └── FuelStation.ts   # Fuel station model
│   ├── middleware/
│   │   ├── cors.ts          # CORS configuration
│   │   ├── logger.ts        # Request logging
│   │   └── errorHandler.ts # Error handling
│   └── utils/
│       ├── mockData.ts      # Mock data generators
│       └── cache.ts         # Caching utilities
├── .env                      # Environment variables (not in git)
├── .env.example             # Environment template
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

### Key Features

- **Graceful Degradation**: Automatically falls back to mock data when external APIs fail
- **Comprehensive Error Handling**: All errors are logged and return user-friendly messages
- **Caching**: Reduces external API calls with intelligent caching (1 hour for events, 30 minutes for fuel, 24 hours for recipes)
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Testing**: Unit tests and property-based tests for reliability

### Data Flow

```
Frontend (React)
    ↓
Express Server (localhost:3001)
    ↓
├── DynamoDB (User data, Plans, Cached data)
├── OpenAI API (Chat functionality)
└── External APIs (Eventbrite, FuelCheck, Grocery)
    └── Mock Data (Fallback)
```

## License

This project is part of the SaveSmart application suite.

---

**Need help?** Check the [Troubleshooting](#troubleshooting) section or contact the development team.
