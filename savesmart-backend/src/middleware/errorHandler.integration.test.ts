import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import {
  errorHandler,
  ValidationError,
  ExternalAPIError,
  DatabaseError,
} from './errorHandler';

describe('Error Handler Integration Tests', () => {
  let app: express.Application;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should handle ValidationError in route', async () => {
    app.get('/test-validation', (req: Request, res: Response, next: NextFunction) => {
      next(new ValidationError('Invalid data', { email: 'Invalid email format' }));
    });
    app.use(errorHandler);

    const response = await request(app).get('/test-validation');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Validation failed',
      details: { email: 'Invalid email format' },
    });
  });

  it('should handle ExternalAPIError in route', async () => {
    app.get('/test-api-error', (req: Request, res: Response, next: NextFunction) => {
      next(new ExternalAPIError('API unavailable', 'Eventbrite'));
    });
    app.use(errorHandler);

    const response = await request(app).get('/test-api-error');

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      error: 'External API error',
      message: 'API unavailable',
      apiName: 'Eventbrite',
    });
  });

  it('should handle DatabaseError in route', async () => {
    app.get('/test-db-error', (req: Request, res: Response, next: NextFunction) => {
      next(new DatabaseError('Connection failed'));
    });
    app.use(errorHandler);

    const response = await request(app).get('/test-db-error');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Database operation failed',
      message: 'Connection failed',
    });
  });

  it('should handle generic errors in route', async () => {
    app.get('/test-generic-error', (req: Request, res: Response, next: NextFunction) => {
      next(new Error('Unexpected error'));
    });
    app.use(errorHandler);

    const response = await request(app).get('/test-generic-error');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Internal server error',
      message: 'Unexpected error',
    });
  });

  it('should log all errors with timestamp and stack trace', async () => {
    app.get('/test-logging', (req: Request, res: Response, next: NextFunction) => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';
      next(error);
    });
    app.use(errorHandler);

    await request(app).get('/test-logging');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] Error occurred:/)
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith('Method: GET');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Path: /test-logging');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Test error');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Stack trace:')
    );
  });

  it('should handle async route errors', async () => {
    app.get('/test-async', async (req: Request, res: Response, next: NextFunction) => {
      try {
        throw new ValidationError('Async validation failed', { field: 'error' });
      } catch (error) {
        next(error);
      }
    });
    app.use(errorHandler);

    const response = await request(app).get('/test-async');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Validation failed',
      details: { field: 'error' },
    });
  });
});
