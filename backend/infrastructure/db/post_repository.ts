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
}

export async function createPost(authorId: string, content: string, visibility: 'public' | 'connections_only' = 'public'): Promise<Post> {
  const query = `
    INSERT INTO posts (author_id, content, visibility)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const result = await pool.query(query, [authorId, content, visibility]);
  const post = result.rows[0];

  // We need to fetch the author details for the newly created post to match the interface
  // or we can make them optional. For now, let's fetch them.
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
  // This is tricky because we need the current user ID to know if they liked it.
  // For now, let's just return count. But wait, feed needs to show if I liked it.
  // Let's modify listPosts to include this info instead of a separate call for list.
  // But for a single post view or updates, we might need this.
  // Actually, let's just support listing posts with reaction info in the main query.
  return { count: 0, user_has_liked: false, user_id: '' }; // Placeholder if needed
}

export async function listPosts(userId: string, limit: number = 20, cursor?: string): Promise<any[]> {
  let query = `
      SELECT p.*, 
             u.first_name as author_first_name, 
             u.last_name as author_last_name,
             u.headline as author_headline,
             (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.type = 'like') as likes_count,
             (SELECT COUNT(*) > 0 FROM reactions r WHERE r.post_id = p.id AND r.user_id = $1 AND r.type = 'like') as has_liked,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE (
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
      )
    `;
  const values: any[] = [userId, limit];

  if (cursor) {
    query += ' AND p.created_at < $3';
    values.push(cursor);
  }

  query += ' ORDER BY p.created_at DESC LIMIT $2';

  const result = await pool.query(query, values);
  return result.rows;
}

export async function listUserPosts(userId: string): Promise<any[]> {
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
