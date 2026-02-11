# AWS Infrastructure Setup Checklist

This is what needs to be set up in AWS before deploying the Lambda functions.

## ✅ What Your Teammate Needs to Create

### 1. DynamoDB Tables (2 tables)

#### Table 1: savesmart-users
- **Table name**: `savesmart-users`
- **Partition key**: `userId` (String)
- **Billing mode**: On-demand
- **Region**: ap-southeast-2 (Sydney)

#### Table 2: savesmart-plans
- **Table name**: `savesmart-plans`
- **Partition key**: `userId` (String)
- **Sort key**: `planId` (String)
- **Billing mode**: On-demand
- **Region**: ap-southeast-2 (Sydney)
- **Global Secondary Index (GSI)**:
  - Index name: `userId-index`
  - Partition key: `userId` (String)
  - Sort key: `createdAt` (String)
  - Projection: All attributes

### 2. IAM Role for Lambda Functions

Create ONE IAM role that all Lambda functions will use:

- **Role name**: `savesmart-lambda-execution-role`
- **Trust relationship**: Lambda service
- **Policies to attach**:
  1. `AWSLambdaBasicExecutionRole` (managed policy - for CloudWatch Logs)
  2. Custom inline policy for DynamoDB:

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
        "arn:aws:dynamodb:ap-southeast-2:*:table/savesmart-plans",
        "arn:aws:dynamodb:ap-southeast-2:*:table/savesmart-plans/index/userId-index"
      ]
    }
  ]
}
```

### 3. Lambda Functions (5 functions)

Create these 5 Lambda functions with the following settings:

#### Function 1: savesmart-saveUser
- **Runtime**: Node.js 20.x
- **Handler**: saveUser.handler
- **Timeout**: 10 seconds
- **Memory**: 128 MB
- **Role**: savesmart-lambda-execution-role
- **Environment variables**: None (uses defaults)

#### Function 2: savesmart-getUser
- **Runtime**: Node.js 20.x
- **Handler**: getUser.handler
- **Timeout**: 10 seconds
- **Memory**: 128 MB
- **Role**: savesmart-lambda-execution-role
- **Environment variables**: None (uses defaults)

#### Function 3: savesmart-updateUser
- **Runtime**: Node.js 20.x
- **Handler**: updateUser.handler
- **Timeout**: 10 seconds
- **Memory**: 128 MB
- **Role**: savesmart-lambda-execution-role
- **Environment variables**: None (uses defaults)

#### Function 4: savesmart-chat ⚠️ CRITICAL
- **Runtime**: Node.js 20.x
- **Handler**: chat.handler
- **Timeout**: 60 seconds (important!)
- **Memory**: 256 MB
- **Role**: savesmart-lambda-execution-role
- **Environment variables**:
  - `N8N_WEBHOOK_URL` = (get this from AI/Agent team)

#### Function 5: savesmart-getPlans
- **Runtime**: Node.js 20.x
- **Handler**: getPlans.handler
- **Timeout**: 10 seconds
- **Memory**: 128 MB
- **Role**: savesmart-lambda-execution-role
- **Environment variables**: None (uses defaults)

### 4. API Gateway

#### Create REST API
- **API name**: `savesmart-api`
- **API type**: REST API
- **Endpoint type**: Regional

#### Create Resources and Methods

Create these resources and methods:

```
/
├── /users (POST) → savesmart-saveUser
│   └── /{userId}
│       ├── (GET) → savesmart-getUser
│       └── (PUT) → savesmart-updateUser
├── /chat (POST) → savesmart-chat
└── /plans
    └── /{userId} (GET) → savesmart-getPlans
```

For each method:
1. Integration type: **Lambda Function (proxy integration)**
2. Select the corresponding Lambda function
3. Enable **Lambda Proxy Integration** checkbox

#### Enable CORS

For each resource, enable CORS with these settings:
- **Access-Control-Allow-Origin**: `*`
- **Access-Control-Allow-Headers**: `Content-Type,Authorization`
- **Access-Control-Allow-Methods**: `GET,POST,PUT,OPTIONS`

This will automatically create OPTIONS methods.

#### Deploy API
1. Click "Deploy API"
2. **Stage name**: `prod`
3. Copy the **Invoke URL** (looks like: `https://abc123.execute-api.ap-southeast-2.amazonaws.com/prod`)

---

## 📋 What You Need Back From Your Teammate

Once they're done, you need these 3 things:

### 1. ✅ Confirmation that all resources are created
- 2 DynamoDB tables exist
- 1 IAM role exists
- 5 Lambda functions exist (empty, ready for code upload)
- 1 API Gateway exists with all endpoints configured

### 2. 🔗 API Gateway Invoke URL
Example: `https://abc123def.execute-api.ap-southeast-2.amazonaws.com/prod`

You'll need this to:
- Share with the frontend team
- Test the endpoints
- Add to Postman collection

### 3. 🔑 AWS Access (Optional but helpful)
- Access to AWS Console to upload Lambda code
- OR they can upload the code for you (you'll provide .zip files)

---

## 🚀 After Infrastructure is Ready

Once your teammate confirms everything is set up:

1. **Build and package the Lambda functions**:
   ```bash
   cd savesmart-backend
   npm install
   npx tsc
   # Follow DEPLOYMENT.md to create .zip files
   ```

2. **Upload code to Lambda functions** (either you or your teammate)

3. **Test each endpoint** using Postman or curl

4. **Share API Gateway URL** with frontend team

---

## 📞 Coordination with Other Teams

### From AI/Agent Team
You need the **n8n webhook URL** to set as environment variable in the `savesmart-chat` Lambda function.

### To Frontend Team
Once API Gateway is deployed, share:
- API Gateway Invoke URL
- API documentation (endpoints, request/response formats)
- Postman collection

---

## ⏱️ Estimated Setup Time

- DynamoDB tables: 5 minutes
- IAM role: 5 minutes
- Lambda functions (empty): 10 minutes
- API Gateway: 15 minutes
- **Total: ~35 minutes**

---

## 🆘 Common Issues

### Issue: Lambda can't access DynamoDB
**Solution**: Check that the IAM role has the DynamoDB policy attached

### Issue: CORS errors in browser
**Solution**: Verify CORS is enabled on all API Gateway resources and OPTIONS methods exist

### Issue: API Gateway returns 502
**Solution**: Check Lambda function logs in CloudWatch for errors

### Issue: Chat function times out
**Solution**: Verify timeout is set to 60 seconds (not 10)
