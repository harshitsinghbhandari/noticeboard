import { useEffect, useRef } from 'react';
import type { FeedItem } from '../../../types';
import PostCard from './PostCard';
import { useFeed } from '../hooks/useFeed';
import { usePostActions } from '../hooks/usePostActions';
import HappeningSoon from './HappeningSoon';
import SocialProof from './SocialProof';

export default function Feed() {
    const {
        feedItems,
        setFeedItems,
        loading,
        loadingMore,
        hasMore,
        loadMore
    } = useFeed();

    const onPostAdded = (newItem: FeedItem) => {
        setFeedItems(prev => [newItem, ...(prev || [])]);
    };

    const {
        handleLikeToggle
    } = usePostActions(onPostAdded);

    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
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
    }, [loadMore, hasMore, loadingMore]);

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

    if (loading && feedItems.length === 0) return <div className="p-4 text-white">Loading CampusPulse...</div>;

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            {/* Section 1: Happening Soon */}
            <HappeningSoon />

            {/* Section 2: Your People Are Going */}
            <SocialProof />

            {/* Main Feed: For You */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Recommended For You</h2>
                    <div className="flex items-center gap-2 text-slate-400">
                        <span className="material-symbols-outlined !text-base">sort</span>
                        <span className="text-xs font-semibold">Latest First</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {feedItems.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-slate-400">No events found in your pulse.</p>
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

                {hasMore && (
                    <div ref={observerTarget} className="py-10 flex justify-center">
                        <button
                            onClick={() => loadMore()}
                            disabled={loadingMore}
                            className="px-8 py-2.5 border border-primary/30 text-primary font-bold rounded-full hover:bg-primary/5 transition-colors disabled:opacity-50"
                        >
                            {loadingMore ? 'Pulse checking...' : 'Load More Events'}
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
