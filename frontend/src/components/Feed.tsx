import { useState, useEffect, useCallback } from 'react';
import type { Post } from '../types';
import PostCard from './PostCard';

interface FeedProps {
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export default function Feed({ authenticatedFetch }: FeedProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPosts = useCallback(async () => {
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
    }, [authenticatedFetch]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handlePost = async () => {
        if (!newPostContent.trim()) return;
        setIsPosting(true);
        try {
            const res = await authenticatedFetch('http://localhost:3000/posts', {
                method: 'POST',
                body: JSON.stringify({ content: newPostContent }),
            });
            if (res.ok) {
                setNewPostContent('');
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
        <div className="flex justify-center">
            <main className="max-w-[700px] flex-1 space-y-6">
                {/* Post Composer */}
                <section className="bg-white dark:bg-[#1a242f] rounded-xl shadow-sm border border-[#e8edf3] dark:border-gray-800 p-4">
                    <div className="flex gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
                            <span className="material-symbols-outlined">person</span>
                        </div>
                        <div className="flex-1 space-y-3">
                            <textarea
                                className="w-full bg-background-light dark:bg-background-dark border-none focus:ring-1 focus:ring-primary/30 rounded-lg p-3 text-sm text-[#0e141b] dark:text-gray-200 placeholder:text-gray-500 resize-none min-h-[100px]"
                                placeholder="Share something with your campus..."
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                            ></textarea>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex gap-1">
                                    <button className="p-2 text-[#507395] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-xl">image</span>
                                        <span className="text-xs font-medium">Photo</span>
                                    </button>
                                    <button className="p-2 text-[#507395] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-xl">poll</span>
                                        <span className="text-xs font-medium">Poll</span>
                                    </button>
                                </div>
                                <button
                                    className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold text-sm transition-all shadow-sm disabled:opacity-50"
                                    onClick={handlePost}
                                    disabled={isPosting || !newPostContent.trim()}
                                >
                                    {isPosting ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Feed List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-10">
                            <div className="animate-pulse flex flex-col items-center">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                            </div>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-[#1a242f] rounded-xl border border-[#e8edf3] dark:border-gray-800">
                            <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">post_add</span>
                            <p className="text-[#507395]">No posts to show. Start the conversation!</p>
                        </div>
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

                {/* Footer / End of Feed */}
                <div className="py-10 text-center">
                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 text-[#507395] mb-2">
                        <span className="material-symbols-outlined">auto_awesome</span>
                    </div>
                    <p className="text-sm font-medium text-[#507395] dark:text-gray-400">You're all caught up for today!</p>
                    <button
                        className="mt-3 text-primary font-bold text-sm hover:underline"
                        onClick={() => fetchPosts()}
                    >
                        Refresh Feed
                    </button>
                </div>
            </main>

            {/* Sidebar Suggestion (Responsive Hidden) */}
            <aside className="hidden lg:block sticky top-24 h-fit w-64 ml-8 space-y-6">
                <section className="bg-white dark:bg-[#1a242f] rounded-xl shadow-sm border border-[#e8edf3] dark:border-gray-800 p-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Trending Groups</h4>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-lg">code</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold group-hover:text-primary transition-colors">Dev-Circle 2024</p>
                                <p className="text-[10px] text-gray-400">1.2k members</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="h-8 w-8 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                                <span className="material-symbols-outlined text-lg">eco</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold group-hover:text-primary transition-colors">Green Campus Init.</p>
                                <p className="text-[10px] text-gray-400">850 members</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="h-8 w-8 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                                <span className="material-symbols-outlined text-lg">sports_basketball</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold group-hover:text-primary transition-colors">Varsity Sports</p>
                                <p className="text-[10px] text-gray-400">2.4k members</p>
                            </div>
                        </div>
                    </div>
                </section>
            </aside>
        </div>
    );
}
