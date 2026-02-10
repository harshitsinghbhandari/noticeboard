import { useState, useEffect, useCallback } from 'react';
import type { Post, FeedItem } from '../types';
import { Card, CardContent } from './ui/Card';
import PostCard from './PostCard';
import apiClient from '../api/client';

interface ProfilePostsProps {
    userId: string;
}

export default function ProfilePosts({ userId }: ProfilePostsProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPosts = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get<Post[]>(`/users/${userId}/posts`);
            setPosts(res.data);
        } catch (error) {
            console.error('Failed to fetch profile posts', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            fetchPosts();
        }
    }, [userId, fetchPosts]);

    const handleLike = async (post: FeedItem | Post) => {
        const targetPost = post as Post; // We know it's a Post here

        // Optimistic update
        setPosts(prev => prev.map(p => {
            if (p.id === targetPost.id) {
                return {
                    ...p,
                    has_liked: !p.has_liked,
                    likes_count: p.has_liked ? Number(p.likes_count) - 1 : Number(p.likes_count) + 1
                };
            }
            return p;
        }));

        try {
            if (targetPost.has_liked) {
                await apiClient.delete(`/posts/${targetPost.id}/like`);
            } else {
                await apiClient.post(`/posts/${targetPost.id}/like`);
            }
        } catch (error) {
            console.error('Failed to toggle like', error);
            fetchPosts(); // Revert/Refresh on error
        }
    };

    const handleCommentAdded = (postId: string) => {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: Number(p.comments_count) + 1 } : p));
    };


    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold px-1">My Posts</h3>
            {isLoading ? (
                <div className="text-center py-8 text-text-muted">Loading posts...</div>
            ) : posts.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-text-muted italic">
                        No posts yet.
                    </CardContent>
                </Card>
            ) : (
                posts.map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        onLike={handleLike}
                        onCommentAdded={handleCommentAdded}
                    />
                ))
            )}
        </div>
    );
}
