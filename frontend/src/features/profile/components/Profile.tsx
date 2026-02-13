import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PostCard from '../../feed/components/PostCard';
import { useProfile } from '../hooks/useProfile';
import { usePostActions } from '../../feed/hooks/usePostActions';
import type { Post, Opening } from '../../../types';

interface ProfileProps {
    currentUserId?: string;
}

export default function Profile({ currentUserId }: ProfileProps) {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        profile,
        posts,
        setPosts,
        loading,
        isLoadingPosts,
        isMe,
        targetUserId,
        updateProfile,
        handleBlockUser,
        handleUnblockUser,
        handleReportUser
    } = useProfile(id, currentUserId);

    const [isEditing, setIsEditing] = useState(false);
    const [about, setAbout] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const onPostAdded = (newPost: any) => {
        setPosts(prev => [newPost as Post, ...(prev || [])]);
    };

    const { handleLikeToggle } = usePostActions(onPostAdded);

    const onSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile(about);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save profile', error);
        } finally {
            setIsSaving(false);
        }
    };

    const onLikeToggle = (postToLike: Post | Opening) => {
        const postId = postToLike.id;
        const currentHasLiked = (postToLike as Post).has_liked;

        handleLikeToggle(postId, currentHasLiked, (newHasLiked) => {
            setPosts(prev => (prev || []).map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        has_liked: newHasLiked,
                        likes_count: newHasLiked ? Number(post.likes_count) + 1 : Number(post.likes_count) - 1
                    };
                }
                return post;
            }));
        });
    };

    const onCommentAdded = (postId: string) => {
        setPosts(prev => (prev || []).map(p => p.id === postId ? { ...p, comments_count: Number(p.comments_count) + 1 } : p));
    };

    if (loading) {
        return <div className="text-center py-20">Loading profile...</div>;
    }

    if (!profile) {
        return <div className="text-center py-20">Profile not found</div>;
    }

    return (
        <main className="max-w-[1100px] mx-auto p-4 md:py-8">
            {/* Profile Header */}
            <div className="bg-white dark:bg-[#1a242f] rounded-xl overflow-hidden shadow-sm border border-[#e8edf3] dark:border-gray-800 mb-6">
                <div className="h-32 md:h-48 bg-gradient-to-r from-primary to-blue-400 relative">
                    <button className="absolute bottom-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-all">
                        <span className="material-symbols-outlined text-sm">photo_camera</span>
                        Change Cover
                    </button>
                </div>
                <div className="px-6 pb-6 relative">
                    <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12 md:-mt-16">
                        <div className="size-24 md:size-32 rounded-xl border-4 border-white dark:border-[#1a242f] bg-white dark:bg-gray-800 overflow-hidden shadow-lg flex items-center justify-center text-primary font-bold text-4xl">
                            {profile.first_name?.[0]}
                        </div>
                        <div className="flex-1 pb-2">
                            <h1 className="text-2xl md:text-3xl font-bold">{profile.first_name} {profile.last_name}</h1>
                            <p className="text-gray-500 dark:text-gray-400">{profile.headline || 'Student'}</p>
                        </div>
                        <div className="flex gap-2 pb-2">

                            {isMe ? (
                                <button
                                    onClick={() => {
                                        setIsEditing(!isEditing);
                                        setAbout(profile.about || '');
                                    }}
                                    className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                    {isEditing ? 'Cancel' : 'Edit Profile'}
                                </button>
                            ) : (
                                <>
                                    {!profile.is_blocked && profile.connection_status === 'accepted' && (
                                        <button
                                            onClick={() => navigate(`/messages/${targetUserId}`, { state: { user: profile } })}
                                            className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">mail</span>
                                            Message
                                        </button>
                                    )}

                                    {profile.is_blocked ? (
                                        <button
                                            onClick={async () => {
                                                if (!confirm('Are you sure you want to unblock this user?')) return;
                                                try {
                                                    await handleUnblockUser();
                                                } catch (err) {
                                                    alert('Failed to unblock user');
                                                }
                                            }}
                                            className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">block</span>
                                            Unblock
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={async () => {
                                                    if (!confirm('Are you sure you want to block this user? They will not be able to message or connect with you.')) return;
                                                    try {
                                                        await handleBlockUser();
                                                    } catch (err) {
                                                        alert('Failed to block user');
                                                    }
                                                }}
                                                className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition-colors flex items-center gap-2"
                                                title="Block User"
                                            >
                                                <span className="material-symbols-outlined text-lg">block</span>
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const reason = prompt('Please provide a reason for reporting this user:');
                                                    if (!reason) return;
                                                    try {
                                                        await handleReportUser(reason);
                                                        alert('User reported successfully.');
                                                    } catch (err) {
                                                        alert('Failed to report user');
                                                    }
                                                }}
                                                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
                                                title="Report User"
                                            >
                                                <span className="material-symbols-outlined text-lg">flag</span>
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                            <button className="bg-[#e8edf3] dark:bg-gray-800 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <span className="material-symbols-outlined">share</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Sidebar: About Section */}
                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                    <div className="bg-white dark:bg-[#1a242f] rounded-xl p-6 border border-[#e8edf3] dark:border-gray-800 shadow-sm group">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">About</h3>
                            {isMe && (
                                <button className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-gray-500">info</span>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold">Bio</p>
                                    {isEditing ? (
                                        <div className="mt-2 space-y-2">
                                            <textarea
                                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-black"
                                                value={about}
                                                onChange={(e) => setAbout(e.target.value)}
                                                rows={4}
                                            />
                                            <button
                                                className="w-full py-1 bg-primary text-white text-xs font-bold rounded"
                                                onClick={onSave}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? 'Saving...' : 'Save Bio'}
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {profile.about || 'No bio yet.'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-gray-500">school</span>
                                <div>
                                    <p className="text-sm font-semibold">Major</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{profile.headline || 'Not specified'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-gray-500">calendar_today</span>
                                <div>
                                    <p className="text-sm font-semibold">Class of</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">May 2025</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-gray-500">groups</span>
                                <div>
                                    <p className="text-sm font-semibold">Bodies</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Coding Body, Hackathon Team</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1a242f] rounded-xl p-6 border border-[#e8edf3] dark:border-gray-800 shadow-sm">
                        <h3 className="text-lg font-bold mb-4">Photos</h3>
                        <div className="grid grid-cols-3 gap-2 rounded-lg overflow-hidden">
                            <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                <span className="material-symbols-outlined">image</span>
                            </div>
                            <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                <span className="material-symbols-outlined">image</span>
                            </div>
                            <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                <span className="material-symbols-outlined">image</span>
                            </div>
                            <div className="aspect-square bg-gray-200 flex items-center justify-center bg-[#e8edf3] dark:bg-gray-800 text-primary font-bold cursor-pointer hover:bg-gray-200 transition-colors">
                                +0
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Post Feed */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Create Post Shortcut */}
                    {isMe && (
                        <div className="bg-white dark:bg-[#1a242f] rounded-xl p-4 border border-[#e8edf3] dark:border-gray-800 shadow-sm flex gap-4">
                            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                                {profile.first_name?.[0]}
                            </div>
                            <button className="flex-1 bg-background-light dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-left px-4 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm">
                                What's on your mind, {profile.first_name}?
                            </button>
                            <div className="flex gap-1">
                                <button className="p-2 text-gray-500 hover:text-primary transition-colors"><span className="material-symbols-outlined">image</span></button>
                                <button className="p-2 text-gray-500 hover:text-primary transition-colors"><span className="material-symbols-outlined">event</span></button>
                            </div>
                        </div>
                    )}

                    {/* Posts */}
                    <div className="space-y-4">
                        {isLoadingPosts ? (
                            <div className="text-center py-10 text-gray-500">Loading posts...</div>
                        ) : posts.length === 0 ? (
                            <div className="bg-white dark:bg-[#1a242f] rounded-xl p-8 border border-[#e8edf3] dark:border-gray-800 text-center text-gray-500">
                                No posts yet.
                            </div>
                        ) : (
                            posts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    onLike={() => onLikeToggle(post)}
                                    onCommentAdded={onCommentAdded}
                                />
                            ))
                        )}
                    </div>

                    {posts.length > 0 && (
                        <div className="flex justify-center py-4">
                            <button className="text-primary font-semibold flex items-center gap-2 hover:underline">
                                View older posts
                                <span className="material-symbols-outlined">expand_more</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Simple Footer */}
            <footer className="mt-12 py-8 border-t border-[#e8edf3] dark:border-gray-800 text-gray-500 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <p>© 2024 CampusConnect Inc.</p>
                <div className="flex gap-6">
                    <a className="hover:text-primary" href="#">Privacy Policy</a>
                    <a className="hover:text-primary" href="#">Terms of Service</a>
                    <a className="hover:text-primary" href="#">Campus Guidelines</a>
                </div>
            </footer>
        </main>
    );
}
