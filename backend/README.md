# Ticketing System Backend

A robust, high-performance backend for managing events, venues, tickets, and orders, built with NestJS, TypeScript, and Prisma. This implementation is designed for high-concurrency "viral" ticketing events.

## 🚀 Advanced Features
- **ACID Atomic Transactions:** Optimized order processing using database-level atomic updates to prevent race conditions and overselling without pessimistic locking.
- **Asynchronous Purchase Queue:** Redis-backed queuing (BullMQ) to decouple high-load purchase requests from the HTTP lifecycle, preventing server timeouts and DB spikes.
- **Virtual Waiting Room:** Custom `WaitingRoomGuard` that controls server ingress by limiting concurrent active users during traffic surges.
- **Global Caching:** Integrated `CacheModule` for ultra-fast read operations on static data like Venues and Events.
- **Rate Limiting:** Global request throttling to protect against brute-force and DDoS-like surges.
- **Comprehensive API Docs:** Interactive Swagger/OpenAPI UI for all endpoints.

## 🛠 Tech Stack
- **Node.js** 22+
- **NestJS** (Core Framework)
- **Prisma** (ORM)
- **PostgreSQL** (Primary Database)
- **Redis** (Caching, Queuing, and Session Tracking)
- **BullMQ** (Background Job Processing)
- **Docker** (Containerization)

## 📦 Getting Started

### 1. Prerequisites
- Docker & Docker Compose
- Node.js 22+

### 2. Installation
```bash
cd backend
npm install
```

### 3. Infrastructure Setup (Local)
Start the PostgreSQL and Redis containers:
```bash
docker-compose up -d
```

Apply migrations and generate Prisma client:
```bash
npm run db:migrate
npm run db:gen
```

### 4. Running the App
```bash
# development
npm run start:dev

# production
npm run start:prod
```

### 5. API Documentation
Access the interactive Swagger UI at:
[http://localhost:3000/api](http://localhost:3000/api)

## 📄 Senior-Level Design Patterns

### High-Concurrency Order Processing
We use an **Atomic Update** pattern in the `OrdersService`:
```typescript
await tx.ticket.update({
  where: { 
    id: ticketId,
    remainingQuantity: { gte: quantity }, // Atomic check at the DB level
  },
  data: {
    remainingQuantity: { decrement: quantity },
  },
});
```
This ensures that even if 10,000 requests hit the server at the same time, the database only allows the decrement if the stock is actually available at the exact millisecond of the update.

### Distributed Queuing
For massive bursts (e.g., ticket sales opening), users can use the `POST /orders/async-purchase` endpoint. This returns a `jobId` immediately, placing the user in a **BullMQ** queue for background processing, ensuring the API remains responsive.

### Infrastructure Protection
The `WaitingRoomGuard` monitors active sessions in Redis. If the server load exceeds safe thresholds, users are automatically served a `503 Service Unavailable` with queue information, protecting the core services from crashing.

---
Developed for the Senior Software Engineer technical assignment.
