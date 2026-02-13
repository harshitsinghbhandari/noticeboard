import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Post, Opening, BodyRole } from '../../../types';
import { Button } from '../../../components/ui/Button';
import PostCard from '../../feed/components/PostCard';
import apiClient from '../../../api/client';
import { useBodyProfile } from '../hooks/useBodyProfile';
import { usePostActions } from '../../feed/hooks/usePostActions';

export default function BodyProfile() {
  const { id } = useParams();
  const {
    body,
    posts,
    setPosts,
    openings,
    members,
    loading,
    fetchBodyData,
    toggleFollow,
    handleAddMember: addMember,
    handleRemoveMember: removeMember,
    handleChangeRole: changeRole
  } = useBodyProfile(id);

  const onPostAdded = (newPost: any) => {
    setPosts(prev => [newPost as Post, ...(prev || [])]);
    setNewPostContent('');
  };

  const {
    posting,
    handleCreatePost,
    handleLikeToggle,
  } = usePostActions(onPostAdded);

  // New Post State
  const [newPostContent, setNewPostContent] = useState('');

  // Member Management State
  const [showMembers, setShowMembers] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<BodyRole>('BODY_MEMBER');
  const [addingMember, setAddingMember] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'posts' | 'openings'>('posts');

  // Create Opening State
  const [showCreateOpening, setShowCreateOpening] = useState(false);
  const [newOpeningTitle, setNewOpeningTitle] = useState('');
  const [newOpeningDesc, setNewOpeningDesc] = useState('');
  const [newOpeningLocationCity, setNewOpeningLocationCity] = useState('');
  const [newOpeningLocationCountry, setNewOpeningLocationCountry] = useState('');
  const [newOpeningJobType, setNewOpeningJobType] = useState('full_time');
  const [newOpeningExpLevel, setNewOpeningExpLevel] = useState('fresher');

  const onToggleFollow = async () => {
    await toggleFollow();
  };

  const onCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleCreatePost(newPostContent, 'public', id);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      const errorMessage = error.response?.data?.error || 'Failed to create post';
      alert(errorMessage);
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
    setPosts(prev => (prev || []).map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments_count: Number(post.comments_count) + 1
        };
      }
      return post;
    }));
  };

  const onAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMember(true);
    try {
      await addMember(newMemberUserId, newMemberRole);
      setNewMemberUserId('');
    } catch (err) {
      alert('Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleCreateOpening = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/openings', {
        body_id: id,
        title: newOpeningTitle,
        description: newOpeningDesc,
        location_city: newOpeningLocationCity,
        location_country: newOpeningLocationCountry,
        job_type: newOpeningJobType,
        experience_level: newOpeningExpLevel
      });
      setShowCreateOpening(false);
      setNewOpeningTitle('');
      setNewOpeningDesc('');
      setNewOpeningLocationCity('');
      setNewOpeningLocationCountry('');
      fetchBodyData();
    } catch (err) {
      console.error('Failed to create opening', err);
      alert('Failed to create opening');
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
            <Button variant={body.is_following ? 'outline' : 'primary'} onClick={onToggleFollow}>
              {body.is_following ? 'Unfollow' : 'Follow'}
            </Button>
          </div>
        </div>
        <p className="mt-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{body.description}</p>
      </div>

      {showMembers && isAdmin ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4">Member Management</h2>

          <form onSubmit={onAddMember} className="mb-6 flex gap-2">
            <input
              type="text"
              placeholder="User ID"
              value={newMemberUserId}
              onChange={e => setNewMemberUserId(e.target.value)}
              className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-black"
              required
            />
            <select
              value={newMemberRole}
              onChange={e => setNewMemberRole(e.target.value as BodyRole)}
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-black"
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
                    onChange={e => changeRole(member.user_id, e.target.value as BodyRole)}
                    className="p-1 border rounded text-sm dark:bg-gray-700 text-black"
                  >
                    <option value="BODY_MEMBER">Member</option>
                    <option value="BODY_MANAGER">Manager</option>
                    <option value="BODY_ADMIN">Admin</option>
                  </select>
                  <Button variant="danger" size="sm" onClick={() => removeMember(member.user_id)}>Remove</Button>
                </div>
              </div>
            ))}
            {members.length === 0 && <p className="text-center text-gray-500">No members found.</p>}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              className={`py-2 px-4 font-semibold ${activeTab === 'posts' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('posts')}
            >
              Posts
            </button>
            <button
              className={`py-2 px-4 font-semibold ${activeTab === 'openings' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('openings')}
            >
              Openings
            </button>
          </div>

          {activeTab === 'posts' && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl font-bold mb-4">Latest Updates</h2>

              {canPost && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                  <form onSubmit={onCreatePost}>
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
                    onLike={() => onLikeToggle(post)}
                    onCommentAdded={onCommentAdded}
                  />
                ))
              ) : (
                <div className="bg-white dark:bg-gray-800 p-4 rounded shadow border border-gray-200 dark:border-gray-700 text-center text-gray-500">
                  No posts yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'openings' && (
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Openings</h2>
                {canCreateEvent && (
                  <Button size="sm" onClick={() => setShowCreateOpening(true)}>+ Create Opening</Button>
                )}
              </div>

              {showCreateOpening && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
                    <h3 className="text-xl font-bold mb-4">Create New Opening</h3>
                    <form onSubmit={handleCreateOpening} className="space-y-4">
                      <input
                        placeholder="Job Title"
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-black"
                        value={newOpeningTitle}
                        onChange={e => setNewOpeningTitle(e.target.value)}
                        required
                      />
                      <textarea
                        placeholder="Description"
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-black"
                        rows={3}
                        value={newOpeningDesc}
                        onChange={e => setNewOpeningDesc(e.target.value)}
                        required
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="City"
                          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-black"
                          value={newOpeningLocationCity}
                          onChange={e => setNewOpeningLocationCity(e.target.value)}
                          required
                        />
                        <input
                          placeholder="Country"
                          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-black"
                          value={newOpeningLocationCountry}
                          onChange={e => setNewOpeningLocationCountry(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-black"
                          value={newOpeningJobType}
                          onChange={e => setNewOpeningJobType(e.target.value)}
                        >
                          <option value="full_time">Full Time</option>
                          <option value="part_time">Part Time</option>
                          <option value="internship">Internship</option>
                        </select>
                        <select
                          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-black"
                          value={newOpeningExpLevel}
                          onChange={e => setNewOpeningExpLevel(e.target.value)}
                        >
                          <option value="fresher">Fresher</option>
                          <option value="1-2_years">1-2 Years</option>
                          <option value="3+_years">3+ Years</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" type="button" onClick={() => setShowCreateOpening(false)}>Cancel</Button>
                        <Button type="submit">Create</Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {openings.length > 0 ? (
                  openings.map(opening => (
                    <PostCard
                      key={opening.id}
                      post={{
                        id: opening.id,
                        type: 'opening',
                        content: opening.description,
                        created_at: opening.created_at,
                        likes_count: 0,
                        has_liked: false,
                        comments_count: 0,
                        title: opening.title,
                        job_type: opening.job_type,
                        experience_level: opening.experience_level,
                        location_city: opening.location_city,
                        location_country: opening.location_country,
                        body_name: body.name
                      } as any}
                      onLike={() => { }}
                      onCommentAdded={() => { }}
                    />
                  ))
                ) : (
                  <div className="bg-white dark:bg-gray-800 p-8 rounded shadow border border-gray-200 dark:border-gray-700 text-center text-gray-500">
                    <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">work_off</span>
                    <p>No active openings at this time.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
