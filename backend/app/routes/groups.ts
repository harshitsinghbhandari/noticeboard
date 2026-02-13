import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/http/auth_middleware';
import {
    createGroup,
    addGroupMember,
    leaveGroup,
    saveGroupMessage,
    markGroupRead,
    getUserGroups,
    getGroupMessages,
    getGroupUnreadSummary
} from '../../infrastructure/db/group_repository';
import { io } from '../server';

const router = Router();

// Create Group
router.post('/groups', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, description, memberIds } = req.body;

    if (!name || !Array.isArray(memberIds)) {
        return res.status(400).json({ error: 'Name and memberIds array are required' });
    }

    try {
        const group = await createGroup({
            name,
            description: description || '',
            creatorId: req.user.id,
            memberIds
        });

        // Notify members about new group
        // We need to fetch the full member list or just iterate memberIds + creator
        const allMembers = [...new Set([...memberIds, req.user.id])];
        allMembers.forEach(uid => {
            io.to(`user:${uid}`).emit('group:created', group);
            // Also make them join the room if online
            // But we can't force socket join from here easily without tracking socket-user mapping better
            // The client should rejoin or we can leverage the user room to send a "please join" signal
            // Or better: Re-fetch groups on client side which joins rooms?
            // Actually, simplest is: client listens to 'group:created', then emits 'join:group'?
            // Constraint says: "Do NOT trust client to specify group ids... socket room join... On socket connection: Query all group_ids"
            // So real-time joining might require the user to reconnect or we iterate connected sockets.
            // For now, let's just emit the notification. Real-time message delivery relies on them being in the room.
            // If we want immediate message delivery in this new group, we need them to join.
            // Solution: Emit event "group:added", client responds by refreshing or reconnecting socket?
            // Or iterate io.sockets and check user.id?
            // Let's iterate sockets for correctness if possible, or leave it for "On reconnect" as per "On socket connection... Query all group_ids"
        });

        // Let's try to update connected sockets for these users to join the new room effectively
        const sockets = await io.fetchSockets();
        for (const socket of sockets) {
            // @ts-ignore
            if (socket.user && allMembers.includes(socket.user.id)) {
                socket.join(`group:${group.id}`);
            }
        }

        res.json(group);
    } catch (e: any) {
        console.error('Create group error', e);
        res.status(500).json({ error: e.message || 'Internal server error' });
    }
});

// Get User Groups
router.get('/groups', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const groups = await getUserGroups(req.user.id);
        res.json(groups);
    } catch (e: any) {
        console.error('Get groups error', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add Member
router.post('/groups/:groupId/members', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const groupId = req.params.groupId as string;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId is required' });

    try {
        await addGroupMember(groupId, userId, req.user.id);

        // Notify group and user
        io.to(`group:${groupId}`).emit('group:member:added', { groupId, userId, addedBy: req.user.id });
        io.to(`user:${userId}`).emit('group:added', { groupId });

        // Force join socket for the new user
        const sockets = await io.fetchSockets();
        for (const socket of sockets) {
            // @ts-ignore
            if (socket.user && socket.user.id === userId) {
                socket.join(`group:${groupId}`);
            }
        }

        res.json({ success: true });
    } catch (e: any) {
        console.error('Add member error', e);
        res.status(400).json({ error: e.message });
    }
});

// Leave Group
router.patch('/groups/:groupId/leave', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { groupId } = req.params;

    try {
        await leaveGroup(groupId, req.user.id);

        io.to(`group:${groupId}`).emit('group:member:left', { groupId, userId: req.user.id });

        // Leave socket room
        const sockets = await io.fetchSockets();
        for (const socket of sockets) {
            // @ts-ignore
            if (socket.user && socket.user.id === req.user.id) {
                socket.leave(`group:${groupId}`);
            }
        }

        res.json({ success: true });
    } catch (e: any) {
        console.error('Leave group error', e);
        res.status(400).json({ error: e.message });
    }
});

// Send Message
router.post('/groups/:groupId/messages', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const groupId = req.params.groupId as string;
    const { content } = req.body;

    if (!content) return res.status(400).json({ error: 'Content is required' });

    try {
        const message = await saveGroupMessage(groupId, req.user.id, content);

        io.to(`group:${groupId}`).emit('group:message:new', message);

        res.json(message);
    } catch (e: any) {
        console.error('Send group message error', e);
        res.status(400).json({ error: e.message });
    }
});

// Get Messages
router.get('/groups/:groupId/messages', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const groupId = req.params.groupId as string;

    try {
        const messages = await getGroupMessages(groupId, req.user.id);
        res.json(messages);
    } catch (e: any) {
        console.error('Get group messages error', e);
        res.status(400).json({ error: e.message });
    }
});

// Mark Read
router.patch('/groups/:groupId/read', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const groupId = req.params.groupId as string;

    try {
        const count = await markGroupRead(groupId, req.user.id);

        // Emit summary event only
        io.to(`group:${groupId}`).emit("group:read", {
            userId: req.user.id,
            groupId
        });

        res.json({ readCount: count });
    } catch (e: any) {
        console.error('Mark read error', e);
        res.status(500).json({ error: e.message });
    }
});

// Unread Summary
router.get('/groups/unread-summary', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const summary = await getGroupUnreadSummary(req.user.id);
        res.json(summary);
    } catch (e: any) {
        console.error('Unread summary error', e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
