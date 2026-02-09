import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { pool } from '../infrastructure/db/pool';
import { authMiddleware } from '../infrastructure/http/auth_middleware';
import { getUser } from '../infrastructure/db/user_repository';
import { getProfile, upsertProfile } from '../infrastructure/db/profile_repository';
import { createRequest, updateStatus, listIncoming, listOutgoing } from '../infrastructure/db/connection_repository';
import { createPost, listPosts, addComment, listComments, addReaction, removeReaction, getPost, listUserPosts, getAggregatedFeed } from '../infrastructure/db/post_repository';
import { createNotification, listNotifications, markAsRead } from '../infrastructure/db/notification_repository';
import { getConnection } from '../infrastructure/db/connection_repository';
import { createClub, listClubs, getClub, followClub, unfollowClub, listFollowedClubs, isFollowingClub, updateClub, deleteClub } from '../infrastructure/db/club_repository';
import { createOpening, listOpenings, getOpening, updateOpening, deleteOpening } from '../infrastructure/db/opening_repository';
import { sendMessage, listConversations, getChat, markMessagesAsRead } from '../infrastructure/db/message_repository';
import { requireRole } from '../infrastructure/http/auth_middleware';
import { body, validationResult } from 'express-validator';

const app = express();
const port = parseInt(process.env.PORT || '3000');

app.use(cors());
app.use(express.json());

// Public Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

import { createKeycloakUser } from '../infrastructure/keycloak/keycloak_service';
import { upsertUser } from '../infrastructure/db/user_repository';

app.post('/auth/register', async (req, res) => {
    const { email, firstName, lastName, password, headline } = req.body;

    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
        // 1. Create in Keycloak
        const keycloakUser = await createKeycloakUser({ email, firstName, lastName, password, headline });

        // 2. Create in Local DB
        // sync user table
        await upsertUser({
            id: keycloakUser.id,
            email: keycloakUser.email,
            first_name: keycloakUser.firstName,
            last_name: keycloakUser.lastName
        });

        // sync profile table (optional headline)
        if (headline) {
            await upsertProfile(keycloakUser.id, headline);
        }

        // 3. Return 201 with info
        res.status(201).json({
            id: keycloakUser.id,
            firstName: keycloakUser.firstName,
            lastName: keycloakUser.lastName,
            email: keycloakUser.email,
            headline: headline || null
        });

    } catch (error: any) {
        console.error('Registration error:', error);
        if (error.message === 'User with this email already exists') {
            res.status(409).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to register user. Please try again later.' });
        }
    }
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
    const { content, visibility, club_id } = req.body;

    if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Content is required' });
    }

    if (club_id) {
        if (!req.user.roles.includes('CLUB_CONVENER')) {
            return res.status(403).json({ error: 'Only club conveners can post as a club' });
        }
        const club = await getClub(club_id);
        if (!club || club.admin_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden: You are not authorized to post for this club' });
        }
    }

    const validVisibility = ['public', 'connections_only'];
    const postVisibility = (visibility && validVisibility.includes(visibility)) ? visibility : 'public';

    try {
        const post = await createPost(req.user.id, content, postVisibility, club_id);
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
        const feed = await getAggregatedFeed(req.user.id, limit, cursor);
        res.json(feed);
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

app.get('/posts/:id', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    try {
        const post = await getPost(id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (error) {
        console.error('Get post error', error);
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

// Club Routes
app.get('/clubs', authMiddleware, async (req, res) => {
    try {
        const clubs = await listClubs();
        res.json(clubs);
    } catch (error) {
        console.error('List clubs error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/clubs/followed', authMiddleware, async (req, res) => {
    try {
        const clubs = await listFollowedClubs(req.user!.id);
        res.json(clubs);
    } catch (error) {
        console.error('List followed clubs error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/clubs',
    authMiddleware,
    requireRole('CLUB_ADMIN'),
    body('name').notEmpty().withMessage('Name is required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
    const { name, description, website_url } = req.body;
    try {
        const club = await createClub(name, description, req.user!.id, website_url);
        res.status(201).json(club);
    } catch (error) {
        console.error('Create club error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/clubs/:id',
    authMiddleware,
    requireRole('CLUB_ADMIN'),
    body('name').notEmpty().withMessage('Name is required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, description, website_url } = req.body;
        try {
            const existingClub = await getClub(req.params.id);
            if (!existingClub) return res.status(404).json({ error: 'Club not found' });
            if (existingClub.admin_id !== req.user!.id) {
                return res.status(403).json({ error: 'Forbidden: You are not the admin of this club' });
            }

            const club = await updateClub(req.params.id, name, description, website_url);
            res.json(club);
        } catch (error) {
            console.error('Update club error', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

app.delete('/clubs/:id', authMiddleware, requireRole('CLUB_ADMIN'), async (req, res) => {
    try {
        const existingClub = await getClub(req.params.id);
        if (!existingClub) return res.status(404).json({ error: 'Club not found' });
        if (existingClub.admin_id !== req.user!.id) {
            return res.status(403).json({ error: 'Forbidden: You are not the admin of this club' });
        }

        await deleteClub(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Delete club error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/clubs/:id/posts', authMiddleware, async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const cursor = req.query.cursor as string;
    try {
        const posts = await listPosts(req.user!.id, limit, cursor, req.params.id);
        res.json(posts);
    } catch (error) {
        console.error('List club posts error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/clubs/:id', authMiddleware, async (req, res) => {
    try {
        const club = await getClub(req.params.id);
        if (!club) return res.status(404).json({ error: 'Club not found' });

        const isFollowing = await isFollowingClub(club.id, req.user!.id);
        res.json({ ...club, is_following: isFollowing });
    } catch (error) {
        console.error('Get club error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/clubs/:id/follow', authMiddleware, async (req, res) => {
    try {
        await followClub(req.params.id, req.user!.id);
        res.json({ status: 'followed' });
    } catch (error) {
        console.error('Follow club error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/clubs/:id/follow', authMiddleware, async (req, res) => {
    try {
        await unfollowClub(req.params.id, req.user!.id);
        res.json({ status: 'unfollowed' });
    } catch (error) {
        console.error('Unfollow club error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Opening Routes
app.get('/openings', authMiddleware, async (req, res) => {
    const { club_id, job_type, experience_level } = req.query;
    try {
        const openings = await listOpenings({
            club_id: club_id as string,
            job_type: job_type as string,
            experience_level: experience_level as string
        });
        res.json(openings);
    } catch (error) {
        console.error('List openings error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/openings',
    authMiddleware,
    requireRole('CLUB_CONVENER'),
    body('club_id').notEmpty(),
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('job_type').notEmpty(),
    body('experience_level').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
    const { club_id, title, description, location_city, location_country, job_type, experience_level } = req.body;
    try {
        const club = await getClub(club_id);
        if (!club || club.admin_id !== req.user!.id) {
            return res.status(403).json({ error: 'Forbidden: You are not authorized to create openings for this club' });
        }
        const opening = await createOpening({ club_id, title, description, location_city, location_country, job_type, experience_level });
        res.status(201).json(opening);
    } catch (error) {
        console.error('Create opening error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/openings/:id',
    authMiddleware,
    requireRole('CLUB_CONVENER'),
    async (req, res) => {
        try {
            const existingOpening = await getOpening(req.params.id);
            if (!existingOpening) return res.status(404).json({ error: 'Opening not found' });

            const club = await getClub(existingOpening.club_id);
            if (!club || club.admin_id !== req.user!.id) {
                return res.status(403).json({ error: 'Forbidden: You are not authorized to edit openings for this club' });
            }

            const opening = await updateOpening(req.params.id, req.body);
            res.json(opening);
        } catch (error) {
            console.error('Update opening error', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

app.delete('/openings/:id', authMiddleware, requireRole('CLUB_CONVENER'), async (req, res) => {
    try {
        const existingOpening = await getOpening(req.params.id);
        if (!existingOpening) return res.status(404).json({ error: 'Opening not found' });

        const club = await getClub(existingOpening.club_id);
        if (!club || club.admin_id !== req.user!.id) {
            return res.status(403).json({ error: 'Forbidden: You are not authorized to delete openings for this club' });
        }

        await deleteOpening(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Delete opening error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Message Routes
app.get('/messages', authMiddleware, async (req, res) => {
    try {
        const conversations = await listConversations(req.user!.id);
        res.json(conversations);
    } catch (error) {
        console.error('List conversations error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/messages/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params;
    try {
        const chat = await getChat(req.user!.id, userId);
        await markMessagesAsRead(req.user!.id, userId);
        res.json(chat);
    } catch (error) {
        console.error('Get chat error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/messages', authMiddleware, async (req, res) => {
    const { receiver_id, message_text, attachment_url } = req.body;
    if (!receiver_id || !message_text) {
        return res.status(400).json({ error: 'receiver_id and message_text are required' });
    }
    try {
        const message = await sendMessage(req.user!.id, receiver_id, message_text, attachment_url);
        res.status(201).json(message);
    } catch (error) {
        console.error('Send message error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

export default app;
