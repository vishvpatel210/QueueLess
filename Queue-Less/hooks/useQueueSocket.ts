import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { notificationService } from '../services/notificationService';

export const useQueueSocket = (queueId?: string, userId?: string) => {
  const { joinQueueRoom, leaveQueueRoom, subscribeUser, lastQueueEvent, lastTokenEvent } = useSocket();
  const prevTokenStatus = useRef<string | null>(null);

  useEffect(() => {
    if (queueId) {
      joinQueueRoom(queueId);
      return () => {
        leaveQueueRoom(queueId);
      };
    }
  }, [queueId]);

  useEffect(() => {
    if (userId) {
      subscribeUser(userId);
    }
  }, [userId]);

  // Trigger notifications based on real-time token status changes
  useEffect(() => {
    if (!lastTokenEvent) return;

    const { status, tokenNumber, branchName, ahead } = lastTokenEvent as Record<string, any>;

    if (status === prevTokenStatus.current) return;
    prevTokenStatus.current = status;

    switch (status) {
      case 'CALLED':
        notificationService.notifyYourTurn(tokenNumber ?? '', branchName ?? 'the branch');
        break;
      case 'APPROACHING':
        notificationService.notifyApproaching(ahead ?? 2);
        break;
      case 'SKIPPED':
        notificationService.notifyTokenSkipped(tokenNumber ?? '');
        break;
      case 'COMPLETED':
        notificationService.notifyServiceCompleted(branchName ?? 'the branch');
        break;
      default:
        break;
    }
  }, [lastTokenEvent]);

  // Trigger notifications on queue-level events (paused / closed)
  useEffect(() => {
    if (!lastQueueEvent) return;

    const { type, branchName } = lastQueueEvent as Record<string, any>;

    switch (type) {
      case 'QUEUE_PAUSED':
        notificationService.notifyQueuePaused(branchName ?? 'the branch');
        break;
      case 'QUEUE_CLOSED':
        notificationService.notifyQueueClosed(branchName ?? 'the branch');
        break;
      default:
        break;
    }
  }, [lastQueueEvent]);

  return {
    lastQueueEvent,
    lastTokenEvent,
  };
};

export default useQueueSocket;
