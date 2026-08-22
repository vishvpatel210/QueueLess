import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../services/api';

// Socket server URL derived from REST API base URL
const SOCKET_URL = API_BASE_URL.replace('/api', '');

interface SocketContextType {
  isConnected: boolean;
  joinQueueRoom: (queueId: string) => void;
  leaveQueueRoom: (queueId: string) => void;
  subscribeUser: (userId: string) => void;
  lastQueueEvent: any;
  lastTokenEvent: any;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  joinQueueRoom: () => {},
  leaveQueueRoom: () => {},
  subscribeUser: () => {},
  lastQueueEvent: null,
  lastTokenEvent: null,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true); // Simulated live socket state
  const [lastQueueEvent, setLastQueueEvent] = useState<any>(null);
  const [lastTokenEvent, setLastTokenEvent] = useState<any>(null);

  const joinQueueRoom = (queueId: string) => {
    console.log(`[Mobile Socket] Joined room queue:${queueId}`);
  };

  const leaveQueueRoom = (queueId: string) => {
    console.log(`[Mobile Socket] Left room queue:${queueId}`);
  };

  const subscribeUser = (userId: string) => {
    console.log(`[Mobile Socket] Subscribed user:${userId}`);
  };

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        joinQueueRoom,
        leaveQueueRoom,
        subscribeUser,
        lastQueueEvent,
        lastTokenEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
