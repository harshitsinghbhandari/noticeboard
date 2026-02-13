import { useState, useEffect, useCallback } from 'react';
import type { Post, Comment } from '../../../types';
import * as feedApi from '../api/feed';
import { usePostActions } from '../hooks/usePostActions';
import { timeAgo } from '../../../utils/timeAgo';

interface SinglePostProps {
    postId: string;
    onBack?: () => void;
}

export default function SinglePost({ postId }: SinglePostProps) {
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'posts' | 'chat' | 'info'>('posts');
    const [newComment, setNewComment] = useState('');

    const { handleLikeToggle, handleAddComment } = usePostActions();

    const fetchPostAndComments = useCallback(async () => {
        setIsLoading(true);
        try {
            const postRes = await feedApi.getPost(postId);
            setPost(postRes.data);
            const commentsRes = await feedApi.getComments(postId);
            setComments(commentsRes.data);
        } catch (error) {
            console.error('Failed to fetch post details', error);
        } finally {
            setIsLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        fetchPostAndComments();
    }, [postId, fetchPostAndComments]);

    const onLikeToggle = () => {
        if (!post) return;
        handleLikeToggle(post.id, post.has_liked, (newHasLiked) => {
            setPost({
                ...post,
                has_liked: newHasLiked,
                likes_count: newHasLiked ? Number(post.likes_count) + 1 : Number(post.likes_count) - 1
            });
        });
    };

    const onCommentSubmit = async () => {
        if (!newComment.trim() || !post) return;
        try {
            await handleAddComment(post.id, newComment);
            setNewComment('');
            const commentsRes = await feedApi.getComments(postId);
            setComments(commentsRes.data);
            setPost({ ...post, comments_count: Number(post.comments_count) + 1 });
        } catch (error) {
            console.error('Failed to add comment', error);
        }
    };

    if (isLoading) return <div className="text-center py-20 text-white">Loading Pulse...</div>;
    if (!post) return <div className="text-center py-20 text-white">Event not found.</div>;

    return (
        <div className="pb-32">
            <main className="max-w-4xl mx-auto px-0 md:px-6">
                {/* Hero Banner Section */}
                <div className="relative w-full aspect-[21/9] md:aspect-[3/1] overflow-hidden md:rounded-xl mt-0 md:mt-4">
                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent z-10"></div>
                    <img
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzJ1fBenYlnlrfeJpNZuctvAd6wJFrmoLueNXhwPhFjeJ3vo30E0WF99jPRcWjCQcrB-3aY0s_d-8GHuJcciJe-H2k6WO4JHteQ2mVsqYciyvVy7tTcMM7WwQGt9-_26t0NgP8H3k3xT9zpQPgLUHKyhSxS1Fzi_mAHzTJ7vz8eghj0KHSJYO90L9Ctea2973uG6M2ctWTqgPrVWCy3BI-8TizkReoKMQYDhEUReW0CwpTe8H1ZpK5eejlXVjxhol_sMkAmv-UN8o"
                        alt="Hero"
                    />
                    <div className="absolute bottom-4 left-4 z-20">
                        <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-wider">Campus Pulse</span>
                        <h2 className="text-white text-3xl md:text-4xl font-extrabold mt-2 leading-tight">
                            {post.content.split('\n')[0].substring(0, 50)}
                        </h2>
                        <p className="text-white/80 text-sm font-medium mt-1">Organized by {post.body_name || 'Campus Student'}</p>
                    </div>
                </div>

                {/* Social Proof Section */}
                <div className="mx-4 md:mx-0 -mt-6 relative z-30">
                    <div className="bg-white dark:bg-[#251a30] p-4 rounded-xl shadow-2xl border border-white/5 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-3 overflow-hidden">
                                <div className="inline-block h-10 w-10 rounded-full ring-2 ring-[#251a30] bg-slate-700"></div>
                                <div className="inline-block h-10 w-10 rounded-full ring-2 ring-[#251a30] bg-slate-600"></div>
                                <div className="inline-block h-10 w-10 rounded-full ring-2 ring-[#251a30] bg-slate-500"></div>
                                <div className="flex items-center justify-center h-10 w-10 rounded-full ring-2 ring-[#251a30] bg-primary text-[10px] font-bold text-white uppercase">+{post.likes_count}</div>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">{post.likes_count} pulses going</p>
                                <p className="text-xs text-primary font-semibold">Join the hype train!</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                <span className="material-symbols-outlined text-primary text-sm">local_fire_department</span>
                                <span className="text-xs font-bold text-primary">Trending</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Info Tiles */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 md:px-0">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center text-center">
                        <span className="material-symbols-outlined text-primary mb-2">calendar_today</span>
                        <span className="text-xs uppercase text-slate-400 font-bold tracking-widest">Date</span>
                        <span className="text-sm font-bold text-white mt-1">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center text-center">
                        <span className="material-symbols-outlined text-primary mb-2">schedule</span>
                        <span className="text-xs uppercase text-slate-400 font-bold tracking-widest">Time</span>
                        <span className="text-sm font-bold text-white mt-1">Check Description</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center text-center col-span-2 md:col-span-1">
                        <span className="material-symbols-outlined text-primary mb-2">location_on</span>
                        <span className="text-xs uppercase text-slate-400 font-bold tracking-widest">Location</span>
                        <span className="text-sm font-bold text-white mt-1">Campus Ground</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center text-center hidden md:flex">
                        <span className="material-symbols-outlined text-primary mb-2">confirmation_number</span>
                        <span className="text-xs uppercase text-slate-400 font-bold tracking-widest">Entry</span>
                        <span className="text-sm font-bold text-white mt-1">Free Entry</span>
                    </div>
                </div>

                {/* Tab System */}
                <div className="sticky top-[60px] z-40 glass-effect border-b border-white/10 px-4 mt-2">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`py-4 border-b-2 text-sm font-bold transition-colors ${activeTab === 'posts' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'}`}
                        >
                            Posts
                        </button>
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`py-4 border-b-2 text-sm font-bold transition-colors ${activeTab === 'chat' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'}`}
                        >
                            Chat <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-[10px] rounded">{post.comments_count}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`py-4 border-b-2 text-sm font-bold transition-colors ${activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'}`}
                        >
                            Info
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-4 md:px-0 space-y-6 mt-4">
                    {activeTab === 'posts' && (
                        <>
                            {/* Create Post Input */}
                            <div className="bg-white/5 rounded-xl border border-white/10 p-4 flex gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary">person</span>
                                </div>
                                <div className="flex-1">
                                    <input
                                        className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 p-2"
                                        placeholder="Post a hype message..."
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && onCommentSubmit()}
                                    />
                                </div>
                                <button onClick={onCommentSubmit} className="bg-primary text-white p-2 rounded-lg flex items-center justify-center">
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                            </div>

                            {/* Hype Feed (Comments) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden flex flex-col">
                                        <div className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                    {comment.author_first_name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white leading-none">{comment.author_first_name} {comment.author_last_name}</p>
                                                    <p className="text-[10px] text-slate-500">{timeAgo(comment.created_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-4 pb-4">
                                            <p className="text-sm text-slate-200 font-medium">{comment.content}</p>
                                        </div>
                                        <div className="p-3 border-t border-white/5 flex items-center gap-4">
                                            <button className="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined text-lg">local_fire_department</span>
                                                <span className="text-xs font-bold">Pulse</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {comments.length === 0 && (
                                    <div className="col-span-full py-10 text-center text-slate-500 italic">
                                        No hype yet. Be the first to post!
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'info' && (
                        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                            <h3 className="text-xl font-bold text-white mb-4">About the Event</h3>
                            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {post.content}
                            </p>
                        </div>
                    )}

                    {activeTab === 'chat' && (
                        <div className="bg-white/5 rounded-xl border border-white/10 p-6 text-center">
                            <span className="material-symbols-outlined text-4xl text-primary mb-4">chat_bubble</span>
                            <h3 className="text-white font-bold mb-2">Join the conversation</h3>
                            <p className="text-slate-400 text-sm">Real-time chat for attendees coming soon!</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Sticky Bottom RSVP Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 md:pb-4 glass-effect border-t border-white/10 flex items-center justify-center">
                <div className="max-w-4xl w-full flex items-center justify-between gap-4">
                    <div className="hidden md:flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Hype level</span>
                        <span className="text-sm font-bold text-white">Trending High 🔥</span>
                    </div>
                    <div className="flex flex-1 md:flex-initial gap-3">
                        <button
                            onClick={onLikeToggle}
                            className={`flex-1 md:w-48 py-3.5 ${post.has_liked ? 'bg-white/10 text-primary border border-primary/30' : 'bg-primary text-white shadow-primary/30 shadow-lg'} hover:opacity-90 text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2`}
                        >
                            <span className="material-symbols-outlined text-lg">{post.has_liked ? 'check_circle' : 'bolt'}</span>
                            {post.has_liked ? 'Joined Pulse' : 'Join Pulse'}
                        </button>
                        <button className="p-3.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all">
                            <span className="material-symbols-outlined text-white">calendar_add_on</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
