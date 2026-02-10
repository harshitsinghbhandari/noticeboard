import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/http/auth_middleware';
import { listConversations, getChat, markMessagesAsRead, sendMessage } from '../../infrastructure/db/message_repository';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const conversations = await listConversations(req.user!.id);
        res.json(conversations);
    } catch (error) {
        console.error('List conversations error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:userId', authMiddleware, async (req, res) => {
    const userId = req.params.userId as string;
    try {
        const chat = await getChat(req.user!.id, userId);
        await markMessagesAsRead(req.user!.id, userId);
        res.json(chat);
    } catch (error) {
        console.error('Get chat error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', authMiddleware, async (req, res) => {
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

export default router;
