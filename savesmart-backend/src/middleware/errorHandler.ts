import { Request, Response, NextFunction } from 'express';

/**
 * Custom error classes for different error types
 */

export class ValidationError extends Error {
  public details: Record<string, string>;

  constructor(message: string, details: Record<string, string> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class ExternalAPIError extends Error {
  public apiName: string;

  constructor(message: string, apiName: string) {
    super(message);
    this.name = 'ExternalAPIError';
    this.apiName = apiName;
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Global error handler middleware
 * Categorizes errors and returns appropriate HTTP status codes and JSON responses
 * Logs all errors with timestamp and stack trace
 *
 * Requirements: 2.4, 14.1, 14.2
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error with timestamp and stack trace
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error occurred:`);
  console.error(`Method: ${req.method}`);
  console.error(`Path: ${req.path}`);
  console.error(`Error: ${err.message}`);
  if (err.stack) {
    console.error(`Stack trace:\n${err.stack}`);
  }

  // Handle ValidationError (400)
  if (err instanceof ValidationError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.details,
    });
    return;
  }

  // Handle ExternalAPIError (502)
  if (err instanceof ExternalAPIError) {
    res.status(502).json({
      error: 'External API error',
      message: err.message,
      apiName: err.apiName,
    });
    return;
  }

  // Handle DatabaseError (500)
  if (err instanceof DatabaseError) {
    res.status(500).json({
      error: 'Database operation failed',
      message: err.message,
    });
    return;
  }

  // Default error handler (500)
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
}
