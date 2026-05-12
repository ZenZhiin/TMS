# AirAsia Ticketing System Backend

A high-concurrency, fault-tolerant ticketing system built with NestJS, Prisma, PostgreSQL, and Redis. This system is designed to handle extreme traffic spikes (e.g., concert ticket launches) while ensuring data consistency and protecting against scalpers.

## 🚀 Key Features

### 1. High-Concurrency Performance
- **Redis-Backed Inventory:** Hot-key protection using atomic Redis counters to reject over-capacity requests before they hit the database.
- **Asynchronous Purchase Flow:** Support for high-load purchasing via BullMQ to decouple request reception from order processing.
- **Idempotency Engine:** `X-Idempotency-Key` support to prevent "double-click" or retry-based duplicate orders.

### 2. Advanced Seating Logic
- **Contiguous Allocation:** Automatically finds the best seats for groups to stay together.
- **Anti-Orphan Protection:** Prevents single empty seats from being left between bookings to maximize venue occupancy.
- **Social Distancing Ready:** Configurable gaps between bookings to support health and safety protocols.

### 3. Security & Anti-Bot
- **JWT Authorization:** Stateless microservice-first authentication.
- **AntiBotGuard:** HoneyPot traps and strict per-IP rate limiting to block sophisticated scalper bots.
- **Smart Wait Mechanism:** Server-side enforcement of sale start times with a 2-second hold to handle client-side clock skew gracefully.

### 4. Data Integrity & Reliability
- **ACID Transactions:** Full PostgreSQL transactions ensuring no ticket is ever double-sold.
- **Automatic Expiration:** PENDING orders are automatically expired and inventory is restored after 10 minutes.
- **Reconciliation Service:** Hourly background job to ensure absolute consistency between the DB and Redis cache.
- **Refund Storm Handling:** Throttled, asynchronous mass-refund processing for cancelled events.

## 🛠 Tech Stack
- **Framework:** NestJS 11
- **ORM:** Prisma 6
- **Database:** PostgreSQL
- **Caching & Queuing:** Redis 7 + BullMQ
- **Validation:** Zod + Class-Validator
- **Testing:** Jest

## 🚦 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Start Infrastructure (PostgreSQL & Redis)
docker-compose up -d

# 3. Setup Database
npm run db:migrate

# 4. Start Development Server
npm run start:dev
```

## 🧪 Testing
```bash
# Run Unit Tests
npm run test

# Run End-to-End Tests
npm run test:e2e
```

## 📜 API Documentation
The API includes a Postman collection for easy testing.
- `Ticketing API.postman_collection.json` located in the root directory.
- Protected routes require a Bearer Token.

---
Built by **ZenZhiin: Master Agent** for AirAsia.
