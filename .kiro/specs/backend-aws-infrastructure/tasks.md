# Implementation Plan: Backend AWS Infrastructure

## Overview

This implementation plan breaks down the AWS serverless backend infrastructure into discrete coding tasks. The approach follows an incremental deployment strategy: create infrastructure, deploy Lambda functions one by one, test each endpoint, and finally integrate with n8n. Each task builds on previous work to ensure continuous validation.

## Tasks

- [ ] 1. Set up DynamoDB tables and verify access
  - Create `savesmart-users` table with userId as partition key
  - Create `savesmart-plans` table with userId as partition key and planId as sort key
  - Add Global Secondary Index `userId-index` to plans table for efficient querying
  - Configure both tables with on-demand billing mode
  - Test table creation and basic read/write operations using AWS CLI or SDK
  - _Requirements: 3.1_

- [ ] 2. Create IAM roles and policies for Lambda functions
  - Create base execution role with CloudWatch Logs permissions
  - Create DynamoDB read policy for getUser, chat, and getPlans functions
  - Create DynamoDB write policy for saveUser, updateUser, and chat functions
  - Attach appropriate policies to each Lambda function role
  - _Requirements: 3.5_

- [ ] 3. Implement and deploy saveUser Lambda function
  - [x] 3.1 Create saveUser Lambda function with input validation
    - Implement handler with request body parsing
    - Add validation for required fields (userId, email, name, income, rent, groceryBudget, savings, location)
    - Add validation for data types (numbers, booleans, arrays)
    - Implement DynamoDB PutItem operation using AWS SDK v3
    - Add error handling for validation errors and DynamoDB errors
    - Include CORS headers in all responses
    - Add comprehensive logging
    - _Requirements: 3.3.1, 3.6_

  - [ ] 3.2 Write property test for saveUser
    - **Property 1: User Creation Round-Trip**
    - **Validates: Requirements 3.3.1, 3.3.2**

  - [ ] 3.3 Write unit tests for saveUser
    - Test successful user creation with valid data
    - Test validation errors for missing required fields
    - Test validation errors for invalid data types
    - Test error response format
    - _Requirements: 3.3.1, 3.6_

- [ ] 4. Implement and deploy getUser Lambda function
  - [x] 4.1 Create getUser Lambda function with path parameter handling
    - Implement handler with pathParameters extraction
    - Add validation for userId parameter
    - Implement DynamoDB GetItem operation
    - Handle user not found case (404 response)
    - Add error handling and CORS headers
    - Add comprehensive logging
    - _Requirements: 3.3.2, 3.6_

  - [ ] 4.2 Write property test for getUser
    - **Property 2: Non-Existent User Returns 404**
    - **Validates: Requirements 3.3.2**

  - [ ] 4.3 Write unit tests for getUser
    - Test successful user retrieval
    - Test 404 response for non-existent user
    - Test validation error for missing userId
    - _Requirements: 3.3.2, 3.6_

- [ ] 5. Checkpoint - Verify user creation and retrieval flow
  - Test POST /users creates a user successfully
  - Test GET /users/{userId} retrieves the created user
  - Verify all fields are correctly stored and retrieved
  - Ensure all tests pass, ask the user if questions arise

- [ ] 6. Implement and deploy updateUser Lambda function
  - [x] 6.1 Create updateUser Lambda function with dynamic update expressions
    - Implement handler with pathParameters and body parsing
    - Build dynamic UpdateExpression for partial updates
    - Handle different data types (numbers, booleans, arrays, strings, null)
    - Implement DynamoDB UpdateItem operation
    - Add validation for allowed fields
    - Add error handling and CORS headers
    - Add comprehensive logging
    - _Requirements: 3.3.3, 3.6_

  - [ ] 6.2 Write property test for updateUser
    - **Property 3: User Update Consistency**
    - **Validates: Requirements 3.3.3**

  - [ ] 6.3 Write unit tests for updateUser
    - Test successful partial update
    - Test update with multiple fields
    - Test validation error for no fields to update
    - Test that unchanged fields are preserved
    - _Requirements: 3.3.3, 3.6_

- [ ] 7. Implement and deploy chat Lambda function (critical path)
  - [x] 7.1 Create chat Lambda function with n8n integration
    - Implement handler with request body parsing
    - Add validation for userId and message parameters
    - Implement DynamoDB GetItem to fetch user profile
    - Handle user not found case (404 response)
    - Implement fetch call to n8n webhook with user context
    - Add timeout handling (55 seconds) for n8n requests
    - Handle n8n error responses (502 status)
    - Conditionally save plan to DynamoDB if present in n8n response
    - Return formatted response with reply, savings, and plan
    - Add comprehensive error handling and logging
    - Include CORS headers in all responses
    - _Requirements: 3.3.4, 3.6_

  - [ ] 7.2 Write property test for chat response structure
    - **Property 4: Chat Response Structure**
    - **Validates: Requirements 3.3.4**

  - [ ] 7.3 Write property test for plan persistence
    - **Property 5: Plan Persistence and Retrieval**
    - **Validates: Requirements 3.3.4, 3.3.5**

  - [ ] 7.4 Write unit tests for chat function
    - Test successful chat with valid userId and message
    - Test 404 response for non-existent user
    - Test validation errors for missing parameters
    - Test n8n timeout handling
    - Test n8n error response handling
    - Test plan saving when n8n returns plan
    - _Requirements: 3.3.4, 3.6_

- [ ] 8. Implement and deploy getPlans Lambda function
  - [x] 8.1 Create getPlans Lambda function with GSI query
    - Implement handler with pathParameters extraction
    - Add validation for userId parameter
    - Implement DynamoDB Query operation using userId-index GSI
    - Sort results by createdAt (most recent first)
    - Handle case where user has no plans (return empty array)
    - Add fallback to scan if GSI doesn't exist
    - Add error handling and CORS headers
    - Add comprehensive logging
    - _Requirements: 3.3.5, 3.6_

  - [ ] 8.2 Write unit tests for getPlans
    - Test successful retrieval of plans for user with plans
    - Test empty array response for user with no plans
    - Test validation error for missing userId
    - _Requirements: 3.3.5, 3.6_

- [ ] 9. Set up API Gateway REST API
  - Create REST API named `savesmart-api`
  - Create resources: /users, /users/{userId}, /chat, /plans, /plans/{userId}
  - Configure CORS for all resources (Allow-Origin: *, Allow-Headers: Content-Type,Authorization, Allow-Methods: GET,POST,PUT,OPTIONS)
  - Create OPTIONS methods for CORS preflight requests
  - _Requirements: 3.2_

- [ ] 10. Integrate Lambda functions with API Gateway
  - Create POST /users integration with saveUser Lambda (proxy integration)
  - Create GET /users/{userId} integration with getUser Lambda (proxy integration)
  - Create PUT /users/{userId} integration with updateUser Lambda (proxy integration)
  - Create POST /chat integration with chat Lambda (proxy integration)
  - Create GET /plans/{userId} integration with getPlans Lambda (proxy integration)
  - Configure method responses for each endpoint
  - _Requirements: 3.2, 3.3_

- [ ] 11. Deploy API Gateway to prod stage
  - Create deployment to `prod` stage
  - Note the API Gateway URL (format: https://{api-id}.execute-api.ap-southeast-2.amazonaws.com/prod)
  - Test all endpoints using the prod URL
  - _Requirements: 3.2_

- [ ] 12. Configure environment variables for chat Lambda
  - Set N8N_WEBHOOK_URL environment variable in chat Lambda configuration
  - Verify environment variable is accessible in Lambda function
  - _Requirements: 3.3.4_

- [ ] 13. Create demo data for testing
  - Insert Sarah's demo user profile into savesmart-users table
  - Use userId: demo-sarah-123
  - Populate all profile fields with demo data
  - Optionally create a sample plan in savesmart-plans table
  - _Requirements: 5.1_

- [ ] 14. End-to-end integration testing
  - [ ] 14.1 Write property test for standardized error format
    - **Property 6: Standardized Error Format**
    - **Validates: Requirements 3.6**

  - [ ] 14.2 Write integration tests for complete flows
    - Test user creation → retrieval → update → retrieval flow
    - Test chat flow: create user → send chat → verify plan saved → retrieve plans
    - Test CORS headers present in all responses
    - Test error responses from all endpoints
    - _Requirements: 3.3, 3.6_

- [ ] 15. Final checkpoint - Verify all endpoints operational
  - Test POST /users with valid data returns 200
  - Test GET /users/{userId} with valid userId returns 200
  - Test PUT /users/{userId} with valid updates returns 200
  - Test POST /chat with valid userId and message returns 200 (requires n8n webhook)
  - Test GET /plans/{userId} returns 200
  - Verify all error cases return appropriate status codes
  - Verify CORS headers present in all responses
  - Check CloudWatch Logs for any errors
  - Ensure all tests pass, ask the user if questions arise

- [ ] 16. Create API documentation and handoff materials
  - Document API Gateway URL
  - Create example request/response payloads for each endpoint
  - Document error response formats
  - Create Postman collection for API testing
  - Document n8n webhook contract (request/response format)
  - Share API documentation with frontend team
  - _Requirements: 9.1, 9.2_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each Lambda function should be tested independently before API Gateway integration
- The chat Lambda function is the most complex and critical - allocate extra time for testing
- Environment variable N8N_WEBHOOK_URL must be set before testing chat endpoint
- All Lambda functions use Node.js 20.x runtime with AWS SDK v3
- Use `@aws-sdk/client-dynamodb` and `@aws-sdk/util-dynamodb` packages
- All responses must include CORS headers to avoid browser blocking
- Property tests should run minimum 100 iterations each
- Consider using AWS SAM or Terraform for infrastructure deployment (optional for MVP)
