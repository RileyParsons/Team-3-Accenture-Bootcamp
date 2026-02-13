/**
 * Event data model for SaveSmart application
 * Represents a local activity with associated deals or discounts
 */

export interface EventLocation {
  venue: string;
  suburb: string;
  postcode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface EventDiscount {
  description: string;
  amount?: number;
  percentage?: number;
}

export interface Event {
  eventId: string;             // Partition key
  name: string;
  description: string;
  date: string;                // ISO 8601 timestamp
  location: EventLocation;
  discount: EventDiscount;
  externalUrl: string;
  source: 'eventbrite' | 'mock';
  cachedAt: string;
}
