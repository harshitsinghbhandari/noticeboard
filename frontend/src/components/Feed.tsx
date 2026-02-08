import { useState, useEffect } from 'react';
import { Post } from '../types';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Card, CardContent } from './ui/Card';
import PostCard from './PostCard';

interface FeedProps {
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export default function Feed({ authenticatedFetch }: FeedProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'connections_only'>('public');
    const [isPosting, setIsPosting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const res = await authenticatedFetch('http://localhost:3000/posts');
            if (res.ok) {
                const data = await res.json();
                setPosts(data);
            }
        } catch (error) {
            console.error('Failed to fetch posts', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePost = async () => {
        if (!newPostContent.trim()) return;
        setIsPosting(true);
        try {
            const res = await authenticatedFetch('http://localhost:3000/posts', {
                method: 'POST',
                body: JSON.stringify({ content: newPostContent, visibility }),
            });
            if (res.ok) {
                setNewPostContent('');
                setVisibility('public');
                fetchPosts();
            }
        } catch (error) {
            console.error('Failed to create post', error);
        } finally {
            setIsPosting(false);
        }
    };

    const handleLike = async (post: Post) => {
        // Optimistic update
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
            fetchPosts(); // Revert from server on error
        }
    };

    const handleCommentAdded = (postId: string) => {
        setPosts(posts.map(p => p.id === postId ? { ...p, comments_count: Number(p.comments_count) + 1 } : p));
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Post Composer */}
            <Card>
                <CardContent className="pt-6">
                    < Textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="What's on your mind?"
                        className="mb-4 min-h-[100px] text-base resize-none border-none focus-visible:ring-0 px-0"
                    />
                    <div className="flex justify-between items-center border-t border-border pt-4">
                        <select
                            value={visibility}
                            onChange={(e) => setVisibility(e.target.value as 'public' | 'connections_only')}
                            className="bg-surface-muted border border-border text-text-primary text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="public">Public</option>
                            <option value="connections_only">Connections Only</option>
                        </select>
                        <Button
                            onClick={handlePost}
                            disabled={isPosting || !newPostContent.trim()}
                        >
                            {isPosting ? 'Posting...' : 'Post'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Feed */}
            {isLoading ? (
                <div className="text-center py-10">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-10 text-text-muted">
                    No posts yet. Be the first to share something!
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            authenticatedFetch={authenticatedFetch}
                            onLike={handleLike}
                            onCommentAdded={handleCommentAdded}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
