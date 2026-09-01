require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const connectDB  = require('./config/db');
const { PORT }   = require('./config/constants');
const { initSocket } = require('./services/socketService');

// ── routes ────────────────────────────────────────────────────────────────────
const authRoutes      = require('./routes/authRoutes');
const businessRoutes  = require('./routes/businessRoutes');
const branchRoutes    = require('./routes/branchRoutes');
const serviceRoutes   = require('./routes/serviceRoutes');
const queueRoutes     = require('./routes/queueRoutes');
const tokenRoutes     = require('./routes/tokenRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { getServiceById } = require('./controllers/serviceController');

// ── app setup ─────────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

initSocket(server);                          // real-time queue updates

app.use(cors({ origin: '*' }));              // allow all origins (dev)
app.use(express.json());

// ── health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.status(200).json({
    status:    'online',
    app:       'QueueLess API',
    timestamp: new Date().toISOString(),
  })
);

// ── api routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',                          authRoutes);
app.use('/api/businesses',                    businessRoutes);
app.use('/api/branches',                      branchRoutes);
app.use('/api/branches/:branchId/services',   serviceRoutes);
app.use('/api/services',                      serviceRoutes);
app.use('/api/queues',                        queueRoutes);
app.use('/api/tokens',                        tokenRoutes);
app.use('/api/analytics',                     analyticsRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
);

// ── global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ── start ─────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  // '0.0.0.0' lets physical phones on the same Wi-Fi reach the server
  server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('🚀  QueueLess Server Running');
    console.log(`    Local  → http://localhost:${PORT}/api/health`);
    console.log(`    LAN    → http://10.140.250.147:${PORT}/api/health`);
    console.log('');
  });
}).catch((err) => {
  console.error('❌  MongoDB connection failed:', err.message);
  process.exit(1);
});

module.exports = { app, server };
