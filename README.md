# ✈️ AirAsia High-Concurrency Ticketing System

[![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

An elite, senior-level backend infrastructure designed for the extreme demands of global ticket launches. This system implements advanced distributed systems patterns to ensure **100% data consistency**, **sub-millisecond rejection of invalid traffic**, and **protection against sophisticated scalper bots**.

## 🏗 System Architecture

The architecture follows a **Queue-First, Cache-Optimized** approach:

1.  **Request Layer:** Enforces JWT validation, Idempotency, and Anti-Bot guards.
2.  **Hot-Key Cache:** Redis atomic counters verify inventory availability before requests ever touch the database.
3.  **Transaction Layer:** Prisma ACID transactions ensure atomic seat reservation and stock decrement.
4.  **Async Workflows:** BullMQ handles time-consuming tasks like purchase processing, order expiration, and mass refunds.
5.  **Consistency Layer:** A scheduled reconciliation service fixes any discrepancies between Redis and PostgreSQL.

## 💎 Premium Features

### 🛡 Security & Resilience
- **Anti-Bot HoneyPot:** Traps automated scalper bots using hidden form fields.
- **Smart Wait Protection:** Server-side mitigation for client clock skew (2-second grace period).
- **Idempotency Engine:** Prevents duplicate orders from network retries or "double-click" actions.
- **JWT Auth:** Stateless validation for secure microservice communication.

### 🪑 Intelligent Seating
- **Contiguous Allocation:** Automatically groups family and friends together in the best available seats.
- **Anti-Orphan Algorithm:** Sophisticated logic that prevents leaving isolated empty seats, maximizing venue occupancy.

### 🌊 Distributed Operations
- **Refund Storm Processor:** Throttled, asynchronous mass-cancellation handling to protect payment gateway rate limits.
- **Automatic Stock Recovery:** PENDING reservations are automatically released if payment is not received within 10 minutes.

## 📁 Project Structure

```text
AirAsia/
├── backend/                # NestJS Application Source
│   ├── src/
│   │   ├── auth/           # JWT & Security Logic
│   │   ├── common/         # Guards, Interceptors, Filters
│   │   ├── orders/         # High-Concurrency Order Logic
│   │   ├── reconciliation/ # Data Consistency Service
│   │   └── ...             # Feature Modules (Events, Venues, etc.)
│   ├── prisma/             # Database Schema & Migrations
│   └── test/               # E2E & Unit Test Suites
└── Ticketing API.json      # Complete Postman Collection
```

## 🚀 Quick Start

### 1. Spin up Infrastructure
Ensure Docker is running:
```bash
docker-compose up -d
```

### 2. Install & Migrate
```bash
cd backend
npm install
npm run db:migrate
```

### 3. Launch the Engine
```bash
npm run start:dev
```

## 🚦 API Testing
Import the **`Ticketing API.postman_collection.json`** from the root directory into Postman. It contains pre-configured requests for all sync/async flows, including the mass-cancellation "Refund Storm" test case.

---
**Lead Architect:** ZenZhiin Master Agent  
**Stakeholder:** AirAsia Digital
