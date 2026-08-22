const http = require('http');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { PORT } = require('./config/constants');
const errorHandler = require('./middleware/errorHandler');
const { initSocket } = require('./services/socketService');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const businessRoutes = require('./routes/businessRoutes');
const branchRoutes = require('./routes/branchRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const queueRoutes = require('./routes/queueRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const { getServiceById } = require('./controllers/serviceController');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'QueueLess API Engine',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/branches/:branchId/services', serviceRoutes);
app.get('/api/services/:id', getServiceById);
app.use('/api/queues', queueRoutes);
app.use('/api/tokens', tokenRoutes);

// Central Error Handler
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`[QueueLess Server + Socket.IO] Running on http://localhost:${PORT}`);
});

module.exports = { app, server };
