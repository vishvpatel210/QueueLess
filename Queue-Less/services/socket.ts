import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

const SOCKET_SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, '');

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log(`[Socket] Connected to ${SOCKET_SERVER_URL} (id: ${socket?.id})`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      console.log(`[Socket] Connect error:`, error.message);
    });
  }

  return socket;
};

export const joinQueueRoom = (queueId: string) => {
  const s = getSocket();
  s.emit('join:queue', queueId);
};

export const leaveQueueRoom = (queueId: string) => {
  const s = getSocket();
  s.emit('leave:queue', queueId);
};

export const subscribeUserAlerts = (userId: string) => {
  const s = getSocket();
  s.emit('join:user', userId);
};

export const onQueueUpdate = (callback: (data: any) => void) => {
  const s = getSocket();
  s.on('queue:updated', callback);
  return () => {
    s.off('queue:updated', callback);
  };
};

export const onTokenCalled = (callback: (data: any) => void) => {
  const s = getSocket();
  s.on('token:called', callback);
  return () => {
    s.off('token:called', callback);
  };
};

export default {
  getSocket,
  joinQueueRoom,
  leaveQueueRoom,
  subscribeUserAlerts,
  onQueueUpdate,
  onTokenCalled,
};
