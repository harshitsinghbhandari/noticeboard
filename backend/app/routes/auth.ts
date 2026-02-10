import { Router } from 'express';
import { createKeycloakUser } from '../../infrastructure/keycloak/keycloak_service';
import { upsertUser } from '../../infrastructure/db/user_repository';
import { upsertProfile } from '../../infrastructure/db/profile_repository';

const router = Router();

router.post('/register', async (req, res) => {
    const { email, firstName, lastName, password, headline } = req.body;

    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
        // 1. Create in Keycloak
        const keycloakUser = await createKeycloakUser({ email, firstName, lastName, password, headline });

        // 2. Create in Local DB
        // sync user table
        await upsertUser({
            id: keycloakUser.id,
            email: keycloakUser.email,
            first_name: keycloakUser.firstName,
            last_name: keycloakUser.lastName,
            roles: []
        });

        // sync profile table (optional headline)
        if (headline) {
            await upsertProfile(keycloakUser.id, headline);
        }

        // 3. Return 201 with info
        res.status(201).json({
            id: keycloakUser.id,
            firstName: keycloakUser.firstName,
            lastName: keycloakUser.lastName,
            email: keycloakUser.email,
            headline: headline || null
        });

    } catch (error: any) {
        console.error('Registration error:', error);
        if (error.message === 'User with this email already exists') {
            res.status(409).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to register user. Please try again later.' });
        }
    }
});

export default router;
