import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/http/auth_middleware';
import { PostService } from '../services/post_service';

const router = Router();

router.post('/', authMiddleware, async (req, res) => {
    try {
        const post = await PostService.createPost(req.user!.id, req.body);
        res.status(201).json(post);
    } catch (error: any) {
        console.error('Create post error', error);
        if (error.message.startsWith('Forbidden')) {
            res.status(403).json({ error: error.message });
        } else if (error.message === 'Content is required') {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.get('/', authMiddleware, async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as any) : 20;
    const cursor = req.query.cursor as any;

    try {
        const feed = await PostService.getFeed(req.user!.id, limit, cursor);
        res.json(feed);
    } catch (error) {
        console.error('List posts error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const post = await PostService.getPost(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (error) {
        console.error('Get post error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/comments', authMiddleware, async (req, res) => {
    try {
        const comment = await PostService.addComment(req.user!.id, req.params.id, req.body.content);
        res.status(201).json(comment);
    } catch (error: any) {
        console.error('Add comment error', error);
        if (error.message === 'Content is required') {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.get('/:id/comments', authMiddleware, async (req, res) => {
    try {
        const comments = await PostService.listComments(req.params.id);
        res.json(comments);
    } catch (error) {
        console.error('List comments error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        await PostService.likePost(req.user!.id, req.params.id);
        res.json({ status: 'liked' });
    } catch (error) {
        console.error('Like error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id/like', authMiddleware, async (req, res) => {
    try {
        await PostService.unlikePost(req.user!.id, req.params.id);
        res.json({ status: 'unliked' });
    } catch (error) {
        console.error('Unlike error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
