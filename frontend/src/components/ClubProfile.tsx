import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { Club, Post, Opening } from '../types';
import { Button } from './ui/Button';
import PostCard from './PostCard';
import apiClient from '../api/client';

interface ClubProfileProps {
  currentUserId?: string;
  userRoles?: string[];
}

export default function ClubProfile({ currentUserId, userRoles = [] }: ClubProfileProps) {
  const { id } = useParams();
  const [club, setClub] = useState<Club | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);

  // New Post State
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchClubData = useCallback(async () => {
    try {
      const [clubRes, openingsRes, postsRes] = await Promise.all([
        apiClient.get(`/clubs/${id}`),
        apiClient.get(`/openings?club_id=${id}`),
        apiClient.get(`/clubs/${id}/posts`)
      ]);

      setClub(clubRes.data);
      setOpenings(openingsRes.data);
      setPosts(postsRes.data);
    } catch (err) {
      console.error('Failed to fetch club data', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchClubData();
    }
  }, [id, fetchClubData]);

  const toggleFollow = async () => {
    if (!club) return;
    try {
      if (club.is_following) {
        await apiClient.delete(`/clubs/${id}/follow`);
      } else {
        await apiClient.post(`/clubs/${id}/follow`);
      }
      setClub({ ...club, is_following: !club.is_following });
    } catch (err) {
      console.error('Failed to toggle follow', err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setPosting(true);
    try {
      const res = await apiClient.post('/posts', {
        content: newPostContent,
        club_id: id,
        visibility: 'public' // Club posts are usually public
      });

      const newPost = res.data;

      if (newPost) {
        // Transform to match Post type if needed (FeedItem has 'type')
        const newPostTyped: Post = {
          ...newPost,
          likes_count: 0,
          has_liked: false,
          comments_count: 0,
          type: 'post'
        };
        setPosts(prev => [newPostTyped, ...prev]);
        setNewPostContent('');
      } else {
        fetchClubData(); // Fallback
      }

    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      console.error('Failed to create post', error);
      const errorMessage = error.response?.data?.error || 'Failed to create post';
      alert(errorMessage);
    } finally {
      setPosting(false);
    }
  };


  const handleLikeToggle = (postId: string, currentHasLiked: boolean) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          has_liked: !post.has_liked,
          likes_count: post.has_liked ? Number(post.likes_count) - 1 : Number(post.likes_count) + 1
        };
      }
      return post;
    }));

    if (currentHasLiked) {
      apiClient.delete(`/posts/${postId}/like`).catch(err => console.error("Failed to unlike", err));
    } else {
      apiClient.post(`/posts/${postId}/like`).catch(err => console.error("Failed to like", err));
    }
  };

  const handleCommentAdded = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments_count: Number(post.comments_count) + 1
        };
      }
      return post;
    }));
  };

  if (loading) return <div className="p-4">Loading club...</div>;
  if (!club) return <div className="p-4">Club not found</div>;

  const isAdmin = club.admin_id === currentUserId;
  // Check if user has CONVENER role AND is the admin of this club
  const canPost = isAdmin && userRoles.includes('CLUB_CONVENER');

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl text-black font-bold">{club.name}</h1>
              {isAdmin && (
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full border border-primary/20">
                  Admin
                </span>
              )}
            </div>
            {club.website_url && (
              <a href={club.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {club.website_url}
              </a>
            )}
          </div>
          <Button variant={club.is_following ? 'outline' : 'primary'} onClick={toggleFollow} className="text-black">
            {club.is_following ? 'Unfollow' : 'Follow'}
          </Button>
        </div>
        <p className="mt-4 text-gray-700 whitespace-pre-wrap">{club.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Latest Updates</h2>

          {/* Create Post Widget for Conveners */}
          {canPost && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 animate-fade-in">
              <form onSubmit={handleCreatePost}>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary font-bold">
                    {club.name[0]}
                  </div>
                  <div className="flex-grow">
                    <textarea
                      className="w-full bg-transparent border-none resize-none focus:ring-0 text-lg placeholder-gray-400 dark:text-gray-100"
                      placeholder={`Post an update for ${club.name}...`}
                      rows={2}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end items-center mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <Button type="submit" disabled={!newPostContent.trim() || posting}>
                    {posting ? 'Posting...' : 'Post Update'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {posts.length > 0 ? (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLike={() => handleLikeToggle(post.id, post.has_liked)}
                onCommentAdded={handleCommentAdded}
              />
            ))
          ) : (
            <div className="bg-white p-4 rounded shadow border border-gray-200 text-center text-gray-500">
              No posts yet.
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Openings</h2>
          {openings.length > 0 ? (
            openings.map(opening => (
              <div key={opening.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-4">
                <h3 className="font-bold text-lg">{opening.title}</h3>
                <p className="text-sm text-gray-600">{opening.job_type} • {opening.experience_level}</p>
                <p className="text-sm text-gray-500">{opening.location_city}, {opening.location_country}</p>
                <Button variant="ghost" size="sm" className="mt-2 w-full">Apply Now</Button>
              </div>
            ))
          ) : (
            <div className="bg-white p-4 rounded shadow border border-gray-200 text-center text-gray-500">
              No active openings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
