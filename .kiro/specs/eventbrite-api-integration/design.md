# Design Document: Eventbrite API Integration

## Overview

This design specifies the implementation of Eventbrite API v3 integration for the SaveSmart application. The integration replaces mock event data with real events from Eventbrite, filtered by location (Melbourne area), price (free and low-cost), and category relevance (students and tech professionals). The design maintains the existing service architecture while adding robust API communication, response transformation, error handling with graceful fallback, and efficient caching.

The implementation builds on the existing `EventbriteService` class structure and extends it with proper API integration, maintaining backward compatibility with the current frontend implementation.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  - Events Page Component                                     │
│  - Location/Price/Category Filters                           │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP GET /api/events
                     │ Query: suburb, postcode
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express Routes Layer                      │
│  - GET /api/events endpoint                                  │
│  - Query parameter validation                                │
│  - Cache key generation                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      Cache Manager                           │
│  - Check cache for location key                              │
│  - Return cached data if valid (< 1 hour)                    │
│  - Store fresh API responses                                 │
└────────────────────┬────────────────────────────────────────┘
                     │ Cache miss
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   EventbriteService                          │
│  - API key validation                                        │
│  - Location query construction                               │
│  - Fallback decision logic                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│   API Client     │    │ Fallback Handler │
│  - HTTP requests │    │  - Mock data     │
│  - Bearer auth   │    │  - Error logging │
│  - Error handling│    │                  │
└────────┬─────────┘    └──────────────────┘
         │
         ▼
┌──────────────────┐
│ Event Transformer│
│  - Response parse│
│  - Model mapping │
│  - Validation    │
└──────────────────┘
```

### Data Flow

1. **Request Flow**: Frontend → Routes → Cache Check → Service → API Client → Eventbrite API
2. **Response Flow**: Eventbrite API → Transformer → Service → Cache Store → Routes → Frontend
3. **Fallback Flow**: API Error → Fallback Handler → Mock Data → Routes → Frontend

### Integration Points

- **Existing**: `EventbriteService` class structure, Express routes, Cache service, Event model
- **New**: Eventbrite API v3 HTTP client, Response transformer, Enhanced error handling
- **Modified**: `searchEvents()` method implementation, API request construction

## Components and Interfaces

### 1. EventbriteService (Enhanced)

**Responsibility**: Orchestrate event fetching with API integration and fallback logic

**Interface**:
```typescript
class EventbriteService {
  private apiKey: string | undefined;
  private baseUrl: string = 'https://www.eventbriteapi.com/v3';

  constructor();

  // Public API
  async searchEvents(location: string): Promise<Event[]>;

  // Private methods
  private async fetchFromEventbrite(location: string): Promise<Event[]>;
  private transformEventbriteResponse(data: EventbriteAPIResponse): Event[];
  private getMockEvents(location: string): Event[];
  private buildSearchUrl(location: string): string;
  private validateApiKey(): boolean;
}
```

**Key Methods**:

- `searchEvents(location)`: Main entry point that checks API key availability and delegates to API or fallback
- `fetchFromEventbrite(location)`: Executes HTTP request to Eventbrite API with proper authentication
- `transformEventbriteResponse(data)`: Converts Eventbrite response format to SaveSmart Event model
- `buildSearchUrl(location)`: Constructs API URL with location and expansion parameters
- `validateApiKey()`: Checks if Bearer token is configured and non-empty

### 2. API Client (Embedded in EventbriteService)

**Responsibility**: HTTP communication with Eventbrite API v3

**Implementation**:
```typescript
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

  const data = await response.json();
  return this.transformEventbriteResponse(data);
}

private buildSearchUrl(location: string): string {
  const params = new URLSearchParams({
    'location.address': location,
    'expand': 'venue',
  });

  return `${this.baseUrl}/events/search/?${params.toString()}`;
}
```

**Authentication**: Bearer token in Authorization header
**Error Handling**: HTTP status validation, JSON parsing errors, network timeouts

### 3. Event Transformer

**Responsibility**: Convert Eventbrite API response to SaveSmart Event model

**Implementation**:
```typescript
private transformEventbriteResponse(data: EventbriteAPIResponse): Event[] {
  if (!data.events || !Array.isArray(data.events)) {
    return [];
  }

  return data.events.map((event: EventbriteEvent) => {
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
```

**Field Mappings**:
- `eventId`: Prefixed with "eventbrite-" + Eventbrite event ID
- `name`: From `event.name.text` with fallback to "Unnamed Event"
- `description`: From `event.description.text` or `event.summary` with fallback to empty string
- `date`: From `event.start.utc` with fallback to current timestamp
- `location.venue`: From `venue.name` with fallback to "TBA"
- `location.suburb`: From `venue.address.city` with fallback to "Unknown"
- `location.postcode`: From `venue.address.postal_code` with fallback to "0000"
- `location.coordinates`: Parsed from `venue.latitude` and `venue.longitude` with fallback to (0, 0)
- `discount.description`: "Free event" if `is_free` is true, otherwise "Check event page for pricing"
- `discount.percentage`: 100 if `is_free` is true, otherwise undefined
- `externalUrl`: From `event.url` with fallback to empty string
- `source`: Always "eventbrite" for API responses
- `cachedAt`: Current timestamp when transformation occurs

### 4. Fallback Handler

**Responsibility**: Provide mock data when API is unavailable

**Implementation**:
```typescript
private getMockEvents(location: string): Event[] {
  // Extract postcode if present (4 digits)
  const postcodeMatch = location.match(/\b\d{4}\b/);
  const postcode = postcodeMatch ? postcodeMatch[0] : undefined;

  // If location is just a number, treat as postcode
  const isPostcode = /^\d{4}$/.test(location);
  const suburb = isPostcode ? undefined : location;

  return generateMockEvents(suburb, postcode);
}
```

**Trigger Conditions**:
1. API key not configured (`EVENTBRITE_API_KEY` environment variable missing or empty)
2. API request fails (network error, timeout, invalid response)
3. API returns non-200 status code

**Logging**: All fallback triggers are logged with error details for debugging

### 5. Cache Manager Integration

**Responsibility**: Store and retrieve API responses to reduce external calls

**Cache Key Format**: `events:{suburb}:{postcode}`
- Suburb normalized to lowercase, "any" if not provided
- Postcode as-is, "any" if not provided
- Examples: `events:melbourne:3000`, `events:any:3000`, `events:carlton:any`

**TTL**: 3600 seconds (1 hour)

**Cached Data Structure**:
```typescript
{
  events: Event[],
  source: 'eventbrite' | 'mock'
}
```

**Cache Flow**:
1. Routes layer generates cache key from query parameters
2. Check cache before calling EventbriteService
3. Return cached data if valid (within TTL)
4. On cache miss, fetch from service and store result
5. Cache both successful API responses and fallback mock data

## Data Models

### Eventbrite API Response Types

```typescript
interface EventbriteAPIResponse {
  pagination: {
    object_count: number;
    page_number: number;
    page_size: number;
    page_count: number;
  };
  events: EventbriteEvent[];
}

interface EventbriteEvent {
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

interface EventbriteVenue {
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
```

### SaveSmart Event Model (Existing)

```typescript
interface Event {
  eventId: string;
  name: string;
  description: string;
  date: string;  // ISO 8601
  location: EventLocation;
  discount: EventDiscount;
  externalUrl: string;
  source: 'eventbrite' | 'mock';
  cachedAt: string;  // ISO 8601
}

interface EventLocation {
  venue: string;
  suburb: string;
  postcode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface EventDiscount {
  description: string;
  amount?: number;
  percentage?: number;
}
```

### Environment Configuration

```typescript
interface ExternalApisConfig {
  eventbriteApiKey?: string;  // Optional, triggers fallback if missing
  fuelcheckApiKey?: string;
  groceryApiKey?: string;
}
```

**Environment Variable**: `EVENTBRITE_API_KEY`
**Format**: OAuth Bearer token string
**Validation**: Non-empty string check before API calls
**Security**: Never logged or exposed in error messages


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Event Transformation Completeness

*For any* valid Eventbrite API event object, the transformed SaveSmart Event SHALL contain all required fields: eventId, name, description, date, location (venue, suburb, postcode, coordinates), discount (description, percentage), externalUrl, source, and cachedAt.

**Validates: Requirements 1.4, 5.1, 5.2, 5.3**

### Property 2: Location Filter Suburb Matching

*For any* event list and suburb filter string, all events returned by the Location_Filter SHALL have a suburb field that contains the filter string (case-insensitive partial match).

**Validates: Requirements 2.3, 2.5**

### Property 3: Location Filter Postcode Exact Matching

*For any* event list and postcode filter string, all events returned by the Location_Filter SHALL have a postcode field that exactly matches the filter string.

**Validates: Requirements 2.4**

### Property 4: Free Event Discount Transformation

*For any* Eventbrite event where is_free is true, the transformed Event SHALL have discount.description set to "Free event" and discount.percentage set to 100.

**Validates: Requirements 3.3**

### Property 5: Paid Event Discount Transformation

*For any* Eventbrite event where is_free is false, the transformed Event SHALL have discount.description set to "Check event page for pricing".

**Validates: Requirements 3.4**

### Property 6: Event Source Indicator

*For any* event returned by the Event_Service, the source field SHALL be either "eventbrite" or "mock", and SHALL be "eventbrite" when data comes from the API and "mock" when data comes from the fallback handler.

**Validates: Requirements 5.4, 6.5**

### Property 7: ISO 8601 Date Format

*For any* transformed event, the date field SHALL be a valid ISO 8601 timestamp string.

**Validates: Requirements 5.5**

### Property 8: Cache Key Uniqueness

*For any* two different combinations of suburb and postcode filters, the generated cache keys SHALL be different, ensuring unique cache entries for different location queries.

**Validates: Requirements 7.4**

### Property 9: Cached Data Structure

*For any* cached response, the data SHALL include both an events array and a source indicator field.

**Validates: Requirements 7.5**

### Property 10: URL Parameter Encoding

*For any* location string containing special characters (spaces, punctuation, unicode), the API_Client SHALL properly URL-encode the location.address parameter.

**Validates: Requirements 9.3**

### Property 11: API Error Response Handling

*For any* HTTP response with status code other than 200, the API_Client SHALL throw an error containing the status code.

**Validates: Requirements 10.1**

### Property 12: Missing Events Array Handling

*For any* Eventbrite API response that is missing the events array or has a non-array events field, the Event_Transformer SHALL return an empty array.

**Validates: Requirements 10.2**

### Property 13: Missing Field Default Values

*For any* Eventbrite event object with missing optional fields, the Event_Transformer SHALL provide appropriate default values: "Unnamed Event" for missing name, empty string for missing description, "TBA" for missing venue name, "Unknown" for missing city, "0000" for missing postal code, and 0 for missing coordinates.

**Validates: Requirements 10.3, 10.4, 10.5**

### Property 14: Coordinate Parsing Robustness

*For any* venue latitude or longitude value that cannot be parsed as a floating-point number, the Event_Transformer SHALL use 0 as the fallback value.

**Validates: Requirements 10.5**

## Error Handling

### Error Categories

1. **Configuration Errors**
   - Missing API key: Trigger fallback mode, log warning
   - Invalid API key format: Trigger fallback mode, log warning
   - Action: Use mock data, continue operation

2. **Network Errors**
   - Connection timeout: Trigger fallback mode, log error with timeout details
   - DNS resolution failure: Trigger fallback mode, log error
   - Network unreachable: Trigger fallback mode, log error
   - Action: Use mock data, continue operation

3. **API Errors**
   - 401 Unauthorized: Invalid API key, trigger fallback mode, log error
   - 403 Forbidden: API key lacks permissions, trigger fallback mode, log error
   - 429 Too Many Requests: Rate limit exceeded, trigger fallback mode, log error
   - 500 Internal Server Error: Eventbrite service issue, trigger fallback mode, log error
   - Other non-200 status: Trigger fallback mode, log error with status code
   - Action: Use mock data, continue operation

4. **Data Validation Errors**
   - Missing events array: Return empty array, log warning
   - Invalid event structure: Skip invalid event, log warning, continue with valid events
   - Missing required fields: Use default values, log warning
   - Invalid coordinate format: Use fallback value (0), log warning
   - Action: Graceful degradation, continue operation

5. **Cache Errors**
   - Cache read failure: Skip cache, fetch from API, log warning
   - Cache write failure: Continue without caching, log warning
   - Action: Degrade to non-cached operation

### Error Logging Strategy

**Log Levels**:
- `ERROR`: API failures, network errors, authentication issues
- `WARN`: Missing API key, data validation issues, cache failures
- `INFO`: Fallback mode activation, cache hits/misses

**Log Format**:
```typescript
console.error('Eventbrite API call failed:', {
  error: error.message,
  location: location,
  timestamp: new Date().toISOString(),
});
console.log('Falling back to mock event data');
```

**Security Considerations**:
- Never log API keys or Bearer tokens
- Sanitize location parameters in logs (remove potential injection attempts)
- Log only error messages, not full response bodies (may contain sensitive data)

### Fallback Behavior

**Trigger Conditions**:
1. API key not configured or empty
2. Network request fails
3. API returns non-200 status
4. Response parsing fails

**Fallback Flow**:
```typescript
try {
  if (!this.apiKey) {
    console.log('Eventbrite API key not configured, using mock data');
    return this.getMockEvents(location);
  }

  const events = await this.fetchFromEventbrite(location);
  return events;
} catch (error) {
  console.error('Eventbrite API call failed:', error.message);
  console.log('Falling back to mock event data');
  return this.getMockEvents(location);
}
```

**Mock Data Characteristics**:
- Source field set to "mock"
- Location-aware: Respects suburb and postcode filters
- Realistic event data for Melbourne area
- Includes mix of free and low-cost events
- Includes tech, student, and networking categories

## Testing Strategy

### Dual Testing Approach

This feature requires both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Both approaches are complementary and necessary for complete validation

### Property-Based Testing

**Library**: fast-check (for TypeScript/JavaScript)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property reference
- Tag format: `Feature: eventbrite-api-integration, Property {number}: {property_text}`

**Property Test Coverage**:

1. **Transformation Properties** (Properties 1, 4, 5, 7, 13, 14)
   - Generate random Eventbrite API responses
   - Verify all required fields present in transformed output
   - Verify discount fields set correctly based on is_free flag
   - Verify date format is valid ISO 8601
   - Verify default values used for missing fields
   - Verify coordinate parsing handles invalid values

2. **Filtering Properties** (Properties 2, 3)
   - Generate random event lists with various locations
   - Verify suburb filter matches case-insensitively
   - Verify postcode filter matches exactly

3. **Source Indicator Property** (Property 6)
   - Generate random scenarios (API success, API failure, no API key)
   - Verify source field is always "eventbrite" or "mock"
   - Verify source matches data origin

4. **Cache Key Property** (Property 8)
   - Generate random suburb/postcode combinations
   - Verify different combinations produce different cache keys
   - Verify same combination produces same cache key

5. **URL Encoding Property** (Property 10)
   - Generate random location strings with special characters
   - Verify URL parameters are properly encoded

6. **Error Handling Properties** (Properties 11, 12)
   - Generate random HTTP status codes
   - Verify non-200 status throws error
   - Generate responses with missing/invalid events array
   - Verify empty array returned

### Unit Testing

**Focus Areas**:

1. **API Client Integration**
   - Test URL construction with location parameter
   - Test expand=venue parameter inclusion
   - Test Authorization header format
   - Test Bearer token prefix
   - Test postcode prioritization over suburb

2. **Fallback Scenarios**
   - Test missing API key triggers fallback
   - Test API error triggers fallback
   - Test timeout triggers fallback
   - Test fallback returns mock data with source="mock"

3. **Cache Integration**
   - Test cache hit returns cached data without API call
   - Test cache miss triggers API call
   - Test cache TTL is 3600 seconds
   - Test cached data includes events and source

4. **Configuration**
   - Test EVENTBRITE_API_KEY environment variable is read
   - Test empty API key triggers fallback mode
   - Test API key validation before requests

5. **Edge Cases**
   - Test empty location string
   - Test location with only whitespace
   - Test very long location strings
   - Test location with unicode characters
   - Test response with empty events array
   - Test response with null venue
   - Test response with missing venue fields

### Integration Testing

**Scenarios**:

1. **End-to-End API Flow**
   - Mock Eventbrite API with realistic responses
   - Test full request → transform → cache → response flow
   - Verify correct data returned to frontend

2. **Fallback Flow**
   - Mock API failure scenarios
   - Test fallback to mock data
   - Verify error logging occurs

3. **Cache Behavior**
   - Test multiple requests with same location use cache
   - Test different locations create different cache entries
   - Test cache expiration triggers new API call

### Test Data Generators

**For Property-Based Tests**:

```typescript
// Generate random Eventbrite event
const eventbriteEventArbitrary = fc.record({
  id: fc.string(),
  name: fc.record({ text: fc.string() }),
  description: fc.option(fc.record({ text: fc.string() })),
  summary: fc.string(),
  start: fc.record({ utc: fc.date().map(d => d.toISOString()) }),
  url: fc.webUrl(),
  is_free: fc.boolean(),
  venue: fc.option(fc.record({
    name: fc.string(),
    address: fc.record({
      city: fc.string(),
      postal_code: fc.string({ minLength: 4, maxLength: 4 }),
    }),
    latitude: fc.float().map(String),
    longitude: fc.float().map(String),
  })),
});

// Generate random location filter
const locationFilterArbitrary = fc.record({
  suburb: fc.option(fc.string()),
  postcode: fc.option(fc.string({ minLength: 4, maxLength: 4 })),
});
```

### Manual Testing Checklist

1. Configure valid Eventbrite API key, verify real events displayed
2. Remove API key, verify mock data displayed with source="mock"
3. Search for "Melbourne", verify events in Melbourne area
4. Search for specific suburb (e.g., "Carlton"), verify filtered results
5. Search for postcode (e.g., "3000"), verify exact postcode match
6. Verify cache works (second request faster, no API call)
7. Wait 1 hour, verify cache expires and new API call made
8. Test with special characters in location (e.g., "St Kilda")
9. Verify error handling with invalid API key
10. Verify frontend displays all event fields correctly
