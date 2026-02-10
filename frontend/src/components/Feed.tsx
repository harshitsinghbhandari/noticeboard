import { useState, useEffect, useRef, useCallback } from 'react';
import type { FeedItem } from '../types';
import PostCard from './PostCard';
import apiClient from '../api/client';
import { Button } from './ui/Button';

export default function Feed() {
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // New Post State
    const [newPostContent, setNewPostContent] = useState('');
    const [posting, setPosting] = useState(false);
    const [postVisibility, setPostVisibility] = useState<'public' | 'connections_only'>('public');

    const [error, setError] = useState<string | null>(null);

    const observerTarget = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<string | null>(null);

    const fetchFeed = useCallback(async (isLoadMore = false) => {
        try {
            setError(null);
            const limit = 20;
            let url = `/posts?limit=${limit}`;
            if (isLoadMore && cursorRef.current) {
                url += `&cursor=${cursorRef.current}`;
            }


            const res = await apiClient.get(url);
            const items = res.data as FeedItem[]; // It returns an array directly

            if (!Array.isArray(items)) {
                throw new Error('Invalid response format');
            }

            if (items.length < limit) {
                setHasMore(false);
            }

            if (items.length > 0) {
                const lastItem = items[items.length - 1];
                cursorRef.current = lastItem.created_at; // Use created_at as cursor
            } else {
                setHasMore(false);
            }

            if (isLoadMore) {
                setFeedItems(prev => [...prev, ...items]);
            } else {
                setFeedItems(items);
            }
        } catch (err) {
            console.error('Failed to fetch feed', err);
            setError('Failed to load posts. Please try again.');
            // Stop infinite loop by disabling infinite scroll on error
            setLoadingMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && !error) {
                    setLoadingMore(true);
                    fetchFeed(true);
                }
            },
            { threshold: 1.0 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasMore, loading, loadingMore, fetchFeed, error]);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;

        setPosting(true);
        try {
            const res = await apiClient.post('/posts', {
                content: newPostContent,
                visibility: postVisibility,
            });

            const newPost = res.data;

            if (newPost) {
                const newItem: FeedItem = {
                    ...newPost,
                    type: 'post', // Ensure type is set
                    likes_count: 0,
                    has_liked: false,
                    comments_count: 0,
                };
                setFeedItems(prev => [newItem, ...prev]);
            } else {
                // Fallback
                fetchFeed();
            }

            setNewPostContent('');
        } catch (err) {
            console.error('Failed to create post', err);
            setError('Failed to create post. Please try again.');
        } finally {
            setPosting(false);
        }
    };

    const handleLikeToggle = (postId: string, currentHasLiked: boolean) => {
        // Optimistic update
        setFeedItems(prev => prev.map(item => {
            if (item.id === postId) {
                return {
                    ...item,
                    has_liked: !item.has_liked,
                    likes_count: item.has_liked ? Number(item.likes_count) - 1 : Number(item.likes_count) + 1
                };
            }
            return item;
        }));

        if (currentHasLiked) {
            apiClient.delete(`/posts/${postId}/like`).catch(err => console.error("Failed to unlike", err));
        } else {
            apiClient.post(`/posts/${postId}/like`).catch(err => console.error("Failed to like", err));
        }
    };

    const handleCommentAdded = (postId: string) => {
        setFeedItems(prev => prev.map(item => {
            if (item.id === postId) {
                return {
                    ...item,
                    comments_count: Number(item.comments_count) + 1
                };
            }
            return item;
        }));
    };

    if (loading && feedItems.length === 0) return <div className="p-4">Loading feed...</div>;

    if (error && feedItems.length === 0) {
        return (
            <div className="p-4 text-center text-red-500">
                <p>{error}</p>
                <Button onClick={() => { setLoading(true); fetchFeed(); }} className="mt-4">
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 animate-fade-in relative">
            {/* Create Post Widget */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <form onSubmit={handleCreatePost}>
                    <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 animate-pulse-slow"></div>
                        <div className="flex-grow">
                            <textarea
                                className="w-full bg-transparent border-none resize-none focus:ring-0 text-lg placeholder-gray-400 dark:text-gray-100"
                                placeholder="Start a post..."
                                rows={2}
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex gap-2">
                            <select
                                value={postVisibility}
                                onChange={(e) => setPostVisibility(e.target.value as 'public' | 'connections_only')}
                                className="text-sm border-none bg-gray-50 dark:bg-gray-900 rounded-lg px-2 py-1 text-gray-600 dark:text-gray-300 focus:ring-0 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <option value="public">🌏 Public</option>
                                <option value="connections_only">👥 Connections</option>
                            </select>
                        </div>
                        <Button type="submit" disabled={!newPostContent.trim() || posting}>
                            {posting ? 'Posting...' : 'Post'}
                        </Button>
                    </div>
                </form>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {feedItems.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <p>No posts yet. Be the first to post!</p>
                    </div>
                ) : (
                    feedItems.map(item => (
                        <PostCard
                            key={item.id}
                            post={item}
                            onLike={() => handleLikeToggle(item.id, item.has_liked)}
                            onCommentAdded={handleCommentAdded}
                        />
                    ))
                )}
            </div>

            {hasMore && feedItems.length > 0 && !error && (
                <div ref={observerTarget} className="p-4 text-center text-gray-500">
                    {loadingMore ? 'Loading more...' : 'Load more'}
                </div>
            )}
        </div>
    );
}
