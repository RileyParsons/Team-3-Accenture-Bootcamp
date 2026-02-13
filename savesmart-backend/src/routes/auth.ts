/**
 * Authentication Routes
 *
 * Provides endpoints for user registration and authentication.
 * This is a simplified version for the local backend.
 */

import { Router, Request, Response } from 'express';
import { DynamoDBService } from '../services/dynamodb.js';
import { User } from '../models/User.js';

const router = Router();

// Lazy-load DynamoDB service
let dbService: DynamoDBService | null = null;
function getDBService(): DynamoDBService {
  if (!dbService) {
    dbService = new DynamoDBService();
  }
  return dbService;
}

/**
 * POST /api/test_users
 *
 * Legacy endpoint for user registration (kept for backward compatibility)
 * Creates a new user in the database
 */
router.post('/test_users', async (req: Request, res: Response) => {
  try {
    console.log('User registration request:', { userId: req.body.userId, email: req.body.email });

    const {
      userId,
      email,
      name,
      hashedPassword,
      income,
      incomeFrequency,
      savings,
      location,
      postcode,
      recurringExpenses,
      createdAt,
    } = req.body;

    // Validate required fields
    if (!userId || !email || !name) {
      return res.status(400).json({
        error: 'Validation failed',
        details: {
          userId: !userId ? 'userId is required' : undefined,
          email: !email ? 'email is required' : undefined,
          name: !name ? 'name is required' : undefined,
        },
      });
    }

    // Create user object
    const user: User = {
      userId,
      email,
      name,
      location: {
        suburb: location || '',
        postcode: postcode || '',
      },
      savingsGoal: savings || 0,
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to DynamoDB
    const savedUser = await getDBService().createUser(user);

    console.log('User created successfully:', savedUser.userId);

    // Return success response
    return res.status(200).json({
      message: 'User created successfully',
      userId: savedUser.userId,
      user: savedUser,
    });
  } catch (error) {
    console.error('User registration error:', error);

    // Check if user already exists
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this ID or email already exists',
      });
    }

    return res.status(500).json({
      error: 'Database operation failed',
      message: error instanceof Error ? error.message : 'Failed to create user',
    });
  }
});

/**
 * GET /api/test_users/:userId
 *
 * Legacy endpoint for getting user by ID (kept for backward compatibility)
 */
router.get('/test_users/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'Validation failed',
        details: { userId: 'userId is required' },
      });
    }

    const user = await getDBService().getUser(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Resource not found',
        resource: 'User',
        id: userId,
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: 'Database operation failed',
      message: error instanceof Error ? error.message : 'Failed to get user',
    });
  }
});

/**
 * POST /api/auth/login
 *
 * Simple login endpoint for email/password authentication
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        details: {
          email: !email ? 'email is required' : undefined,
          password: !password ? 'password is required' : undefined,
        },
      });
    }

    console.log('Login attempt for email:', email);

    // Get user by email from DynamoDB
    const user = await getDBService().getUserByEmail(email);

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    // For demo purposes, we're using simple SHA-256 hashing (same as frontend)
    // In production, use bcrypt or similar
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map((b: number) => b.toString(16).padStart(2, '0')).join('');

    // Verify password (comparing hashes)
    if (user.hashedPassword !== hashedPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    console.log('Login successful for user:', email);

    // Return user data (exclude hashedPassword)
    const { hashedPassword: _, ...safeUserData } = user;

    return res.status(200).json(safeUserData);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Failed to authenticate',
    });
  }
});

export default router;
