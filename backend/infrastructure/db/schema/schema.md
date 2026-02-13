# 📘 Database Schema Documentation

Schema: `public`
Database Type: PostgreSQL
Primary Key Type: `uuid` (default: `gen_random_uuid()` unless stated otherwise)

---

# 🗂 Tables

---

## 👤 `users`

| Column          | Type                     | Nullable | Default |
| --------------- | ------------------------ | -------- | ------- |
| id              | uuid                     | NO       | —       |
| email           | text                     | NO       | —       |
| first_name      | text                     | NO       | —       |
| last_name       | text                     | NO       | —       |
| headline        | text                     | YES      | —       |
| created_at      | timestamp with time zone | NO       | now()   |
| updated_at      | timestamp with time zone | NO       | now()   |
| is_system_admin | boolean                  | YES      | false   |

---

## 🧑 `user_profiles`

| Column            | Type                     | Nullable | Default       |
| ----------------- | ------------------------ | -------- | ------------- |
| user_id           | uuid                     | NO       | FK → users.id |
| about             | text                     | YES      | —             |
| profile_image_url | text                     | YES      | —             |
| created_at        | timestamp with time zone | NO       | now()         |
| updated_at        | timestamp with time zone | NO       | now()         |

---

## 🏛 `bodies`

| Column      | Type                     | Nullable | Default           |
| ----------- | ------------------------ | -------- | ----------------- |
| id          | uuid                     | NO       | gen_random_uuid() |
| name        | text                     | NO       | —                 |
| description | text                     | YES      | —                 |
| website_url | text                     | YES      | —                 |
| created_at  | timestamp with time zone | NO       | now()             |
| updated_at  | timestamp with time zone | NO       | now()             |

---

## 👥 `body_memberships`

| Column     | Type             | Nullable | Default           |
| ---------- | ---------------- | -------- | ----------------- |
| id         | uuid             | NO       | gen_random_uuid() |
| body_id    | uuid             | NO       | FK → bodies.id    |
| user_id    | uuid             | NO       | FK → users.id     |
| role       | body_role (ENUM) | NO       | —                 |
| created_at | timestamp        | YES      | now()             |

---

## ⭐ `body_followers`

| Column     | Type                     | Nullable | Default           |
| ---------- | ------------------------ | -------- | ----------------- |
| id         | uuid                     | NO       | gen_random_uuid() |
| body_id    | uuid                     | NO       | FK → bodies.id    |
| user_id    | uuid                     | NO       | FK → users.id     |
| created_at | timestamp with time zone | NO       | now()             |

---

## 📝 `posts`

| Column     | Type                     | Nullable | Default           |
| ---------- | ------------------------ | -------- | ----------------- |
| id         | uuid                     | NO       | gen_random_uuid() |
| author_id  | uuid                     | NO       | FK → users.id     |
| body_id    | uuid                     | YES      | FK → bodies.id    |
| content    | text                     | NO       | —                 |
| visibility | text                     | YES      | 'public'          |
| created_at | timestamp with time zone | YES      | now()             |
| updated_at | timestamp with time zone | YES      | now()             |

---

## 💬 `comments`

| Column     | Type                     | Nullable | Default           |
| ---------- | ------------------------ | -------- | ----------------- |
| id         | uuid                     | NO       | gen_random_uuid() |
| post_id    | uuid                     | YES      | FK → posts.id     |
| author_id  | uuid                     | YES      | FK → users.id     |
| content    | text                     | NO       | —                 |
| created_at | timestamp with time zone | YES      | now()             |
| updated_at | timestamp with time zone | YES      | now()             |

---

## ❤️ `reactions`

| Column     | Type                     | Nullable | Default           |
| ---------- | ------------------------ | -------- | ----------------- |
| id         | uuid                     | NO       | gen_random_uuid() |
| post_id    | uuid                     | YES      | FK → posts.id     |
| user_id    | uuid                     | YES      | FK → users.id     |
| type       | text                     | YES      | —                 |
| created_at | timestamp with time zone | YES      | now()             |

---

## 🤝 `connections`

| Column       | Type                     | Nullable | Default           |
| ------------ | ------------------------ | -------- | ----------------- |
| id           | uuid                     | NO       | gen_random_uuid() |
| requester_id | uuid                     | NO       | FK → users.id     |
| receiver_id  | uuid                     | NO       | FK → users.id     |
| status       | connection_status (ENUM) | NO       | 'pending'         |
| created_at   | timestamp with time zone | YES      | now()             |
| updated_at   | timestamp with time zone | YES      | now()             |

---

## 🚫 `blocked_users`

| Column     | Type                     | Nullable | Default           |
| ---------- | ------------------------ | -------- | ----------------- |
| id         | uuid                     | NO       | gen_random_uuid() |
| blocker_id | uuid                     | YES      | FK → users.id     |
| blocked_id | uuid                     | YES      | FK → users.id     |
| created_at | timestamp with time zone | YES      | now()             |

---

## 📩 `messages`

| Column         | Type                     | Nullable | Default           |
| -------------- | ------------------------ | -------- | ----------------- |
| id             | uuid                     | NO       | gen_random_uuid() |
| sender_id      | uuid                     | NO       | FK → users.id     |
| receiver_id    | uuid                     | NO       | FK → users.id     |
| message_text   | text                     | NO       | —                 |
| attachment_url | text                     | YES      | —                 |
| created_at     | timestamp with time zone | NO       | now()             |
| read_at        | timestamp with time zone | YES      | —                 |

---

## 🔔 `notifications`

| Column     | Type                     | Nullable | Default           |
| ---------- | ------------------------ | -------- | ----------------- |
| id         | uuid                     | NO       | gen_random_uuid() |
| user_id    | uuid                     | YES      | FK → users.id     |
| actor_id   | uuid                     | YES      | FK → users.id     |
| post_id    | uuid                     | YES      | FK → posts.id     |
| type       | text                     | YES      | —                 |
| created_at | timestamp with time zone | YES      | now()             |
| read_at    | timestamp with time zone | YES      | —                 |

---

## 👥 `groups`

| Column      | Type                     | Nullable | Default           |
| ----------- | ------------------------ | -------- | ----------------- |
| id          | uuid                     | NO       | gen_random_uuid() |
| name        | varchar                  | NO       | —                 |
| description | text                     | YES      | —                 |
| created_by  | uuid                     | NO       | —                 |
| type        | varchar                  | NO       | 'regular'         |
| max_members | integer                  | NO       | 100               |
| is_active   | boolean                  | NO       | true              |
| created_at  | timestamp with time zone | YES      | now()             |

---

## 👤 `group_members`

| Column    | Type                     | Nullable | Default        |
| --------- | ------------------------ | -------- | -------------- |
| group_id  | uuid                     | NO       | FK → groups.id |
| user_id   | uuid                     | NO       | —              |
| role      | varchar                  | NO       | 'member'       |
| status    | varchar                  | NO       | 'active'       |
| joined_at | timestamp with time zone | YES      | now()          |
| acted_by  | uuid                     | YES      | —              |

---

## 💬 `group_messages`

| Column     | Type                     | Nullable | Default           |
| ---------- | ------------------------ | -------- | ----------------- |
| id         | uuid                     | NO       | gen_random_uuid() |
| group_id   | uuid                     | NO       | FK → groups.id    |
| sender_id  | uuid                     | NO       | —                 |
| content    | text                     | NO       | —                 |
| created_at | timestamp with time zone | YES      | now()             |
| edited_at  | timestamp with time zone | YES      | —                 |
| deleted_at | timestamp with time zone | YES      | —                 |

---

## 👁 `group_message_reads`

| Column     | Type                     | Nullable | Default                |
| ---------- | ------------------------ | -------- | ---------------------- |
| message_id | uuid                     | NO       | FK → group_messages.id |
| user_id    | uuid                     | NO       | —                      |
| read_at    | timestamp with time zone | YES      | now()                  |

---

## 📅 `events`

| Column        | Type             | Nullable | Default           |
| ------------- | ---------------- | -------- | ----------------- |
| id            | uuid             | NO       | gen_random_uuid() |
| body_id       | uuid             | NO       | —                 |
| group_id      | uuid             | NO       | FK → groups.id    |
| title         | varchar          | NO       | —                 |
| description   | text             | NO       | —                 |
| location_name | varchar          | NO       | —                 |
| latitude      | double precision | NO       | —                 |
| longitude     | double precision | NO       | —                 |
| start_time    | timestamptz      | NO       | —                 |
| end_time      | timestamptz      | NO       | —                 |
| capacity      | integer          | YES      | —                 |
| status        | varchar          | NO       | 'draft'           |
| created_at    | timestamptz      | YES      | now()             |
| updated_at    | timestamptz      | YES      | now()             |

---

## 🛠 `openings`

| Column           | Type                         | Nullable | Default           |
| ---------------- | ---------------------------- | -------- | ----------------- |
| id               | uuid                         | NO       | gen_random_uuid() |
| body_id          | uuid                         | NO       | FK → bodies.id    |
| title            | text                         | NO       | —                 |
| description      | text                         | YES      | —                 |
| location_city    | text                         | YES      | —                 |
| location_country | text                         | YES      | 'India'           |
| job_type         | job_type_enum (ENUM)         | NO       | —                 |
| experience_level | experience_level_enum (ENUM) | NO       | —                 |
| created_at       | timestamptz                  | NO       | now()             |
| updated_at       | timestamptz                  | NO       | now()             |

---

## 🚨 `user_reports`

| Column      | Type                 | Nullable | Default           |
| ----------- | -------------------- | -------- | ----------------- |
| id          | uuid                 | NO       | gen_random_uuid() |
| reporter_id | uuid                 | YES      | FK → users.id     |
| reported_id | uuid                 | YES      | FK → users.id     |
| reason      | text                 | NO       | —                 |
| status      | report_status (ENUM) | YES      | 'OPEN'            |
| created_at  | timestamptz          | YES      | now()             |

---

# 🔢 ENUM Types

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

## `job_type_enum`

* full_time
* part_time
* internship

## `experience_level_enum`

* fresher
* 1-2_years
* 3+_years

## `report_status`

* OPEN
* REVIEWED
* DISMISSED

