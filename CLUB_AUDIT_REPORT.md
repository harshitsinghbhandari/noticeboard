# CLUB FUNCTIONALITY AUDIT REPORT

## 1. Audit Summary

| Feature | Status | Findings |
| --- | --- | --- |
| **Club Creation** | ❌ Broken (Fixed) | Creator was not recorded; no ownership link established. |
| **Club Visibility** | ✅ Working | Clubs visible to all logged-in users; public posts visible in feed. |
| **Following Logic** | ✅ Working | Idempotent follow/unfollow persisted correctly; affects feed. |
| **Admin Permissions** | ❌ Broken (Fixed) | Any user with global roles could manage ANY club. No backend enforcement of ownership. |
| **Posting as Club** | ❌ Broken (Fixed) | Any user with `CLUB_CONVENER` role could post as any club. |
| **Feed Integration** | ✅ Working | Club posts correctly attributed and integrated via `UNION ALL` query. |
| **UI Consistency** | ⚠️ Fragile (Improved) | Lack of management UI; added "Admin" badge to `ClubProfile` for clarity. |

---

## 2. Issues and Fixes

### Issue 1: Lack of Club Ownership Recording
- **Problem**: `POST /clubs` created a club but did not record the user who created it.
- **Cause**: Missing `admin_id` column in `clubs` table and missing logic in `createClub`.
- **Fix**: Added `admin_id` column via migration `011_add_club_admin.sql`. Updated `createClub` and `POST /clubs` to store the creator's ID.

### Issue 2: Global Role Vulnerability (Authorization)
- **Problem**: Any user with `CLUB_ADMIN` or `CLUB_CONVENER` roles could perform actions on any club, regardless of whether they were associated with it.
- **Cause**: Backend routes only checked for the presence of the role, not for association with the specific `club_id`.
- **Fix**: Updated all management routes (`PUT /clubs/:id`, `DELETE /clubs/:id`, `POST /posts` as club, and all `/openings` routes) to verify that the requesting user's ID matches the club's `admin_id`.

### Issue 3: Missing Admin Context in Frontend
- **Problem**: The UI did not reflect whether a user had administrative rights over a club.
- **Cause**: `admin_id` was not part of the frontend `Club` type or passed to components.
- **Fix**: Updated `frontend/src/types.ts` and `App.tsx` to pass `currentUserId` to `ClubProfile`. Added a conditional "Admin" badge in `ClubProfile.tsx`.

---

## 3. Practical Verification Results

- **Verified**: `POST /clubs` now correctly stores the `admin_id`.
- **Verified**: `PUT /clubs/:id` now returns `403 Forbidden` if a different `CLUB_ADMIN` tries to edit a club they didn't create.
- **Verified**: `POST /posts` with `club_id` now returns `403 Forbidden` if the user is not the admin of that club.
- **Verified**: `getAggregatedFeed` correctly joins `clubs` to display the club name as the author for club posts.

---

## 4. Recommendations
- **Future Improvement**: Implement a `club_members` table to support multiple conveners per club, as the current `admin_id` only supports a single owner.
- **UI Gap**: Add actual "Edit", "Delete", and "Create Opening" buttons to the `ClubProfile` for admins to move away from API-only management.
