# ScaleRefactor Journal - Critical Structural Risks

## 2025-05-14 - Lack of Backend Service Layer
**Structural Gap:** Business logic (notifications, permission checks, side effects) is directly implemented within Express route handlers.
**Scaling Risk:** As more features are added, route handlers will become bloated, making logic reuse difficult and unit testing nearly impossible without integration overhead. It blocks safe growth of complex cross-feature workflows.
**Guidance Added:** Introduced the requirement for a Service Layer in `SCALABILITY_REFACTORING.md`.

## 2025-05-14 - Frontend Component Logic Overload
**Structural Gap:** UI components (e.g., `Feed.tsx`) manage their own data fetching, optimistic state updates, and complex business logic using the base `apiClient`.
**Scaling Risk:** This "Smart Component" pattern leads to massive, unmaintainable components and logic duplication. Adding new features like "Groups" or "Events" will likely result in copy-pasted logic, increasing the technical debt exponentially.
**Guidance Added:** Introduced Feature-based modularization and Data/Logic abstraction rules in `SCALABILITY_REFACTORING.md`.

## 2025-05-14 - Flat Component Structure
**Structural Gap:** All frontend components reside in a single flat directory (`frontend/src/components/`).
**Scaling Risk:** Navigating and managing the codebase becomes significantly harder as the number of features grows. Feature entanglement is encouraged because there are no clear boundaries.
**Guidance Added:** Mandatory transition to a feature-based folder structure.
