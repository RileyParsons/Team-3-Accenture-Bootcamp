/**
 * SaveSmart Authentication Lambda Deployment Script
 *
 * This script automates the creation and deployment of authentication Lambda functions:
 * - savesmart-auth: Handles authentication endpoints (register, login, refresh, reset)
 * - savesmart-users: Handles user profile endpoints (get, update)
 *
 * Prerequisites:
 * - AWS CLI configured with appropriate credentials
 * - auth.zip and users.zip deployment packages created
 * - DynamoDB table 'savesmart-users' exists
 * - SSM parameter '/savesmart/jwt-secret' exists
 */

const {
  LambdaClient,
  CreateFunctionCommand,
  UpdateFunctionCodeCommand,
  UpdateFunctionConfigurationCommand,
  GetFunctionCommand,
  AddPermissionCommand
} = require('@aws-sdk/client-lambda');
const {
  IAMClient,
  CreateRoleCommand,
  AttachRolePolicyCommand,
  PutRolePolicyCommand,
  GetRoleCommand
} = require('@aws-sdk/client-iam');
const fs = require('fs');
const path = require('path');

const REGION = 'ap-southeast-2';
const ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || '*'; // Will be fetched if not provided

const lambda = new LambdaClient({ region: REGION });
const iam = new IAMClient({ region: REGION });

// Configuration for Lambda functions
const LAMBDA_CONFIGS = {
  auth: {
    functionName: 'savesmart-auth',
    zipFile: '../auth.zip',
    handler: 'index.handler',
    timeout: 30,
    memorySize: 256,
    description: 'SaveSmart authentication service - handles register, login, refresh, and password reset',
    environment: {
      TABLE_NAME: 'savesmart-users',
      JWT_SECRET_PARAM: '/savesmart/jwt-secret',
      AWS_REGION: REGION
    },
    iamPolicy: {
      dynamodb: [
        'dynamodb:PutItem',
        'dynamodb:GetItem',
        'dynamodb:UpdateItem',
        'dynamodb:Query',
        'dynamodb:Scan'
      ],
      resources: [
        `arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/savesmart-users`,
        `arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/savesmart-users/index/email-index`
      ]
    }
  },
  users: {
    functionName: 'savesmart-users',
    zipFile: '../users.zip',
    handler: 'index.handler',
    timeout: 10,
    memorySize: 128,
    description: 'SaveSmart user service - handles user profile operations',
    environment: {
      TABLE_NAME: 'savesmart-users',
      JWT_SECRET_PARAM: '/savesmart/jwt-secret',
      AWS_REGION: REGION
    },
    iamPolicy: {
      dynamodb: [
        'dynamodb:GetItem',
        'dynamodb:UpdateItem'
      ],
      resources: [
        `arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/savesmart-users`
      ]
    }
  }
};

// Utility functions
function log(emoji, message, color = '\x1b[0m') {
  console.log(`${emoji} ${color}${message}\x1b[0m`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if zip file exists
function checkZipFile(zipPath) {
  const fullPath = path.join(__dirname, zipPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Deployment package not found: ${fullPath}`);
  }
  const stats = fs.statSync(fullPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  return { fullPath, sizeMB };
}

// Create or get IAM role for Lambda
async function createOrGetLambdaRole(functionName, iamPolicy) {
  const roleName = `${functionName}-role`;

  log('🔐', `Checking IAM role: ${roleName}`, '\x1b[33m');

  try {
    // Try to get existing role
    const getRole = await iam.send(new GetRoleCommand({ RoleName: roleName }));
    log('✅', `IAM role already exists: ${roleName}`, '\x1b[32m');
    return getRole.Role.Arn;
  } catch (error) {
    if (error.name !== 'NoSuchEntityException') {
      throw error;
    }
  }

  // Create new role
  log('📝', `Creating IAM role: ${roleName}`, '\x1b[33m');

  const assumeRolePolicy = {
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Principal: { Service: 'lambda.amazonaws.com' },
      Action: 'sts:AssumeRole'
    }]
  };

  const createRole = await iam.send(new CreateRoleCommand({
    RoleName: roleName,
    AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicy),
    Description: `Execution role for ${functionName} Lambda function`
  }));

  const roleArn = createRole.Role.Arn;
  log('✅', `IAM role created: ${roleName}`, '\x1b[32m');

  // Attach basic execution policy
  log('📎', 'Attaching AWSLambdaBasicExecutionRole...', '\x1b[33m');
  await iam.send(new AttachRolePolicyCommand({
    RoleName: roleName,
    PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
  }));

  // Create inline policy for DynamoDB and SSM
  log('📎', 'Creating inline policy for DynamoDB and SSM...', '\x1b[33m');

  const inlinePolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: iamPolicy.dynamodb,
        Resource: iamPolicy.resources
      },
      {
        Effect: 'Allow',
        Action: ['ssm:GetParameter'],
        Resource: `arn:aws:ssm:${REGION}:${ACCOUNT_ID}:parameter/savesmart/jwt-secret`
      }
    ]
  };

  await iam.send(new PutRolePolicyCommand({
    RoleName: roleName,
    PolicyName: `${functionName}-policy`,
    PolicyDocument: JSON.stringify(inlinePolicy)
  }));

  log('✅', 'IAM policies attached', '\x1b[32m');

  // Wait for role to propagate
  log('⏳', 'Waiting for IAM role to propagate (10 seconds)...', '\x1b[33m');
  await sleep(10000);

  return roleArn;
}

// Check if Lambda function exists
async function functionExists(functionName) {
  try {
    await lambda.send(new GetFunctionCommand({ FunctionName: functionName }));
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

// Create Lambda function
async function createLambdaFunction(config, roleArn) {
  const { functionName, zipFile, handler, timeout, memorySize, description, environment } = config;

  log('📦', `Creating Lambda function: ${functionName}`, '\x1b[33m');

  const zipPath = path.join(__dirname, zipFile);
  const zipBuffer = fs.readFileSync(zipPath);

  const createParams = {
    FunctionName: functionName,
    Runtime: 'nodejs20.x',
    Role: roleArn,
    Handler: handler,
    Code: { ZipFile: zipBuffer },
    Timeout: timeout,
    MemorySize: memorySize,
    Description: description,
    Environment: {
      Variables: environment
    },
    Architectures: ['x86_64']
  };

  await lambda.send(new CreateFunctionCommand(createParams));
  log('✅', `Lambda function created: ${functionName}`, '\x1b[32m');
}

// Update existing Lambda function
async function updateLambdaFunction(config) {
  const { functionName, zipFile, timeout, memorySize, environment } = config;

  log('🔄', `Updating Lambda function: ${functionName}`, '\x1b[33m');

  // Update code
  const zipPath = path.join(__dirname, zipFile);
  const zipBuffer = fs.readFileSync(zipPath);

  await lambda.send(new UpdateFunctionCodeCommand({
    FunctionName: functionName,
    ZipFile: zipBuffer
  }));

  log('✅', 'Code updated', '\x1b[32m');

  // Wait for update to complete
  await sleep(2000);

  // Update configuration
  await lambda.send(new UpdateFunctionConfigurationCommand({
    FunctionName: functionName,
    Timeout: timeout,
    MemorySize: memorySize,
    Environment: {
      Variables: environment
    }
  }));

  log('✅', `Lambda function updated: ${functionName}`, '\x1b[32m');
}

// Deploy a single Lambda function
async function deployLambda(type) {
  const config = LAMBDA_CONFIGS[type];

  log('🚀', `\nDeploying ${config.functionName}...`, '\x1b[36m');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', '', '\x1b[36m');

  try {
    // Check zip file
    const { fullPath, sizeMB } = checkZipFile(config.zipFile);
    log('✅', `Deployment package found: ${path.basename(fullPath)} (${sizeMB} MB)`, '\x1b[32m');

    // Create or get IAM role
    const roleArn = await createOrGetLambdaRole(config.functionName, config.iamPolicy);

    // Check if function exists
    const exists = await functionExists(config.functionName);

    if (exists) {
      log('⚠️', `Function ${config.functionName} already exists, updating...`, '\x1b[33m');
      await updateLambdaFunction(config);
    } else {
      await createLambdaFunction(config, roleArn);
    }

    log('✅', `${config.functionName} deployed successfully!`, '\x1b[32m');
    return true;
  } catch (error) {
    log('❌', `Error deploying ${config.functionName}: ${error.message}`, '\x1b[31m');
    console.error(error);
    return false;
  }
}

// Main deployment function
async function main() {
  console.log('\x1b[36m');
  console.log('🚀 SaveSmart Authentication Lambda Deployment');
  console.log('==============================================');
  console.log('\x1b[0m');

  try {
    // Deploy Auth Lambda
    const authSuccess = await deployLambda('auth');

    // Deploy Users Lambda
    const usersSuccess = await deployLambda('users');

    console.log('\n\x1b[36m==============================================\x1b[0m\n');

    if (authSuccess && usersSuccess) {
      log('✅', 'All Lambda functions deployed successfully!', '\x1b[32m');
      console.log('\n📋 Next steps:');
      console.log('   1. Configure API Gateway routes (see AUTH_DEPLOYMENT.md)');
      console.log('   2. Test the authentication endpoints');
      console.log('   3. Set up monitoring and alarms');
      console.log('\n💡 Function URLs:');
      console.log(`   - Auth: https://console.aws.amazon.com/lambda/home?region=${REGION}#/functions/savesmart-auth`);
      console.log(`   - Users: https://console.aws.amazon.com/lambda/home?region=${REGION}#/functions/savesmart-users`);
    } else {
      log('❌', 'Some deployments failed. Please check the errors above.', '\x1b[31m');
      process.exit(1);
    }
  } catch (error) {
    log('❌', `Deployment failed: ${error.message}`, '\x1b[31m');
    console.error(error);
    process.exit(1);
  }
}

// Run the deployment
main();
