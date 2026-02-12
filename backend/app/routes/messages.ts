import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/http/auth_middleware';
import { listConversations, getChat, markMessagesAsRead, sendMessage } from '../../infrastructure/db/message_repository';
import { io } from '../server';

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
        const readMessageIds = await markMessagesAsRead(req.user!.id, userId);

        readMessageIds.forEach(messageId => {
            io.to(`user:${userId}`).emit("message:read", {
                messageId,
                readerId: req.user!.id
            });
        });

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

        io.to(`user:${receiver_id}`).emit("message:new", message);

        res.status(201).json(message);
    } catch (error: any) {
        console.error('Send message error', error);
        if (error.message.includes('blocking')) {
            res.status(403).json({ error: error.message });
        } else if (error.message.includes('accepted connection')) {
            res.status(403).json({ error: error.message });
        } else if (error.message.includes('Rate limit')) {
            res.status(429).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

export default router;
