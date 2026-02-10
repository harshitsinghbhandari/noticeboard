import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import connectionRoutes from './connections';
import postRoutes from './posts';
import notificationRoutes from './notifications';
import clubRoutes from './clubs';
import openingRoutes from './openings';
import messageRoutes from './messages';

const router = Router();

router.use('/auth', authRoutes);
router.use('/', userRoutes); // Some routes are at root like /me
router.use('/connections', connectionRoutes);
router.use('/posts', postRoutes);
router.use('/notifications', notificationRoutes);
router.use('/clubs', clubRoutes);
router.use('/openings', openingRoutes);
router.use('/messages', messageRoutes);

export default router;
