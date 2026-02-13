import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/http/auth_middleware';
import { OpeningService } from '../services/opening_service';
import { body, validationResult } from 'express-validator';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const openings = await OpeningService.listOpenings(req.query);
        res.json(openings);
    } catch (error) {
        console.error('List openings error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/',
    authMiddleware,
    body('body_id').notEmpty(),
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('job_type').notEmpty(),
    body('experience_level').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const opening = await OpeningService.createOpening(req.user!.id, req.body);
            res.status(201).json(opening);
        } catch (error: any) {
            console.error('Create opening error', error);
            if (error.message.startsWith('Forbidden')) {
                res.status(403).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    });

router.put('/:id',
    authMiddleware,
    async (req, res) => {
        try {
            const opening = await OpeningService.updateOpening(req.user!.id, req.params.id, req.body);
            res.json(opening);
        } catch (error: any) {
            console.error('Update opening error', error);
            if (error.message === 'Opening not found') {
                res.status(404).json({ error: error.message });
            } else if (error.message.startsWith('Forbidden')) {
                res.status(403).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
);

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await OpeningService.deleteOpening(req.user!.id, req.params.id);
        res.status(204).send();
    } catch (error: any) {
        console.error('Delete opening error', error);
        if (error.message === 'Opening not found') {
            res.status(404).json({ error: error.message });
        } else if (error.message.startsWith('Forbidden')) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

export default router;
