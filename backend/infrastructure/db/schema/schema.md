## TABLES

 table_schema |    table_name    |    column_name    |          data_type          | is_nullable |        column_default        
--------------+------------------+-------------------+-----------------------------+-------------+------------------------------
 public       | bodies           | id                | uuid                        | NO          | gen_random_uuid()
 public       | bodies           | name              | text                        | NO          | 
 public       | bodies           | description       | text                        | YES         | 
 public       | bodies           | website_url       | text                        | YES         | 
 public       | bodies           | created_at        | timestamp with time zone    | NO          | now()
 public       | bodies           | updated_at        | timestamp with time zone    | NO          | now()
 public       | body_followers   | id                | uuid                        | NO          | gen_random_uuid()
 public       | body_followers   | body_id           | uuid                        | NO          | 
 public       | body_followers   | user_id           | uuid                        | NO          | 
 public       | body_followers   | created_at        | timestamp with time zone    | NO          | now()
 public       | body_memberships | id                | uuid                        | NO          | gen_random_uuid()
 public       | body_memberships | body_id           | uuid                        | NO          | 
 public       | body_memberships | user_id           | uuid                        | NO          | 
 public       | body_memberships | role              | USER-DEFINED                | NO          | 
 public       | body_memberships | created_at        | timestamp without time zone | YES         | now()
 public       | comments         | id                | uuid                        | NO          | gen_random_uuid()
 public       | comments         | post_id           | uuid                        | YES         | 
 public       | comments         | author_id         | uuid                        | YES         | 
 public       | comments         | content           | text                        | NO          | 
 public       | comments         | created_at        | timestamp with time zone    | YES         | now()
 public       | comments         | updated_at        | timestamp with time zone    | YES         | now()
 public       | connections      | id                | uuid                        | NO          | gen_random_uuid()
 public       | connections      | requester_id      | uuid                        | NO          | 
 public       | connections      | receiver_id       | uuid                        | NO          | 
 public       | connections      | status            | USER-DEFINED                | NO          | 'pending'::connection_status
 public       | connections      | created_at        | timestamp with time zone    | YES         | now()
 public       | connections      | updated_at        | timestamp with time zone    | YES         | now()
 public       | events           | id                | uuid                        | NO          | gen_random_uuid()
 public       | events           | body_id           | uuid                        | NO          | 
 public       | events           | title             | text                        | NO          | 
 public       | events           | description       | text                        | YES         | 
 public       | events           | location          | text                        | YES         | 
 public       | events           | start_time        | timestamp without time zone | NO          | 
 public       | events           | end_time          | timestamp without time zone | NO          | 
 public       | events           | status            | USER-DEFINED                | YES         | 'UPCOMING'::event_status
 public       | events           | created_at        | timestamp without time zone | YES         | now()
 public       | messages         | id                | uuid                        | NO          | gen_random_uuid()
 public       | messages         | sender_id         | uuid                        | NO          | 
 public       | messages         | receiver_id       | uuid                        | NO          | 
 public       | messages         | message_text      | text                        | NO          | 
 public       | messages         | attachment_url    | text                        | YES         | 
 public       | messages         | created_at        | timestamp with time zone    | NO          | now()
 public       | messages         | read_at           | timestamp with time zone    | YES         | 
 public       | notifications    | id                | uuid                        | NO          | gen_random_uuid()
 public       | notifications    | user_id           | uuid                        | YES         | 
 public       | notifications    | type              | text                        | YES         | 
 public       | notifications    | actor_id          | uuid                        | YES         | 
 public       | notifications    | post_id           | uuid                        | YES         | 
 public       | notifications    | created_at        | timestamp with time zone    | YES         | now()
 public       | notifications    | read_at           | timestamp with time zone    | YES         | 
 public       | openings         | id                | uuid                        | NO          | gen_random_uuid()
 public       | openings         | body_id           | uuid                        | NO          | 
 public       | openings         | title             | text                        | NO          | 
 public       | openings         | description       | text                        | YES         | 
 public       | openings         | location_city     | text                        | YES         | 
 public       | openings         | location_country  | text                        | YES         | 'India'::text
 public       | openings         | job_type          | USER-DEFINED                | NO          | 
 public       | openings         | experience_level  | USER-DEFINED                | NO          | 
 public       | openings         | created_at        | timestamp with time zone    | NO          | now()



## FOREIGN KEYS
 table_schema |    table_name    | column_name  | foreign_table_name | foreign_column_name 
--------------+------------------+--------------+--------------------+---------------------
 public       | user_profiles    | user_id      | users              | id
 public       | connections      | requester_id | users              | id
 public       | connections      | receiver_id  | users              | id
 public       | posts            | author_id    | users              | id
 public       | comments         | post_id      | posts              | id
 public       | comments         | author_id    | users              | id
 public       | reactions        | post_id      | posts              | id
 public       | reactions        | user_id      | users              | id
 public       | notifications    | user_id      | users              | id
 public       | notifications    | actor_id     | users              | id
 public       | notifications    | post_id      | posts              | id
 public       | body_followers   | body_id      | bodies             | id
 public       | body_followers   | user_id      | users              | id
 public       | openings         | body_id      | bodies             | id
 public       | messages         | sender_id    | users              | id
 public       | messages         | receiver_id  | users              | id
 public       | posts            | body_id      | bodies             | id
 public       | body_memberships | body_id      | bodies             | id
 public       | body_memberships | user_id      | users              | id
 public       | events           | body_id      | bodies             | id




## ENUMS
 schema |       enum_name       |  enum_value   
--------+-----------------------+---------------
 public | body_role             | BODY_ADMIN
 public | body_role             | BODY_MANAGER
 public | body_role             | BODY_CONVENER
 public | connection_status     | pending
 public | connection_status     | accepted
 public | connection_status     | rejected
 public | event_status          | UPCOMING
 public | event_status          | CANCELLED
 public | event_status          | COMPLETED
 public | experience_level_enum | fresher
 public | experience_level_enum | 1-2_years
 public | experience_level_enum | 3+_years
 public | job_type_enum         | full_time
 public | job_type_enum         | part_time
 public | job_type_enum         | internship


## INDEXES
 schemaname |    tablename     |              indexname               |                                                                       indexdef                                                                        
------------+------------------+--------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------
 public     | bodies           | clubs_pkey                           | CREATE UNIQUE INDEX clubs_pkey ON public.bodies USING btree (id)
 public     | body_followers   | club_followers_club_id_user_id_key   | CREATE UNIQUE INDEX club_followers_club_id_user_id_key ON public.body_followers USING btree (body_id, user_id)
 public     | body_followers   | club_followers_pkey                  | CREATE UNIQUE INDEX club_followers_pkey ON public.body_followers USING btree (id)
 public     | body_memberships | body_memberships_body_id_user_id_key | CREATE UNIQUE INDEX body_memberships_body_id_user_id_key ON public.body_memberships USING btree (body_id, user_id)
 public     | body_memberships | body_memberships_pkey                | CREATE UNIQUE INDEX body_memberships_pkey ON public.body_memberships USING btree (id)
 public     | body_memberships | idx_body_memberships_body            | CREATE INDEX idx_body_memberships_body ON public.body_memberships USING btree (body_id)
 public     | body_memberships | idx_body_memberships_user            | CREATE INDEX idx_body_memberships_user ON public.body_memberships USING btree (user_id)
 public     | comments         | comments_pkey                        | CREATE UNIQUE INDEX comments_pkey ON public.comments USING btree (id)
 public     | connections      | connections_pkey                     | CREATE UNIQUE INDEX connections_pkey ON public.connections USING btree (id)
 public     | connections      | connections_unique_pair              | CREATE UNIQUE INDEX connections_unique_pair ON public.connections USING btree (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id))
 public     | events           | events_pkey                          | CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id)
 public     | events           | idx_events_body                      | CREATE INDEX idx_events_body ON public.events USING btree (body_id)
 public     | messages         | messages_pkey                        | CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id)
 public     | notifications    | notifications_pkey                   | CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id)
 public     | openings         | openings_pkey                        | CREATE UNIQUE INDEX openings_pkey ON public.openings USING btree (id)
 public     | posts            | idx_posts_body                       | CREATE INDEX idx_posts_body ON public.posts USING btree (body_id)
 public     | posts            | idx_posts_created_at_desc            | CREATE INDEX idx_posts_created_at_desc ON public.posts USING btree (created_at DESC)
 public     | posts            | posts_pkey                           | CREATE UNIQUE INDEX posts_pkey ON public.posts USING btree (id)
 public     | reactions        | reactions_pkey                       | CREATE UNIQUE INDEX reactions_pkey ON public.reactions USING btree (id)
 public     | reactions        | reactions_post_id_user_id_type_key   | CREATE UNIQUE INDEX reactions_post_id_user_id_type_key ON public.reactions USING btree (post_id, user_id, type)
 public     | user_profiles    | user_profiles_pkey                   | CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (user_id)
 public     | users            | users_email_key                      | CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email)
 public     | users            | users_pkey                           | CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)



## CONSTRAINTS

           constraint_name            | constraint_type | schema |    table_name    |                                   definition                                    
--------------------------------------+-----------------+--------+------------------+---------------------------------------------------------------------------------
 clubs_pkey                           | p               | public | bodies           | PRIMARY KEY (id)
 club_followers_club_id_fkey          | f               | public | body_followers   | FOREIGN KEY (body_id) REFERENCES bodies(id) ON DELETE CASCADE
 club_followers_club_id_user_id_key   | u               | public | body_followers   | UNIQUE (body_id, user_id)
 club_followers_pkey                  | p               | public | body_followers   | PRIMARY KEY (id)
 club_followers_user_id_fkey          | f               | public | body_followers   | FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
 body_memberships_body_id_fkey        | f               | public | body_memberships | FOREIGN KEY (body_id) REFERENCES bodies(id) ON DELETE CASCADE
 body_memberships_body_id_user_id_key | u               | public | body_memberships | UNIQUE (body_id, user_id)
 body_memberships_pkey                | p               | public | body_memberships | PRIMARY KEY (id)
 body_memberships_user_id_fkey        | f               | public | body_memberships | FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
 comments_author_id_fkey              | f               | public | comments         | FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
 comments_pkey                        | p               | public | comments         | PRIMARY KEY (id)
 comments_post_id_fkey                | f               | public | comments         | FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
 check_not_self                       | c               | public | connections      | CHECK ((requester_id <> receiver_id))
 connections_pkey                     | p               | public | connections      | PRIMARY KEY (id)
 connections_receiver_id_fkey         | f               | public | connections      | FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
 connections_requester_id_fkey        | f               | public | connections      | FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
 events_body_id_fkey                  | f               | public | events           | FOREIGN KEY (body_id) REFERENCES bodies(id) ON DELETE CASCADE
 events_pkey                          | p               | public | events           | PRIMARY KEY (id)
 messages_pkey                        | p               | public | messages         | PRIMARY KEY (id)
 messages_receiver_id_fkey            | f               | public | messages         | FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
 messages_sender_id_fkey              | f               | public | messages         | FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
 notifications_actor_id_fkey          | f               | public | notifications    | FOREIGN KEY (actor_id) REFERENCES users(id)
 notifications_pkey                   | p               | public | notifications    | PRIMARY KEY (id)
 notifications_post_id_fkey           | f               | public | notifications    | FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
 notifications_type_check             | c               | public | notifications    | CHECK ((type = ANY (ARRAY['like'::text, 'comment'::text, 'connection'::text])))
 notifications_user_id_fkey           | f               | public | notifications    | FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
 openings_club_id_fkey                | f               | public | openings         | FOREIGN KEY (body_id) REFERENCES bodies(id) ON DELETE CASCADE
 openings_pkey                        | p               | public | openings         | PRIMARY KEY (id)
 posts_author_id_fkey                 | f               | public | posts            | FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
 posts_club_id_fkey                   | f               | public | posts            | FOREIGN KEY (body_id) REFERENCES bodies(id) ON DELETE SET NULL
 posts_pkey                           | p               | public | posts            | PRIMARY KEY (id)
 posts_visibility_check               | c               | public | posts            | CHECK ((visibility = ANY (ARRAY['public'::text, 'connections_only'::text])))
 reactions_pkey                       | p               | public | reactions        | PRIMARY KEY (id)
 reactions_post_id_fkey               | f               | public | reactions        | FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
 reactions_post_id_user_id_type_key   | u               | public | reactions        | UNIQUE (post_id, user_id, type)
 reactions_type_check                 | c               | public | reactions        | CHECK ((type = 'like'::text))
 reactions_user_id_fkey               | f               | public | reactions        | FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
 user_profiles_pkey                   | p               | public | user_profiles    | PRIMARY KEY (user_id)
 user_profiles_user_id_fkey           | f               | public | user_profiles    | FOREIGN KEY (user_id) REFERENCES users(id)
 users_email_key                      | u               | public | users            | UNIQUE (email)
 users_pkey                           | p               | public | users            | PRIMARY KEY (id)
