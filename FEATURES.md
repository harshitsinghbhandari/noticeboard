# Features Documentation

> **Status**: Implementation Accurate
> **Source of Truth**: Codebase (Backend & Frontend)
> **Verification**: `npm run build` passing

---

## 🔐 Authentication & Users

### Implementation
- **Provider**: Keycloak (OIDC) via `keycloak-js` (Frontend) and `jwks-rsa` (Backend).
- **Session**: stateless JWT (RS256).
- **User Identity**: UUID (v4) synced from Keycloak `sub` claim.

### Flow
1. **Frontend**: `App.tsx` initializes Keycloak.
   - Login: Redirects to Keycloak or uses `Login` component.
   - Token Storage: `localStorage`.
   - Socket Env: Authenticates via JWT in handshake.
2. **Backend**: `auth_service.ts` -> `createKeycloakUser`.
   - **Sync**: `upsertUser` updates local `users` table on registration.

### Permissions
- **System Admin**: defined by `users.is_system_admin` boolean.
- **Roles**: Extracted from JWT `realm_access.roles`.

### Search
- **Endpoint**: `GET /users/search?q={query}`
- **Logic**: ILIKE match on `email`, `first_name`, or `last_name`.
- **Limit**: Returns top 10 results.

---

## 🏛 Bodies (Organizations)

### Structure
- **Definition**: Fundamental organizational unit (Club, Department, etc.).
- **Tables**: `bodies`, `body_memberships`, `body_followers`.

### Roles & Authority
| Role | Code Constant | Permissions |
| :--- | :--- | :--- |
| Admin | `BODY_ADMIN` | Manage members, Delete body, Edit body, Create events/posts |
| Manager | `BODY_MANAGER` | Create events, Edit body |
| Convener | `BODY_CONVENER` | (Defined in Enum but logic treats as member in some checks) |
| Member | `BODY_MEMBER` | Create posts (if allowed) |

### Features
- **Follow**: Users can follow bodies (`body_followers`).
- **Discovery**: List all bodies sorted alphabetically.
- **Profile**: Public profile with description, website, and follower count.

---

## 📅 Events System

### Data Model
- **Table**: `events`
- **Linkage**:
  - Belongs to a **Body** (`body_id`).
  - Creates a dedicated **Group** (`group_id`) for chat/members.
- **Permissions**: `event_admins` and `event_organizers` tables.

### Lifecycle
1. **Creation**: `POST /events`
   - Role Required: `BODY_ADMIN` or `BODY_MANAGER`.
   - Effect: Creates `event` record AND `groups` record (type='event').
   - Creator becomes `owner` of the group and `event_admin`.
2. **Status**: `draft` -> `published` -> `cancelled` / `completed`.
3. **Joining**:
   - Limit: Max **5 active events** per user.
   - Capacity: Hard limit on group members (defaults to 500 if null).
   - Logic: Transactional check with `FOR UPDATE` lock.

### Discovery
- **Endpoint**: `GET /events`
- **Filter**: Geospatial query (Haversine formula) using `latitude`/`longitude`.
- **UI Categories**: "Happening Soon", "Your People Are Going", "Recommended".
- **Visuals**: Client-side filtering in `EventDiscovery.tsx`.

---

## 💬 Group Chats

### Architecture
- **Table**: `groups` (types: `regular`, `event`).
- **Membership**: `group_members` (roles: `owner`, `admin`, `member`).
- **Messages**: `group_messages`.
- **Persistence**: PostgreSQL.

### Rules
- **Creation**:
  - Regular: Anyone can create (`POST /groups`).
  - Event: Auto-created by system when Event is created.
- **Limits**:
  - Regular Groups: **100 members** max.
  - Event Groups: **Capacity** or **500 members**.
- **Management**:
  - Owner/Admin can add members.
  - Owner cannot leave.
  - Minimum members to exist: 2 (barrier to leaving).
- **Socket**: Real-time updates via `socket.io` (rooms: `group:{groupId}`).

### UI Features
- **Event Distinction**: Event groups show "Event Group" badge and "View Event" button.
- **Organizer Highlight**: Messages from event admins/organizers are flagged (`is_organizer` boolean).

---

## 📨 Messaging (Direct)

### System
- **Table**: `messages`
- **Relation**: Sender <-> Receiver (Self-referential User FKs).

### Constraints
1. **Connections**: Users MUST be connected (`status='accepted'` in `connections` table) to message.
2. **Blocking**: Checked via `blocked_users` table before sending.
3. **Rate Limit**: Max **30 new conversations** started per user per 24 hours.

### Features
- **Unread Counts**:
  - Global: `UnreadContext` via `GET /messages/unread-summary`.
  - Real-time: Socket events `unread:update`.
- **Read Receipts**: `read_at` timestamp.
- **Grouping**: Conversations grouped by `other_id`.

---

## 🗄 Database Design

### Core Schema
*   **users**: Identity & Auth profile.
*   **user_profiles**: Extended bio/image.
*   **connections**: Friend requests (`pending`, `accepted`).
*   **blocked_users**: User blocking logic.

### Organization
*   **bodies**: Clubs/Orgs metadata.
*   **body_memberships**: RBAC for bodies.
*   **body_followers**: Interest tracking.

### Social
*   **posts**: Feed content (can be linked to Body).
*   **comments**: Threaded discussions on posts.
*   **reactions**: Likes/etc.
*   **notifications**: Activity stream.

### Communication
*   **groups**: Chat containers.
*   **group_members**: Chat participants.
*   **group_messages**: Chat content.
*   **messages**: 1:1 Direct messages.
*   **events**: Event metadata (linked to groups).
*   **openings**: Job/Role listings.
*   **user_reports**: Moderation queue.
