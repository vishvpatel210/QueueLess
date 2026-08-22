import api from './api';
import { Business, Branch, BusinessCategory } from '../types/business';

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

  async getNearbyBusinesses(lat: number, lng: number, maxDistanceKm = 10): Promise<Branch[]> {
    const response = await api.get<{ success: boolean; data: Branch[] }>(
      `/businesses/nearby?lat=${lat}&lng=${lng}&maxDistanceKm=${maxDistanceKm}`
    );
    return response.data.data;
  },

  async getBusinessById(id: string): Promise<Business> {
    const response = await api.get<{ success: boolean; data: Business }>(`/businesses/${id}`);
    return response.data.data;
  },
};

export default businessService;
