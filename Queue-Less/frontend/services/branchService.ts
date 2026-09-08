import api from './api';
import { Branch, ServiceItem } from '../types/business';

export const branchService = {
  async getAllBranches(category?: string, search?: string): Promise<Branch[]> {
    const params: Record<string, string> = {};
    if (category && category !== 'All') params.category = category;
    if (search) params.search = search;

    const queryString = new URLSearchParams(params).toString();
    const url = `/branches${queryString ? `?${queryString}` : ''}`;
    const response = await api.get<{ success: boolean; count: number; data: Branch[] }>(url);
    return response.data.data;
  },

  async getBranchById(id: string): Promise<Branch> {
    const response = await api.get<{ success: boolean; data: Branch }>(`/branches/${id}`);
    return response.data.data;
  },

  async getServicesByBranch(branchId: string): Promise<ServiceItem[]> {
    const response = await api.get<{ success: boolean; data: ServiceItem[] }>(
      `/branches/${branchId}/services`
    );
    return response.data.data;
  },
};

export default branchService;
