import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import router from './routes';
import { requestLogger } from '../infrastructure/http/logging_middleware';

const app = express();

app.use(requestLogger);
app.use(cors());
app.use(express.json());

// Public Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// App Routes
app.use('/', router);

export default app;
