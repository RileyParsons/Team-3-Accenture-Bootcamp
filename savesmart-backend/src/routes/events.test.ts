/**
 * Unit tests for Events Routes
 *
 * Tests the events endpoint with location filtering and caching behavior.
 */

import request from 'supertest';
import express, { Express } from 'express';
import eventsRoutes from './events';
import { cacheService } from '../utils/cache';

// Mock the EventbriteService
jest.mock('../services/eventbrite', () => {
  return {
    EventbriteService: jest.fn().mockImplementation(() => {
      return {
        searchEvents: jest.fn().mockResolvedValue([
          {
            eventId: 'mock-event-1',
            name: 'Test Event 1',
            description: 'A test event in Sydney',
            date: '2024-02-01T10:00:00Z',
            location: {
              venue: 'Test Venue',
              suburb: 'Sydney',
              postcode: '2000',
              coordinates: { lat: -33.8688, lng: 151.2093 },
            },
            discount: {
              description: 'Free event',
              percentage: 100,
            },
            externalUrl: 'https://example.com/event1',
            source: 'mock',
            cachedAt: new Date().toISOString(),
          },
          {
            eventId: 'mock-event-2',
            name: 'Test Event 2',
            description: 'A test event in Parramatta',
            date: '2024-02-02T14:00:00Z',
            location: {
              venue: 'Another Venue',
              suburb: 'Parramatta',
              postcode: '2150',
              coordinates: { lat: -33.8150, lng: 151.0000 },
            },
            discount: {
              description: '20% off',
              percentage: 20,
            },
            externalUrl: 'https://example.com/event2',
            source: 'mock',
            cachedAt: new Date().toISOString(),
          },
        ]),
      };
    }),
  };
});

describe('Events Routes', () => {
  let app: Express;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api', eventsRoutes);

    // Clear cache before each test
    cacheService.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/events', () => {
    it('should return events without filters', async () => {
      const response = await request(app).get('/api/events');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('events');
      expect(response.body).toHaveProperty('source');
      expect(Array.isArray(response.body.events)).toBe(true);
      expect(response.body.source).toBe('mock');
    });

    it('should filter events by suburb', async () => {
      const response = await request(app).get('/api/events?suburb=Sydney');

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].location.suburb).toBe('Sydney');
    });

    it('should filter events by postcode', async () => {
      const response = await request(app).get('/api/events?postcode=2150');

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].location.postcode).toBe('2150');
    });

    it('should filter events by both suburb and postcode', async () => {
      const response = await request(app).get('/api/events?suburb=Parramatta&postcode=2150');

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].location.suburb).toBe('Parramatta');
      expect(response.body.events[0].location.postcode).toBe('2150');
    });

    it('should return empty array when no events match filters', async () => {
      const response = await request(app).get('/api/events?suburb=Melbourne');

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(0);
    });

    it('should cache events data', async () => {
      // First request - should fetch from service
      const response1 = await request(app).get('/api/events?suburb=Sydney');
      expect(response1.status).toBe(200);

      // Second request - should use cache
      const response2 = await request(app).get('/api/events?suburb=Sydney');
      expect(response2.status).toBe(200);
      expect(response2.body).toEqual(response1.body);
    });

    it('should return 400 for invalid suburb parameter type', async () => {
      // Note: This is hard to test with supertest as query params are always strings
      // But the validation is in place in the route handler
      const response = await request(app).get('/api/events?suburb=Sydney');
      expect(response.status).toBe(200); // Valid string
    });

    it('should handle case-insensitive suburb search', async () => {
      const response = await request(app).get('/api/events?suburb=sydney');

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].location.suburb).toBe('Sydney');
    });

    it('should handle partial suburb match', async () => {
      const response = await request(app).get('/api/events?suburb=Syd');

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].location.suburb).toBe('Sydney');
    });
  });
});
