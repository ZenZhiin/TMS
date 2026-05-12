## CMS & E-commerce Architecture

This guide defines the standards for maintaining a "weightless" codebase. We prioritize readability, maintainability, and strict modularity to ensure the system remains easy to evolve.

---

## 1. Core Principles

### The 500-Line Rule
* **Constraint:** No single source file (`.ts`, `.tsx`, `.prisma`) shall exceed **500 lines**.
* **Action:** If a file approaches this limit, it must be decomposed.
    * **Frontend:** Extract sub-components or move logic to custom hooks.
    * **Backend:** Split services into specialized sub-services (e.g., `OrderService` -> `OrderCalculationService` + `OrderPersistenceService`).

### SOLID Foundations
1.  **Single Responsibility:** Each class/function does one thing.
2.  **Open/Closed:** Use interfaces and inheritance to extend behavior without modifying core logic.
3.  **Liskov Substitution:** Subclasses must be usable in place of their parents.
4.  **Interface Segregation:** Create small, specific interfaces rather than "god" interfaces.
5.  **Dependency Inversion:** Depend on abstractions (interfaces), not concrete implementations.

### Readability & Naming
* **Variables:** Descriptive nouns (`isValidUser` over `v`).
* **Functions:** Verb-noun pairs (`calculateTotalTax`).
* **Booleans:** Prefix with `is`, `has`, or `should`.
* **Simplicity:** Favor clear, multi-line code over "clever" one-liners.

---

## 2. Frontend: Next.js (App Router)

### Structure
* **Feature-First:** Group by feature, not by technical type.
    ```text
    /src
      /features
        /cart
          /components
          /hooks
          /services
          index.ts (Public API)
    ```
* **Server Components:** Use Server Components by default for data fetching.
* **Client Components:** Use 'use client' only at the leaf nodes (buttons, forms, interactive UI).

### Component Standards
* **Atomic Design Hierarchy:** 
    * **Atoms:** Stateless UI primitives (Buttons, Inputs, Badges).
    * **Molecules:** Small combinations of atoms (FormField, SearchBar).
    * **Organisms:** Complex, self-contained UI sections (Sidebar, MediaGallery).
    * **Features:** Business-logic driven modules in `/src/features`.
* **JSX Limit:** Max 100 lines of JSX per file.
* **Props:** Use TypeScript interfaces for all props.
* **Data Fetching:** 
    * Use Server Components for initial page data.
    * Use the `@/lib/api` fetch wrapper for client-side interactions.

---

## 3. Monorepo & Shared Logic

### Package Boundaries
* **Shared Types:** All DTOs and Interfaces shared between Backend and Frontend MUST reside in `/packages/shared`.
* **Utility Logic:** Generic validators or formatters should be centralized in the shared workspace to avoid duplication.

## 3. Backend: NestJS (REST API)

### Service Architecture
* **Controllers:** Handling routing, input validation (DTOs), and response mapping only. No business logic.
* **Services:** Where the "brain" lives. Business logic and Prisma calls happen here.
* **DTOs (Data Transfer Objects):** Required for every request. Use `class-validator` for runtime checks.

### Multi-Service Management (CMS & E-commerce)
* **Isolation:** The CMS and E-commerce services must remain decoupled.
* **Inter-service Communication:** Use lightweight HTTP calls or a Message Broker.
* **Global Exception Filter:** All errors must return a consistent format:
    ```json
    {
      "success": false,
      "message": "Human readable error",
      "errorCode": "ENTITY_NOT_FOUND",
      "timestamp": "ISO-STRING"
    }
    ```

---

## 4. Database: Prisma & PostgreSQL

### Schema Standards
* **Naming:** Use `snake_case` for database tables/columns and `PascalCase` for Prisma models.
    ```prisma
    model Product {
      id          Int      @id @default(autoincrement())
      productName String   @map("product_name")
      @@map("products")
    }
    ```
* **Migrations:** Always use `prisma migrate dev`. Never manually alter the database schema.
* **Indexing:** Explicitly index foreign keys and columns frequently used in `WHERE` or `ORDER BY` clauses.

### Repository Pattern (Optional but Recommended)
* For complex queries, create a `Repository` layer to abstract Prisma calls away from the Service layer, keeping Services focused on business rules.

---

## 5. Implementation Guardrails

* **Absolute Imports:** Use `@/` for all imports to avoid `../../` paths.
* **Early Returns:** Avoid `if/else` nesting.
    ```typescript
    if (!order) throw new NotFoundException();
    if (order.isPaid) return;
    // ... logic
    ```
* **Automated Linting:** ESLint and Prettier are mandatory.
* **Testing:** * **Unit Tests:** For business logic in Services.
    * **Integration Tests:** For critical API endpoints.

---

## 6. The "Antigravity" Checklist
Before submitting a Pull Request, ask:
1. Is this file under 500 lines?
2. If I delete this feature, is it easy to remove all its files without breaking others?
3. Can a new developer understand this logic in under 60 seconds? 
