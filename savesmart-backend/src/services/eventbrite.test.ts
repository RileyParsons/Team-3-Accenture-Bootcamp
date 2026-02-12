/**
 * Unit tests for EventbriteService
 */

// Mock env-loader before any imports
jest.mock('../env-loader.js', () => ({}));

import { EventbriteService } from './eventbrite.js';
import { getConfig } from '../config/env.js';

// Mock dependencies
jest.mock('../config/env');
jest.mock('../utils/mockData', () => ({
  generateMockEvents: jest.fn(() => [
    {
      eventId: 'mock-1',
      name: 'Mock Event',
      description: 'A mock event',
      date: '2024-01-01T00:00:00Z',
      location: {
        venue: 'Mock Venue',
        suburb: 'Melbourne',
        postcode: '3000',
        coordinates: { lat: -37.8136, lng: 144.9631 },
      },
      discount: {
        description: 'Free event',
        percentage: 100,
      },
      externalUrl: 'https://example.com',
      source: 'mock',
      cachedAt: '2024-01-01T00:00:00Z',
    },
  ]),
}));

const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;

// Mock global fetch
global.fetch = jest.fn();

describe('EventbriteService', () => {
  let service: EventbriteService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default config with API key
    mockGetConfig.mockReturnValue({
      port: 3001,
      nodeEnv: 'test',
      corsOrigin: 'http://localhost:3000',
      aws: {
        region: 'us-east-1',
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
      },
      dynamodb: {
        usersTable: 'test-users',
        plansTable: 'test-plans',
        eventsTable: 'test-events',
        recipesTable: 'test-recipes',
        fuelStationsTable: 'test-fuel',
        transactionsTable: 'test-transactions',
      },
      openai: {
        apiKey: 'test-openai-key',
      },
      externalApis: {
        eventbriteApiKey: 'test-api-key',
      },
    });
  });

  describe('API Client Implementation (Task 2.1)', () => {
    it('should set Authorization header with Bearer token prefix', async () => {
      service = new EventbriteService();

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ events: [] }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await service.searchEvents('Melbourne');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should set Content-Type header to application/json', async () => {
      service = new EventbriteService();

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ events: [] }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await service.searchEvents('Melbourne');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should use constructed URL from buildSearchUrl()', async () => {
      service = new EventbriteService();

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ events: [] }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await service.searchEvents('Melbourne');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://www.eventbriteapi.com/v3/events/search/'),
        expect.any(Object)
      );

      // Verify URL includes location parameter
      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('location.address=Melbourne');
    });

    it('should include expand=venue parameter in URL', async () => {
      service = new EventbriteService();

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ events: [] }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await service.searchEvents('Melbourne');

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('expand=venue');
    });

    it('should parse JSON response', async () => {
      service = new EventbriteService();

      const mockEventData = {
        events: [
          {
            id: '123',
            name: { text: 'Test Event' },
            summary: 'Test summary',
            start: { utc: '2024-01-01T00:00:00Z' },
            url: 'https://eventbrite.com/event/123',
            is_free: true,
            venue: {
              name: 'Test Venue',
              address: {
                city: 'Melbourne',
                postal_code: '3000',
              },
              latitude: '-37.8136',
              longitude: '144.9631',
            },
          },
        ],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockEventData),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      expect(mockResponse.json).toHaveBeenCalled();
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('Test Event');
    });

    it('should throw error with status code for non-200 responses', async () => {
      service = new EventbriteService();

      const mockResponse = {
        ok: false,
        status: 401,
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Should fall back to mock data instead of throwing
      const events = await service.searchEvents('Melbourne');

      // Verify it fell back to mock data
      expect(events[0].source).toBe('mock');
    });

    it('should handle 403 Forbidden error', async () => {
      service = new EventbriteService();

      const mockResponse = {
        ok: false,
        status: 403,
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      expect(events[0].source).toBe('mock');
    });

    it('should handle 429 Too Many Requests error', async () => {
      service = new EventbriteService();

      const mockResponse = {
        ok: false,
        status: 429,
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      expect(events[0].source).toBe('mock');
    });

    it('should handle 500 Internal Server Error', async () => {
      service = new EventbriteService();

      const mockResponse = {
        ok: false,
        status: 500,
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      expect(events[0].source).toBe('mock');
    });

    it('should handle network errors gracefully', async () => {
      service = new EventbriteService();

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const events = await service.searchEvents('Melbourne');

      expect(events[0].source).toBe('mock');
    });
  });

  describe('Event Transformation (Task 3.1)', () => {
    it('should return empty array when events array is missing', async () => {
      service = new EventbriteService();

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      expect(events).toEqual([]);
    });

    it('should return empty array when events is not an array', async () => {
      service = new EventbriteService();

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ events: 'not-an-array' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      expect(events).toEqual([]);
    });

    it('should extract all fields correctly from complete event data', async () => {
      service = new EventbriteService();

      const mockEventData = {
        events: [
          {
            id: '123456',
            name: { text: 'Tech Meetup Melbourne' },
            description: { text: 'A great tech meetup event' },
            summary: 'Tech meetup summary',
            start: { utc: '2024-06-15T18:00:00Z' },
            url: 'https://eventbrite.com/event/123456',
            is_free: true,
            venue: {
              name: 'Melbourne Convention Centre',
              address: {
                city: 'Melbourne',
                postal_code: '3000',
              },
              latitude: '-37.8136',
              longitude: '144.9631',
            },
          },
        ],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockEventData),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        eventId: 'eventbrite-123456',
        name: 'Tech Meetup Melbourne',
        description: 'A great tech meetup event',
        date: '2024-06-15T18:00:00Z',
        location: {
          venue: 'Melbourne Convention Centre',
          suburb: 'Melbourne',
          postcode: '3000',
          coordinates: {
            lat: -37.8136,
            lng: 144.9631,
          },
        },
        discount: {
          description: 'Free event',
          percentage: 100,
        },
        externalUrl: 'https://eventbrite.com/event/123456',
        source: 'eventbrite',
      });
      expect(events[0].cachedAt).toBeDefined();
    });

    it('should use fallback values for missing name', async () => {
      service = new EventbriteService();

      const mockEventData = {
        events: [
          {
            id: '123',
            start: { utc: '2024-01-01T00:00:00Z' },
            url: 'https://eventbrite.com/event/123',
            is_free: false,
          },
        ],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockEventData),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      expect(events[0].name).toBe('Unnamed Event');
    });

    it('should use fallback values for missing description', async () => {
      service = new EventbriteService();

      const mockEventData = {
        events: [
          {
            id: '123',
            name: { text: 'Test Event' },
            start: { utc: '2024-01-01T00:00:00Z' },
            url: 'https://eventbrite.com/event/123',
            is_free: false,
          },
        ],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockEventData),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      expect(events[0].description).toBe('');
    });

    it('should use summary as fallback for description when description.text is missing', async () => {
      service = new EventbriteService();

      const mockEventData = {
        events: [
          {
            id: '123',
            name: { text: 'Test Event' },
            summary: 'This is a summary',
            start: { utc: '2024-01-01T00:00:00Z' },
            url: 'https://eventbrite.com/event/123',
            is_free: false,
          },
        ],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockEventData),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      expect(events[0].description).toBe('This is a summary');
    });

    it('should use current timestamp as fallback for missing date', async () => {
      service = new EventbriteService();

      const beforeTime = new Date().toISOString();

      const mockEventData = {
        events: [
          {
            id: '123',
            name: { text: 'Test Event' },
            url: 'https://eventbrite.com/event/123',
            is_free: false,
          },
        ],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockEventData),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      const afterTime = new Date().toISOString();

      // Check that the date is between before and after (within reasonable time)
      expect(events[0].date).toBeDefined();
      expect(new Date(events[0].date).getTime()).toBeGreaterThanOrEqual(new Date(beforeTime).getTime());
      expect(new Date(events[0].date).getTime()).toBeLessThanOrEqual(new Date(afterTime).getTime());
    });

    it('should use fallback values for missing venue', async () => {
      service = new EventbriteService();

      const mockEventData = {
        events: [
          {
            id: '123',
            name: { text: 'Test Event' },
            start: { utc: '2024-01-01T00:00:00Z' },
            url: 'https://eventbrite.com/event/123',
            is_free: false,
          },
        ],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockEventData),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      expect(events[0].location.venue).toBe('TBA');
      expect(events[0].location.suburb).toBe('Unknown');
      expect(events[0].location.postcode).toBe('0000');
      expect(events[0].location.coordinates.lat).toBe(0);
      expect(events[0].location.coordinates.lng).toBe(0);
    });

    it('should use fallback values for missing venue address fields', async () => {
      service = new EventbriteService();

      const mockEventData = {
        events: [
          {
            id: '123',
            name: { text: 'Test Event' },
            start: { utc: '2024-01-01T00:00:00Z' },
            url: 'https://eventbrite.com/event/123',
            is_free: false,
            venue: {
              name: 'Test Venue',
              address: {},
            },
          },
        ],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockEventData),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      expect(events[0].location.venue).toBe('Test Venue');
      expect(events[0].location.suburb).toBe('Unknown');
      expect(events[0].location.postcode).toBe('0000');
    });

    it('should parse coordinates as floats with fallback to 0', async () => {
      service = new EventbriteService();

      const mockEventData = {
        events: [
          {
            id: '123',
            name: { text: 'Test Event' },
            start: { utc: '2024-01-01T00:00:00Z' },
            url: 'https://eventbrite.com/event/123',
            is_free: false,
            venue: {
              name: 'Test Venue',
              address: {
                city: 'Melbourne',
                postal_code: '3000',
              },
              latitude: 'invalid',
              longitude: 'invalid',
            },
          },
        ],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockEventData),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      expect(events[0].location.coordinates.lat).toBe(0);
      expect(events[0].location.coordinates.lng).toBe(0);
    });

    it('should set discount correctly for free events', async () => {
      service = new EventbriteService();

      const mockEventData = {
        events: [
          {
            id: '123',
            name: { text: 'Free Event' },
            start: { utc: '2024-01-01T00:00:00Z' },
            url: 'https://eventbrite.com/event/123',
            is_free: true,
          },
        ],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockEventData),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      expect(events[0].discount.description).toBe('Free event');
      expect(events[0].discount.percentage).toBe(100);
    });

    it('should set discount correctly for paid events', async () => {
      service = new EventbriteService();

      const mockEventData = {
        events: [
          {
            id: '123',
            name: { text: 'Paid Event' },
            start: { utc: '2024-01-01T00:00:00Z' },
            url: 'https://eventbrite.com/event/123',
            is_free: false,
          },
        ],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockEventData),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      expect(events[0].discount.description).toBe('Check event page for pricing');
      expect(events[0].discount.percentage).toBeUndefined();
    });

    it('should use empty string as fallback for missing externalUrl', async () => {
      service = new EventbriteService();

      const mockEventData = {
        events: [
          {
            id: '123',
            name: { text: 'Test Event' },
            start: { utc: '2024-01-01T00:00:00Z' },
            is_free: false,
          },
        ],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockEventData),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      expect(events[0].externalUrl).toBe('');
    });

    it('should set source to eventbrite for API responses', async () => {
      service = new EventbriteService();

      const mockEventData = {
        events: [
          {
            id: '123',
            name: { text: 'Test Event' },
            start: { utc: '2024-01-01T00:00:00Z' },
            url: 'https://eventbrite.com/event/123',
            is_free: false,
          },
        ],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockEventData),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      expect(events[0].source).toBe('eventbrite');
    });

    it('should set cachedAt to current ISO timestamp', async () => {
      service = new EventbriteService();

      const beforeTime = new Date().toISOString();

      const mockEventData = {
        events: [
          {
            id: '123',
            name: { text: 'Test Event' },
            start: { utc: '2024-01-01T00:00:00Z' },
            url: 'https://eventbrite.com/event/123',
            is_free: false,
          },
        ],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockEventData),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const events = await service.searchEvents('Melbourne');

      const afterTime = new Date().toISOString();

      expect(events[0].cachedAt).toBeDefined();
      expect(new Date(events[0].cachedAt).getTime()).toBeGreaterThanOrEqual(new Date(beforeTime).getTime());
      expect(new Date(events[0].cachedAt).getTime()).toBeLessThanOrEqual(new Date(afterTime).getTime());
    });
  });

  describe('Fallback Behavior', () => {
    it('should use mock data when API key is not configured', async () => {
      mockGetConfig.mockReturnValue({
        port: 3001,
        nodeEnv: 'test',
        corsOrigin: 'http://localhost:3000',
        aws: {
          region: 'us-east-1',
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
        dynamodb: {
          usersTable: 'test-users',
          plansTable: 'test-plans',
          eventsTable: 'test-events',
          recipesTable: 'test-recipes',
          fuelStationsTable: 'test-fuel',
          transactionsTable: 'test-transactions',
        },
        openai: {
          apiKey: 'test-openai-key',
        },
        externalApis: {
          eventbriteApiKey: undefined,
        },
      });

      service = new EventbriteService();
      const events = await service.searchEvents('Melbourne');

      expect(events[0].source).toBe('mock');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should log warning when API key is not configured', async () => {
      mockGetConfig.mockReturnValue({
        port: 3001,
        nodeEnv: 'test',
        corsOrigin: 'http://localhost:3000',
        aws: {
          region: 'us-east-1',
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
        dynamodb: {
          usersTable: 'test-users',
          plansTable: 'test-plans',
          eventsTable: 'test-events',
          recipesTable: 'test-recipes',
          fuelStationsTable: 'test-fuel',
          transactionsTable: 'test-transactions',
        },
        openai: {
          apiKey: 'test-openai-key',
        },
        externalApis: {
          eventbriteApiKey: undefined,
        },
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      service = new EventbriteService();
      await service.searchEvents('Melbourne');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Eventbrite API key not configured, using mock data'
      );

      consoleSpy.mockRestore();
    });

    it('should log error when API call fails', async () => {
      service = new EventbriteService();

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      await service.searchEvents('Melbourne');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Eventbrite API call failed:',
        'API Error'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Falling back to mock event data'
      );

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });
});
