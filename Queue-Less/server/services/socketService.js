const { Server } = require('socket.io');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join specific queue room for live updates
    socket.on('join:queue', (queueId) => {
      socket.join(`queue:${queueId}`);
      console.log(`[Socket.IO] ${socket.id} joined room queue:${queueId}`);
    });

    // Leave queue room
    socket.on('leave:queue', (queueId) => {
      socket.leave(`queue:${queueId}`);
      console.log(`[Socket.IO] ${socket.id} left room queue:${queueId}`);
    });

    // Join individual user channel for personal token alerts
    socket.on('join:user', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`[Socket.IO] ${socket.id} subscribed to user:${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO is not initialized!');
  }
  return io;
};

const emitQueueUpdate = (queueId, payload) => {
  if (io) {
    io.to(`queue:${queueId}`).emit('queue:updated', payload);
  }
};

const emitTokenCalled = (userId, tokenPayload) => {
  if (io) {
    io.to(`user:${userId}`).emit('token:called', tokenPayload);
  }
};

const emitTokenUpdated = (userId, tokenPayload) => {
  if (io) {
    io.to(`user:${userId}`).emit('token:updated', tokenPayload);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitQueueUpdate,
  emitTokenCalled,
  emitTokenUpdated,
};
