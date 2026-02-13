import { useState, useEffect, useCallback } from 'react';
import type { Post } from '../../../types';
import PostCard from './PostCard';
import * as feedApi from '../api/feed';
import { usePostActions } from '../hooks/usePostActions';

interface SinglePostProps {
    postId: string;
    onBack?: () => void;
}

export default function SinglePost({ postId, onBack }: SinglePostProps) {
    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { handleLikeToggle } = usePostActions();

    const fetchPost = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await feedApi.getPost(postId);
            setPost(res.data);
        } catch (error) {
            console.error('Failed to fetch post', error);
            setError('Failed to load post');
        } finally {
            setIsLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        fetchPost();
    }, [postId, fetchPost]);

    const onLikeToggle = (currentPost: Post) => {
        handleLikeToggle(currentPost.id, currentPost.has_liked, (newHasLiked) => {
            setPost({
                ...currentPost,
                has_liked: newHasLiked,
                likes_count: newHasLiked ? Number(currentPost.likes_count) + 1 : Number(currentPost.likes_count) - 1
            });
        });
    };

    const handleCommentAdded = () => {
        if (!post) return;
        setPost({ ...post, comments_count: Number(post.comments_count) + 1 });
    };

    if (isLoading) return <div className="text-center py-10">Loading post...</div>;
    if (error || !post) return (
        <div className="text-center py-10">
            <p className="text-red-500 mb-4">{error || 'Post not found'}</p>
            {onBack && <button onClick={onBack} className="text-blue-500 underline">Go Back</button>}
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            {onBack && (
                <button onClick={onBack} className="mb-4 text-sm text-text-muted hover:text-primary flex items-center gap-1">
                    &larr; Back
                </button>
            )}
            <PostCard
                post={post}
                onLike={() => onLikeToggle(post)}
                onCommentAdded={handleCommentAdded}
            />
        </div>
    );
}
