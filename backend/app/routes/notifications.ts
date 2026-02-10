import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/http/auth_middleware';
import { listNotifications, markAsRead } from '../../infrastructure/db/notification_repository';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const notifications = await listNotifications(req.user.id);
        res.json(notifications);
    } catch (error) {
        console.error('List notifications error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/read', authMiddleware, async (req, res) => {
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

export default router;
