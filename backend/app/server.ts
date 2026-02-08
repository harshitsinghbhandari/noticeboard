import express, { Request, Response } from 'express';
import cors from 'cors';
import { pool } from '../infrastructure/db/pool';
import { authMiddleware } from '../infrastructure/http/auth_middleware';

const app = express();
const port = parseInt(process.env.PORT || '3000');

app.use(cors());
app.use(express.json());

// Public Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Protected Routes
app.get('/me', authMiddleware, (req, res) => {
    res.json(req.user);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
