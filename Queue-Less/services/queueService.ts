import api from './api';
import { QueueItem, TokenItem } from '../types/queue';

export const queueService = {
  async getQueueStatus(queueId: string): Promise<QueueItem> {
    const response = await api.get<{ success: boolean; data: QueueItem }>(`/queues/${queueId}`);
    return response.data.data;
  },

  async joinQueue(
    queueId: string,
    forPersonName?: string,
    forPersonPhone?: string
  ): Promise<{ token: TokenItem; peopleAhead: number; estimatedWaitTimeMinutes: number }> {
    const response = await api.post<{
      success: boolean;
      data: { token: TokenItem; peopleAhead: number; estimatedWaitTimeMinutes: number };
    }>(`/queues/${queueId}/join`, { forPersonName, forPersonPhone });
    return response.data.data;
  },

  async getTokenById(tokenId: string): Promise<TokenItem> {
    const response = await api.get<{ success: boolean; data: TokenItem }>(`/tokens/${tokenId}`);
    return response.data.data;
  },

  async cancelToken(tokenId: string): Promise<TokenItem> {
    const response = await api.post<{ success: boolean; data: TokenItem }>(`/tokens/${tokenId}/cancel`);
    return response.data.data;
  },

  async getMyActiveTokens(): Promise<TokenItem[]> {
    const response = await api.get<{ success: boolean; data: TokenItem[] }>('/tokens/active');
    return response.data.data;
  },
};

export default queueService;
