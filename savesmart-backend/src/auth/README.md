# Authentication Lambda

This directory contains the authentication Lambda function for the SaveSmart backend.

## Structure

- `handlers/` - Request handlers for auth endpoints (register, login, refresh, reset)
- `services/` - Core authentication services (moved to shared/services)
- `index.ts` - Main Lambda handler entry point

## Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Token refresh
- `POST /auth/reset-request` - Password reset request
- `POST /auth/reset-complete` - Password reset completion

## Dependencies

- `jsonwebtoken` - JWT token generation and validation
- `bcryptjs` - Password hashing
- `uuid` - User ID generation
- `@aws-sdk/client-dynamodb` - DynamoDB operations
- `@aws-sdk/client-ssm` - Systems Manager Parameter Store access
