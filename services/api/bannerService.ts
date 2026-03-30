// services/api/bannerService.ts
import apiClient from './client';
import { ApiResponse } from './types';
import { API_CONFIG, buildApiUrl, isApiEnabled } from './config';

export interface Banner {
  id: string;
  title: string;
  image: string;
  link: string;
  description?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export class BannerService {
  async getBanners(storeId: string): Promise<ApiResponse<Banner[]>> {
    console.log('🖼️ Fetching banners for store:', storeId);
    
    if (!isApiEnabled('USE_REAL_BANNERS')) {
      console.log('   API disabled for banners');
      throw new Error('API_DISABLED');
    }
    
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.BANNERS, { storeId });
      const response = await apiClient.get<Banner[]>(url);
      console.log(' Banners API response:', response);
      return response;
    } catch (error) {
      console.log('  Banners API error:', error);
      console.log('   Error fetching banners');
      throw error;
    }
  }

  async getBannerById(bannerId: string): Promise<ApiResponse<Banner>> {
    console.log('🖼️ Fetching banner by ID:', bannerId);
    
    if (!isApiEnabled('USE_REAL_BANNERS')) {
      console.log('   API disabled for banner details');
      throw new Error('API_DISABLED');
    }
    
    try {
      const response = await apiClient.get<Banner>(`/banners/${bannerId}`);
      console.log(' Banner details API response:', response);
      return response;
    } catch (error) {
      console.log('  Banner details API error:', error);
      console.log('   Using fallback mock data for banner details');
      throw error;
    }
  }
}

export const bannerService = new BannerService(); 