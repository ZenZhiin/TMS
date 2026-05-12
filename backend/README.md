# Ticketing System Backend

A robust, scalable backend for managing events, venues, tickets, and orders, built with NestJS, TypeScript, and Prisma.

## 🚀 Features
- **Venue Management:** CRUD operations for event locations.
- **Event Management:** Create and manage events linked to venues.
- **Ticket Definition:** Flexible ticket types (VIP, General) with stock tracking.
- **Order Processing:** Atomic ticket purchasing with transaction safety and concurrency handling.
- **Reserved Seating (Bonus):** Seat-specific availability and reservations.
- **API Documentation:** Interactive Swagger/OpenAPI UI.
- **Containerization:** Ready for Docker deployment.

## 🛠 Tech Stack
- **Node.js** 22+
- **NestJS** (Core Framework)
- **TypeScript**
- **Prisma** (ORM)
- **PostgreSQL** (Database)
- **Docker** (Containerization)
- **Jest** (Testing)

## 📦 Getting Started

### 1. Prerequisites
- Docker & Docker Compose
- Node.js 22+

### 2. Installation
```bash
cd backend
npm install
```

### 3. Database Setup (Local)
Start the PostgreSQL container:
```bash
docker-compose up -d
```

Apply migrations:
```bash
npx prisma migrate dev --name init
```

### 4. Running the App
```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

### 5. API Documentation
Once the app is running, visit:
[http://localhost:3000/api](http://localhost:3000/api) to view the Swagger UI.

## 🧪 Testing
```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## 📄 API Examples

### Create a Venue
```bash
curl -X POST http://localhost:3000/venues \
  -H "Content-Type: application/json" \
  -d '{"name": "Stadium Bukit Jalil", "address": "KL", "capacity": 50000}'
```

### Purchase Tickets
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"ticketId": "uuid-here", "quantity": 2, "customerEmail": "user@example.com"}'
```

## 🐳 Docker Deployment
Build and run the production image:
```bash
docker build -t ticketing-backend .
docker run -p 3000:3000 ticketing-backend
```

## 🛡 Security & Design
- **Validation:** Strict input validation using `class-validator`.
- **Error Handling:** Standardized JSON error responses via global exception filter.
- **Atomicity:** All order operations are wrapped in Prisma transactions.
- **Scale:** Modular architecture following the "500-Line Rule" for maintainability.

---
Developed as part of a Senior Software Engineer technical assignment.
