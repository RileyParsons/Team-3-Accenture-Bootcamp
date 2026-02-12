/**
 * FuelStation data model for SaveSmart application
 * Represents a location selling fuel with current price information
 */

export interface FuelStationLocation {
  address: string;
  suburb: string;
  postcode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface FuelPrice {
  fuelType: 'E10' | 'U91' | 'U95' | 'U98' | 'Diesel';
  price: number;              // cents per liter
  lastUpdated: string;
}

export interface FuelStation {
  stationId: string;           // Partition key
  name: string;
  brand: string;
  location: FuelStationLocation;
  prices: FuelPrice[];
  source: 'fuelcheck' | 'mock';
  updatedAt: string;
}
