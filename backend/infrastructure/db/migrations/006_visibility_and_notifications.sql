ALTER TABLE posts
ADD COLUMN IF NOT EXISTS visibility TEXT CHECK (visibility IN ('public', 'connections_only')) DEFAULT 'public';

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('like', 'comment', 'connection')),
  actor_id UUID REFERENCES users(id),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);
