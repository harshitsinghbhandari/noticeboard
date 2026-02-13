import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/http/auth_middleware';
import { NotificationService } from '../services/notification_service';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const notifications = await NotificationService.listNotifications(req.user!.id);
        res.json(notifications);
    } catch (error) {
        console.error('List notifications error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/read', authMiddleware, async (req, res) => {
    try {
        await NotificationService.markAsRead(req.user!.id, req.params.id);
        res.json({ status: 'marked as read' });
    } catch (error) {
        console.error('Mark read error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
