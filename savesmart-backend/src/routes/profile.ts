/**
 * Profile Routes
 *
 * Provides endpoints for user profile CRUD operations.
 * Handles profile retrieval and updates with validation.
 *
 * Requirements: 6.5, 6.6, 6.7, 6.8, 12.1, 12.2
 */

import { Router, Request, Response } from 'express';
import { DynamoDBService } from '../services/dynamodb.js';
import { User, UserLocation } from '../models/User.js';

const router = Router();

// Lazy-load DynamoDB service to avoid initialization issues
let dbService: DynamoDBService | null = null;
function getDBService(): DynamoDBService {
  if (!dbService) {
    dbService = new DynamoDBService();
  }
  return dbService;
}

/**
 * Profile update request body interface
 */
interface ProfileUpdateRequest {
  name?: string;
  email?: string;
  location?: UserLocation;
  savingsGoal?: number;
}

/**
 * Validation error details
 */
interface ValidationErrors {
  [field: string]: string;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate profile update data
 * Requirement 6.6: Validate profile data before updating
 * Requirement 6.8: Return specific error messages for each invalid field
 */
function validateProfileUpdate(updates: ProfileUpdateRequest): ValidationErrors {
  const errors: ValidationErrors = {};

  // Validate name
  if (updates.name !== undefined) {
    if (typeof updates.name !== 'string' || updates.name.trim().length === 0) {
      errors.name = 'Name is required and must be a non-empty string';
    } else if (updates.name.trim().length > 100) {
      errors.name = 'Name must not exceed 100 characters';
    }
  }

  // Validate email
  if (updates.email !== undefined) {
    if (typeof updates.email !== 'string' || updates.email.trim().length === 0) {
      errors.email = 'Email is required and must be a non-empty string';
    } else if (!isValidEmail(updates.email)) {
      errors.email = 'Email must be a valid email address';
    }
  }

  // Validate location
  if (updates.location !== undefined) {
    if (typeof updates.location !== 'object' || updates.location === null) {
      errors.location = 'Location must be an object';
    } else {
      if (!updates.location.suburb || typeof updates.location.suburb !== 'string' || updates.location.suburb.trim().length === 0) {
        errors['location.suburb'] = 'Location suburb is required and must be a non-empty string';
      }
      if (!updates.location.postcode || typeof updates.location.postcode !== 'string' || updates.location.postcode.trim().length === 0) {
        errors['location.postcode'] = 'Location postcode is required and must be a non-empty string';
      }
      // Validate coordinates if provided
      if (updates.location.coordinates !== undefined) {
        if (typeof updates.location.coordinates !== 'object' || updates.location.coordinates === null) {
          errors['location.coordinates'] = 'Location coordinates must be an object';
        } else {
          if (typeof updates.location.coordinates.lat !== 'number' || updates.location.coordinates.lat < -90 || updates.location.coordinates.lat > 90) {
            errors['location.coordinates.lat'] = 'Latitude must be a number between -90 and 90';
          }
          if (typeof updates.location.coordinates.lng !== 'number' || updates.location.coordinates.lng < -180 || updates.location.coordinates.lng > 180) {
            errors['location.coordinates.lng'] = 'Longitude must be a number between -180 and 180';
          }
        }
      }
    }
  }

  // Validate savingsGoal
  if (updates.savingsGoal !== undefined) {
    if (typeof updates.savingsGoal !== 'number') {
      errors.savingsGoal = 'Savings goal must be a number';
    } else if (updates.savingsGoal < 0) {
      errors.savingsGoal = 'Savings goal must be a positive number';
    } else if (!Number.isFinite(updates.savingsGoal)) {
      errors.savingsGoal = 'Savings goal must be a finite number';
    }
  }

  return errors;
}

/**
 * GET /api/profile/:userId
 *
 * Retrieve a user's profile information.
 * Requirement 12.1: GET /api/profile/:userId endpoint
 *
 * Path parameters:
 * - userId: User's unique identifier
 *
 * Response:
 * - 200: User profile object
 * - 404: User not found
 * - 500: Database error
 */
router.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: { userId: 'userId is required and must be a non-empty string' },
      });
    }

    // Get user from database
    const user = await getDBService().getUser(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Resource not found',
        resource: 'User',
        id: userId,
      });
    }

    // Return user profile
    return res.status(200).json(user);
  } catch (error) {
    console.error('Profile GET endpoint error:', error);
    return res.status(500).json({
      error: 'Database operation failed',
      message: error instanceof Error ? error.message : 'Failed to retrieve user profile',
    });
  }
});

/**
 * PUT /api/profile/:userId
 *
 * Update a user's profile information with validation.
 * Requirement 6.5: Send updated data to Backend_Server
 * Requirement 6.6: Validate profile data before updating
 * Requirement 6.7: Return updated profile data on success
 * Requirement 6.8: Return specific error messages for invalid fields
 * Requirement 12.2: PUT /api/profile/:userId endpoint
 *
 * Path parameters:
 * - userId: User's unique identifier
 *
 * Request body (all fields optional):
 * - name: User's name
 * - email: User's email address
 * - location: User's location (suburb, postcode, coordinates)
 * - savingsGoal: User's savings goal amount
 *
 * Response:
 * - 200: Updated user profile object
 * - 400: Validation errors
 * - 404: User not found
 * - 500: Database error
 */
router.put('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updates = req.body as ProfileUpdateRequest;

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: { userId: 'userId is required and must be a non-empty string' },
      });
    }

    // Check if any updates are provided
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: { body: 'At least one field must be provided for update' },
      });
    }

    // Validate profile update data (Requirement 6.6)
    const validationErrors = validateProfileUpdate(updates);

    // Return validation errors if any (Requirement 6.8)
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors,
      });
    }

    // Update user in database
    const updatedUser = await getDBService().updateUser(userId, updates);

    // Return updated profile data (Requirement 6.7)
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Profile PUT endpoint error:', error);

    // Handle user not found error
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Resource not found',
        resource: 'User',
        id: req.params.userId,
      });
    }

    // Handle other database errors
    return res.status(500).json({
      error: 'Database operation failed',
      message: error instanceof Error ? error.message : 'Failed to update user profile',
    });
  }
});

export default router;
