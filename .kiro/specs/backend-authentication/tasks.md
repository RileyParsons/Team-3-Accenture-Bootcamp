# Implementation Plan: Backend Authentication

## Overview

This implementation plan breaks down the backend authentication feature into discrete coding tasks. The approach follows a bottom-up strategy: build core services first, then Lambda handlers, then infrastructure, and finally wire everything together. Each task builds on previous work to ensure incremental progress with no orphaned code.

## Tasks

- [-] 1. Set up project structure and dependencies
  - Create directory structure for auth Lambda and shared utilities
  - Install dependencies: jsonwebtoken, bcryptjs, uuid, aws-sdk, fast-check (dev)
  - Set up Jest testing framework with fast-check integration
  - Create package.json with Node.js 20.x compatibility
  - _Requirements: 10.5_

- [ ] 2. Implement core validation service
  - [~] 2.1 Create ValidationService class with email and password validation
    - Implement email format validation (regex for standard email format)
    - Implement password requirements validation (8 chars, 1 upper, 1 lower, 1 number)
    - Implement request payload validation methods
    - _Requirements: 1.1, 1.2_

  - [ ]* 2.2 Write property test for email validation
    - **Property 1: Email validation**
    - **Validates: Requirements 1.1**

  - [ ]* 2.3 Write property test for password validation
    - **Property 2: Password validation**
    - **Validates: Requirements 1.2**

  - [ ]* 2.4 Write unit tests for validation edge cases
    - Test empty strings, very long inputs, special characters
    - Test boundary cases for password requirements
    - _Requirements: 1.1, 1.2_

- [ ] 3. Implement password service
  - [~] 3.1 Create PasswordService class with bcrypt operations
    - Implement hashPassword method (bcrypt with 10 salt rounds)
    - Implement verifyPassword method
    - Implement validatePasswordRequirements method
    - _Requirements: 1.4, 2.2, 7.3_

  - [ ]* 3.2 Write property test for password hashing
    - **Property 4: Password hashing on storage**
    - **Validates: Requirements 1.4, 7.3**

  - [ ]* 3.3 Write property test for password verification
    - **Property 8: Password verification**
    - **Validates: Requirements 2.2**

  - [ ]* 3.4 Write unit tests for password service
    - Test bcrypt hash format validation
    - Test password verification with correct and incorrect passwords
    - _Requirements: 1.4, 2.2_

- [ ] 4. Implement token service
  - [~] 4.1 Create TokenService class with JWT operations
    - Implement generateAccessToken method (1 hour expiration, includes userId, email, type)
    - Implement generateRefreshToken method (7 day expiration, includes userId, type)
    - Implement validateToken method with signature and expiration checks
    - Implement extractUserId method
    - Use HS256 algorithm for all JWT operations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.4_

  - [ ]* 4.2 Write property test for access token structure
    - **Property 11: Access token structure and expiration**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 4.3 Write property test for refresh token structure
    - **Property 12: Refresh token structure and expiration**
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 4.4 Write property test for JWT algorithm
    - **Property 14: JWT algorithm**
    - **Validates: Requirements 3.6**

  - [ ]* 4.5 Write property test for invalid signature rejection
    - **Property 15: Invalid signature rejection**
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 4.6 Write property test for expired token rejection
    - **Property 16: Expired token rejection**
    - **Validates: Requirements 4.3**

  - [ ]* 4.7 Write unit tests for token service
    - Test token generation with various inputs
    - Test token validation edge cases
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1_

- [ ] 5. Implement user repository
  - [~] 5.1 Create UserRepository class with DynamoDB operations
    - Implement createUser method (userId, email, hashedPassword, createdAt)
    - Implement getUserById method
    - Implement getUserByEmail method (uses email-index GSI)
    - Implement updatePassword method
    - Implement setResetToken method
    - Implement clearResetToken method
    - _Requirements: 1.5, 2.1, 6.1, 6.3, 7.4, 7.5_

  - [ ]* 5.2 Write property test for user record structure
    - **Property 5: User record structure**
    - **Validates: Requirements 1.5**

  - [ ]* 5.3 Write unit tests for user repository
    - Test CRUD operations with mock DynamoDB client
    - Test GSI query for email lookup
    - Test error handling for database failures
    - _Requirements: 1.5, 2.1, 6.1_

- [~] 6. Checkpoint - Ensure all core service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement registration handler
  - [~] 7.1 Create handleRegister function in auth Lambda
    - Validate request payload (email, password)
    - Check if email already exists (return 409 if exists)
    - Hash password using PasswordService
    - Generate userId (UUID v4)
    - Create user record via UserRepository
    - Generate access and refresh tokens
    - Return response with userId, email, and tokens
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 7.2 Write property test for duplicate email rejection
    - **Property 3: Duplicate email rejection**
    - **Validates: Requirements 1.3**

  - [ ]* 7.3 Write property test for registration response tokens
    - **Property 6: Registration response tokens**
    - **Validates: Requirements 1.6**

  - [ ]* 7.4 Write unit tests for registration handler
    - Test successful registration flow
    - Test validation errors
    - Test duplicate email handling
    - _Requirements: 1.1, 1.2, 1.3, 1.6_

- [ ] 8. Implement login handler
  - [~] 8.1 Create handleLogin function in auth Lambda
    - Validate request payload (email, password)
    - Get user by email via UserRepository
    - Return generic error if user not found
    - Verify password using PasswordService
    - Return generic error if password incorrect
    - Generate access and refresh tokens
    - Return response with userId, email, and tokens
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 8.2 Write property test for login with non-existent email
    - **Property 7: Login with non-existent email**
    - **Validates: Requirements 2.1**

  - [ ]* 8.3 Write property test for generic authentication errors
    - **Property 9: Generic authentication errors**
    - **Validates: Requirements 2.3, 6.5, 9.1**

  - [ ]* 8.4 Write property test for login response tokens
    - **Property 10: Login response tokens**
    - **Validates: Requirements 2.4, 2.5, 2.6**

  - [ ]* 8.5 Write unit tests for login handler
    - Test successful login flow
    - Test invalid credentials handling
    - Test error message consistency
    - _Requirements: 2.1, 2.2, 2.3, 2.6_

- [ ] 9. Implement token refresh handler
  - [~] 9.1 Create handleRefresh function in auth Lambda
    - Validate request payload (refreshToken)
    - Validate refresh token using TokenService
    - Check token type is "refresh"
    - Extract userId from token
    - Generate new access and refresh tokens
    - Return response with new tokens
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 9.2 Write property test for refresh token validation
    - **Property 19: Refresh token validation**
    - **Validates: Requirements 5.1, 5.4**

  - [ ]* 9.3 Write property test for token refresh response
    - **Property 20: Token refresh response**
    - **Validates: Requirements 5.2, 5.3, 5.5**

  - [ ]* 9.4 Write unit tests for refresh handler
    - Test successful refresh flow
    - Test invalid token handling
    - Test expired token handling
    - _Requirements: 5.1, 5.4, 5.5_

- [ ] 10. Implement password reset request handler
  - [~] 10.1 Create handleResetRequest function in auth Lambda
    - Validate request payload (email)
    - Get user by email via UserRepository
    - Generate unique reset token (UUID v4)
    - Hash reset token using bcrypt
    - Set expiration to 1 hour from now
    - Store token hash and expiration via UserRepository
    - Return success response with reset token (always return success even if email doesn't exist)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 10.2 Write property test for reset token generation and storage
    - **Property 21: Reset token generation and storage**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

  - [ ]* 10.3 Write unit tests for reset request handler
    - Test reset token generation
    - Test token storage in database
    - Test response consistency for existing and non-existing emails
    - _Requirements: 6.1, 6.2, 6.5_

- [ ] 11. Implement password reset completion handler
  - [~] 11.1 Create handleResetComplete function in auth Lambda
    - Validate request payload (resetToken, newPassword)
    - Validate new password meets requirements
    - Hash the provided reset token
    - Query all users to find matching reset token hash (in production, would use GSI)
    - Check reset token expiration
    - Return error if token invalid or expired
    - Hash new password using PasswordService
    - Update user password via UserRepository
    - Clear reset token fields via UserRepository
    - Return success response
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 11.2 Write property test for reset token validation
    - **Property 22: Reset token validation**
    - **Validates: Requirements 7.1, 7.6**

  - [ ]* 11.3 Write property test for password reset updates password
    - **Property 23: Password reset updates password**
    - **Validates: Requirements 7.2, 7.4**

  - [ ]* 11.4 Write property test for reset token cleanup
    - **Property 24: Reset token cleanup**
    - **Validates: Requirements 7.5**

  - [ ]* 11.5 Write unit tests for reset completion handler
    - Test successful password reset flow
    - Test invalid token handling
    - Test expired token handling
    - Test password validation
    - _Requirements: 7.1, 7.2, 7.6_

- [~] 12. Checkpoint - Ensure all auth handler tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement authentication middleware for user Lambda
  - [~] 13.1 Create validateToken middleware function
    - Extract token from Authorization header (Bearer token)
    - Return 401 if no token provided
    - Validate token using TokenService
    - Return 401 if token invalid or expired
    - Check token type is "access"
    - Extract userId from token
    - Attach userId to event context for downstream use
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.3_

  - [ ]* 13.2 Write property test for token signing with SSM secret
    - **Property 13: Token signing with SSM secret**
    - **Validates: Requirements 3.5**

  - [ ]* 13.3 Write property test for userId extraction
    - **Property 17: UserId extraction from valid tokens**
    - **Validates: Requirements 4.4**

  - [ ]* 13.4 Write property test for valid token allows access
    - **Property 18: Valid token allows access**
    - **Validates: Requirements 4.5**

  - [ ]* 13.5 Write unit tests for authentication middleware
    - Test token extraction from headers
    - Test 401 responses for missing/invalid tokens
    - Test userId attachment to context
    - _Requirements: 4.1, 4.2, 4.3, 8.3_

- [ ] 14. Update user Lambda handlers with authentication
  - [~] 14.1 Modify getUser handler to require authentication
    - Apply validateToken middleware
    - Extract userId from token context
    - Extract requested userId from path parameters
    - Return 403 if token userId doesn't match requested userId
    - Get user data via UserRepository
    - Return user data (exclude hashedPassword, resetToken fields)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [~] 14.2 Modify updateUser handler to require authentication
    - Apply validateToken middleware
    - Extract userId from token context
    - Extract requested userId from path parameters
    - Return 403 if token userId doesn't match requested userId
    - Validate update payload
    - Update user data via UserRepository (don't allow password updates here)
    - Return updated user data
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 14.3 Write property test for protected endpoints require authentication
    - **Property 25: Protected endpoints require authentication**
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [ ]* 14.4 Write property test for user data isolation
    - **Property 26: User data isolation**
    - **Validates: Requirements 8.4**

  - [ ]* 14.5 Write unit tests for protected user endpoints
    - Test authentication requirement
    - Test authorization (userId matching)
    - Test successful data access
    - _Requirements: 8.1, 8.2, 8.4_

- [ ] 15. Implement SSM parameter management
  - [~] 15.1 Create SSM helper module
    - Implement getJWTSecret function to retrieve secret from Parameter Store
    - Cache secret in memory for Lambda execution context reuse
    - Handle SSM errors gracefully
    - _Requirements: 3.5_

  - [ ]* 15.2 Write unit tests for SSM helper
    - Test secret retrieval with mock SSM client
    - Test caching behavior
    - Test error handling
    - _Requirements: 3.5_

- [ ] 16. Create auth Lambda handler entry point
  - [~] 16.1 Create main handler function that routes requests
    - Initialize services (TokenService, PasswordService, UserRepository, ValidationService)
    - Get JWT secret from SSM on cold start
    - Route requests based on routeKey (POST /auth/register, /auth/login, etc.)
    - Handle errors and return appropriate status codes
    - Implement generic error responses for security
    - Never log plain text passwords
    - _Requirements: 9.1, 9.3, 9.4, 9.5_

  - [ ]* 16.2 Write property test for validation error specificity
    - **Property 28: Validation error specificity**
    - **Validates: Requirements 9.4**

  - [ ]* 16.3 Write property test for password secrecy in logs
    - **Property 29: Password secrecy in logs**
    - **Validates: Requirements 9.5**

  - [ ]* 16.4 Write unit tests for main handler routing
    - Test route dispatching
    - Test error handling
    - Test error response format
    - _Requirements: 9.1, 9.3, 9.4_

- [ ] 17. Create user Lambda handler entry point
  - [~] 17.1 Update main handler function with authentication
    - Initialize services including TokenService
    - Get JWT secret from SSM on cold start
    - Apply authentication middleware to protected routes
    - Route requests based on routeKey (GET /users/{userId}, PUT /users/{userId})
    - Handle authentication and authorization errors
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 17.2 Write property test for public endpoints allow unauthenticated access
    - **Property 27: Public endpoints allow unauthenticated access**
    - **Validates: Requirements 8.5**

  - [ ]* 17.3 Write integration tests for user Lambda
    - Test end-to-end flows with authentication
    - Test protected vs public endpoint behavior
    - _Requirements: 8.1, 8.2, 8.5_

- [~] 18. Checkpoint - Ensure all Lambda handler tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Create infrastructure setup script
  - [~] 19.1 Create script to set up DynamoDB table
    - Delete existing savesmart-users table if exists
    - Create new table with userId as partition key
    - Create Global Secondary Index on email field
    - Wait for table to be active
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [~] 19.2 Create script to set up SSM parameter
    - Generate random 256-bit secret (base64 encoded)
    - Store secret in Parameter Store as SecureString
    - Parameter name: /savesmart/jwt-secret
    - _Requirements: 3.5_

  - [~] 19.3 Create deployment documentation
    - Document environment variables needed for Lambdas
    - Document IAM permissions required (DynamoDB, SSM)
    - Document API Gateway route configuration
    - _Requirements: 10.5_

- [ ]* 20. Write end-to-end integration tests
  - [ ]* 20.1 Test complete registration and login flow
    - Register user → Login → Access protected endpoint
    - Verify tokens work correctly
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.6, 8.4_

  - [ ]* 20.2 Test token refresh flow
    - Login → Wait → Refresh → Access protected endpoint
    - Verify new tokens work correctly
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [ ]* 20.3 Test password reset flow
    - Register → Request reset → Complete reset → Login with new password
    - Verify old password doesn't work
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.4, 7.5_

  - [ ]* 20.4 Test security properties
    - Verify tokens with wrong signatures are rejected
    - Verify expired tokens are rejected
    - Verify users cannot access other users' data
    - Verify error messages don't leak information
    - _Requirements: 4.1, 4.2, 4.3, 8.4, 9.1_

- [~] 21. Final checkpoint - Ensure all tests pass and system is ready
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: services → handlers → infrastructure
- All code should be compatible with Node.js 20.x runtime
- JWT secret must be stored in AWS Systems Manager Parameter Store, never hardcoded
