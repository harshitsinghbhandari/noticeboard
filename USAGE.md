# IIT Bombay Social Platform - Usage Guide

Welcome to the IIT Bombay Social Platform, a professional networking site designed specifically for our campus community. This guide provides comprehensive instructions on how to use every feature of the platform.

---

## 1. Login & Authentication

### Accessing the Platform
- Navigate to the login page at `/login`.
- If you don't have an account, click **Sign up** to go to the `/register` page.

### Registration
- **Who can register:** Any student or faculty member with a valid email.
- **Fields required:**
  - First Name & Last Name
  - Headline (e.g., "B.Tech Computer Science '25")
  - Email Address
  - Password (minimum 8 characters)
- After successful registration, you will be redirected to the login page.

### Roles & Permissions
Roles are managed via Keycloak and determine your level of access:
- **USER:** Standard access. Can post, connect, message, and follow clubs.
- **CLUB_ADMIN:** Can create, edit, and delete clubs/societies.
- **CLUB_CONVENER:** Can post official updates as a club and manage job/internship openings.

### Session Management
- **Logging Out:** Click the **Logout** icon (door icon) in the top navigation bar.
- **Expiration:** For security, your session will expire periodically, requiring you to sign in again.

---

## 2. User Profile

### Viewing Your Profile
- Click on your profile icon in the top right corner of the navigation bar to go to `/profile/me`.
- Your profile displays your name, headline, bio, and a history of your posts.

### Finding Your User ID (UUID)
- To share your profile with others for connection requests, click on your profile and copy the unique ID (UUID) from the browser's address bar (e.g., `/profile/550e8400-e29b-41d4-a716-446655440000`).

### Editing Your Profile
- On your profile page, click **Edit Profile**.
- You can update your **Bio (About)** section.
- Click **Save Bio** to apply changes.

### Viewing Others
- You can view other students' profiles by clicking their names on posts or notifications.

---

## 3. Connections

Connections allow you to build your professional campus network.

### Sending a Request
1. Navigate to the **Connections** page via the top navigation.
2. Under **Find Students**, enter the **User ID (UUID)** of the person you want to connect with.
3. Click **Connect**.

### Managing Requests
- **Incoming Requests:** View pending requests from others in the "Incoming Requests" section. You can choose to **Accept** or **Reject**.
- **Outgoing Requests:** View requests you've sent and their status (Pending, Accepted, or Rejected).

### Benefits of Connecting
- Connecting with others allows you to see their "Connections Only" posts in your feed.
- You will receive a notification once someone accepts your request.

---

## 4. Posts

### Creating a Post
- On the **Feed** page, use the composer at the top.
- Enter your thoughts and click **Post**.

### Posting as a Club
- If you have the **CLUB_CONVENER** role, you can choose to post on behalf of a club you manage. These posts will appear with the club's name and branding.

### Visibility
- **Public:** Visible to everyone on the platform.
- **Connections Only:** Visible only to your accepted connections.
- *Note: Posts default to Public in the current version.*

### Management
- You can view all your previous posts on your profile page.

---

## 5. Comments & Reactions

### Reacting to Posts
- Click the **Like** button on any post to show your appreciation.
- The like count updates instantly. Click again to remove your like.

### Commenting
- Click the **Comment** button to expand the comments section.
- Type your comment in the input field and press **Enter** or click **Post**.
- Authors receive notifications for new comments on their posts.

---

## 6. Feed

The **Feed** (`/feed`) is your central hub for campus activity.

### What Appears in Your Feed
- Public posts from all users.
- Posts from your connections.
- Updates from clubs you follow.
- Official **Openings** (Jobs/Internships) posted by clubs.

### Sorting
- The feed is sorted chronologically, with the most recent updates at the top.

---

## 7. Clubs / Societies

Explore and follow campus organizations.

### Discovering Clubs
- Navigate to the **Clubs** page (`/clubs`) to see a list of all registered IIT Bombay clubs.
- Click **View Profile** to visit a specific club's page.

### Following a Club
- On a club's profile page, click **Follow**.
- Following a club ensures their updates appear in your main feed.

### Club Management
- **Admins:** Use the platform to create new club entities.
- **Conveners:** Post updates and openings directly to the club's profile.

---

## 8. Openings / Opportunities

The **Openings** page (`/openings`) lists career and project opportunities.

### Searching & Filtering
- Use the filters at the top to narrow down openings by:
  - **Job Type:** Full-time, Part-time, Internship, Contract.
  - **Experience Level:** Entry, Mid, Senior, Executive.

### Applying
- Each opening shows details like location, type, and description.
- Click **Apply** or **Apply Now** to start your application process.

### Appearance in Feed
- New openings are automatically injected into the main Feed for high visibility.

---

## 9. Messaging

Direct 1:1 messaging for campus collaboration.

### Starting a Chat
- Click on the **Messages** tab in the navigation bar.
- Select a contact from your conversation list on the left.

### Chatting
- Type your message in the bottom input field and click **Send**.
- The chat history updates in real-time.
- You can see timestamps for every message sent and received.

---

## 10. Notifications

Stay informed about interactions.

### Accessing Notifications
- Click the **Notifications** tab (`/notifications`).
- Unread notifications are highlighted with a blue indicator.

### Types of Notifications
- **Likes:** When someone likes your post.
- **Comments:** When someone comments on your post.
- **Connections:** When someone accepts your connection request.

### Clearing Notifications
- Clicking on a notification will mark it as read and take you to the relevant content (e.g., the post that was liked).

---

## 11. Navigation & Pages Summary

| Route | Page | Purpose |
|-------|------|---------|
| `/feed` | Feed | View all campus updates and openings. |
| `/connections` | Connections | Manage your network and send requests via UUID. |
| `/clubs` | Clubs | Browse campus clubs and societies. |
| `/clubs/:id` | Club Profile | View a specific club's details and posts. |
| `/openings` | Openings | Search for jobs and internships. |
| `/messages` | Messages | Private 1:1 conversations. |
| `/notifications` | Notifications | Track likes, comments, and connections. |
| `/profile/:id` | User Profile | View/Edit bio and personal post history. |

---

## 12. Miscellaneous

### Human-Readable Timestamps
- All activities show relative time (e.g., "just now", "5 minutes ago", "2 days ago") for better context.

### Error Handling
- If an action fails (e.g., trying to connect with yourself), a descriptive error message will appear near the action area.

### Current Limitations
- **Search:** The search bar in the header is currently a visual placeholder and does not filter content.
- **Finding Users:** To connect with someone, you currently need their specific User ID (UUID), which they can find on their profile page.
- **Profile Pictures:** Users are currently represented by their initials; custom avatar uploads are not yet available.
