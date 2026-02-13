import { useState, useEffect, useRef } from 'react';
import type { FeedItem } from '../../../types';
import PostCard from './PostCard';
import { Button } from '../../../components/ui/Button';
import { useFeed } from '../hooks/useFeed';
import { usePostActions } from '../hooks/usePostActions';

export default function Feed() {
    const {
        feedItems,
        setFeedItems,
        loading,
        loadingMore,
        hasMore,
        error,
        fetchFeed,
        loadMore
    } = useFeed();

    const onPostAdded = (newItem: FeedItem) => {
        setFeedItems(prev => [newItem, ...(prev || [])]);
    };

    const {
        posting,
        handleCreatePost,
        handleLikeToggle
    } = usePostActions(onPostAdded);

    // New Post State
    const [newPostContent, setNewPostContent] = useState('');
    const [postVisibility, setPostVisibility] = useState<'public' | 'connections_only'>('public');

    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    loadMore();
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
    }, [loadMore]);

    const onCreatePostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await handleCreatePost(newPostContent, postVisibility);
            setNewPostContent('');
        } catch {
            // Error handled in hook
        }
    };

    const onLikeToggle = (postId: string, currentHasLiked: boolean) => {
        handleLikeToggle(postId, currentHasLiked, (newHasLiked) => {
            setFeedItems(prev => (prev || []).map(item => {
                if (item.id === postId) {
                    return {
                        ...item,
                        has_liked: newHasLiked,
                        likes_count: newHasLiked ? Number(item.likes_count) + 1 : Number(item.likes_count) - 1
                    };
                }
                return item;
            }));
        });
    };

    const handleCommentAdded = (postId: string) => {
        setFeedItems(prev => (prev || []).map(item => {
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
                <Button onClick={() => fetchFeed()} className="mt-4">
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 animate-fade-in relative">
            {/* Create Post Widget */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <form onSubmit={onCreatePostSubmit}>
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
                            onLike={() => onLikeToggle(item.id, item.has_liked)}
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
