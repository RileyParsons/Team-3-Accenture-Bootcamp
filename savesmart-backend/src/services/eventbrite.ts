/**
 * Eventbrite API Service
 *
 * Integrates with Eventbrite API for event discovery.
 * Falls back to mock data when API is unavailable or API key is not configured.
 *
 * Requirements: 8.3, 8.4, 14.5
 */

import { Event } from '../models/Event.js';
import { getConfig } from '../config/env.js';
import { generateMockEvents } from '../utils/mockData.js';

/**
 * Eventbrite API Response Types
 * Based on Eventbrite API v3 specification
 */

export interface EventbriteAPIResponse {
  pagination: {
    object_count: number;
    page_number: number;
    page_size: number;
    page_count: number;
  };
  events: EventbriteEvent[];
}

export interface EventbriteEvent {
  id: string;
  name: {
    text: string;
    html: string;
  };
  description: {
    text: string;
    html: string;
  } | null;
  summary: string;
  start: {
    timezone: string;
    local: string;
    utc: string;
  };
  end: {
    timezone: string;
    local: string;
    utc: string;
  };
  url: string;
  is_free: boolean;
  venue: EventbriteVenue | null;
}

export interface EventbriteVenue {
  id: string;
  name: string;
  address: {
    address_1: string;
    address_2: string | null;
    city: string;
    region: string;
    postal_code: string;
    country: string;
  };
  latitude: string;
  longitude: string;
}

export class EventbriteService {
  private apiKey: string | undefined;
  private baseUrl = 'https://www.eventbriteapi.com/v3';

  constructor() {
    const config = getConfig();
    this.apiKey = config.externalApis.eventbriteApiKey;
  }

  /**
   * Search for events by location
   * Falls back to mock data if API key is not configured or API call fails
   *
   * @param location - Location string (suburb or postcode)
   * @returns Array of events
   */
  async searchEvents(location: string): Promise<Event[]> {
    // Check if API key is configured using validateApiKey()
    if (!this.validateApiKey()) {
      console.warn('Eventbrite API key not configured, using mock data');
      return this.getMockEvents(location);
    }

    try {
      // Attempt to fetch from Eventbrite API
      const events = await this.fetchFromEventbrite(location);
      return events;
    } catch (error) {
      // Log error message with details
      console.error('Eventbrite API call failed:', error instanceof Error ? error.message : 'Unknown error');
      // Log fallback activation message
      console.log('Falling back to mock event data');
      return this.getMockEvents(location);
    }
  }

  /**
   * Fetch events from Eventbrite API
   * @private
   */
  private async fetchFromEventbrite(location: string): Promise<Event[]> {
    const url = this.buildSearchUrl(location);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Eventbrite API returned status ${response.status}`);
    }

    const data = await response.json() as EventbriteAPIResponse;
    return this.transformEventbriteResponse(data);
  }

  /**
   * Transform Eventbrite API response to our Event model
   * @private
   */
  private transformEventbriteResponse(data: EventbriteAPIResponse): Event[] {
    if (!data.events || !Array.isArray(data.events)) {
      return [];
    }

    return data.events.map((event: EventbriteEvent) => {
      const venue = event.venue || {} as EventbriteVenue;
      const address = venue.address || {} as EventbriteVenue['address'];

      return {
        eventId: `eventbrite-${event.id}`,
        name: event.name?.text || 'Unnamed Event',
        description: event.description?.text || event.summary || '',
        date: event.start?.utc || new Date().toISOString(),
        location: {
          venue: venue.name || 'TBA',
          suburb: address.city || 'Unknown',
          postcode: address.postal_code || '0000',
          coordinates: {
            lat: parseFloat(venue.latitude) || 0,
            lng: parseFloat(venue.longitude) || 0,
          },
        },
        discount: {
          description: event.is_free ? 'Free event' : 'Check event page for pricing',
          percentage: event.is_free ? 100 : undefined,
        },
        externalUrl: event.url || '',
        source: 'eventbrite',
        cachedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Build Eventbrite API URL to fetch user's owned events
   * Note: Eventbrite deprecated the public event search API in 2019.
   * We can only access events owned by the authenticated user.
   * @private
   * @param location - Location string (suburb or postcode) - used for client-side filtering
   * @returns Complete URL string with base URL and encoded parameters
   */
  private buildSearchUrl(location: string): string {
    const params = new URLSearchParams({
      'expand': 'venue',
      'status': 'live', // Only get live/published events
    });

    // Use /users/me/owned_events/ endpoint since /events/search/ was deprecated
    return `${this.baseUrl}/users/me/owned_events/?${params.toString()}`;
  }

  /**
   * Validate that API key is configured and non-empty
   * @private
   * @returns Boolean indicating if API key is valid
   */
  private validateApiKey(): boolean {
    return this.apiKey !== undefined && this.apiKey.trim() !== '';
  }

  /**
   * Get mock events for fallback
   * @private
   */
  private getMockEvents(location: string): Event[] {
    // Try to extract suburb and postcode from location string
    const postcodeMatch = location.match(/\b\d{4}\b/);
    const postcode = postcodeMatch ? postcodeMatch[0] : undefined;

    // If location is just a number, treat it as postcode
    const isPostcode = /^\d{4}$/.test(location);
    const suburb = isPostcode ? undefined : location;

    return generateMockEvents(suburb, postcode);
  }
}
