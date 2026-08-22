export type QueueState = 'OPEN' | 'PAUSED' | 'CLOSED';

export type TokenStatus =
  | 'WAITING'
  | 'CALLED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'SKIPPED'
  | 'NO_SHOW';

export interface TokenItem {
  _id: string;
  queueId: string;
  tokenNumber: string;
  sequenceNumber: number;
  userId: string;
  forPersonName: string;
  forPersonPhone?: string;
  status: TokenStatus;
  estimatedWaitTimeMinutes: number;
  peopleAhead?: number;
  calledAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface QueueItem {
  _id: string;
  branchId: string;
  serviceId: string;
  date: string;
  status: QueueState;
  currentTokenNumber?: string | null;
  totalTokensIssued: number;
  waitingCount?: number;
}
