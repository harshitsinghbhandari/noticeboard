import { useState, useEffect } from 'react';
import { timeAgo } from '../utils/timeAgo';

interface Comment {
    id: string;
    post_id: string;
    author_id: string;
    content: string;
    created_at: string;
    author_first_name: string;
    author_last_name: string;
}

interface Post {
    id: string;
    author_id: string;
    content: string;
    created_at: string;
    author_first_name: string;
    author_last_name: string;
    likes_count: number;
    has_liked: boolean;
    comments_count: number;
    visibility: 'public' | 'connections_only';
}

interface FeedProps {
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
    userId: string;
}

export default function Feed({ authenticatedFetch, userId }: FeedProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'connections_only'>('public');
    const [isPosting, setIsPosting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isCommenting, setIsCommenting] = useState(false);

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

    const toggleLike = async (post: Post) => {
        // Optimistic update
        const updatedPosts = posts.map(p => {
            if (p.id === post.id) {
                return {
                    ...p,
                    has_liked: !p.has_liked,
                    likes_count: p.has_liked ? parseInt(p.likes_count as any) - 1 : parseInt(p.likes_count as any) + 1
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
            fetchPosts(); // Revert on error
        }
    };

    const toggleComments = async (postId: string) => {
        if (expandedPostId === postId) {
            setExpandedPostId(null);
            setComments([]);
        } else {
            setExpandedPostId(postId);
            fetchComments(postId);
        }
    };

    const fetchComments = async (postId: string) => {
        try {
            const res = await authenticatedFetch(`http://localhost:3000/posts/${postId}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (error) {
            console.error('Failed to fetch comments', error);
        }
    };

    const handleComment = async (postId: string) => {
        if (!newComment.trim()) return;
        setIsCommenting(true);
        try {
            const res = await authenticatedFetch(`http://localhost:3000/posts/${postId}/comments`, {
                method: 'POST',
                body: JSON.stringify({ content: newComment }),
            });
            if (res.ok) {
                setNewComment('');
                fetchComments(postId);
                // Update comment count in post list
                setPosts(posts.map(p => p.id === postId ? { ...p, comments_count: parseInt(p.comments_count as any) + 1 } : p));
            }
        } catch (error) {
            console.error('Failed to add comment', error);
        } finally {
            setIsCommenting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Create Post</h3>
                <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full h-24 p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-3"
                />
                <div className="flex justify-between items-center">
                    <select
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value as 'public' | 'connections_only')}
                        className="p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                    >
                        <option value="public">Public</option>
                        <option value="connections_only">Connections Only</option>
                    </select>
                    <div className="flex justify-end">
                        <button
                            onClick={handlePost}
                            disabled={isPosting || !newPostContent.trim()}
                            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isPosting ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Feed</h3>
                {isLoading ? (
                    <p className="text-gray-500">Loading posts...</p>
                ) : posts.length === 0 ? (
                    <p className="text-gray-500 italic">No posts yet.</p>
                ) : (
                    posts.map((post) => (
                        <div key={post.id} className="bg-white p-6 rounded shadow-sm border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="font-bold text-gray-900">
                                        {post.author_first_name} {post.author_last_name}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">
                                        {timeAgo(post.created_at)}
                                    </span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${post.visibility === 'public'
                                    ? 'bg-green-50 text-green-600 border-green-200'
                                    : 'bg-purple-50 text-purple-600 border-purple-200'
                                    }`}>
                                    {post.visibility === 'public' ? 'Public' : 'Connections'}
                                </span>
                            </div>
                            <p className="text-gray-800 whitespace-pre-wrap mb-4">{post.content}</p>

                            <div className="flex items-center space-x-4 border-t border-gray-100 pt-3">
                                <button
                                    onClick={() => toggleLike(post)}
                                    className={`flex items-center space-x-1 text-sm ${post.has_liked ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <span>{post.has_liked ? 'Liked' : 'Like'}</span>
                                    <span>({post.likes_count})</span>
                                </button>
                                <button
                                    onClick={() => toggleComments(post.id)}
                                    className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
                                >
                                    <span>Comments</span>
                                    <span>({post.comments_count})</span>
                                </button>
                            </div>

                            {expandedPostId === post.id && (
                                <div className="mt-4 bg-gray-50 p-4 rounded">
                                    <div className="space-y-3 mb-4">
                                        {comments.map(comment => (
                                            <div key={comment.id} className="text-sm">
                                                <span className="font-semibold">{comment.author_first_name} {comment.author_last_name}: </span>
                                                <span className="text-gray-800">{comment.content}</span>
                                                <div className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleString()}</div>
                                            </div>
                                        ))}
                                        {comments.length === 0 && <p className="text-gray-400 italic text-sm">No comments yet.</p>}
                                    </div>
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Write a comment..."
                                            className="flex-1 p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                                            onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                                        />
                                        <button
                                            onClick={() => handleComment(post.id)}
                                            disabled={isCommenting || !newComment.trim()}
                                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                                        >
                                            Send
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
