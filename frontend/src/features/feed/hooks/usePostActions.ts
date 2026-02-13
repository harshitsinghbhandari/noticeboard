import type { FeedItem } from '../../../types';
import * as feedApi from '../api/feed';
import { useApi } from '../../../hooks/useApi';

export const usePostActions = (onPostAdded?: (post: FeedItem) => void) => {
    const {
        isLoading: posting,
        error: postError,
        execute: executeCreatePost
    } = useApi(feedApi.createPost);

    const {
        execute: executeLike
    } = useApi(feedApi.likePost);

    const {
        execute: executeUnlike
    } = useApi(feedApi.unlikePost);

    const {
        execute: executeAddComment
    } = useApi(feedApi.addComment);

    const handleCreatePost = async (content: string, visibility: 'public' | 'connections_only', bodyId?: string) => {
        const newPost = await executeCreatePost(content, visibility, bodyId);
        if (newPost && onPostAdded) {
            const newItem: FeedItem = {
                ...newPost,
                type: 'post',
                likes_count: 0,
                has_liked: false,
                comments_count: 0,
            };
            onPostAdded(newItem);
        }
        return newPost;
    };

    const handleLikeToggle = async (postId: string, currentHasLiked: boolean, updateLocalState: (hasLiked: boolean) => void) => {
        updateLocalState(!currentHasLiked);
        try {
            if (currentHasLiked) {
                await executeUnlike(postId);
            } else {
                await executeLike(postId);
            }
        } catch (err) {
            updateLocalState(currentHasLiked);
        }
    };

    const handleAddComment = async (postId: string, content: string) => {
        const comment = await executeAddComment(postId, content);
        return comment;
    };

    return {
        posting,
        error: postError ? 'Failed to create post' : null,
        handleCreatePost,
        handleLikeToggle,
        handleAddComment
    };
};
