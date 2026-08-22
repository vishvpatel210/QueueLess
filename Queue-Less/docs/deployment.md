# QueueLess — Production Deployment Guide

## Server Deployment (Node.js API)

### Environment Variables

Create `Queue-Less/server/.env.production`:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/queueless_prod?retryWrites=true&w=majority
JWT_SECRET=<strong-random-secret-256-bits>
JWT_EXPIRE=30d
CORS_ORIGIN=https://queueless.io
```

### Process Manager (PM2)

```bash
npm install -g pm2
cd Queue-Less/server
pm2 start server.js --name queueless-api --env production
pm2 save
pm2 startup
```

### Recommended Hosting

| Platform | Service | Notes |
|----------|---------|-------|
| Railway  | Web Service + MongoDB Atlas | Easiest for Node + MongoDB |
| Render   | Web Service | Auto-deploy from GitHub |
| DigitalOcean | App Platform | Full control |
| AWS EC2 + DocumentDB | Production-scale | Highest reliability |

### MongoDB Indexes (Required)

```js
// Run in MongoDB shell or Compass:
db.branches.createIndex({ location: '2dsphere' }); // geospatial queries
db.tokens.createIndex({ queue: 1, status: 1, sequenceNumber: 1 }); // queue operations
db.tokens.createIndex({ user: 1, status: 1, createdAt: -1 }); // user token history
db.queues.createIndex({ branch: 1, status: 1 }); // branch queue lookups
db.users.createIndex({ email: 1 }, { unique: true }); // unique emails
```

---

## Mobile App Build (Expo EAS)

### Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### Initialize EAS Build

```bash
cd Queue-Less
eas build:configure
```

### Configure `eas.json`

```json
{
  "cli": { "version": ">= 3.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Point App to Production API

Update `Queue-Less/services/api.ts` `BASE_URL` for production:

```ts
const BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://api.queueless.io'
    : 'http://localhost:5000';
```

### Build for Android

```bash
eas build --platform android --profile production
```

### Build for iOS

```bash
eas build --platform ios --profile production
```

### Submit to Stores

```bash
eas submit --platform android
eas submit --platform ios
```

---

## Security Checklist

- [ ] JWT secret is 256-bit random string (not default)
- [ ] MongoDB is not exposed publicly (use Atlas allowlist or VPC)
- [ ] CORS is restricted to your domain (not `*`)
- [ ] Rate limiting is enabled on auth routes
- [ ] Helmet.js is configured on Express
- [ ] All `.env` files are in `.gitignore`
- [ ] Expo secrets managed via `eas secret:create`

---

## Production Monitoring

- **Server Logs**: `pm2 logs queueless-api`
- **MongoDB**: Atlas Performance Advisor for slow queries
- **Mobile Crashes**: Expo Application Services (EAS) crash reports
- **Uptime Monitoring**: Better Uptime / UptimeRobot on `/api/health`

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────┐
│                   QueueLess Platform                │
├──────────────┬──────────────────┬───────────────────┤
│ Mobile App   │   REST API       │  Real-Time Engine │
│ (Expo SDK54) │   (Express 4)    │  (Socket.IO 4)    │
│              │   Port :5000     │  WS on same port  │
├──────────────┴──────────────────┴───────────────────┤
│              MongoDB Atlas (Cloud)                  │
│  Collections: users, businesses, branches,          │
│               services, queues, tokens              │
└─────────────────────────────────────────────────────┘
```
