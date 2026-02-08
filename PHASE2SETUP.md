# Phase 2 Setup Guide — Professional Social Layer

This document outlines the configuration and setup required for Phase 2 of the IIT Bombay college communication platform.

## 1. Environment Variables (.env)

Create a `.env` file in the `backend/` directory with the following variables:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=noticeboard

# Keycloak Configuration
KEYCLOAK_ISSUER=http://localhost:8080/realms/noticeboard
KEYCLOAK_JWKS_URI=http://localhost:8080/realms/noticeboard/protocol/openid-connect/certs
KEYCLOAK_ADMIN_CLIENT_ID=admin-cli
KEYCLOAK_ADMIN_CLIENT_SECRET=your_admin_secret
KEYCLOAK_FRONTEND_CLIENT_ID=noticeboard-frontend
KEYCLOAK_FRONTEND_CLIENT_SECRET=your_frontend_secret
JWT_SECRET=your_jwt_secret_if_needed
```

## 2. Keycloak Setup

- **Realm Name:** `noticeboard`
- **Roles:**
  - `CLUB_ADMIN`: Permission to create and update clubs.
  - `CLUB_CONVENER`: Permission to post on behalf of clubs and manage openings.
  - `USER`: Standard user permissions (default).
- **Backend Client (`noticeboard-backend`):**
  - Access Type: `confidential`
  - Service Accounts Enabled: `On`
  - Direct Access Grants Enabled: `On`
- **Frontend Client (`noticeboard-frontend`):**
  - Access Type: `public`
  - Valid Redirect URIs: `http://localhost:5173/*`
  - Web Origins (CORS): `http://localhost:5173`

## 3. Database Setup

### Instructions
1. Ensure PostgreSQL is running.
2. Create the database: `CREATE DATABASE noticeboard;`
3. The migrations will be applied in order. New tables for Phase 2:

- **clubs**: UUID PK, name, description, website_url, timestamps.
- **club_followers**: UUID PK, club_id (FK), user_id (FK), created_at.
- **openings**: UUID PK, club_id (FK), title, description, location_city, location_country, job_type (ENUM), experience_level (ENUM), timestamps.
- **messages**: UUID PK, sender_id (FK), receiver_id (FK), message_text, attachment_url, timestamps, read_at.

### Table Definitions (Migrations)
New migration files will be created in `backend/infrastructure/db/migrations/`:
- `007_clubs.sql`
- `008_openings.sql`
- `009_messages.sql`

## 4. Packages

Run the following commands to install new dependencies:

### Backend
```bash
cd backend
npm install express-validator
```

### Frontend
```bash
cd frontend
# No new major packages required, using existing React Router and Fetch API
```

## 5. Routing & Pages

### Frontend Routes
- `/feed`: Aggregated feed including connection posts, followed club posts, and openings.
- `/clubs`: Directory of all clubs.
- `/clubs/:id`: Club profile page showing details, posts, and openings.
- `/openings`: Searchable list of opportunities.
- `/messages`: 1:1 messaging interface.

### Page Responsibilities
- **Feed**: Fetches and merges content from multiple sources.
- **Club Profile**: Manages club-specific content and following status.
- **Messages**: Real-time (or polled) chat between users.

## 6. Permissions & Roles Enforcement

| Role | Endpoint/Action |
| :--- | :--- |
| `CLUB_ADMIN` | `POST /clubs`, `PUT /clubs/:id`, `DELETE /clubs/:id` |
| `CLUB_CONVENER` | `POST /posts` (with `club_id`), `POST /openings`, `PUT /openings/:id`, `DELETE /openings/:id` |
| `USER` | `POST /clubs/:id/follow`, `GET /messages`, `POST /messages` |

## 7. Additional Notes

- **Startup**:
  - Backend: `npm start`
  - Frontend: `npm run dev`
- **Integration**: All API calls from frontend must include the Keycloak JWT in the `Authorization` header.
- **Testing**: Use `vitest` for unit tests and `supertest` for integration tests.
