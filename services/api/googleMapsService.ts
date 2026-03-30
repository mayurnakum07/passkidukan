import { API_CONFIG } from './config';

const GOOGLE_MAPS_API_KEY = API_CONFIG.GOOGLE_MAPS.API_KEY;

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  address: string;
  formattedAddress: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface ReverseGeocodeResult {
  address: string;
  formattedAddress: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

class GoogleMapsService {
  private apiKey: string;

  constructor() {
    this.apiKey = GOOGLE_MAPS_API_KEY;
  }

  /**
   * Convert pincode to coordinates using Google Geocoding API
   */
  async geocodePincode(pincode: string): Promise<GeocodeResult | null> {
    try {
      console.log('🗺️ Geocoding pincode:', pincode);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(pincode + ', India')}&key=${this.apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;
        
        const addressComponents = result.address_components;
        let city = '';
        let state = '';
        let country = '';
        let pincodeFromApi = '';
        
        addressComponents.forEach((component: any) => {
          if (component.types.includes('locality')) {
            city = component.long_name;
          } else if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name;
          } else if (component.types.includes('country')) {
            country = component.long_name;
          } else if (component.types.includes('postal_code')) {
            pincodeFromApi = component.long_name;
          }
        });
        
        const geocodeResult: GeocodeResult = {
          latitude: location.lat,
          longitude: location.lng,
          address: result.formatted_address,
          formattedAddress: result.formatted_address,
          city: city || 'Unknown',
          state: state || 'Unknown',
          pincode: pincodeFromApi || pincode,
          country: country || 'India',
        };
        
        console.log(' Geocoding successful:', geocodeResult);
        return geocodeResult;
      } else {
        console.error(' Geocoding failed:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error(' Geocoding error:', error);
      return null;
    }
  }

  /**
   * Convert coordinates to address using Google Reverse Geocoding API
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
    try {
      console.log('🗺️ Reverse geocoding coordinates:', { latitude, longitude });
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${this.apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        
        const addressComponents = result.address_components;
        let city = '';
        let state = '';
        let country = '';
        let pincode = '';
        
        addressComponents.forEach((component: any) => {
          if (component.types.includes('locality')) {
            city = component.long_name;
          } else if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name;
          } else if (component.types.includes('country')) {
            country = component.long_name;
          } else if (component.types.includes('postal_code')) {
            pincode = component.long_name;
          }
        });
        
        const reverseGeocodeResult: ReverseGeocodeResult = {
          address: result.formatted_address,
          formattedAddress: result.formatted_address,
          city: city || 'Unknown',
          state: state || 'Unknown',
          pincode: pincode || 'Unknown',
          country: country || 'India',
        };
        
        console.log(' Reverse geocoding successful:', reverseGeocodeResult);
        return reverseGeocodeResult;
      } else {
        console.error(' Reverse geocoding failed:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error(' Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Search for places using Google Places API
   */
  async searchPlaces(query: string): Promise<any[]> {
    try {
      console.log('🔍 Searching places for:', query);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK') {
        console.log(' Places search successful:', data.results.length, 'results');
        return data.results;
      } else {
        console.error('  Places search failed:', data.status, data.error_message);
        return [];
      }
    } catch (error) {
      console.error('  Places search error:', error);
      return [];
    }
  }

  /**
   * Get place details using Google Places API
   */
  async getPlaceDetails(placeId: string): Promise<any | null> {
    try {
      console.log('📍 Getting place details for:', placeId);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry,address_components&key=${this.apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK') {
        console.log(' Place details retrieved successfully');
        return data.result;
      } else {
        console.error(' Place details failed:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error(' Place details error:', error);
      return null;
    }
  }
}

export const googleMapsService = new GoogleMapsService();
export default googleMapsService;
