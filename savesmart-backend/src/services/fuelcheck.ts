/**
 * FuelCheck API Service
 *
 * Integrates with NSW Government FuelCheck API for real-time fuel price data.
 * Falls back to mock data when API is unavailable or API key is not configured.
 *
 * Requirements: 9.5, 9.6, 14.5
 */

import { FuelStation } from '../models/FuelStation';
import { getConfig } from '../config/env';
import { generateMockFuelStations } from '../utils/mockData';

export class FuelCheckService {
  private apiKey: string | undefined;
  private baseUrl = 'https://api.onegov.nsw.gov.au/FuelCheckApp/v1';

  constructor() {
    const config = getConfig();
    this.apiKey = config.externalApis.fuelcheckApiKey;
  }

  /**
   * Get fuel prices by location
   * Falls back to mock data if API key is not configured or API call fails
   *
   * @param suburb - Suburb name
   * @param postcode - Postcode (optional)
   * @returns Array of fuel stations with prices
   */
  async getFuelPrices(suburb: string, postcode?: string): Promise<FuelStation[]> {
    // If no API key configured, use mock data
    if (!this.apiKey) {
      console.log('FuelCheck API key not configured, using mock data');
      return this.getMockFuelStations(suburb, postcode);
    }

    try {
      // Attempt to fetch from FuelCheck API
      const stations = await this.fetchFromFuelCheck(suburb, postcode);
      return stations;
    } catch (error) {
      // Log the error and fall back to mock data
      console.error('FuelCheck API call failed:', error instanceof Error ? error.message : 'Unknown error');
      console.log('Falling back to mock fuel station data');
      return this.getMockFuelStations(suburb, postcode);
    }
  }

  /**
   * Fetch fuel prices from FuelCheck API
   * @private
   */
  private async fetchFromFuelCheck(suburb: string, postcode?: string): Promise<FuelStation[]> {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('suburb', suburb);
    if (postcode) {
      params.append('postcode', postcode);
    }

    const url = `${this.baseUrl}/fuel/prices?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`FuelCheck API returned status ${response.status}`);
    }

    const data = await response.json();
    return this.transformFuelCheckResponse(data);
  }

  /**
   * Transform FuelCheck API response to our FuelStation model
   * @private
   */
  private transformFuelCheckResponse(data: any): FuelStation[] {
    if (!data.stations || !Array.isArray(data.stations)) {
      return [];
    }

    return data.stations.map((station: any) => {
      const location = station.location || {};
      const address = location.address || {};

      // Transform prices array
      const prices = (station.prices || []).map((price: any) => ({
        fuelType: this.normalizeFuelType(price.fueltype),
        price: parseFloat(price.price) || 0,
        lastUpdated: price.lastupdated || new Date().toISOString(),
      }));

      return {
        stationId: `fuelcheck-${station.code || station.id}`,
        name: station.name || 'Unknown Station',
        brand: station.brand || 'Independent',
        location: {
          address: address.line1 || station.address || 'Unknown',
          suburb: address.suburb || location.suburb || 'Unknown',
          postcode: address.postcode || location.postcode || '0000',
          coordinates: {
            lat: parseFloat(location.latitude) || 0,
            lng: parseFloat(location.longitude) || 0,
          },
        },
        prices,
        source: 'fuelcheck',
        updatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Normalize fuel type names to our standard format
   * @private
   */
  private normalizeFuelType(fuelType: string): 'E10' | 'U91' | 'U95' | 'U98' | 'Diesel' {
    const normalized = fuelType.toUpperCase().replace(/\s+/g, '');

    // Map common variations to our standard types
    const typeMap: Record<string, 'E10' | 'U91' | 'U95' | 'U98' | 'Diesel'> = {
      'E10': 'E10',
      'ETHANOL': 'E10',
      'U91': 'U91',
      'UNLEADED91': 'U91',
      'ULP': 'U91',
      'U95': 'U95',
      'UNLEADED95': 'U95',
      'PREMIUMUNLEADED95': 'U95',
      'U98': 'U98',
      'UNLEADED98': 'U98',
      'PREMIUMUNLEADED98': 'U98',
      'DIESEL': 'Diesel',
      'DL': 'Diesel',
    };

    return typeMap[normalized] || 'U91'; // Default to U91 if unknown
  }

  /**
   * Get mock fuel stations for fallback
   * @private
   */
  private getMockFuelStations(suburb: string, postcode?: string): FuelStation[] {
    return generateMockFuelStations(suburb, postcode);
  }
}
