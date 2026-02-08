CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status connection_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_not_self CHECK (requester_id <> receiver_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS connections_unique_pair 
ON connections (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id));
