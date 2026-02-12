import { Request, Response, NextFunction } from 'express';
import { getConfig } from '../config/env.js';

/**
 * CORS middleware to enable cross-origin requests from the frontend
 * Configured to allow requests from localhost:3000 (frontend)
 *
 * Requirements: 1.3
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const config = getConfig();
  const allowedOrigin = config.corsOrigin;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
}
