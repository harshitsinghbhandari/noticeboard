import { useState, useEffect, useCallback } from 'react';
import type { Post } from '../types';
import PostCard from './PostCard';
import apiClient from '../api/client';

interface SinglePostProps {
    postId: string;
    onBack?: () => void;
}

export default function SinglePost({ postId, onBack }: SinglePostProps) {
    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPost = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await apiClient.get(`/posts/${postId}`);
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

    const handleLikeToggle = (currentPost: Post) => {
        setPost({
            ...currentPost,
            has_liked: !currentPost.has_liked,
            likes_count: currentPost.has_liked ? Number(currentPost.likes_count) - 1 : Number(currentPost.likes_count) + 1
        });

        if (currentPost.has_liked) {
            apiClient.delete(`/posts/${currentPost.id}/like`).catch(err => console.error("Failed to unlike", err));
        } else {
            apiClient.post(`/posts/${currentPost.id}/like`).catch(err => console.error("Failed to like", err));
        }
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
                onLike={() => handleLikeToggle(post)}
                onCommentAdded={handleCommentAdded}
            />
        </div>
    );
}
