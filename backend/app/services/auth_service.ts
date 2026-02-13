import { createKeycloakUser } from '../../infrastructure/keycloak/keycloak_service';
import { upsertUser } from '../../infrastructure/db/user_repository';
import { upsertProfile } from '../../infrastructure/db/profile_repository';

export class AuthService {
    static async register(userData: any) {
        const { email, firstName, lastName, password, headline } = userData;

        if (!email || !password || !firstName || !lastName) {
            throw new Error('Missing required fields');
        }

        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }

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

        return {
            id: keycloakUser.id,
            firstName: keycloakUser.firstName,
            lastName: keycloakUser.lastName,
            email: keycloakUser.email,
            headline: headline || null
        };
    }
}
