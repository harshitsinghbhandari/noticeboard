import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/http/auth_middleware';
import { EventService } from '../services/event_service';

const router = Router();

// Create Event
router.post('/', authMiddleware, async (req, res) => {
    try {
        const event = await EventService.createEvent(req.user!.id, req.body);
        res.status(201).json(event);
    } catch (e: any) {
        console.error('Create event error', e);
        res.status(e.message.startsWith('Forbidden') ? 403 : 400).json({ error: e.message });
    }
});

// Publish Event
router.patch('/:id/publish', authMiddleware, async (req, res) => {
    try {
        await EventService.publishEvent(req.user!.id, req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        console.error('Publish event error', e);
        res.status(e.message.startsWith('Forbidden') ? 403 : 400).json({ error: e.message });
    }
});

// Edit Event
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const event = await EventService.updateEvent(req.user!.id, req.params.id, req.body);
        res.json(event);
    } catch (e: any) {
        console.error('Update event error', e);
        res.status(e.message.startsWith('Forbidden') ? 403 : 400).json({ error: e.message });
    }
});

// Join Event
router.post('/:id/join', authMiddleware, async (req, res) => {
    try {
        await EventService.joinEvent(req.user!.id, req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        console.error('Join event error', e);
        res.status(400).json({ error: e.message });
    }
});

// Leave Event
router.patch('/:id/leave', authMiddleware, async (req, res) => {
    try {
        await EventService.leaveEvent(req.user!.id, req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        console.error('Leave event error', e);
        res.status(400).json({ error: e.message });
    }
});

// Cancel Event
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
    try {
        await EventService.cancelEvent(req.user!.id, req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        console.error('Cancel event error', e);
        res.status(e.message.startsWith('Forbidden') ? 403 : 400).json({ error: e.message });
    }
});

// Discover Events
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
        // Helper to safely parse float from query param
        const parseQueryParam = (param: string | string[] | undefined, defaultVal: number): number => {
            if (!param) return defaultVal;
            const strVal = Array.isArray(param) ? param[0] : param;
            return parseFloat(strVal);
        }

        const userLat = parseQueryParam(lat as string | string[] | undefined, 19.1240);
        const userLng = parseQueryParam(lng as string | string[] | undefined, 72.9112);
        const searchRadius = parseQueryParam(radius as string | string[] | undefined, 50000);

        const events = await EventService.listEvents(
            userLat,
            userLng,
            searchRadius
        );
        res.json(events);
    } catch (e: any) {
        console.error('List events error', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Event by ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const event = await EventService.getEvent(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.json(event);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Get Event by Group ID
router.get('/group/:groupId', authMiddleware, async (req, res) => {
    try {
        const event = await EventService.getEventByGroupId(req.params.groupId);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.json(event);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Add Event Admin
router.post('/:id/admins', authMiddleware, async (req, res) => {
    try {
        await EventService.addEventAdmin(req.user!.id, req.params.id, req.body.userId);
        res.json({ success: true });
    } catch (e: any) {
        console.error('Add event admin error', e);
        res.status(e.message.startsWith('Forbidden') ? 403 : 400).json({ error: e.message });
    }
});

// Add Event Organizer
router.post('/:id/organizers', authMiddleware, async (req, res) => {
    try {
        await EventService.addEventOrganizer(req.user!.id, req.params.id, req.body.userId);
        res.json({ success: true });
    } catch (e: any) {
        console.error('Add event organizer error', e);
        res.status(e.message.startsWith('Forbidden') ? 403 : 400).json({ error: e.message });
    }
});

export default router;
