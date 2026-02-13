import { Request, Response, NextFunction } from 'express';
import { loggerMiddleware } from './logger';

describe('Logger Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/api/test',
    };
    mockResponse = {};
    nextFunction = jest.fn();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should log HTTP method, path, and timestamp', () => {
    loggerMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/api\/test/)
    );
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should log POST requests', () => {
    mockRequest = {
      method: 'POST',
      path: '/api/users',
    };

    loggerMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] POST \/api\/users/)
    );
  });

  it('should log PUT requests', () => {
    mockRequest = {
      method: 'PUT',
      path: '/api/profile/123',
    };

    loggerMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] PUT \/api\/profile\/123/)
    );
  });

  it('should log DELETE requests', () => {
    mockRequest = {
      method: 'DELETE',
      path: '/api/resource/456',
    };

    loggerMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] DELETE \/api\/resource\/456/)
    );
  });

  it('should always call next() to continue request processing', () => {
    loggerMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalledTimes(1);
  });
});
