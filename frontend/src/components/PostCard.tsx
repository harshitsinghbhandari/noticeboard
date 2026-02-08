import { useState } from 'react';
import type { Comment, FeedItem, Post } from '../types';
import { timeAgo } from '../utils/timeAgo';

interface PostCardProps {
    post: FeedItem | Post;
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
    onLike: (post: any) => void;
    onCommentAdded: (postId: string) => void;
}

export default function PostCard({ post, authenticatedFetch, onLike, onCommentAdded }: PostCardProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isCommenting, setIsCommenting] = useState(false);
    const [areCommentsLoaded, setAreCommentsLoaded] = useState(false);

    const toggleComments = async () => {
        if (isExpanded) {
            setIsExpanded(false);
        } else {
            setIsExpanded(true);
            if (!areCommentsLoaded) {
                fetchComments();
            }
        }
    };

    const fetchComments = async () => {
        try {
            const res = await authenticatedFetch(`http://localhost:3000/posts/${post.id}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
                setAreCommentsLoaded(true);
            }
        } catch (error) {
            console.error('Failed to fetch comments', error);
        }
    };

    const handleComment = async () => {
        if (!newComment.trim()) return;
        setIsCommenting(true);
        try {
            const res = await authenticatedFetch(`http://localhost:3000/posts/${post.id}/comments`, {
                method: 'POST',
                body: JSON.stringify({ content: newComment }),
            });
            if (res.ok) {
                setNewComment('');
                fetchComments();
                onCommentAdded(post.id);
            }
        } catch (error) {
            console.error('Failed to add comment', error);
        } finally {
            setIsCommenting(false);
        }
    };

    if (post.type === 'opening') {
        return (
            <article className="bg-white dark:bg-[#1a242f] rounded-xl shadow-sm border border-[#e8edf3] dark:border-gray-800 overflow-hidden hover:border-primary/20 transition-all">
                <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-11 w-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                            <span className="material-symbols-outlined">work</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#0e141b] dark:text-white leading-tight">
                                Opportunity: {post.title}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-[#507395] dark:text-gray-400">
                                <span className="text-primary font-semibold">{post.club_name}</span>
                                <span>•</span>
                                <span>{timeAgo(post.created_at)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-[#0e141b] dark:text-gray-200 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                        <p>{post.content}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                             <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">📍 {post.location_city}, {post.location_country}</span>
                             <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">💼 {post.job_type}</span>
                             <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">🎓 {post.experience_level}</span>
                        </div>
                    </div>
                    <button className="w-full py-2 bg-primary text-white rounded-lg font-bold text-sm">Apply Now</button>
                </div>
            </article>
        );
    }

    return (
        <article className="bg-white dark:bg-[#1a242f] rounded-xl shadow-sm border border-[#e8edf3] dark:border-gray-800 overflow-hidden hover:border-primary/20 transition-all">
            <div className="p-5">
                {/* Post Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden">
                        {post.author_first_name?.[0] || post.club_name?.[0]}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#0e141b] dark:text-white leading-tight">
                            {post.club_name ? post.club_name : `${post.author_first_name} ${post.author_last_name}`}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-[#507395] dark:text-gray-400">
                            <span>{post.author_headline || 'Student'}</span>
                            <span>•</span>
                            <span>{timeAgo(post.created_at)}</span>
                        </div>
                    </div>
                    <button className="ml-auto text-[#507395] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded">
                        <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                </div>

                {/* Post Body */}
                <div className="text-[#0e141b] dark:text-gray-200 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                    <p>{post.content}</p>
                </div>

                {/* Post Meta Info */}
                <div className="flex items-center justify-between py-3 border-y border-gray-100 dark:border-gray-800 mb-2">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-2">
                                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center ring-2 ring-white dark:ring-[#1a242f]">
                                    <span className="material-symbols-outlined text-[12px] text-white filled-icon">thumb_up</span>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-[#507395] dark:text-gray-400">
                                {post.likes_count} likes
                            </span>
                        </div>
                        <span className="text-xs font-medium text-[#507395] dark:text-gray-400">
                            {post.comments_count} comments
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onLike(post)}
                        className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg font-semibold text-sm transition-colors ${
                            post.has_liked
                                ? 'text-primary bg-primary/5 hover:bg-primary/10'
                                : 'text-[#507395] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                        <span className={`material-symbols-outlined text-xl ${post.has_liked ? 'filled-icon' : ''}`}>
                            thumb_up
                        </span>
                        <span>{post.has_liked ? 'Liked' : 'Like'}</span>
                    </button>
                    <button
                        onClick={toggleComments}
                        className={`flex-1 py-2 flex items-center justify-center gap-2 text-[#507395] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-semibold text-sm transition-colors ${
                            isExpanded ? 'bg-gray-100 dark:bg-gray-800' : ''
                        }`}
                    >
                        <span className="material-symbols-outlined text-xl">chat_bubble</span>
                        <span>Comment</span>
                    </button>
                </div>

                {/* Comments Section */}
                {isExpanded && (
                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {comments.map((comment) => (
                                <div key={comment.id} className="py-3 flex gap-3">
                                    <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs overflow-hidden">
                                        {comment.author_first_name?.[0]}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold">{comment.author_first_name} {comment.author_last_name}</span>
                                            <span className="text-[10px] text-gray-400">{timeAgo(comment.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <input
                                className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                            />
                            <button
                                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50"
                                onClick={handleComment}
                                disabled={isCommenting || !newComment.trim()}
                            >
                                {isCommenting ? '...' : 'Post'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </article>
    );
}
