import api from './api';
import { ServiceItem } from '../types/business';
import { QueueItem } from '../types/queue';

export interface ServiceWithQueue extends ServiceItem {
  queue?: QueueItem & { waitingCount?: number };
  branchId: any;
}

export const serviceService = {
  async getServiceById(id: string): Promise<ServiceWithQueue> {
    const response = await api.get<{ success: boolean; data: ServiceWithQueue }>(
      `/services/${id}`
    );
    return response.data.data;
  },

  async getServicesByBranch(branchId: string, includeInactive = false): Promise<ServiceWithQueue[]> {
    const url = includeInactive
      ? `/branches/${branchId}/services?includeInactive=true`
      : `/branches/${branchId}/services`;
    const response = await api.get<{ success: boolean; data: ServiceWithQueue[] }>(url);
    return response.data.data;
  },

  async toggleServiceStatus(serviceId: string, isActive: boolean): Promise<ServiceItem> {
    const response = await api.patch<{ success: boolean; data: ServiceItem }>(
      `/services/${serviceId}`,
      { isActive }
    );
    return response.data.data;
  },

  async createService(
    branchId: string,
    data: {
      name: string;
      description?: string;
      estimatedDurationMinutes: number;
      price?: number;
      prefix?: string;
    }
  ): Promise<ServiceItem> {
    const response = await api.post<{ success: boolean; data: ServiceItem }>(
      `/branches/${branchId}/services`,
      data
    );
    return response.data.data;
  },

  async updateService(
    serviceId: string,
    data: Partial<ServiceItem>
  ): Promise<ServiceItem> {
    const response = await api.patch<{ success: boolean; data: ServiceItem }>(
      `/services/${serviceId}`,
      data
    );
    return response.data.data;
  },

  async deleteService(serviceId: string): Promise<{ message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(
      `/services/${serviceId}`
    );
    return response.data;
  },
};

export default serviceService;
