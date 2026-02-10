import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { upsertUser, EmailConflictError } from '../db/user_repository';

if (!process.env.KEYCLOAK_JWKS_URI) {
    throw new Error('KEYCLOAK_JWKS_URI not set');
}


const client = jwksRsa({
    jwksUri: process.env.KEYCLOAK_JWKS_URI,
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            callback(err);
            return;
        }
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
    });
}

export interface AuthUser {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    roles: string[];
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export function requireRole(role: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!req.user.roles.includes(role)) {
            res.status(403).json({ error: `Forbidden: Requires role ${role}` });
            return;
        }
        next();
    };
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid token' });
        return;
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(
        token,
        getKey,
        {
            audience: 'account',
            issuer: process.env.KEYCLOAK_ISSUER,
            algorithms: ['RS256'],
        },
        async (err, decoded) => {
            if (err) {
                console.error('Token verification failed:', err);
                res.status(401).json({ error: 'Invalid token' });
                return;
            }

            if (!decoded || typeof decoded !== 'object') {
                res.status(401).json({ error: 'Invalid token payload' });
                return;
            }

            const payload = decoded as any;

            if (!payload.sub || !payload.email || !payload.given_name || !payload.family_name) {
                console.error('Missing claims:', { sub: !!payload.sub, email: !!payload.email, given: !!payload.given_name, family: !!payload.family_name });
                res.status(403).json({ error: 'Token missing required claims' });
                return;
            }

            const roles = payload.realm_access?.roles || [];
            const user: AuthUser = {
                id: payload.sub,
                email: payload.email,
                first_name: payload.given_name,
                last_name: payload.family_name,
                roles,
            };



            try {
                await upsertUser(user);
                req.user = user;
                next();
            } catch (dbError) {
                if (dbError instanceof EmailConflictError) {
                    console.warn('Email conflict detected:', dbError.message);
                    res.status(409).json({ error: 'Email already associated with another account' });
                    return;
                }
                console.error('Database error during auth upsert:', dbError);
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    );
}
