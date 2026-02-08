import { useState, useEffect } from 'react';
import { Post } from '../types';
import { Card, CardContent } from './ui/Card';
import PostCard from './PostCard';

interface ProfilePostsProps {
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
    userId: string;
}

export default function ProfilePosts({ authenticatedFetch, userId }: ProfilePostsProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchPosts();
        }
    }, [userId]);

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const res = await authenticatedFetch(`http://localhost:3000/users/${userId}/posts`);
            if (res.ok) {
                const data = await res.json();
                setPosts(data);
            }
        } catch (error) {
            console.error('Failed to fetch profile posts', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async (post: Post) => {
        const updatedPosts = posts.map(p => {
            if (p.id === post.id) {
                return {
                    ...p,
                    has_liked: !p.has_liked,
                    likes_count: p.has_liked ? Number(p.likes_count) - 1 : Number(p.likes_count) + 1
                };
            }
            return p;
        });
        setPosts(updatedPosts);

        try {
            const method = post.has_liked ? 'DELETE' : 'POST';
            await authenticatedFetch(`http://localhost:3000/posts/${post.id}/like`, { method });
        } catch (error) {
            console.error('Failed to toggle like', error);
            fetchPosts();
        }
    };

    const handleCommentAdded = (postId: string) => {
        setPosts(posts.map(p => p.id === postId ? { ...p, comments_count: Number(p.comments_count) + 1 } : p));
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
                        authenticatedFetch={authenticatedFetch}
                        onLike={handleLike}
                        onCommentAdded={handleCommentAdded}
                    />
                ))
            )}
        </div>
    );
}
