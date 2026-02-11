import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { Body, Post, Opening, BodyMember, BodyRole } from '../types';
import { Button } from './ui/Button';
import PostCard from './PostCard';
import apiClient from '../api/client';

export default function BodyProfile() {
  const { id } = useParams();
  const [body, setBody] = useState<Body | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);

  // New Post State
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  // Member Management State
  const [members, setMembers] = useState<BodyMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<BodyRole>('BODY_MEMBER');
  const [addingMember, setAddingMember] = useState(false);

  const fetchBodyData = useCallback(async () => {
    try {
      const [bodyRes, openingsRes, postsRes] = await Promise.all([
        apiClient.get(`/bodies/${id}`),
        apiClient.get(`/openings?body_id=${id}`),
        apiClient.get(`/bodies/${id}/posts`)
      ]);

      setBody(bodyRes.data);
      setOpenings(openingsRes.data);
      setPosts(postsRes.data);

      if (bodyRes.data.user_role === 'BODY_ADMIN') {
          const membersRes = await apiClient.get(`/bodies/${id}/members`);
          setMembers(membersRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch body data', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchBodyData();
    }
  }, [id, fetchBodyData]);

  const toggleFollow = async () => {
    if (!body) return;
    try {
      if (body.is_following) {
        await apiClient.delete(`/bodies/${id}/follow`);
      } else {
        await apiClient.post(`/bodies/${id}/follow`);
      }
      setBody({ ...body, is_following: !body.is_following });
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
        body_id: id,
        visibility: 'public'
      });

      const newPost = res.data;

      if (newPost) {
        const newPostTyped: Post = {
          ...newPost,
          likes_count: 0,
          has_liked: false,
          comments_count: 0
        };
        setPosts(prev => [newPostTyped, ...prev]);
        setNewPostContent('');
      } else {
        fetchBodyData();
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

  const handleLikeToggle = (postToLike: Post | Opening) => {
    // Only posts can be liked in this UI currently
    const postId = postToLike.id;
    const currentHasLiked = (postToLike as Post).has_liked;

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

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMember(true);
    try {
        await apiClient.post(`/bodies/${id}/members`, {
            user_id: newMemberUserId,
            role: newMemberRole
        });
        setNewMemberUserId('');
        // Refresh members
        const membersRes = await apiClient.get(`/bodies/${id}/members`);
        setMembers(membersRes.data);
    } catch (err) {
        console.error('Failed to add member', err);
        alert('Failed to add member');
    } finally {
        setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
        await apiClient.delete(`/bodies/${id}/members/${userId}`);
        setMembers(prev => prev.filter(m => m.user_id !== userId));
    } catch (err) {
        console.error('Failed to remove member', err);
    }
  };

  const handleChangeRole = async (userId: string, role: BodyRole) => {
    try {
        await apiClient.put(`/bodies/${id}/members/${userId}`, { role });
        setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role } : m));
    } catch (err) {
        console.error('Failed to change role', err);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading body...</div>;
  if (!body) return <div className="p-4 text-center">Body not found</div>;

  const userRole = body.user_role;
  const canPost = !!userRole;
  const canCreateEvent = userRole === 'BODY_ADMIN' || userRole === 'BODY_MANAGER';
  const isAdmin = userRole === 'BODY_ADMIN';

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{body.name}</h1>
              {userRole && (
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full border border-primary/20">
                  {userRole.replace('BODY_', '')}
                </span>
              )}
            </div>
            {body.website_url && (
              <a href={body.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {body.website_url}
              </a>
            )}
          </div>
          <div className="flex gap-2">
            {isAdmin && (
                <Button variant="outline" onClick={() => setShowMembers(!showMembers)}>
                    {showMembers ? 'Show Posts' : 'Manage Members'}
                </Button>
            )}
            <Button variant={body.is_following ? 'outline' : 'primary'} onClick={toggleFollow}>
                {body.is_following ? 'Unfollow' : 'Follow'}
            </Button>
          </div>
        </div>
        <p className="mt-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{body.description}</p>
      </div>

      {showMembers && isAdmin ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4">Member Management</h2>

              <form onSubmit={handleAddMember} className="mb-6 flex gap-2">
                  <input
                    type="text"
                    placeholder="User ID"
                    value={newMemberUserId}
                    onChange={e => setNewMemberUserId(e.target.value)}
                    className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                  <select
                    value={newMemberRole}
                    onChange={e => setNewMemberRole(e.target.value as BodyRole)}
                    className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  >
                      <option value="BODY_MEMBER">Member</option>
                      <option value="BODY_MANAGER">Manager</option>
                      <option value="BODY_ADMIN">Admin</option>
                  </select>
                  <Button type="submit" disabled={addingMember}>Add Member</Button>
              </form>

              <div className="space-y-4">
                  {members.map(member => (
                      <div key={member.user_id} className="flex justify-between items-center p-3 border-b dark:border-gray-700">
                          <div>
                              <p className="font-semibold">{member.first_name} {member.last_name}</p>
                              <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                          <div className="flex gap-2 items-center">
                              <select
                                value={member.role}
                                onChange={e => handleChangeRole(member.user_id, e.target.value as BodyRole)}
                                className="p-1 border rounded text-sm dark:bg-gray-700"
                              >
                                  <option value="BODY_MEMBER">Member</option>
                                  <option value="BODY_MANAGER">Manager</option>
                                  <option value="BODY_ADMIN">Admin</option>
                              </select>
                              <Button variant="danger" size="sm" onClick={() => handleRemoveMember(member.user_id)}>Remove</Button>
                          </div>
                      </div>
                  ))}
                  {members.length === 0 && <p className="text-center text-gray-500">No members found.</p>}
              </div>
          </div>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold mb-4">Latest Updates</h2>

              {canPost && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                  <form onSubmit={handleCreatePost}>
                    <div className="flex gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary font-bold">
                        {body.name[0]}
                      </div>
                      <div className="flex-grow">
                        <textarea
                          className="w-full bg-transparent border-none resize-none focus:ring-0 text-lg placeholder-gray-400 dark:text-gray-100"
                          placeholder={`Post an update for ${body.name}...`}
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
                    onLike={() => handleLikeToggle(post)}
                    onCommentAdded={handleCommentAdded}
                  />
                ))
              ) : (
                <div className="bg-white dark:bg-gray-800 p-4 rounded shadow border border-gray-200 dark:border-gray-700 text-center text-gray-500">
                  No posts yet.
                </div>
              )}
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Openings</h2>
                  {canCreateEvent && (
                      <Button size="sm" onClick={() => alert('Create Opening logic not fully implemented in UI yet')}>+ New</Button>
                  )}
              </div>
              {openings.length > 0 ? (
                openings.map(opening => (
                  <div key={opening.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-4">
                    <h3 className="font-bold text-lg">{opening.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{opening.job_type} • {opening.experience_level}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">{opening.location_city}, {opening.location_country}</p>
                    <Button variant="ghost" size="sm" className="mt-2 w-full">Apply Now</Button>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-gray-800 p-4 rounded shadow border border-gray-200 dark:border-gray-700 text-center text-gray-500">
                  No active openings.
                </div>
              )}
            </div>
          </div>
      )}
    </div>
  );
}
