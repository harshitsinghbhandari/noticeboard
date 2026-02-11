# Database Schema Documentation

---

# 📦 Tables

## `bodies`

| Column      | Type        | Nullable | Default           |
| ----------- | ----------- | -------- | ----------------- |
| id          | uuid        | ❌ No     | gen_random_uuid() |
| name        | text        | ❌ No     | —                 |
| description | text        | ✅ Yes    | —                 |
| website_url | text        | ✅ Yes    | —                 |
| created_at  | timestamptz | ❌ No     | now()             |
| updated_at  | timestamptz | ❌ No     | now()             |

---

## `body_followers`

| Column     | Type        | Nullable | Default           |
| ---------- | ----------- | -------- | ----------------- |
| id         | uuid        | ❌ No     | gen_random_uuid() |
| body_id    | uuid        | ❌ No     | —                 |
| user_id    | uuid        | ❌ No     | —                 |
| created_at | timestamptz | ❌ No     | now()             |

---

## `body_memberships`

| Column     | Type             | Nullable | Default           |
| ---------- | ---------------- | -------- | ----------------- |
| id         | uuid             | ❌ No     | gen_random_uuid() |
| body_id    | uuid             | ❌ No     | —                 |
| user_id    | uuid             | ❌ No     | —                 |
| role       | body_role (enum) | ❌ No     | —                 |
| created_at | timestamp        | ✅ Yes    | now()             |

---

## `comments`

| Column     | Type        | Nullable | Default           |
| ---------- | ----------- | -------- | ----------------- |
| id         | uuid        | ❌ No     | gen_random_uuid() |
| post_id    | uuid        | ✅ Yes    | —                 |
| author_id  | uuid        | ✅ Yes    | —                 |
| content    | text        | ❌ No     | —                 |
| created_at | timestamptz | ✅ Yes    | now()             |
| updated_at | timestamptz | ✅ Yes    | now()             |

---

## `connections`

| Column       | Type                     | Nullable | Default           |
| ------------ | ------------------------ | -------- | ----------------- |
| id           | uuid                     | ❌ No     | gen_random_uuid() |
| requester_id | uuid                     | ❌ No     | —                 |
| receiver_id  | uuid                     | ❌ No     | —                 |
| status       | connection_status (enum) | ❌ No     | 'pending'         |
| created_at   | timestamptz              | ✅ Yes    | now()             |
| updated_at   | timestamptz              | ✅ Yes    | now()             |

---

## `events`

| Column      | Type                | Nullable | Default           |
| ----------- | ------------------- | -------- | ----------------- |
| id          | uuid                | ❌ No     | gen_random_uuid() |
| body_id     | uuid                | ❌ No     | —                 |
| title       | text                | ❌ No     | —                 |
| description | text                | ✅ Yes    | —                 |
| location    | text                | ✅ Yes    | —                 |
| start_time  | timestamp           | ❌ No     | —                 |
| end_time    | timestamp           | ❌ No     | —                 |
| status      | event_status (enum) | ✅ Yes    | 'UPCOMING'        |
| created_at  | timestamp           | ✅ Yes    | now()             |

---

## `messages`

| Column         | Type        | Nullable | Default           |
| -------------- | ----------- | -------- | ----------------- |
| id             | uuid        | ❌ No     | gen_random_uuid() |
| sender_id      | uuid        | ❌ No     | —                 |
| receiver_id    | uuid        | ❌ No     | —                 |
| message_text   | text        | ❌ No     | —                 |
| attachment_url | text        | ✅ Yes    | —                 |
| created_at     | timestamptz | ❌ No     | now()             |
| read_at        | timestamptz | ✅ Yes    | —                 |

---

## `notifications`

| Column     | Type        | Nullable | Default           |
| ---------- | ----------- | -------- | ----------------- |
| id         | uuid        | ❌ No     | gen_random_uuid() |
| user_id    | uuid        | ✅ Yes    | —                 |
| type       | text        | ✅ Yes    | —                 |
| actor_id   | uuid        | ✅ Yes    | —                 |
| post_id    | uuid        | ✅ Yes    | —                 |
| created_at | timestamptz | ✅ Yes    | now()             |
| read_at    | timestamptz | ✅ Yes    | —                 |

---

## `openings`

| Column           | Type                  | Nullable | Default           |
| ---------------- | --------------------- | -------- | ----------------- |
| id               | uuid                  | ❌ No     | gen_random_uuid() |
| body_id          | uuid                  | ❌ No     | —                 |
| title            | text                  | ❌ No     | —                 |
| description      | text                  | ✅ Yes    | —                 |
| location_city    | text                  | ✅ Yes    | —                 |
| location_country | text                  | ✅ Yes    | 'India'           |
| job_type         | job_type_enum         | ❌ No     | —                 |
| experience_level | experience_level_enum | ❌ No     | —                 |
| created_at       | timestamptz           | ❌ No     | now()             |

---

# 🔗 Foreign Keys

| Table            | Column       | References |
| ---------------- | ------------ | ---------- |
| user_profiles    | user_id      | users(id)  |
| connections      | requester_id | users(id)  |
| connections      | receiver_id  | users(id)  |
| comments         | post_id      | posts(id)  |
| comments         | author_id    | users(id)  |
| notifications    | user_id      | users(id)  |
| notifications    | actor_id     | users(id)  |
| notifications    | post_id      | posts(id)  |
| body_followers   | body_id      | bodies(id) |
| body_followers   | user_id      | users(id)  |
| body_memberships | body_id      | bodies(id) |
| body_memberships | user_id      | users(id)  |
| openings         | body_id      | bodies(id) |
| events           | body_id      | bodies(id) |
| messages         | sender_id    | users(id)  |
| messages         | receiver_id  | users(id)  |

---

# 🧾 Enums

## `body_role`

* BODY_ADMIN
* BODY_MANAGER
* BODY_CONVENER

## `connection_status`

* pending
* accepted
* rejected

## `event_status`

* UPCOMING
* CANCELLED
* COMPLETED

## `experience_level_enum`

* fresher
* 1-2_years
* 3+_years

## `job_type_enum`

* full_time
* part_time
* internship

---

# 📑 Indexes (Summary)

### Primary Keys

All tables use `id` as primary key except:

* `user_profiles` → primary key: `user_id`

### Important Composite / Unique Indexes

* `body_followers(body_id, user_id)`
* `body_memberships(body_id, user_id)`
* `connections(LEAST(requester_id, receiver_id), GREATEST(...))`
* `reactions(post_id, user_id, type)`
* `users(email)`

---

# ✅ Notable Constraints

* Prevent self-connections:

  ```
  requester_id <> receiver_id
  ```

* Notification type constraint:

  ```
  type IN ('like', 'comment', 'connection')
  ```

* Post visibility constraint:

  ```
  visibility IN ('public', 'connections_only')
  ```

* Reactions limited to:

  ```
  type = 'like'
  ```
