# DynamoDB Setup Guide

## Quick Start

This guide will help you set up the DynamoDB tables for SaveSmart.

## Option 1: Automated Setup (Recommended)

### Prerequisites

1. **Install AWS CLI** (if not already installed):

   **macOS:**
   ```bash
   brew install awscli
   ```

   **Windows:**
   Download from: https://aws.amazon.com/cli/

   **Linux:**
   ```bash
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

2. **Configure AWS Credentials:**
   ```bash
   aws configure
   ```

   You'll need:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region: `ap-southeast-2`
   - Default output format: `json`

3. **Run the setup script:**
   ```bash
   cd savesmart-backend/infrastructure
   npm install
   npm run setup
   ```

### Expected Output

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

savesmart-users:
  Status: ACTIVE
  Partition Key: userId (S)
  Billing Mode: PAY_PER_REQUEST
  Item Count: 0

savesmart-plans:
  Status: ACTIVE
  Partition Key: userId
  Sort Key: planId
  Billing Mode: PAY_PER_REQUEST
  Item Count: 0
  Global Secondary Indexes:
    - userId-index (Status: ACTIVE)

🔍 Verifying table access...

📝 Testing write to savesmart-users...
✅ Write to savesmart-users successful

📖 Testing read from savesmart-users...
✅ Read from savesmart-users successful
   Retrieved user: Test User

📝 Testing write to savesmart-plans...
✅ Write to savesmart-plans successful

📖 Testing read from savesmart-plans...
✅ Read from savesmart-plans successful
   Retrieved plan: Test savings goal

✅ All table access tests passed!

✅ DynamoDB setup completed successfully!

📝 Next steps:
   1. Deploy Lambda functions
   2. Configure API Gateway
   3. Set N8N_WEBHOOK_URL environment variable in chat Lambda
```

## Option 2: Manual Setup via AWS Console

If you prefer to create tables manually or don't have AWS CLI access:

### Step 1: Create savesmart-users Table

1. Go to [DynamoDB Console](https://ap-southeast-2.console.aws.amazon.com/dynamodbv2/home?region=ap-southeast-2#create-table)
2. Click "Create table"
3. Configure:
   - **Table name:** `savesmart-users`
   - **Partition key:** `userId` (String)
   - **Table settings:** Customize settings
   - **Table class:** DynamoDB Standard
   - **Capacity mode:** On-demand
   - **Encryption:** AWS owned key (default)
4. Click "Create table"
5. Wait for status to become "Active"

### Step 2: Create savesmart-plans Table

1. Go to [DynamoDB Console](https://ap-southeast-2.console.aws.amazon.com/dynamodbv2/home?region=ap-southeast-2#create-table)
2. Click "Create table"
3. Configure:
   - **Table name:** `savesmart-plans`
   - **Partition key:** `userId` (String)
   - **Sort key:** `planId` (String)
   - **Table settings:** Customize settings
   - **Table class:** DynamoDB Standard
   - **Capacity mode:** On-demand
4. Click "Create table"
5. Wait for status to become "Active"

### Step 3: Add Global Secondary Index to savesmart-plans

1. Go to the `savesmart-plans` table
2. Click on the "Indexes" tab
3. Click "Create index"
4. Configure:
   - **Partition key:** `userId` (String)
   - **Sort key:** `createdAt` (String)
   - **Index name:** `userId-index`
   - **Attribute projections:** All
5. Click "Create index"
6. Wait for index status to become "Active"

### Step 4: Verify Tables

Run the verification script:
```bash
cd savesmart-backend/infrastructure
npm install
npm run verify
```

## Option 3: AWS CLI Commands

If you have AWS CLI configured but prefer manual commands:

### Create savesmart-users table:
```bash
aws dynamodb create-table \
  --table-name savesmart-users \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-2
```

### Create savesmart-plans table:
```bash
aws dynamodb create-table \
  --table-name savesmart-plans \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=planId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=planId,KeyType=RANGE \
  --global-secondary-indexes \
    "[{\"IndexName\":\"userId-index\",\"KeySchema\":[{\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-2
```

### Verify tables:
```bash
aws dynamodb describe-table --table-name savesmart-users --region ap-southeast-2
aws dynamodb describe-table --table-name savesmart-plans --region ap-southeast-2
```

## Verification

After creating tables, verify they're working:

```bash
cd savesmart-backend/infrastructure
npm run verify
```

Expected output:
```
🔍 SaveSmart DynamoDB Table Verification
=========================================

📋 All DynamoDB tables in region ap-southeast-2:
   ✓ savesmart-users
   ✓ savesmart-plans

✅ savesmart-users:
   Status: ACTIVE
   Billing Mode: PAY_PER_REQUEST
   Item Count: 0
   Keys:
     - userId (Partition Key, Type: S)

✅ savesmart-plans:
   Status: ACTIVE
   Billing Mode: PAY_PER_REQUEST
   Item Count: 0
   Keys:
     - userId (Partition Key, Type: S)
     - planId (Sort Key, Type: S)
   Global Secondary Indexes:
     - userId-index (Status: ACTIVE)
       - userId (Partition Key)
       - createdAt (Sort Key)

==================================================
✅ All required tables exist and are accessible
```

## Troubleshooting

### Issue: "Could not load credentials from any providers"

**Solution:** Configure AWS credentials:
```bash
aws configure
```

Or set environment variables:
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=ap-southeast-2
```

### Issue: "User is not authorized to perform: dynamodb:CreateTable"

**Solution:** Your IAM user needs these permissions:
- `dynamodb:CreateTable`
- `dynamodb:DescribeTable`
- `dynamodb:PutItem`
- `dynamodb:GetItem`

Contact your AWS administrator to grant these permissions.

### Issue: "ResourceInUseException: Table already exists"

**Solution:** Tables are already created! Run `npm run verify` to confirm they're accessible.

### Issue: Tables created but Lambda functions can't access them

**Solution:** Ensure Lambda execution roles have these permissions:
- `dynamodb:GetItem`
- `dynamodb:PutItem`
- `dynamodb:UpdateItem`
- `dynamodb:Query`
- `dynamodb:Scan`

## Cost Estimate

With on-demand billing:
- **Free tier:** 25 GB storage, 25 read/write capacity units
- **After free tier:**
  - Write: $1.25 per million requests
  - Read: $0.25 per million requests
  - Storage: $0.25 per GB-month

For a hackathon/demo with <1000 requests, cost will be **$0.00** (within free tier).

## Next Steps

After DynamoDB setup is complete:

1. ✅ DynamoDB tables created and verified
2. ⬜ Deploy Lambda functions (see `../DEPLOYMENT.md`)
3. ⬜ Create IAM roles for Lambda functions
4. ⬜ Configure API Gateway
5. ⬜ Test end-to-end flow

## Support

If you encounter issues:
1. Check AWS Console for table status
2. Run `npm run verify` to diagnose
3. Check CloudWatch Logs for Lambda errors
4. Review IAM permissions
