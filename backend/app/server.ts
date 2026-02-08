import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { pool } from '../infrastructure/db/pool';
import { authMiddleware } from '../infrastructure/http/auth_middleware';
import { getUser } from '../infrastructure/db/user_repository';
import { getProfile, upsertProfile } from '../infrastructure/db/profile_repository';
import { createRequest, updateStatus, listIncoming, listOutgoing } from '../infrastructure/db/connection_repository';
import { createPost, listPosts, addComment, listComments, addReaction, removeReaction, getPost, listUserPosts } from '../infrastructure/db/post_repository';
import { createNotification, listNotifications, markAsRead } from '../infrastructure/db/notification_repository';
import { getConnection } from '../infrastructure/db/connection_repository';

const app = express();
const port = parseInt(process.env.PORT || '3000');

app.use(cors());
app.use(express.json());

// Public Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Protected Routes
app.get('/me', authMiddleware, async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    try {
        const user = await getUser(req.user.id);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    } catch (error) {
        console.error('Failed to fetch user', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/me/profile', authMiddleware, async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const profile = await getProfile(req.user.id);
        res.json(profile || { about: null });
    } catch (error) {
        console.error('Failed to fetch profile', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/me/profile', authMiddleware, async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { about } = req.body;

    if (typeof about !== 'string') {
        res.status(400).json({ error: 'About must be a string' });
        return;
    }

    try {
        await upsertProfile(req.user.id, about);
        const updatedProfile = await getProfile(req.user.id);
        res.json(updatedProfile);
    } catch (error) {
        console.error('Failed to update profile', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Connection Routes
app.post('/connections/request', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { receiver_id } = req.body;

    if (!receiver_id || typeof receiver_id !== 'string') {
        return res.status(400).json({ error: 'receiver_id is required' });
    }

    if (receiver_id === req.user.id) {
        return res.status(400).json({ error: 'Cannot request connection with self' });
    }

    try {
        const id = await createRequest(req.user.id, receiver_id);
        res.status(201).json({ id, status: 'pending' });
    } catch (error: any) {
        console.error('Create request error', error);
        if (error.message.includes('already exists')) {
            res.status(409).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});



app.post('/connections/:id/reject', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    if (typeof id !== 'string') {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
    }

    try {
        await updateStatus(id, req.user.id, 'rejected');
        res.json({ status: 'rejected' });
    } catch (error: any) {
        console.error('Reject error', error);
        res.status(400).json({ error: error.message });
    }
});

app.get('/connections/incoming', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const connections = await listIncoming(req.user.id);
        res.json(connections);
    } catch (error) {
        console.error('List incoming error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/connections/outgoing', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const connections = await listOutgoing(req.user.id);
        res.json(connections);
    } catch (error) {
        console.error('List outgoing error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Post Routes
app.post('/posts', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { content, visibility } = req.body;

    if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Content is required' });
    }

    const validVisibility = ['public', 'connections_only'];
    const postVisibility = (visibility && validVisibility.includes(visibility)) ? visibility : 'public';

    try {
        const post = await createPost(req.user.id, content, postVisibility);
        res.status(201).json(post);
    } catch (error) {
        console.error('Create post error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/posts', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const cursor = req.query.cursor as string;

    try {
        const posts = await listPosts(req.user.id, limit, cursor);
        res.json(posts);
    } catch (error) {
        console.error('List posts error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/users/:id/posts', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    // Minimal polish: allow users to list their own posts for profile.
    if (id !== req.user.id) {
        return res.status(403).json({ error: 'Viewing other profiles not fully implemented yet' });
    }

    try {
        const posts = await listUserPosts(id);
        res.json(posts);
    } catch (error) {
        console.error('List user posts error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.post('/posts/:id/comments', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { content } = req.body;

    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        const comment = await addComment(id, req.user.id, content);

        // Notify post author
        const post = await getPost(id);
        if (post && post.author_id !== req.user.id) {
            await createNotification(post.author_id, 'comment', req.user.id, id);
        }

        res.status(201).json(comment);
    } catch (error) {
        console.error('Add comment error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/posts/:id/comments', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    try {
        const comments = await listComments(id);
        res.json(comments);
    } catch (error) {
        console.error('List comments error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/posts/:id/like', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    try {
        await addReaction(id, req.user.id);

        // Notify post author
        const post = await getPost(id);
        if (post && post.author_id !== req.user.id) {
            await createNotification(post.author_id, 'like', req.user.id, id);
        }

        res.json({ status: 'liked' });
    } catch (error) {
        console.error('Like error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/posts/:id/like', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    try {
        await removeReaction(id, req.user.id);
        res.json({ status: 'unliked' });
    } catch (error) {
        console.error('Unlike error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/notifications', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const notifications = await listNotifications(req.user.id);
        res.json(notifications);
    } catch (error) {
        console.error('List notifications error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/notifications/:id/read', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID' });
    }
    try {
        await markAsRead(id, req.user.id);
        res.json({ status: 'marked as read' });
    } catch (error) {
        console.error('Mark read error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/connections/:id/accept', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    try {
        const connection = await getConnection(id);
        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }

        await updateStatus(id, req.user.id, 'accepted');

        // Notify requester
        await createNotification(connection.requester_id, 'connection', req.user.id);

        res.json({ status: 'accepted' });
    } catch (error: any) {
        console.error('Accept error', error);
        res.status(400).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
