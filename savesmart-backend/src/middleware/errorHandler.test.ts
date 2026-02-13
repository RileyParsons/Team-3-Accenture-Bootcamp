import { Request, Response, NextFunction } from 'express';
import {
  errorHandler,
  ValidationError,
  ExternalAPIError,
  DatabaseError,
} from './errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let consoleErrorSpy: jest.SpyInstance;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/api/test',
    };

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    nextFunction = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Error Logging', () => {
    it('should log error with timestamp, method, path, and stack trace', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] Error occurred:/)
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith('Method: GET');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Path: /api/test');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Test error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Stack trace:')
      );
    });

    it('should handle errors without stack trace', () => {
      const error = new Error('Test error');
      delete error.stack;

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] Error occurred:/)
      );
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Stack trace:')
      );
    });
  });

  describe('ValidationError Handling', () => {
    it('should return 400 status code for ValidationError', () => {
      const error = new ValidationError('Validation failed', {
        email: 'Invalid email format',
        name: 'Name is required',
      });

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: {
          email: 'Invalid email format',
          name: 'Name is required',
        },
      });
    });

    it('should handle ValidationError with empty details', () => {
      const error = new ValidationError('Validation failed');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: {},
      });
    });
  });

  describe('ExternalAPIError Handling', () => {
    it('should return 502 status code for ExternalAPIError', () => {
      const error = new ExternalAPIError(
        'API request failed',
        'Eventbrite'
      );

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(502);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'External API error',
        message: 'API request failed',
        apiName: 'Eventbrite',
      });
    });

    it('should handle different API names', () => {
      const error = new ExternalAPIError(
        'Connection timeout',
        'FuelCheck'
      );

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(502);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'External API error',
        message: 'Connection timeout',
        apiName: 'FuelCheck',
      });
    });
  });

  describe('DatabaseError Handling', () => {
    it('should return 500 status code for DatabaseError', () => {
      const error = new DatabaseError('Failed to connect to DynamoDB');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Database operation failed',
        message: 'Failed to connect to DynamoDB',
      });
    });

    it('should handle query failure errors', () => {
      const error = new DatabaseError('Query execution failed');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Database operation failed',
        message: 'Query execution failed',
      });
    });
  });

  describe('Generic Error Handling', () => {
    it('should return 500 status code for generic errors', () => {
      const error = new Error('Unexpected error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Unexpected error',
      });
    });

    it('should handle errors with different messages', () => {
      const error = new Error('Something went wrong');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Something went wrong',
      });
    });
  });

  describe('Error Categorization', () => {
    it('should correctly identify and handle ValidationError', () => {
      const error = new ValidationError('Invalid input', { field: 'error' });

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Validation failed' })
      );
    });

    it('should correctly identify and handle ExternalAPIError', () => {
      const error = new ExternalAPIError('API failed', 'TestAPI');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(502);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'External API error' })
      );
    });

    it('should correctly identify and handle DatabaseError', () => {
      const error = new DatabaseError('DB connection failed');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Database operation failed' })
      );
    });
  });
});
