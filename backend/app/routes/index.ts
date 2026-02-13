import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import connectionRoutes from './connections';
import postRoutes from './posts';
import notificationRoutes from './notifications';
import bodyRoutes from './bodies';
import openingRoutes from './openings';
import messageRoutes from './messages';
import groupRoutes from './groups';
import eventRoutes from './events';

const router = Router();

router.use('/auth', authRoutes);
router.use('/', userRoutes); // Some routes are at root like /me
router.use('/connections', connectionRoutes);
router.use('/posts', postRoutes);
router.use('/notifications', notificationRoutes);
router.use('/bodies', bodyRoutes);
router.use('/openings', openingRoutes);
router.use('/messages', messageRoutes); // 1:1 messages
router.use('/events', eventRoutes);
router.use('/', groupRoutes); // Group routes are mixed /groups... and /groups/...


export default router;
