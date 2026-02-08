import { useState } from 'react';
import { Post, Comment } from '../types';
import { Button } from './ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';
import { Input } from './ui/Input';
import { timeAgo } from '../utils/timeAgo';

interface PostCardProps {
    post: Post;
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
    onLike: (post: Post) => void;
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
                const comment = await res.json();
                // Depending on API response, we append using the response
                // But we need the author info. Backend usually returns it or we optimistically add it.
                // Assuming backend returns complete comment object or we refetch.
                // The previous implementation refetched or updated locally. 
                // Let's refetch to be safe and simple.
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

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {post.author_first_name?.[0]}
                        </div>
                        <div>
                            <div className="font-semibold text-text-primary">
                                {post.author_first_name} {post.author_last_name}
                            </div>
                            <div className="text-xs text-text-muted">
                                {timeAgo(post.created_at)}
                                {post.visibility !== 'public' && (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-muted border border-border">
                                        Connections
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="py-2">
                <p className="text-text-primary whitespace-pre-wrap leading-relaxed">
                    {post.content}
                </p>
            </CardContent>
            <CardFooter className="flex-col items-stretch pt-2">
                <div className="flex items-center gap-4 border-t border-border pt-3 w-full">
                    <Button
                        variant="ghost"
                        onClick={() => onLike(post)}
                        className={`gap-2 ${post.has_liked ? 'text-primary' : 'text-text-muted'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={post.has_liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                        {post.likes_count > 0 && <span>{post.likes_count}</span>}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={toggleComments}
                        className="gap-2 text-text-muted"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        {post.comments_count > 0 && <span>{post.comments_count}</span>}
                    </Button>
                </div>

                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border w-full animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                            {comments.length === 0 ? (
                                <p className="text-center text-sm text-text-muted italic py-2">No comments yet</p>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className="flex gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-surface-muted flex-shrink-0 flex items-center justify-center text-xs font-medium text-text-muted border border-border">
                                            {comment.author_first_name?.[0]}
                                        </div>
                                        <div className="bg-surface-muted p-3 rounded-lg rounded-tl-none flex-1">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="font-semibold text-text-primary text-xs">
                                                    {comment.author_first_name} {comment.author_last_name}
                                                </span>
                                                <span className="text-[10px] text-text-muted">
                                                    {timeAgo(comment.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-text-primary">{comment.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="flex gap-2 items-center">
                            <Input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1"
                                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                            />
                            <Button
                                onClick={handleComment}
                                disabled={isCommenting || !newComment.trim()}
                            >
                                Send
                            </Button>
                        </div>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
