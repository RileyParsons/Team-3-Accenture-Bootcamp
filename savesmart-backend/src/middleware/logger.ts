import { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware
 * Logs HTTP method, path, and timestamp for all incoming requests
 *
 * Requirements: 14.3
 */
export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;

  console.log(`[${timestamp}] ${method} ${path}`);

  next();
}
