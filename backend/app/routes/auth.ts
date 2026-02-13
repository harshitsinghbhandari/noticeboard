import { Router } from 'express';
import { AuthService } from '../services/auth_service';

const router = Router();

router.post('/register', async (req, res) => {
    try {
        const result = await AuthService.register(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        console.error('Registration error:', error);
        if (error.message === 'Missing required fields' || error.message === 'Password must be at least 8 characters') {
            res.status(400).json({ error: error.message });
        } else if (error.message === 'User with this email already exists') {
            res.status(409).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to register user. Please try again later.' });
        }
    }
});

export default router;
