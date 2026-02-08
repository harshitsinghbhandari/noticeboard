import { useState, useEffect } from 'react';
import { Post } from '../types';
import PostCard from './PostCard';

interface SinglePostProps {
    postId: string;
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
    onBack?: () => void;
}

export default function SinglePost({ postId, authenticatedFetch, onBack }: SinglePostProps) {
    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPost();
    }, [postId]);

    const fetchPost = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // We need a route to fetch single post.
            // Check backend server.ts. There is NO `GET /posts/:id` route!
            // I need to add that route to backend first.
            const res = await authenticatedFetch(`http://localhost:3000/posts/${postId}`);
            if (res.ok) {
                const data = await res.json();
                setPost(data);
            } else {
                setError('Post not found');
            }
        } catch (error) {
            console.error('Failed to fetch post', error);
            setError('Failed to load post');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async (post: Post) => {
        if (!post) return;
        setPost({
            ...post,
            has_liked: !post.has_liked,
            likes_count: post.has_liked ? Number(post.likes_count) - 1 : Number(post.likes_count) + 1
        });

        try {
            const method = post.has_liked ? 'DELETE' : 'POST';
            await authenticatedFetch(`http://localhost:3000/posts/${post.id}/like`, { method });
        } catch (error) {
            console.error('Failed to toggle like', error);
            fetchPost();
        }
    };

    const handleCommentAdded = (postId: string) => {
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
                authenticatedFetch={authenticatedFetch}
                onLike={handleLike}
                onCommentAdded={handleCommentAdded}
            />
        </div>
    );
}
