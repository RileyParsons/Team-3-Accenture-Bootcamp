import { Request, Response, NextFunction } from 'express';
import { corsMiddleware } from './cors';

// Mock the config module
jest.mock('../config/env', () => ({
  getConfig: jest.fn(() => ({
    corsOrigin: 'http://localhost:3000',
    port: 3001,
    nodeEnv: 'test',
    aws: {
      region: 'ap-southeast-2',
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
    dynamodb: {
      usersTable: 'test-users',
      plansTable: 'test-plans',
      eventsTable: 'test-events',
      recipesTable: 'test-recipes',
      fuelStationsTable: 'test-fuel',
    },
    openai: {
      apiKey: 'test',
    },
    externalApis: {},
  })),
}));

describe('CORS Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let setHeaderSpy: jest.Mock;

  beforeEach(() => {
    setHeaderSpy = jest.fn();
    mockRequest = {
      method: 'GET',
    };
    mockResponse = {
      setHeader: setHeaderSpy,
      status: jest.fn().mockReturnThis(),
      end: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  it('should set CORS headers for regular requests', () => {
    corsMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(setHeaderSpy).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      'http://localhost:3000'
    );
    expect(setHeaderSpy).toHaveBeenCalledWith(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    expect(setHeaderSpy).toHaveBeenCalledWith(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );
    expect(setHeaderSpy).toHaveBeenCalledWith(
      'Access-Control-Allow-Credentials',
      'true'
    );
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should handle OPTIONS preflight requests', () => {
    mockRequest.method = 'OPTIONS';

    corsMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(setHeaderSpy).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.end).toHaveBeenCalled();
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next() for non-OPTIONS requests', () => {
    mockRequest.method = 'POST';

    corsMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
  });
});
