import { createPost, getAggregatedFeed, getPost, addComment, listComments, addReaction, removeReaction } from '../../infrastructure/db/post_repository';
import { checkBodyPermission, BodyAction } from '../../infrastructure/db/body_repository';
import { createNotification } from '../../infrastructure/db/notification_repository';

export class PostService {
    static async createPost(userId: string, postData: any) {
        const { content, visibility, body_id } = postData;

        if (!content || typeof content !== 'string') {
            throw new Error('Content is required');
        }

        if (body_id) {
            const hasPermission = await checkBodyPermission(userId, body_id, BodyAction.CREATE_POST);
            if (!hasPermission) {
                throw new Error('Forbidden: You are not authorized to post for this body');
            }
        }

        const validVisibility = ['public', 'connections_only'];
        const postVisibility = (visibility && validVisibility.includes(visibility)) ? visibility : 'public';

        return await createPost(userId, content, postVisibility as any, body_id);
    }

    static async getFeed(userId: string, limit: number, cursor?: string) {
        return await getAggregatedFeed(userId, limit, cursor);
    }

    static async getPost(postId: string) {
        return await getPost(postId);
    }

    static async addComment(userId: string, postId: string, content: string) {
        if (!content || typeof content !== 'string') {
            throw new Error('Content is required');
        }

        const comment = await addComment(postId, userId, content);

        // Notify post author
        const post = await getPost(postId);
        if (post && post.author_id !== userId) {
            await createNotification(post.author_id, 'comment', userId, postId);
        }

        return comment;
    }

    static async listComments(postId: string) {
        return await listComments(postId);
    }

    static async likePost(userId: string, postId: string) {
        await addReaction(postId, userId);

        // Notify post author
        const post = await getPost(postId);
        if (post && post.author_id !== userId) {
            await createNotification(post.author_id, 'like', userId, postId);
        }
    }

    static async unlikePost(userId: string, postId: string) {
        await removeReaction(postId, userId);
    }
}
