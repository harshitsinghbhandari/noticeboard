import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/http/auth_middleware';
import { GroupService } from '../services/group_service';

const router = Router();

// Create Group
router.post('/groups', authMiddleware, async (req, res) => {
    try {
        const group = await GroupService.createGroup(req.user!.id, req.body);
        res.json(group);
    } catch (e: any) {
        console.error('Create group error', e);
        if (e.message === 'Name and memberIds array are required') {
            res.status(400).json({ error: e.message });
        } else {
            res.status(500).json({ error: e.message || 'Internal server error' });
        }
    }
});

// Get User Groups
router.get('/groups', authMiddleware, async (req, res) => {
    try {
        const groups = await GroupService.listUserGroups(req.user!.id);
        res.json(groups);
    } catch (e: any) {
        console.error('Get groups error', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add Member
router.post('/groups/:groupId/members', authMiddleware, async (req, res) => {
    try {
        await GroupService.addMember(req.user!.id, req.params.groupId, req.body.userId);
        res.json({ success: true });
    } catch (e: any) {
        console.error('Add member error', e);
        res.status(400).json({ error: e.message });
    }
});

// Leave Group
router.patch('/groups/:groupId/leave', authMiddleware, async (req, res) => {
    try {
        await GroupService.leaveGroup(req.user!.id, req.params.groupId);
        res.json({ success: true });
    } catch (e: any) {
        console.error('Leave group error', e);
        res.status(400).json({ error: e.message });
    }
});

// Send Message
router.post('/groups/:groupId/messages', authMiddleware, async (req, res) => {
    try {
        const message = await GroupService.sendMessage(req.user!.id, req.params.groupId, req.body.content);
        res.json(message);
    } catch (e: any) {
        console.error('Send group message error', e);
        res.status(400).json({ error: e.message });
    }
});

// Get Messages
router.get('/groups/:groupId/messages', authMiddleware, async (req, res) => {
    try {
        const messages = await GroupService.listMessages(req.user!.id, req.params.groupId);
        res.json(messages);
    } catch (e: any) {
        console.error('Get group messages error', e);
        res.status(400).json({ error: e.message });
    }
});

// Mark Read
router.patch('/groups/:groupId/read', authMiddleware, async (req, res) => {
    try {
        const result = await GroupService.markAsRead(req.user!.id, req.params.groupId);
        res.json(result);
    } catch (e: any) {
        console.error('Mark read error', e);
        res.status(500).json({ error: e.message });
    }
});

// Unread Summary
router.get('/groups/unread-summary', authMiddleware, async (req, res) => {
    try {
        const summary = await GroupService.getUnreadSummary(req.user!.id);
        res.json(summary);
    } catch (e: any) {
        console.error('Unread summary error', e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
