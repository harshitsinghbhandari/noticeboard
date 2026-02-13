# SCALABILITY_REFACTORING.md 🚀♻️

This document outlines the architectural evolution required to ensure the Noticeboard platform can scale its feature set without collapsing under complexity. It provides a roadmap for refactoring current bottlenecks and establishes rules for sustainable growth.

---

## 1. Current Architectural Shape

### Backend
- **Layering:** Primarily Horizontal (Routes -> Repositories).
- **Organization:** Feature-based files in `app/routes/` and `infrastructure/db/`.
- **Dependency Flow:** Routes depend directly on Database Repositories.
- **Friction Point:** Lack of a Domain/Service layer. Business logic is currently trapped in route handlers.

### Frontend
- **Structure:** Flat component architecture in `src/components/`.
- **Organization:** Single-file components handling multiple responsibilities (UI, State, API).
- **Friction Point:** Deep coupling between UI and Infrastructure (API client). Adding features currently requires modifying large, multi-purpose components.

---

## 2. Scalability Bottlenecks

| Bottleneck | Description | Scaling Risk | Risk Level |
| :--- | :--- | :--- | :--- |
| **Route-Repository Entanglement** | Business logic (e.g., notifications, permissions) is mixed into Express routes. | New features will bloat routes, making logic reuse impossible. | 🔴 High |
| **Smart Components** | Components like `Feed.tsx` handle fetching, optimistic UI, and business logic. | Adding feature variations will cause technical debt to compound. | 🔴 High |
| **Flat Component Directory** | No modular separation of features in the frontend. | Feature entanglement; impossible to isolate or remove features safely. | 🟡 Moderate |
| **Direct DB Repository Usage** | Repositories return raw DB rows; schema changes leak everywhere. | Schema migrations become risky and require wide-reaching code changes. | 🟡 Moderate |

---

## 3. Scaling-Oriented Refactoring Strategy

### Backend: Transition to Service-Oriented Architecture
- ~~**Introduce Service Layer:** Create `backend/app/services/`. All business logic must move from routes to services.~~
- ~~**Service Responsibility:** Services coordinate between multiple repositories (e.g., creating a post AND a notification) and enforce domain rules.~~
- ~~**Route Responsibility:** Routes should only handle HTTP concerns (parsing parameters, calling services, returning status codes).~~

### Frontend: Feature-Based Modularization
- ~~**Modular Folders:** Transition from `src/components/` to `src/features/[feature_name]/`.~~
- ~~**Feature Structure:** Each feature folder should contain its own `components/`, `hooks/`, and `api/` (for feature-specific endpoints).~~
- ~~**UI/Logic Separation:** Extract data fetching and state management into custom hooks (e.g., `useFeed`, `usePostActions`).~~

### Infrastructure: Decoupling
- ~~**Repository Abstraction:** repositories should return structured Domain Objects/Interfaces instead of raw DB rows.~~
- ~~**Centralized API Hooks:** Frontend should use a wrapper around `apiClient` that handles common concerns (loading, errors, caching) to prevent duplication in components.~~

---

## 4. Feature Addition Rules (MANDATORY)

1.  **Isolated Modules:** All new features must live in their own dedicated modules (Backend: `services/`, Frontend: `features/`).
2.  **No Cross-Feature Side Effects in Routes:** A route handler must call a single service method. Side effects (e.g., notifications triggered by a post) must be handled within the Service or via an Event Emitter.
3.  **Forbidden Direct API Calls in UI:** UI components must not call `apiClient` directly. They must use custom hooks or service functions.
4.  **Layer Integrity:** `infrastructure/` must never import from `app/`. `repositories` must never import `services`.
5.  **Schema Encapsulation:** Only repositories should know about table names and column names. Use interfaces to map DB rows to domain-friendly objects.

---

## 5. Safe Scaling Process

- **Service Migration First:** Before adding a major new feature to an existing area (e.g., adding "Post Polls"), the existing route logic must be refactored into a Service.
- **Module Boundaries:** When a feature folder exceeds 5 files, it must be audited for sub-module extraction.
- **Backward Compatibility:** When evolving internal APIs or Service methods, maintain the old signature until all consumers are migrated.

---

## 6. Anti-Patterns That Block Scaling

- **Shared "utils" Dumping Ground:** Putting domain logic into "utils" because it doesn't fit in a route.
- **Prop Drilling for Logic:** Passing service-like functions down multiple component levels instead of using Hooks or Context.
- **God Repositories:** Adding unrelated queries to a repository just because they touch the same table (e.g., mixing Post Feed logic with Post Moderation logic).
- **Conditional Explosion:** Using long `if/else` or `switch` chains inside a single route or component to handle different feature variations.
