# Authentication and User Persistence Audit

## Summary of Findings

| Requirement | Status | Details |
|-------------|--------|---------|
| Single user identity (id = Keycloak sub) | FIXED | Initially violated by `UUID` type in DB; changed to `TEXT`. |
| No password storage | COMPLIANT | Verified no password fields in DB or code. |
| First/last name always present | COMPLIANT | Middleware rejects requests missing `given_name` or `family_name` with 403. |
| Upsert is idempotent and race-safe | PARTIAL VIOLATION | Race-safe for `id`, but concurrent email conflicts on different IDs cause 500. |
| No unauthenticated access to user data | COMPLIANT | User routes are protected by `authMiddleware`. |

## Violations Found

### 1. Single User Identity Mismatch (Fixed)
- **Status**: Fixed in this PR.
- **Reference**: `backend/infrastructure/db/migrations/001_users.sql`
- **Description**: The database schema used `UUID` for the `id` column, while Keycloak `sub` is a string. This would cause failures for any non-UUID `sub` values.
- **Action Taken**: Changed column type to `TEXT`.

### 2. Upsert Race Condition / Idempotency on Email
- **Status**: Violation
- **Reference**: `backend/infrastructure/db/user_repository.ts`, `backend/infrastructure/db/migrations/001_users.sql`
- **Description**: The `upsertUser` function uses `ON CONFLICT (id)`. However, the `email` column also has a `UNIQUE` constraint. If a race condition occurs where two different IDs are upserted with the same email, the database will throw a unique constraint violation (500 error) instead of handling it gracefully or ensuring idempotency across all unique constraints. While `id` is the primary identity, the system is not fully "race-safe" against email conflicts.

## Verified Compliance

- **No Password Storage**: Verified `users` table schema and `AuthUser` interface. No passwords are stored or handled.
- **Name Presence**: `backend/infrastructure/http/auth_middleware.ts` explicitly checks for `payload.given_name` and `payload.family_name`. Requests missing these claims are rejected with a 403 Forbidden status.
- **Access Control**: `backend/app/server.ts` uses `authMiddleware` for the `/me` route. The only other route is `/health`, which is public but contains no user data.
