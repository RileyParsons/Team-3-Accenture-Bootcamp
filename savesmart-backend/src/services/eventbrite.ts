/**
 * Eventbrite API Service
 *
 * Integrates with Eventbrite API for event discovery.
 * Falls back to mock data when API is unavailable or API key is not configured.
 *
 * Requirements: 8.3, 8.4, 14.5
 */

import { Event } from '../models/Event';
import { getConfig } from '../config/env';
import { generateMockEvents } from '../utils/mockData';

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
    // If no API key configured, use mock data
    if (!this.apiKey) {
      console.log('Eventbrite API key not configured, using mock data');
      return this.getMockEvents(location);
    }

    try {
      // Attempt to fetch from Eventbrite API
      const events = await this.fetchFromEventbrite(location);
      return events;
    } catch (error) {
      // Log the error and fall back to mock data
      console.error('Eventbrite API call failed:', error instanceof Error ? error.message : 'Unknown error');
      console.log('Falling back to mock event data');
      return this.getMockEvents(location);
    }
  }

  /**
   * Fetch events from Eventbrite API
   * @private
   */
  private async fetchFromEventbrite(location: string): Promise<Event[]> {
    const url = `${this.baseUrl}/events/search/?location.address=${encodeURIComponent(location)}&expand=venue`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Eventbrite API returned status ${response.status}`);
    }

    const data = await response.json();
    return this.transformEventbriteResponse(data);
  }

  /**
   * Transform Eventbrite API response to our Event model
   * @private
   */
  private transformEventbriteResponse(data: any): Event[] {
    if (!data.events || !Array.isArray(data.events)) {
      return [];
    }

    return data.events.map((event: any) => {
      const venue = event.venue || {};
      const address = venue.address || {};

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
