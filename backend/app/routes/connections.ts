import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/http/auth_middleware';
import { ConnectionService } from '../services/connection_service';

const router = Router();

router.post('/request', authMiddleware, async (req, res) => {
    try {
        const result = await ConnectionService.requestConnection(req.user!.id, req.body.receiver_id);
        res.status(201).json(result);
    } catch (error: any) {
        console.error('Create request error', error);
        if (error.message.includes('already exists')) {
            res.status(409).json({ error: error.message });
        } else if (error.message.includes('blocking')) {
            res.status(403).json({ error: error.message });
        } else if (error.message.includes('Rate limit')) {
            res.status(429).json({ error: error.message });
        } else if (error.message === 'receiver_id is required' || error.message === 'Cannot request connection with self') {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.post('/:id/accept', authMiddleware, async (req, res) => {
    try {
        const result = await ConnectionService.acceptConnection(req.user!.id, req.params.id);
        res.json(result);
    } catch (error: any) {
        console.error('Accept error', error);
        if (error.message === 'Connection not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(400).json({ error: error.message });
        }
    }
});

router.post('/:id/reject', authMiddleware, async (req, res) => {
    try {
        const result = await ConnectionService.rejectConnection(req.user!.id, req.params.id);
        res.json(result);
    } catch (error: any) {
        console.error('Reject error', error);
        res.status(400).json({ error: error.message });
    }
});

router.get('/incoming', authMiddleware, async (req, res) => {
    try {
        const connections = await ConnectionService.listIncoming(req.user!.id);
        res.json(connections);
    } catch (error) {
        console.error('List incoming error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/outgoing', authMiddleware, async (req, res) => {
    try {
        const connections = await ConnectionService.listOutgoing(req.user!.id);
        res.json(connections);
    } catch (error) {
        console.error('List outgoing error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        const connections = await ConnectionService.listConnections(req.user!.id);
        res.json(connections);
    } catch (error) {
        console.error('List connections error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
