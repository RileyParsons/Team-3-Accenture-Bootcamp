# Shared Utilities

This directory contains shared services and utilities used across Lambda functions.

## Structure

- `services/` - Reusable service classes
  - `TokenService` - JWT token generation and validation
  - `PasswordService` - Password hashing and verification
  - `ValidationService` - Input validation
  - `UserRepository` - DynamoDB user operations

- `utils/` - Utility functions
  - SSM parameter management
  - Common helpers
