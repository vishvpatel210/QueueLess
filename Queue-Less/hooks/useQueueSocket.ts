import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

export const useQueueSocket = (queueId?: string, userId?: string) => {
  const { joinQueueRoom, leaveQueueRoom, subscribeUser, lastQueueEvent, lastTokenEvent } = useSocket();

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

  return {
    lastQueueEvent,
    lastTokenEvent,
  };
};

export default useQueueSocket;
