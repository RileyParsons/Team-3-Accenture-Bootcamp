# SaveSmart Infrastructure Setup

This directory contains scripts to set up and verify the AWS infrastructure for the SaveSmart backend.

## Prerequisites

1. **AWS CLI configured** with appropriate credentials:
   ```bash
   aws configure
   ```

2. **IAM Permissions** required:
   - `dynamodb:CreateTable`
   - `dynamodb:DescribeTable`
   - `dynamodb:ListTables`
   - `dynamodb:PutItem`
   - `dynamodb:GetItem`

3. **Node.js** version 18 or higher

## Setup Instructions

### 1. Install Dependencies

```bash
cd savesmart-backend/infrastructure
npm install
```

### 2. Create DynamoDB Tables

```bash
npm run setup
```

This script will:
- Create `savesmart-users` table with `userId` as partition key
- Create `savesmart-plans` table with `userId` as partition key and `planId` as sort key
- Add Global Secondary Index `userId-index` to the plans table
- Configure both tables with on-demand billing mode
- Verify table creation and access with test read/write operations

**Expected Output:**
```
🚀 SaveSmart DynamoDB Setup
============================

📋 Creating table: savesmart-users
✅ Table savesmart-users created successfully
⏳ Waiting for savesmart-users to become active...
✅ Table savesmart-users is now active

📋 Creating table: savesmart-plans
✅ Table savesmart-plans created successfully
✅ Global Secondary Index 'userId-index' created
⏳ Waiting for savesmart-plans to become active...
✅ Table savesmart-plans is now active

📊 Table Information:
...

🔍 Verifying table access...
✅ All table access tests passed!

✅ DynamoDB setup completed successfully!
```

### 3. Verify Tables (Optional)

To verify tables exist and are accessible:

```bash
npm run verify
```

This will display:
- List of all DynamoDB tables in the region
- Detailed information about each SaveSmart table
- Key schema and GSI configuration

## Table Schemas

### savesmart-users

**Purpose:** Store user profile data

**Keys:**
- Partition Key: `userId` (String)

**Attributes:**
- `userId`: Unique user identifier
- `email`: User's email address
- `name`: User's display name
- `income`: Monthly income (Number)
- `rent`: Monthly rent (Number)
- `groceryBudget`: Weekly grocery budget (Number)
- `savings`: Current savings (Number)
- `hasCar`: Whether user owns a car (Boolean)
- `fuelType`: Type of fuel (String, optional)
- `location`: Suburb name (String)
- `postcode`: Australian postcode (String, optional)
- `dietaryPreferences`: Array of dietary preferences (List)
- `subscriptions`: Array of subscriptions (List)
- `createdAt`: ISO 8601 timestamp (String)

**Billing:** On-demand (pay per request)

### savesmart-plans

**Purpose:** Store AI-generated savings plans

**Keys:**
- Partition Key: `userId` (String)
- Sort Key: `planId` (String)

**Global Secondary Index:**
- Index Name: `userId-index`
- Partition Key: `userId`
- Sort Key: `createdAt`
- Projection: ALL

**Attributes:**
- `userId`: User identifier (links to savesmart-users)
- `planId`: Unique plan identifier (format: `plan-{timestamp}`)
- `plan`: JSON object containing plan details
  - `goal`: Savings goal description
  - `timeline`: Time period for the goal
  - `monthly`: Monthly savings target
  - `breakdown`: Array of savings categories
- `createdAt`: ISO 8601 timestamp (String)

**Billing:** On-demand (pay per request)

## Troubleshooting

### Error: "Unable to locate credentials"

**Solution:** Configure AWS CLI with your credentials:
```bash
aws configure
```

### Error: "User is not authorized to perform: dynamodb:CreateTable"

**Solution:** Ensure your IAM user/role has the required DynamoDB permissions.

### Error: "ResourceInUseException: Table already exists"

**Solution:** This is expected if tables were already created. The script will skip creation and verify access.

### Tables created but verification fails

**Solution:** Check that your IAM user/role has `dynamodb:PutItem` and `dynamodb:GetItem` permissions.

## AWS Console Verification

You can also verify table creation in the AWS Console:

1. Go to [DynamoDB Console](https://ap-southeast-2.console.aws.amazon.com/dynamodbv2/home?region=ap-southeast-2#tables)
2. Look for tables:
   - `savesmart-users`
   - `savesmart-plans`
3. Click on each table to view:
   - Key schema
   - Global Secondary Indexes
   - Item count
   - Billing mode

## Next Steps

After setting up DynamoDB tables:

1. ✅ DynamoDB tables created
2. ⬜ Deploy Lambda functions (see `../DEPLOYMENT.md`)
3. ⬜ Configure API Gateway
4. ⬜ Set environment variables in Lambda functions
5. ⬜ Test end-to-end API flow

## Cleanup (Optional)

To delete the tables (use with caution):

```bash
aws dynamodb delete-table --table-name savesmart-users --region ap-southeast-2
aws dynamodb delete-table --table-name savesmart-plans --region ap-southeast-2
```

**Warning:** This will permanently delete all data in the tables.
