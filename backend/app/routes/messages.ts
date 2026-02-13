import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/http/auth_middleware';
import { MessageService } from '../services/message_service';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const conversations = await MessageService.listConversations(req.user!.id);
        res.json(conversations);
    } catch (error) {
        console.error('List conversations error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/unread-summary', authMiddleware, async (req, res) => {
    try {
        const summary = await MessageService.getUnreadSummary(req.user!.id);
        res.json(summary);
    } catch (error) {
        console.error('Get unread summary error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:userId', authMiddleware, async (req, res) => {
    try {
        const chat = await MessageService.getChat(req.user!.id, req.params.userId);
        res.json(chat);
    } catch (error) {
        console.error('Get chat error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const message = await MessageService.sendMessage(req.user!.id, req.body);
        res.status(201).json(message);
    } catch (error: any) {
        console.error('Send message error', error);
        if (error.message === 'receiver_id and message_text are required') {
            res.status(400).json({ error: error.message });
        } else if (error.message.includes('blocking') || error.message.includes('accepted connection')) {
            res.status(403).json({ error: error.message });
        } else if (error.message.includes('Rate limit')) {
            res.status(429).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

export default router;
