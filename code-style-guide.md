# The Ultimate Code Style Guide: Ticketing System

This guide represents the "Best-of-Breed" standards for modern full-stack development, combining high-performance architectural patterns with strict maintainability guardrails.

---

## 1. Core Principles & Philosophy

### ⚖️ The 500-Line Rule
- **Constraint:** No single source file (`.ts`, `.tsx`, `.prisma`) shall exceed **500 lines**.
- **Action:** Decompose files that approach this limit.
    - *Backend:* Split into specialized sub-services (e.g., `PersistenceService`, `CalculationService`).
    - *Frontend:* Extract sub-components or custom hooks.

### 🧱 SOLID Foundations
- **Single Responsibility:** Each class/function does one thing and does it well.
- **Open/Closed:** Behavior can be extended without modifying existing source code.
- **Liskov Substitution:** Derived classes must be substitutable for their base classes.
- **Interface Segregation:** No client should be forced to depend on methods it does not use.
- **Dependency Inversion:** Depend on abstractions, not concretions.

### 📖 Readability & Clarity
- **Naming:** 
    - Variables: Descriptive nouns (`isValidUser`).
    - Functions: Verb-noun pairs (`calculateTax`).
    - Booleans: Prefix with `is`, `has`, or `should`.
- **Simplicity:** Favor clear, multi-line logic over "clever" one-liners.
- **Early Returns:** Avoid nested `if/else` blocks to reduce cognitive load.

---

## 2. Backend Architecture: NestJS (REST API)

### 🏗️ Service-Oriented Design
- **Controllers:** Restricted to routing, input validation (DTOs), and response mapping. **Zero business logic.**
- **Services:** The "brain" of the application. Business logic and database interactions reside here.
- **DTOs:** Mandatory for all requests. Use `class-validator` for runtime checks and `@nestjs/swagger` for documentation.

### 🌐 API Excellence
- **OpenAPI (Swagger):** Every endpoint must be documented with `@ApiOperation`, `@ApiResponse`, and `@ApiProperty`.
- **Standardized Response:** All API responses (especially errors) must follow a predictable schema:
    ```json
    {
      "success": boolean,
      "message": "Human readable summary",
      "data": null | object | array,
      "errorCode": "UNIQUE_ERROR_CODE",
      "timestamp": "ISO-STRING"
    }
    ```

---

## 3. Database: Prisma & PostgreSQL

### 🗄️ Schema Standards
- **Naming Convention:** 
    - Database Tables/Columns: `snake_case`.
    - Prisma Models/Fields: `PascalCase` / `camelCase`.
- **Mapping:** Always use `@@map` and `@map` to bridge the gap.
    ```prisma
    model Ticket {
      id        String   @id @default(uuid())
      eventId   String   @map("event_id")
      createdAt DateTime @default(now()) @map("created_at")

      @@map("tickets")
    }
    ```
- **Integrity:** Explicitly index foreign keys and columns used in frequent filters.

---

## 4. Frontend: Next.js (App Router)

### ⚛️ Atomic Design & Component Limits
- **Hierarchy:** Atoms -> Molecules -> Organisms -> Features.
- **JSX Limit:** Max **100 lines of JSX** per file.
- **Logic Separation:** Extract complex state management or side effects into custom hooks.

### 📂 Feature-First Structure
Group by domain, not by technical layer:
```text
/src
  /features
    /orders
      /components
      /hooks
      /services
      index.ts (Public API)
```

---

## 5. Development Guardrails

- **Absolute Imports:** Use `@/` for all internal references.
- **Testing Strategy:**
    - **Unit:** 100% logic coverage in Services.
    - **Integration:** Happy-path and edge-case testing for critical API flows.
- **AI Protocol:** Document significant prompts in `PROMPT_BUILD.md`.

---

## 6. Testing Strategy

### 🧪 Unit Testing (Jest)
- **Scope:** Test individual functions and components in isolation.
- **Mocks:** Use `jest.mock` to stub external dependencies (APIs, services).
- **Coverage:** Aim for 100% line coverage on business logic.

### 🎭 Integration Testing (Supertest/Cypress)
- **Scope:** Test API endpoints and full user flows.
- **Data:** Use `factory.ts` to generate realistic test data.
- **Validation:** Verify response schemas and database state changes.

---

## 7. The "Antigravity" Checklist
Before finishing a feature, verify:
1. Is every file under 500 lines?
2. Is the code "weightless" (easy to delete without side effects)?
3. Can a peer understand the logic in under 60 seconds?
4. Is the Swagger documentation accurate and complete?
