# Authentication Deployment Guide

## Overview

This guide covers the deployment of the SaveSmart authentication system, including:
- DynamoDB table setup with authentication schema
- JWT secret management in AWS Systems Manager Parameter Store
- Lambda function deployment for authentication endpoints
- API Gateway route configuration
- IAM permissions setup

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 20.x installed
- Appropriate IAM permissions for:
  - DynamoDB (CreateTable, DeleteTable, DescribeTable)
  - SSM Parameter Store (PutParameter, GetParameter)
  - Lambda (CreateFunction, UpdateFunctionCode, UpdateFunctionConfiguration)
  - API Gateway (CreateRoute, UpdateRoute)
  - IAM (CreateRole, AttachRolePolicy)

## Step 1: Infrastructure Setup

### 1.1 Set Up DynamoDB Table

The authentication system requires a DynamoDB table with a Global Secondary Index for email lookups.

```bash
cd savesmart-backend/infrastructure
node setup-auth-dynamodb.js
```

This script will:
- Delete the existing `savesmart-users` table if it exists
- Create a new table with the authentication schema:
  - Partition Key: `userId` (String)
  - Global Secondary Index: `email-index` on `email` field
- Wait for the table to become active

**Table Schema:**
```javascript
{
  userId: String,           // UUID v4, partition key
  email: String,            // User email, indexed via GSI
  hashedPassword: String,   // Bcrypt hash
  createdAt: String,        // ISO 8601 timestamp
  resetToken: String,       // Optional, bcrypt hash of reset token
  resetTokenExpiry: String  // Optional, ISO 8601 timestamp
}
```

### 1.2 Set Up JWT Secret

Generate and store the JWT signing secret in Parameter Store:

```bash
cd savesmart-backend/infrastructure
node setup-jwt-secret.js
```

This script will:
- Generate a random 256-bit secret (base64 encoded)
- Store it in Parameter Store as `/savesmart/jwt-secret` (SecureString)
- Verify the secret was stored correctly

## Step 2: Build and Package Lambda Functions

### 2.1 Build TypeScript Code

```bash
cd savesmart-backend
npm install
npx tsc
```

### 2.2 Package Authentication Lambda

The authentication Lambda handles all auth-related endpoints:

```bash
cd dist/auth
npm init -y
npm install @aws-sdk/client-dynamodb @aws-sdk/client-ssm jsonwebtoken bcryptjs uuid
zip -r ../../auth.zip .
cd ../..
```

### 2.3 Package User Lambda (Updated)

The user Lambda now includes authentication middleware:

```bash
cd dist/users
npm init -y
npm install @aws-sdk/client-dynamodb @aws-sdk/client-ssm jsonwebtoken
zip -r ../../users.zip .
cd ../..
```

## Step 3: Deploy Lambda Functions

### 3.1 Create/Update Auth Lambda

**Function Configuration:**
- Function Name: `savesmart-auth`
- Runtime: Node.js 20.x
- Handler: `index.handler`
- Timeout: 30 seconds
- Memory: 256 MB

**Environment Variables:**
```
TABLE_NAME=savesmart-users
JWT_SECRET_PARAM=/savesmart/jwt-secret
AWS_REGION=ap-southeast-2
```

**IAM Role Permissions:**
- `AWSLambdaBasicExecutionRole` (CloudWatch Logs)
- DynamoDB permissions:
  ```json
  {
    "Effect": "Allow",
    "Action": [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
      "dynamodb:Scan"
    ],
    "Resource": [
      "arn:aws:dynamodb:ap-southeast-2:*:table/savesmart-users",
      "arn:aws:dynamodb:ap-southeast-2:*:table/savesmart-users/index/email-index"
    ]
  }
  ```
- SSM Parameter Store permissions:
  ```json
  {
    "Effect": "Allow",
    "Action": [
      "ssm:GetParameter"
    ],
    "Resource": "arn:aws:ssm:ap-southeast-2:*:parameter/savesmart/jwt-secret"
  }
  ```

### 3.2 Update User Lambda

**Function Configuration:**
- Function Name: `savesmart-users`
- Runtime: Node.js 20.x
- Handler: `index.handler`
- Timeout: 10 seconds
- Memory: 128 MB

**Environment Variables:**
```
TABLE_NAME=savesmart-users
JWT_SECRET_PARAM=/savesmart/jwt-secret
AWS_REGION=ap-southeast-2
```

**IAM Role Permissions:**
- `AWSLambdaBasicExecutionRole` (CloudWatch Logs)
- DynamoDB permissions:
  ```json
  {
    "Effect": "Allow",
    "Action": [
      "dynamodb:GetItem",
      "dynamodb:UpdateItem"
    ],
    "Resource": "arn:aws:dynamodb:ap-southeast-2:*:table/savesmart-users"
  }
  ```
- SSM Parameter Store permissions:
  ```json
  {
    "Effect": "Allow",
    "Action": [
      "ssm:GetParameter"
    ],
    "Resource": "arn:aws:ssm:ap-southeast-2:*:parameter/savesmart/jwt-secret"
  }
  ```

## Step 4: Configure API Gateway Routes

### 4.1 Authentication Routes (Public)

These routes do NOT require authentication:

| Method | Route | Lambda | Description |
|--------|-------|--------|-------------|
| POST | /auth/register | savesmart-auth | User registration |
| POST | /auth/login | savesmart-auth | User login |
| POST | /auth/refresh | savesmart-auth | Token refresh |
| POST | /auth/reset-request | savesmart-auth | Password reset request |
| POST | /auth/reset-complete | savesmart-auth | Password reset completion |

**Route Configuration:**
- Integration Type: Lambda Proxy
- CORS: Enabled
- Authorization: None

### 4.2 User Routes (Protected)

These routes REQUIRE authentication (Bearer token in Authorization header):

| Method | Route | Lambda | Description |
|--------|-------|--------|-------------|
| GET | /users/{userId} | savesmart-users | Get user profile |
| PUT | /users/{userId} | savesmart-users | Update user profile |

**Route Configuration:**
- Integration Type: Lambda Proxy
- CORS: Enabled
- Authorization: None (handled by Lambda middleware)

**Note:** Authorization is handled within the Lambda function, not at the API Gateway level. This provides more flexibility for error handling and custom authorization logic.

## Step 5: Testing the Deployment

### 5.1 Test Registration

```bash
curl -X POST https://your-api-gateway-url/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

Expected response:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 5.2 Test Login

```bash
curl -X POST https://your-api-gateway-url/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

### 5.3 Test Protected Endpoint

```bash
# Get the accessToken from registration/login response
curl -X GET https://your-api-gateway-url/users/{userId} \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected response (success):
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

Expected response (no token):
```json
{
  "error": "No token provided"
}
```

### 5.4 Test Token Refresh

```bash
curl -X POST https://your-api-gateway-url/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 5.5 Test Password Reset Flow

**Request reset:**
```bash
curl -X POST https://your-api-gateway-url/auth/reset-request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Complete reset:**
```bash
curl -X POST https://your-api-gateway-url/auth/reset-complete \
  -H "Content-Type: application/json" \
  -d '{
    "resetToken": "RESET_TOKEN_FROM_PREVIOUS_RESPONSE",
    "newPassword": "NewSecurePass123"
  }'
```

## Environment Variables Summary

### Auth Lambda
| Variable | Value | Description |
|----------|-------|-------------|
| TABLE_NAME | savesmart-users | DynamoDB table name |
| JWT_SECRET_PARAM | /savesmart/jwt-secret | SSM parameter name for JWT secret |
| AWS_REGION | ap-southeast-2 | AWS region |

### User Lambda
| Variable | Value | Description |
|----------|-------|-------------|
| TABLE_NAME | savesmart-users | DynamoDB table name |
| JWT_SECRET_PARAM | /savesmart/jwt-secret | SSM parameter name for JWT secret |
| AWS_REGION | ap-southeast-2 | AWS region |

## IAM Permissions Summary

### Auth Lambda Role

**Managed Policies:**
- `AWSLambdaBasicExecutionRole`

**Inline Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-southeast-2:*:table/savesmart-users",
        "arn:aws:dynamodb:ap-southeast-2:*:table/savesmart-users/index/email-index"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter"
      ],
      "Resource": "arn:aws:ssm:ap-southeast-2:*:parameter/savesmart/jwt-secret"
    }
  ]
}
```

### User Lambda Role

**Managed Policies:**
- `AWSLambdaBasicExecutionRole`

**Inline Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:ap-southeast-2:*:table/savesmart-users"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter"
      ],
      "Resource": "arn:aws:ssm:ap-southeast-2:*:parameter/savesmart/jwt-secret"
    }
  ]
}
```

## Security Considerations

1. **JWT Secret Protection:**
   - Never commit the JWT secret to version control
   - Never log the secret in application code
   - Rotate the secret periodically
   - Use SSM Parameter Store SecureString for encryption at rest

2. **Password Security:**
   - Passwords are hashed using bcrypt with 10 salt rounds
   - Plain text passwords are never stored or logged
   - Password requirements: 8+ characters, 1 uppercase, 1 lowercase, 1 number

3. **Token Expiration:**
   - Access tokens expire after 1 hour
   - Refresh tokens expire after 7 days
   - Expired tokens are rejected with 401 Unauthorized

4. **Error Messages:**
   - Authentication errors are generic to prevent information leakage
   - Validation errors are specific to help users correct input
   - Internal errors are logged but return generic messages to clients

5. **Authorization:**
   - Users can only access their own data
   - Token userId must match requested userId
   - Mismatched userId returns 403 Forbidden

## Troubleshooting

### Issue: "No token provided" error

**Cause:** Authorization header is missing or malformed

**Solution:** Ensure the Authorization header is set correctly:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Issue: "Invalid or expired token" error

**Cause:** Token is expired, invalid, or signed with wrong secret

**Solution:**
1. Check token expiration (access tokens expire after 1 hour)
2. Use the refresh endpoint to get a new access token
3. Verify JWT_SECRET_PARAM is set correctly in Lambda environment
4. Verify SSM parameter exists and Lambda has permission to read it

### Issue: "Invalid credentials" error

**Cause:** Email or password is incorrect

**Solution:** Verify the email and password are correct. Note that the error message is intentionally generic for security.

### Issue: Lambda timeout

**Cause:** DynamoDB or SSM operations are slow

**Solution:**
1. Increase Lambda timeout (recommended: 30 seconds for auth Lambda)
2. Check DynamoDB table status (should be ACTIVE)
3. Check SSM parameter exists and is accessible
4. Review CloudWatch Logs for specific errors

### Issue: CORS errors in browser

**Cause:** CORS headers not configured correctly

**Solution:**
1. Ensure CORS is enabled on API Gateway routes
2. Verify Lambda functions return CORS headers in responses
3. Check that preflight OPTIONS requests are handled

## Monitoring and Logging

### CloudWatch Logs

All Lambda functions log to CloudWatch Logs:
- `/aws/lambda/savesmart-auth`
- `/aws/lambda/savesmart-users`

**Key log events:**
- Authentication attempts (success/failure)
- Token generation and validation
- Password reset requests
- Authorization failures
- Internal errors

### CloudWatch Metrics

Monitor these metrics:
- Lambda invocation count
- Lambda error count
- Lambda duration
- DynamoDB read/write capacity
- API Gateway 4xx/5xx errors

### Alarms

Consider setting up alarms for:
- High authentication failure rate
- Lambda errors exceeding threshold
- DynamoDB throttling
- API Gateway 5xx errors

## Rollback Procedure

If issues occur after deployment:

1. **Revert Lambda Functions:**
   ```bash
   aws lambda update-function-code \
     --function-name savesmart-auth \
     --zip-file fileb://previous-version.zip
   ```

2. **Restore DynamoDB Table:**
   - If you have a backup, restore from backup
   - If no backup, re-run the old setup script

3. **Revert API Gateway Routes:**
   - Update routes to point to previous Lambda versions
   - Or remove new routes if they were added

## Next Steps

After successful deployment:

1. Update frontend application to use authentication endpoints
2. Implement token refresh logic in frontend
3. Add password reset email functionality (currently returns token in response)
4. Set up monitoring and alerting
5. Perform security audit
6. Load testing with realistic traffic patterns
7. Document API for frontend team

## Support

For issues or questions:
- Check CloudWatch Logs for detailed error messages
- Review this documentation
- Contact the backend team
