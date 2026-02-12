/**
 * Events Routes
 *
 * Provides endpoints for local events discovery with location filtering.
 * Integrates with EventbriteService and cache for efficient data retrieval.
 *
 * Requirements: 8.2, 8.7, 12.5
 */

import { Router, Request, Response } from 'express';
import { EventbriteService } from '../services/eventbrite.js';
import { cacheService, TTL } from '../utils/cache.js';
import { Event } from '../models/Event.js';

const router = Router();

// Lazy-load Eventbrite service to avoid initialization issues
let eventbriteService: EventbriteService | null = null;
function getEventbriteService(): EventbriteService {
  if (!eventbriteService) {
    eventbriteService = new EventbriteService();
  }
  return eventbriteService;
}

/**
 * Generate cache key for events based on location filters
 */
function generateCacheKey(suburb?: string, postcode?: string): string {
  const suburbPart = suburb ? suburb.toLowerCase().trim() : 'any';
  const postcodePart = postcode ? postcode.trim() : 'any';
  return `events:${suburbPart}:${postcodePart}`;
}

/**
 * Filter events by location criteria
 */
function filterEventsByLocation(events: Event[], suburb?: string, postcode?: string): Event[] {
  return events.filter(event => {
    // If suburb is specified, check if it matches (case-insensitive)
    if (suburb) {
      const eventSuburb = event.location.suburb.toLowerCase();
      const searchSuburb = suburb.toLowerCase().trim();
      if (!eventSuburb.includes(searchSuburb)) {
        return false;
      }
    }

    // If postcode is specified, check if it matches
    if (postcode) {
      const eventPostcode = event.location.postcode.trim();
      const searchPostcode = postcode.trim();
      if (eventPostcode !== searchPostcode) {
        return false;
      }
    }

    return true;
  });
}

/**
 * GET /api/events
 *
 * Retrieve local events with optional location filtering.
 * Requirement 8.2: Support suburb and postcode query parameters
 * Requirement 8.7: Cache event data for 1 hour
 * Requirement 12.5: GET /api/events endpoint
 *
 * Query parameters:
 * - suburb: Filter events by suburb (optional, case-insensitive partial match)
 * - postcode: Filter events by postcode (optional, exact match)
 *
 * Response:
 * - 200: Events array with source indicator
 *   {
 *     events: Event[],
 *     source: 'eventbrite' | 'mock'
 *   }
 * - 500: Server error
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const suburb = req.query.suburb as string | undefined;
    const postcode = req.query.postcode as string | undefined;

    // Validate query parameters
    if (suburb !== undefined && typeof suburb !== 'string') {
      return res.status(400).json({
        error: 'Validation failed',
        details: { suburb: 'suburb must be a string' },
      });
    }

    if (postcode !== undefined && typeof postcode !== 'string') {
      return res.status(400).json({
        error: 'Validation failed',
        details: { postcode: 'postcode must be a string' },
      });
    }

    // Generate cache key based on location filters
    const cacheKey = generateCacheKey(suburb, postcode);

    // Check cache first (Requirement 8.7: 1 hour cache)
    const cachedEvents = cacheService.get<{ events: Event[]; source: 'eventbrite' | 'mock' }>(cacheKey);
    if (cachedEvents) {
      console.log(`Cache hit for events: ${cacheKey}`);
      return res.status(200).json(cachedEvents);
    }

    console.log(`Cache miss for events: ${cacheKey}`);

    // Build location string for API call
    let location = '';
    if (postcode) {
      location = postcode;
    } else if (suburb) {
      location = suburb;
    } else {
      // Default to Melbourne if no location specified
      location = 'Melbourne, VIC';
    }

    // Fetch events from Eventbrite service (with fallback to mock data)
    const events = await getEventbriteService().searchEvents(location);

    // Filter events by location criteria if both suburb and postcode are provided
    // (API might return broader results)
    const filteredEvents = filterEventsByLocation(events, suburb, postcode);

    // Determine source from first event (all events from same source)
    const source = filteredEvents.length > 0 ? filteredEvents[0].source : 'mock';

    // Prepare response
    const response = {
      events: filteredEvents,
      source,
    };

    // Cache the response for 1 hour (Requirement 8.7)
    cacheService.set(cacheKey, response, TTL.EVENTS);

    // Return events with source indicator
    return res.status(200).json(response);
  } catch (error) {
    console.error('Events endpoint error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to retrieve events',
    });
  }
});

export default router;
