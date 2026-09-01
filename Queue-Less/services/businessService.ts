import api from './api';
import { Business, Branch, BusinessCategory, NearbyBranchItem } from '../types/business';

export const businessService = {
  async getBusinesses(category?: BusinessCategory, search?: string): Promise<Business[]> {
    const params: Record<string, string> = {};
    if (category && category !== 'All') params.category = category;
    if (search) params.search = search;

    const queryString = new URLSearchParams(params).toString();
    const url = `/businesses${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<{ success: boolean; data: Business[] }>(url);
    return response.data.data;
  },

  async getNearbyBusinesses(
    latitude: number,
    longitude: number,
    category?: string,
    search?: string,
    radius = 50000
  ): Promise<NearbyBranchItem[]> {
    const params: Record<string, string> = {
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
    };
    if (category && category !== 'All') params.category = category;
    if (search) params.search = search;

    const queryString = new URLSearchParams(params).toString();
    const response = await api.get<{ success: boolean; data: NearbyBranchItem[] }>(
      `/businesses/nearby?${queryString}`
    );
    return response.data.data;
  },

  async getBusinessById(id: string): Promise<Business> {
    const response = await api.get<{ success: boolean; data: Business }>(`/businesses/${id}`);
    return response.data.data;
  },

  async getMyBusinessAdmin(): Promise<{ businesses: Business[]; branches: Branch[] }> {
    const response = await api.get<{ success: boolean; data: { businesses: Business[]; branches: Branch[] } }>(
      '/businesses/me/admin'
    );
    return response.data.data;
  },
};

export default businessService;
