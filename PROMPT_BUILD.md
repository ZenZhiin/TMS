# PROMPT_BUILD.md

This file documents the major prompts used with AI tools (Antigravity/Gemini) to generate the core logic and architecture of the AirAsia Ticketing System.

## 1. Project Initialization
**Prompt:**
> npx -y @nestjs/cli new backend --package-manager npm --strict

## 2. Distributed Seating Refactor (Multi-Event)
**Prompt:**
> Refactor the seating architecture to support multiple events at the same venue. Separate the physical 'Seat' (template) from the 'EventSeat' (instance) to allow independent status tracking (Available, Reserved, Sold) per event. Update the OrdersService and SeatsController to reflect this.

## 3. High-Concurrency "Refund Storm" Logic
**Prompt:**
> Implement a mass cancellation feature for events. When an event is cancelled, use BullMQ to trigger a 'Refund Storm'—asynchronous, throttled refund processing (10 concurrent jobs) to prevent overloading external payment gateways.

## 4. Scalper Protection & Anti-Bot
**Prompt:**
> Add security hardening to the ticketing purchase flow. Implement a HoneyPot (botToken) trap, IP-based rate limiting, and a 'Smart Wait' mechanism to handle client-side clock skew during high-traffic ticket launches.

## 5. GCP Deployment Strategy
**Prompt:**
> Generate a comprehensive Google Cloud deployment guide using Cloud Run, Cloud SQL, and MemoryStore (Redis). Include a GitHub Actions CI/CD pipeline that handles Docker builds and Prisma migrations via Cloud Run Jobs.
