import { Router } from 'express';
import { authMiddleware, requireRole } from '../../infrastructure/http/auth_middleware';
import { listOpenings, getOpening, createOpening, updateOpening, deleteOpening } from '../../infrastructure/db/opening_repository';
import { getClub } from '../../infrastructure/db/club_repository';
import { body, validationResult } from 'express-validator';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
    const { club_id, job_type, experience_level } = req.query;
    try {
        const openings = await listOpenings({
            club_id: club_id as string,
            job_type: job_type as string,
            experience_level: experience_level as string
        });
        res.json(openings);
    } catch (error) {
        console.error('List openings error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/',
    authMiddleware,
    requireRole('CLUB_CONVENER'),
    body('club_id').notEmpty(),
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('job_type').notEmpty(),
    body('experience_level').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { club_id, title, description, location_city, location_country, job_type, experience_level } = req.body;
        try {
            const club = await getClub(club_id);
            if (!club || club.admin_id !== req.user!.id) {
                return res.status(403).json({ error: 'Forbidden: You are not authorized to create openings for this club' });
            }
            const opening = await createOpening({ club_id, title, description, location_city, location_country, job_type, experience_level });
            res.status(201).json(opening);
        } catch (error) {
            console.error('Create opening error', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

router.put('/:id',
    authMiddleware,
    requireRole('CLUB_CONVENER'),
    async (req, res) => {
        try {
            const existingOpening = await getOpening(req.params.id as string);
            if (!existingOpening) return res.status(404).json({ error: 'Opening not found' });

            const club = await getClub(existingOpening.club_id);
            if (!club || club.admin_id !== req.user!.id) {
                return res.status(403).json({ error: 'Forbidden: You are not authorized to edit openings for this club' });
            }

            const opening = await updateOpening(req.params.id as string, req.body);
            res.json(opening);
        } catch (error) {
            console.error('Update opening error', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

router.delete('/:id', authMiddleware, requireRole('CLUB_CONVENER'), async (req, res) => {
    try {
        const existingOpening = await getOpening(req.params.id as string);
        if (!existingOpening) return res.status(404).json({ error: 'Opening not found' });

        const club = await getClub(existingOpening.club_id);
        if (!club || club.admin_id !== req.user!.id) {
            return res.status(403).json({ error: 'Forbidden: You are not authorized to delete openings for this club' });
        }

        await deleteOpening(req.params.id as string);
        res.status(204).send();
    } catch (error) {
        console.error('Delete opening error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
