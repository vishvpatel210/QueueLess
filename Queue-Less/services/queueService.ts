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

  async getMyActiveTokens(): Promise<TokenItem[]> {
    const response = await api.get<{ success: boolean; data: TokenItem[] }>('/tokens/active');
    return response.data.data || [];
  },

  async getMyTokenHistory(): Promise<TokenItem[]> {
    const response = await api.get<{ success: boolean; data: TokenItem[] }>('/tokens/history');
    return response.data.data || [];
  },

  async getTokenById(tokenId: string): Promise<TokenItem> {
    const response = await api.get<{ success: boolean; data: TokenItem }>(`/tokens/${tokenId}`);
    return response.data.data;
  },

  async cancelToken(tokenId: string): Promise<TokenItem> {
    const response = await api.post<{ success: boolean; data: TokenItem }>(`/tokens/${tokenId}/cancel`);
    return response.data.data;
  },

  async submitReview(tokenId: string, rating: number, comment?: string): Promise<any> {
    const response = await api.post<{ success: boolean; data: any }>(`/tokens/${tokenId}/review`, {
      rating,
      comment,
    });
    return response.data.data;
  },

  async getQueueTokens(queueId: string): Promise<{
    queue: QueueItem;
    waitingTokens: TokenItem[];
    servingToken: TokenItem | null;
    calledToken?: TokenItem | null;
    inProgressToken?: TokenItem | null;
    completedCount: number;
    skippedCount: number;
    cancelledCount: number;
    noShowCount: number;
    allTokens: TokenItem[];
  }> {
    const response = await api.get<{
      success: boolean;
      data: {
        queue: QueueItem;
        waitingTokens: TokenItem[];
        servingToken: TokenItem | null;
        calledToken?: TokenItem | null;
        inProgressToken?: TokenItem | null;
        completedCount: number;
        skippedCount: number;
        cancelledCount: number;
        noShowCount: number;
        allTokens: TokenItem[];
      };
    }>(`/queues/${queueId}/tokens`);
    return response.data.data;
  },

  async callNext(queueId: string): Promise<any> {
    const response = await api.post<{ success: boolean; data: any }>(`/queues/${queueId}/next`);
    return response.data.data;
  },

  async startService(tokenId: string): Promise<TokenItem> {
    const response = await api.post<{ success: boolean; data: TokenItem }>(`/tokens/${tokenId}/start`);
    return response.data.data;
  },

  async noShowToken(tokenId: string): Promise<TokenItem> {
    const response = await api.post<{ success: boolean; data: TokenItem }>(`/tokens/${tokenId}/no-show`);
    return response.data.data;
  },

  async skipToken(tokenId: string): Promise<TokenItem> {
    const response = await api.post<{ success: boolean; data: TokenItem }>(`/tokens/${tokenId}/skip`);
    return response.data.data;
  },

  async completeToken(tokenId: string): Promise<TokenItem> {
    const response = await api.post<{ success: boolean; data: TokenItem }>(`/tokens/${tokenId}/complete`);
    return response.data.data;
  },

  async pauseQueue(queueId: string): Promise<QueueItem> {
    const response = await api.post<{ success: boolean; data: QueueItem }>(`/queues/${queueId}/pause`);
    return response.data.data;
  },

  async resumeQueue(queueId: string): Promise<QueueItem> {
    const response = await api.post<{ success: boolean; data: QueueItem }>(`/queues/${queueId}/resume`);
    return response.data.data;
  },

  async closeQueue(queueId: string): Promise<QueueItem> {
    const response = await api.post<{ success: boolean; data: QueueItem }>(`/queues/${queueId}/close`);
    return response.data.data;
  },
};

export default queueService;
