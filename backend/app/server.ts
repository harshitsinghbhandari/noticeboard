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

io.on('connection', (socket) => {
    if (socket.user) {
        socket.join(`user:${socket.user.id}`);
        console.log(`User connected and joined room: user:${socket.user.id}`);
    }
});

if (process.env.NODE_ENV !== 'test') {
    server.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

export default app;
