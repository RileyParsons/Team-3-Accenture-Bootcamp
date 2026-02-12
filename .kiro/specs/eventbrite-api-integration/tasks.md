# Implementation Plan: Eventbrite API Integration

## Overview

This implementation plan converts the Eventbrite API integration design into actionable coding tasks. The approach enhances the existing `EventbriteService` class with proper API integration, response transformation, error handling, and caching. Each task builds incrementally, ensuring the system remains functional throughout development.

## Tasks

- [ ] 1. Enhance EventbriteService with API request construction
  - [x] 1.1 Implement buildSearchUrl() method for Eventbrite API URL construction
    - Create private method that accepts location string parameter
    - Use URLSearchParams to build query string with location.address and expand=venue parameters
    - Return complete URL string with base URL and encoded parameters
    - _Requirements: 1.2, 9.1, 9.2, 9.3_

  - [ ]* 1.2 Write property test for URL parameter encoding
    - **Property 10: URL Parameter Encoding**
    - **Validates: Requirements 9.3**

  - [x] 1.3 Implement validateApiKey() method
    - Create private method that checks if apiKey is defined and non-empty string
    - Return boolean indicating validity
    - _Requirements: 8.4_

  - [ ]* 1.4 Write unit tests for API key validation
    - Test undefined API key returns false
    - Test empty string API key returns false
    - Test valid API key returns true
    - _Requirements: 8.4_

- [ ] 2. Implement API client with authentication and error handling
  - [x] 2.1 Update fetchFromEventbrite() method with proper HTTP client implementation
    - Use fetch API with constructed URL from buildSearchUrl()
    - Set Authorization header with Bearer token prefix
    - Set Content-Type header to application/json
    - Parse JSON response
    - Throw error with status code for non-200 responses
    - _Requirements: 1.1, 1.2, 8.5, 9.4, 10.1_

  - [ ]* 2.2 Write property test for API error response handling
    - **Property 11: API Error Response Handling**
    - **Validates: Requirements 10.1**

  - [ ]* 2.3 Write unit tests for API client
    - Test Authorization header includes Bearer prefix
    - Test Content-Type header is set
    - Test URL construction with location parameter
    - Test expand=venue parameter is included
    - _Requirements: 1.1, 8.5, 9.2, 9.4_

- [ ] 3. Implement Event Transformer with comprehensive field mapping
  - [x] 3.1 Update transformEventbriteResponse() method with complete field extraction
    - Validate response has events array, return empty array if missing
    - Map each Eventbrite event to SaveSmart Event model
    - Extract eventId with "eventbrite-" prefix
    - Extract name from event.name.text with fallback to "Unnamed Event"
    - Extract description from event.description.text or event.summary with fallback to empty string
    - Extract date from event.start.utc with fallback to current ISO timestamp
    - Extract venue name with fallback to "TBA"
    - Extract city with fallback to "Unknown"
    - Extract postal_code with fallback to "0000"
    - Parse latitude and longitude as floats with fallback to 0
    - Set discount description based on is_free flag
    - Set discount percentage to 100 for free events
    - Extract externalUrl from event.url with fallback to empty string
    - Set source to "eventbrite"
    - Set cachedAt to current ISO timestamp
    - _Requirements: 1.3, 1.4, 1.5, 3.3, 3.4, 5.1, 5.2, 5.3, 5.5, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 3.2 Write property test for event transformation completeness
    - **Property 1: Event Transformation Completeness**
    - **Validates: Requirements 1.4, 5.1, 5.2, 5.3**

  - [ ]* 3.3 Write property test for free event discount transformation
    - **Property 4: Free Event Discount Transformation**
    - **Validates: Requirements 3.3**

  - [ ]* 3.4 Write property test for paid event discount transformation
    - **Property 5: Paid Event Discount Transformation**
    - **Validates: Requirements 3.4**

  - [ ]* 3.5 Write property test for ISO 8601 date format
    - **Property 7: ISO 8601 Date Format**
    - **Validates: Requirements 5.5**

  - [ ]* 3.6 Write property test for missing events array handling
    - **Property 12: Missing Events Array Handling**
    - **Validates: Requirements 10.2**

  - [ ]* 3.7 Write property test for missing field default values
    - **Property 13: Missing Field Default Values**
    - **Validates: Requirements 10.3, 10.4, 10.5**

  - [ ]* 3.8 Write property test for coordinate parsing robustness
    - **Property 14: Coordinate Parsing Robustness**
    - **Validates: Requirements 10.5**

- [x] 4. Checkpoint - Ensure transformation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement fallback handler with proper error logging
  - [x] 5.1 Update searchEvents() method with fallback logic
    - Check if API key is configured using validateApiKey()
    - If not configured, log warning and return mock events
    - Wrap API call in try-catch block
    - On error, log error message with details
    - Log fallback activation message
    - Return mock events from getMockEvents()
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 5.2 Write property test for event source indicator
    - **Property 6: Event Source Indicator**
    - **Validates: Requirements 5.4, 6.5**

  - [ ]* 5.3 Write unit tests for fallback scenarios
    - Test missing API key triggers fallback with mock data
    - Test API error triggers fallback with mock data
    - Test fallback sets source to "mock"
    - Test error logging occurs during fallback
    - _Requirements: 6.1, 6.2, 6.5_

- [ ] 6. Enhance routes layer with location filtering
  - [x] 6.1 Update filterEventsByLocation() function in routes/events.ts
    - Implement case-insensitive partial matching for suburb filter
    - Implement exact matching for postcode filter
    - Return filtered event array
    - _Requirements: 2.3, 2.4, 2.5_

  - [ ]* 6.2 Write property test for location filter suburb matching
    - **Property 2: Location Filter Suburb Matching**
    - **Validates: Requirements 2.3, 2.5**

  - [ ]* 6.3 Write property test for location filter postcode exact matching
    - **Property 3: Location Filter Postcode Exact Matching**
    - **Validates: Requirements 2.4**

  - [ ]* 6.4 Write unit tests for location filtering
    - Test suburb filter with case variations
    - Test postcode exact match
    - Test filtering with both suburb and postcode
    - Test filtering with no filters returns all events
    - _Requirements: 2.3, 2.4, 2.5_

- [ ] 7. Enhance cache integration with proper key generation
  - [x] 7.1 Update generateCacheKey() function in routes/events.ts
    - Normalize suburb to lowercase, use "any" if undefined
    - Use postcode as-is, use "any" if undefined
    - Return cache key in format "events:{suburb}:{postcode}"
    - _Requirements: 7.4_

  - [ ]* 7.2 Write property test for cache key uniqueness
    - **Property 8: Cache Key Uniqueness**
    - **Validates: Requirements 7.4**

  - [ ]* 7.3 Write property test for cached data structure
    - **Property 9: Cached Data Structure**
    - **Validates: Requirements 7.5**

  - [ ]* 7.4 Write unit tests for cache integration
    - Test cache key generation with different suburb/postcode combinations
    - Test cache hit returns cached data without API call
    - Test cache miss triggers API call
    - Test cached data includes events array and source field
    - Test cache TTL is 3600 seconds
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Checkpoint - Ensure all integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Add TypeScript type definitions for Eventbrite API
  - [x] 9.1 Create Eventbrite API response type interfaces
    - Define EventbriteAPIResponse interface with pagination and events array
    - Define EventbriteEvent interface with all API fields
    - Define EventbriteVenue interface with address and coordinates
    - Add types to service file or separate types file
    - _Requirements: 1.3_

  - [ ]* 9.2 Write unit tests for type safety
    - Test transformer handles typed Eventbrite responses
    - Test type checking catches missing required fields at compile time
    - _Requirements: 1.3_

- [ ] 10. Update environment configuration documentation
  - [x] 10.1 Add EVENTBRITE_API_KEY to .env.example file
    - Add comment explaining the variable is optional
    - Add comment explaining fallback to mock data when not set
    - Add example placeholder value format
    - _Requirements: 8.1, 8.2_

  - [x] 10.2 Update README or configuration docs with API key setup instructions
    - Document how to obtain Eventbrite API key
    - Document OAuth token requirements
    - Document fallback behavior when key is missing
    - _Requirements: 8.1, 8.2_

- [ ] 11. Integration testing with mock Eventbrite API
  - [ ]* 11.1 Create integration tests with mocked Eventbrite API
    - Mock fetch to return realistic Eventbrite API responses
    - Test full flow: request → API call → transform → cache → response
    - Test error scenarios trigger fallback
    - Test cache behavior across multiple requests
    - _Requirements: 1.2, 1.3, 6.2, 7.2, 7.3_

- [x] 12. Final checkpoint - End-to-end verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- The existing EventbriteService structure is preserved and enhanced, not replaced
- Frontend requires no changes - API contract remains the same
