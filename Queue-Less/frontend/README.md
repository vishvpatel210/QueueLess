# QueueLess

> **Smart Digital Queue Management Platform** — Expo SDK 54 · React Native · Node.js · MongoDB · Socket.IO

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-blueviolet)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org)

---

## Overview

QueueLess is a production-grade mobile platform that enables customers to find nearby businesses, join digital queues, receive tokenized passes, and track their queue position in real time — eliminating physical waiting.

Business admins can manage queues, call next customers, skip tokens, complete services, pause/resume queues, and view detailed analytics dashboards.

---

## Features

### Customer Experience
- 📍 Discover nearby businesses and branches using geolocation
- 🔍 Search by category (healthcare, banking, government, retail)
- 🎫 Join queues digitally and receive a token number instantly
- 📊 Real-time queue position tracking via WebSocket
- 🔔 Push notification alerts (joining, approaching, your turn)
- 📷 QR code scanner for direct queue check-in
- 📋 Clipboard copy for token, booking ID, and coordinates
- 👤 Contact picker to queue on behalf of someone else
- 🗺️ Geolocation proximity check-in verification

### Admin Dashboard
- 🎛️ Call next customer, skip, complete, undo operations
- ⏸️ Pause and resume queues
- 🔒 Close queues for the day
- 📈 Analytics dashboard with hourly charts, trend graphs, and branch leaderboard
- 🏆 Business-wide performance leaderboard

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Expo SDK 54, React Native, TypeScript |
| Navigation | Expo Router (file-based) |
| State | React Context API |
| Real-Time | Socket.IO client |
| Backend | Node.js, Express 4 (MVC) |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcrypt |
| Location | expo-location |
| Camera | expo-camera, expo-barcode-scanner |
| Contacts | expo-contacts |

---

## Project Structure

```
Queue-Less/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Login, Register
│   ├── (tabs)/             # Home, Explore, Queue, Profile
│   ├── (admin)/            # Dashboard, Analytics
│   ├── business/[id].tsx   # Business detail
│   ├── service/[id].tsx    # Service detail
│   ├── token/[id].tsx      # Digital Token Pass
│   ├── scanner.tsx         # QR Code Scanner
│   ├── location.tsx        # Location check-in
│   ├── contacts.tsx        # Contact picker
│   └── notifications.tsx   # Notification settings
├── components/common/      # UI primitives (Button, Card, Badge, Input, Header)
├── constants/              # Colors, theme tokens
├── context/                # AuthContext, SocketContext
├── hooks/                  # useQueueSocket
├── services/               # api, clipboard, contact, location, notification
├── docs/                   # e2e-test-guide, deployment
└── server/                 # Express MVC backend
    ├── config/             # db.js, constants.js
    ├── controllers/        # auth, business, branch, service, queue, token, analytics
    ├── middleware/         # authMiddleware, errorHandler, asyncHandler
    ├── models/             # User, Business, Branch, Service, Queue, Token
    ├── routes/             # All route files
    └── services/           # queueStateMachine, socketService
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Expo Go app (for development)

### Server Setup

```bash
cd Queue-Less/server
npm install
cp .env.example .env   # Fill in MONGO_URI and JWT_SECRET
node server.js
```

### Mobile Setup

```bash
cd Queue-Less
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone.

---

## Documentation

- [End-to-End Test Guide](docs/e2e-test-guide.md)
- [Deployment Guide](docs/deployment.md)

---

## License

MIT — see [LICENSE](LICENSE)
