# Club Usage Guide

This guide provides a comprehensive overview of how to manage and interact with clubs on the platform.

## 1. What Clubs Are
Clubs represent official campus organizations (e.g., IIT Bombay Clubs). They act as hubs for community engagement, allowing users to:
- Follow clubs to stay updated with their activities.
- View club-specific posts and job/internship openings.
- Interact with club content through likes and comments.

Clubs differ from users in that they are organizational entities. While users have personal profiles and connections, clubs have followers and can post official updates and opportunities.

## 2. Club Creation
### Permissions
Only users with the **`CLUB_ADMIN`** role are permitted to create new clubs.
### Process
Currently, there is **no frontend user interface** for creating a club. Club creation must be performed via the backend API:
- **Route:** `POST /clubs`
- **Required Fields:**
  - `name`: The name of the club (e.g., "Coding Club").
- **Optional Fields:**
  - `description`: A brief overview of the club's purpose.
  - `website_url`: A link to the club's external website.

On creation, the club is assigned a unique UUID and stored in the `clubs` table.

## 3. Club Roles & Permissions
The system utilizes two primary roles for club management:
- **`CLUB_ADMIN`**: Authorized to create, update, and delete club entities.
- **`CLUB_CONVENER`**: Authorized to create posts on behalf of a club and manage (create/edit/delete) job openings associated with the club.

### Enforcement
- **Backend:** Role checks are enforced using the `requireRole` middleware on specific routes.
- **Frontend:** There are currently **no role-specific UI elements**. Management actions must be performed via API calls by authorized users.

Normal users can view all clubs, follow them, and see their posts/openings, but cannot perform management tasks.

## 4. Viewing Clubs
### Club Listing
Users can view all registered clubs by navigating to the **Clubs** tab in the main navigation bar. This page lists all clubs with their names and descriptions.
### Club Profile
Clicking "View Profile" on a club card opens the individual club page (`/clubs/:id`). This page displays:
- Club name, description, and website link.
- **Latest Updates:** A feed of posts created by the club.
- **Openings:** A list of active job or internship opportunities posted by the club.

## 5. Following / Unfollowing Clubs
- **How to Follow:** On the club profile page, click the **Follow** button.
- **How to Unfollow:** If already following, click the **Unfollow** button.
- **Data Storage:** Follower status is stored in the `club_followers` table, linking the user's UUID to the club's UUID.
- **Effect:** Following a club ensures that the club's posts appear in your aggregated feed.

## 6. Posting as a Club
### Permissions
Only users with the **`CLUB_CONVENER`** role can post as a club.
### Process
There is **no frontend UI** to select a club identity when creating a post. This must be done via the API:
- **Route:** `POST /posts`
- **Parameters:** Include the `club_id` in the request body.
### Identity & Feed
When a post is attached to a `club_id`, the club's name is displayed as the author in the feed instead of the individual user's name. These posts are visible to all followers in their home feed.

## 7. Club Openings / Opportunities
### Creation
Only **`CLUB_CONVENER`**s can create openings via the API:
- **Route:** `POST /openings`
- **Required Fields:** `club_id`, `title`, `description`, `job_type`, `experience_level`.
- **Job Types:** `full-time`, `part-time`, `internship`, `contract`.
- **Experience Levels:** `entry`, `mid`, `senior`, `executive`.
### Visibility
Openings are displayed on the individual club profile and the global **Openings** page (`/openings`). Any authenticated user can view and filter openings by job type or experience level.

## 8. Editing & Deleting Club Content
- **Club Details:** Can be updated via `PUT /clubs/:id` and deleted via `DELETE /clubs/:id` by a **`CLUB_ADMIN`**.
- **Openings:** Can be updated via `PUT /openings/:id` and deleted via `DELETE /openings/:id` by a **`CLUB_CONVENER`**.
- **Impact of Deletion:** Deleting a club will automatically remove all its associated followers, posts, and openings via database cascade.

## 9. Notifications Related to Clubs
- **Interactions:** When a user likes or comments on a club post, a notification is triggered for the original author (the user who created the post as a convener).
- **Missing Notifications:** There are currently no automated notifications for "New Post from Club" or "New Opening Posted."

## 10. Known Limitations
- **UI Gaps:** No frontend interface exists for creating clubs, editing club info, creating openings, or selecting club identity for posts.
- **Application Process:** The "Apply Now" button on openings is a UI placeholder and does not currently facilitate a backend application workflow.
- **Member Management:** There is no implemented feature to manage club members or assign convener roles within the UI.
