import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { socketAuthMiddleware } from '../infrastructure/http/socket_auth';

const port = parseInt(process.env.PORT || '3000');
const server = http.createServer(app);

export const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PATCH']
    }
});

io.use(socketAuthMiddleware);

io.on('connection', async (socket) => {
    if (socket.user) {
        const userId = socket.user.id;
        socket.join(`user:${userId}`);
        console.log(`User connected and joined room: user:${userId}`);

        // Join all active group rooms
        try {
            // We need to import pool here or in a better way, but direct query is fine for this specialized logic
            // avoiding circular dependency with group_repository if it imports io (it does not, but routes do)
            // Let's use a fresh pool instance or import the existing one
            const { pool } = await import('../infrastructure/db/pool');
            const res = await pool.query(
                "SELECT group_id FROM group_members WHERE user_id = $1 AND status = 'active'",
                [userId]
            );

            res.rows.forEach(row => {
                socket.join(`group:${row.group_id}`);
                console.log(`User ${userId} joined room: group:${row.group_id}`);
            });
        } catch (e) {
            console.error(`Failed to join group rooms for user ${userId}`, e);
        }
    }
});

if (process.env.NODE_ENV !== 'test') {
    server.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

export default app;
