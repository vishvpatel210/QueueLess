# QueueLess — End-to-End Test Suite Reference

## Server API Verification Scripts

Run these commands from `Queue-Less/server/`:

```bash
# 1. Start server in test mode
NODE_ENV=test node server.js

# 2. Health check
curl http://localhost:5000/api/health

# 3. Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@queueless.io","password":"Pass1234!","role":"customer"}'

# 4. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@queueless.io","password":"Pass1234!"}'

# 5. Get current user (replace TOKEN)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## Queue Flow Verification

```bash
# 1. Create a business (admin token required)
curl -X POST http://localhost:5000/api/businesses \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Clinic","category":"healthcare","description":"Test"}'

# 2. Create branch with location
curl -X POST http://localhost:5000/api/branches \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Main Branch","business":"BUSINESS_ID","location":{"type":"Point","coordinates":[-122.4194,37.7749]},"address":"1 Main St"}'

# 3. Open queue
curl -X POST http://localhost:5000/api/queues \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"branch":"BRANCH_ID","service":"SERVICE_ID"}'

# 4. Customer joins queue
curl -X POST http://localhost:5000/api/tokens/join \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"queueId":"QUEUE_ID"}'

# 5. Admin calls next
curl -X POST http://localhost:5000/api/queues/QUEUE_ID/call-next \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 6. Admin completes service
curl -X PUT http://localhost:5000/api/tokens/TOKEN_ID/complete \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Analytics Verification

```bash
# Queue analytics for today
curl http://localhost:5000/api/analytics/queue/QUEUE_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Branch analytics for last 7 days
curl "http://localhost:5000/api/analytics/branch/BRANCH_ID?days=7" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Business leaderboard
curl "http://localhost:5000/api/analytics/business/BUSINESS_ID/leaderboard?days=30" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## WebSocket (Socket.IO) Verification

Use the Socket.IO admin dashboard or test with `socket.io-client`:

```js
const io = require('socket.io-client');
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  socket.emit('join:queue', { queueId: 'QUEUE_ID' });
});

socket.on('queue:updated', (data) => {
  console.log('Queue update:', data);
});

socket.on('token:called', (data) => {
  console.log('Token called:', data);
});
```
