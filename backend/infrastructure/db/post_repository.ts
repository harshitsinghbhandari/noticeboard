import { pool } from './pool';

export interface Post {
  id: string;
  author_id: string;
  content: string;
  visibility: 'public' | 'connections_only';
  created_at: Date;
  updated_at: Date;
  author_first_name: string;
  author_last_name: string;
  author_headline?: string;
  body_id?: string;
  body_name?: string;
}

export async function createPost(authorId: string, content: string, visibility: 'public' | 'connections_only' = 'public', bodyId?: string): Promise<Post> {
  const query = `
    INSERT INTO posts (author_id, content, visibility, body_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const result = await pool.query(query, [authorId, content, visibility, bodyId || null]);
  const post = result.rows[0];

  const userQuery = 'SELECT first_name, last_name, headline FROM users WHERE id = $1';
  const userResult = await pool.query(userQuery, [authorId]);
  const user = userResult.rows[0];

  return {
    ...post,
    author_first_name: user.first_name,
    author_last_name: user.last_name,
    author_headline: user.headline
  } as Post;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  author_first_name: string;
  author_last_name: string;
}

export async function addComment(postId: string, authorId: string, content: string): Promise<Comment> {
  const query = `
    INSERT INTO comments (post_id, author_id, content)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const result = await pool.query(query, [postId, authorId, content]);
  const comment = result.rows[0];

  const userQuery = 'SELECT first_name, last_name FROM users WHERE id = $1';
  const userResult = await pool.query(userQuery, [authorId]);
  const user = userResult.rows[0];

  return {
    ...comment,
    author_first_name: user.first_name,
    author_last_name: user.last_name
  } as Comment;
}

export async function listComments(postId: string): Promise<Comment[]> {
  const query = `
    SELECT c.*, u.first_name as author_first_name, u.last_name as author_last_name
    FROM comments c
    JOIN users u ON c.author_id = u.id
    WHERE c.post_id = $1
    ORDER BY c.created_at ASC
  `;
  const result = await pool.query(query, [postId]);
  return result.rows as Comment[];
}

export async function addReaction(postId: string, userId: string): Promise<void> {
  const query = `
    INSERT INTO reactions (post_id, user_id, type)
    VALUES ($1, $2, 'like')
    ON CONFLICT (post_id, user_id, type) DO NOTHING;
  `;
  await pool.query(query, [postId, userId]);
}

export async function removeReaction(postId: string, userId: string): Promise<void> {
  const query = `
    DELETE FROM reactions
    WHERE post_id = $1 AND user_id = $2 AND type = 'like';
  `;
  await pool.query(query, [postId, userId]);
}

export async function getPostReactions(postId: string): Promise<{ count: number, user_has_liked: boolean, user_id: string }> {
  return { count: 0, user_has_liked: false, user_id: '' };
}

export interface FeedItem {
  id: string;
  content: string;
  created_at: Date;
  type: 'post' | 'opening';
  author_first_name: string | null;
  author_last_name: string | null;
  author_headline: string | null;
  body_name: string | null;
  likes_count: number;
  has_liked: boolean;
  comments_count: number;
  title: string | null;
  job_type: string | null;
  experience_level: string | null;
  location_city: string | null;
  location_country: string | null;
}

export async function listPosts(userId: string, limit: number = 20, cursor?: string, bodyId?: string): Promise<Post[]> {
  let query = `
      SELECT p.*, 
             u.first_name as author_first_name, 
             u.last_name as author_last_name,
             u.headline as author_headline,
             b.name as body_name,
             (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.type = 'like') as likes_count,
             (SELECT COUNT(*) > 0 FROM reactions r WHERE r.post_id = p.id AND r.user_id = $1 AND r.type = 'like') as has_liked,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
      FROM posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN bodies b ON p.body_id = b.id
      WHERE 1=1
    `;
  const values: any[] = [userId, limit];

  if (bodyId) {
    query += ' AND p.body_id = $3';
    values.push(bodyId);
  } else {
    query += ` AND (
        p.visibility = 'public' 
        OR p.author_id = $1
        OR EXISTS (
            SELECT 1 FROM connections c 
            WHERE c.status = 'accepted' 
            AND (
                (c.requester_id = $1 AND c.receiver_id = p.author_id) 
                OR 
                (c.receiver_id = $1 AND c.requester_id = p.author_id)
            )
        )
        OR EXISTS (
            SELECT 1 FROM body_followers bf
            WHERE bf.user_id = $1 AND bf.body_id = p.body_id
        )
      )`;
  }

  if (cursor) {
    const cursorIdx = values.length + 1;
    query += ` AND p.created_at < $${cursorIdx}`;
    values.push(cursor);
  }

  query += ' ORDER BY p.created_at DESC LIMIT $2';

  const result = await pool.query(query, values);
  return result.rows;
}

export async function listUserPosts(userId: string): Promise<Post[]> {
  const query = `
      SELECT p.*, 
             u.first_name as author_first_name, 
             u.last_name as author_last_name,
             u.headline as author_headline,
             (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.type = 'like') as likes_count,
             (SELECT COUNT(*) > 0 FROM reactions r WHERE r.post_id = p.id AND r.user_id = $1 AND r.type = 'like') as has_liked,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.author_id = $1
      ORDER BY p.created_at DESC
    `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

export async function getPost(postId: string): Promise<Post | null> {
  const query = 'SELECT * FROM posts WHERE id = $1';
  const result = await pool.query(query, [postId]);
  return result.rows[0] as Post || null;
}

export async function getAggregatedFeed(userId: string, limit: number = 20, cursor?: string): Promise<FeedItem[]> {
  const postsPart = `
      SELECT p.id, p.content, p.created_at, 'post' as type,
             u.first_name as author_first_name,
             u.last_name as author_last_name,
             u.headline as author_headline,
             b.name as body_name,
             (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.type = 'like') as likes_count,
             (SELECT COUNT(*) > 0 FROM reactions r WHERE r.post_id = p.id AND r.user_id = $1 AND r.type = 'like') as has_liked,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
             null as title, null as job_type, null as experience_level, null as location_city, null as location_country
      FROM posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN bodies b ON p.body_id = b.id
      WHERE (
        p.visibility = 'public'
        OR p.author_id = $1
        OR EXISTS (
            SELECT 1 FROM connections conn
            WHERE conn.status = 'accepted'
            AND (
                (conn.requester_id = $1 AND conn.receiver_id = p.author_id)
                OR
                (conn.receiver_id = $1 AND conn.requester_id = p.author_id)
            )
        )
        OR EXISTS (
            SELECT 1 FROM body_followers bf
            WHERE bf.user_id = $1 AND bf.body_id = p.body_id
        )
      )
    `;

  const openingsPart = `
      SELECT o.id, o.description as content, o.created_at, 'opening' as type,
             null as author_first_name, null as author_last_name, null as author_headline,
             b.name as body_name,
             0 as likes_count, false as has_liked, 0 as comments_count,
             o.title, o.job_type, o.experience_level, o.location_city, o.location_country
      FROM openings o
      JOIN bodies b ON o.body_id = b.id
    `;

  let combinedQuery = `
        SELECT * FROM (
            (${postsPart})
            UNION ALL
            (${openingsPart})
        ) combined
    `;

  const values: any[] = [userId, limit];
  if (cursor) {
    combinedQuery += ' WHERE created_at < $3';
    values.push(cursor);
  }

  combinedQuery += ' ORDER BY created_at DESC LIMIT $2';

  const result = await pool.query(combinedQuery, values);
  return result.rows;
}
