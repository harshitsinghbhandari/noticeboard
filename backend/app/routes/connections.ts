import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/http/auth_middleware';
import { createRequest, updateStatus, listIncoming, listOutgoing, listConnections, getConnection } from '../../infrastructure/db/connection_repository';
import { createNotification } from '../../infrastructure/db/notification_repository';

const router = Router();

router.post('/request', authMiddleware, async (req, res) => {
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
        } else if (error.message.includes('blocking')) {
            res.status(403).json({ error: error.message });
        } else if (error.message.includes('Rate limit')) {
            res.status(429).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.post('/:id/reject', authMiddleware, async (req, res) => {
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

router.get('/incoming', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const connections = await listIncoming(req.user.id);
        res.json(connections);
    } catch (error) {
        console.error('List incoming error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/outgoing', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const connections = await listOutgoing(req.user.id);
        res.json(connections);
    } catch (error) {
        console.error('List outgoing error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const connections = await listConnections(req.user.id);
        res.json(connections);
    } catch (error) {
        console.error('List connections error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/accept', authMiddleware, async (req, res) => {
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

export default router;
