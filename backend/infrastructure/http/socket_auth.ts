import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

const client = jwksRsa({
    jwksUri: process.env.KEYCLOAK_JWKS_URI || '',
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

export interface SocketUser {
    id: string;
    roles: string[];
}

declare module 'socket.io' {
    interface Socket {
        user?: SocketUser;
    }
}

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Authentication error: Token missing'));
    }

    jwt.verify(
        token,
        getKey,
        {
            audience: 'account',
            issuer: process.env.KEYCLOAK_ISSUER,
            algorithms: ['RS256'],
        },
        (err, decoded) => {
            if (err) {
                console.error('Socket token verification failed:', err);
                return next(new Error('Authentication error: Invalid token'));
            }

            const payload = decoded as any;
            if (!payload.sub) {
                return next(new Error('Authentication error: Missing sub claim'));
            }

            socket.user = {
                id: payload.sub,
                roles: payload.realm_access?.roles || []
            };
            next();
        }
    );
}
