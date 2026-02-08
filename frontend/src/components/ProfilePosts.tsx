import { useState, useEffect } from 'react';
import { timeAgo } from '../utils/timeAgo';

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

    return (
        <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">My Posts</h3>
            {isLoading ? (
                <p className="text-gray-500">Loading posts...</p>
            ) : posts.length === 0 ? (
                <p className="text-gray-500 italic">No posts yet.</p>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <div key={post.id} className="bg-white p-6 rounded shadow-sm border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs text-gray-500">
                                    {timeAgo(post.created_at)}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${post.visibility === 'public'
                                    ? 'bg-green-50 text-green-600 border-green-200'
                                    : 'bg-purple-50 text-purple-600 border-purple-200'
                                    }`}>
                                    {post.visibility === 'public' ? 'Public' : 'Connections'}
                                </span>
                            </div>
                            <p className="text-gray-800 whitespace-pre-wrap mb-4">{post.content}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>{post.likes_count} Likes</span>
                                <span>{post.comments_count} Comments</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
