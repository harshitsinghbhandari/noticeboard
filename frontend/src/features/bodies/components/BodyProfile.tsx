import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Post, Opening, BodyRole } from '../../../types';
import PostCard from '../../feed/components/PostCard';
import apiClient from '../../../api/client';
import { useBodyProfile } from '../hooks/useBodyProfile';
import { usePostActions } from '../../feed/hooks/usePostActions';
import EventCard from './EventCard';
import { createEvent } from '../api/bodies';

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
    handleChangeRole: changeRole,
    events
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

  const [newPostContent, setNewPostContent] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<BodyRole>('BODY_MEMBER');
  const [addingMember, setAddingMember] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'openings' | 'events'>('posts');

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventStartTime, setNewEventStartTime] = useState('');
  const [newEventEndTime, setNewEventEndTime] = useState('');
  const [newEventCapacity, setNewEventCapacity] = useState('');

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
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create post');
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
      alert('Failed to create opening');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEvent({
        bodyId: id!,
        title: newEventTitle,
        description: newEventDesc,
        location_name: newEventLocation,
        latitude: 0,
        longitude: 0,
        start_time: new Date(newEventStartTime).toISOString(),
        end_time: new Date(newEventEndTime).toISOString(),
        capacity: newEventCapacity ? parseInt(newEventCapacity) : null
      });
      setShowCreateEvent(false);
      setNewEventTitle('');
      setNewEventDesc('');
      setNewEventLocation('');
      setNewEventStartTime('');
      setNewEventEndTime('');
      setNewEventCapacity('');
      fetchBodyData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create event');
    }
  };

  if (loading) return <div className="p-20 text-center text-white">Syncing Body Pulse...</div>;
  if (!body) return <div className="p-20 text-center text-white">Body Heartbeat not found.</div>;

  const userRole = body.user_role;
  const canPost = !!userRole;
  const canCreateEvent = userRole === 'BODY_ADMIN' || userRole === 'BODY_MANAGER';
  const isAdmin = userRole === 'BODY_ADMIN';

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* Header Card */}
      <div className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="h-32 md:h-48 bg-gradient-to-r from-primary to-purple-600 relative">
            <div className="absolute -bottom-10 left-8 p-1 bg-background-dark rounded-2xl">
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-4xl shadow-xl">
                    {body.name[0]}
                </div>
            </div>
        </div>
        <div className="pt-12 pb-8 px-8 flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-extrabold text-white">{body.name}</h1>
                    {userRole && (
                        <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded-full border border-primary/30 uppercase tracking-widest">
                            {userRole.replace('BODY_', '')}
                        </span>
                    )}
                </div>
                <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">{body.description}</p>
                {body.website_url && (
                    <a href={body.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline text-xs font-bold mt-2">
                        <span className="material-symbols-outlined text-sm">language</span>
                        Official Pulse
                    </a>
                )}
            </div>
            <div className="flex gap-3">
                {isAdmin && (
                    <button
                        onClick={() => setShowMembers(!showMembers)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${showMembers ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                    >
                        {showMembers ? 'Pulse Posts' : 'Manage Pulsars'}
                    </button>
                )}
                <button
                    onClick={onToggleFollow}
                    className={`px-6 py-2 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95 ${body.is_following ? 'bg-white/10 text-white border border-white/20' : 'bg-primary text-white shadow-primary/20'}`}
                >
                    {body.is_following ? 'Unfollow Pulse' : 'Follow Pulse'}
                </button>
            </div>
        </div>
      </div>

      {showMembers && isAdmin ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-8 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Pulsar Management</h2>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{members.length} Total</span>
          </div>

          <form onSubmit={onAddMember} className="flex gap-3">
            <input
              type="text"
              placeholder="Pulsar User ID"
              value={newMemberUserId}
              onChange={e => setNewMemberUserId(e.target.value)}
              className="flex-grow p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:ring-1 focus:ring-primary outline-none"
              required
            />
            <select
              value={newMemberRole}
              onChange={e => setNewMemberRole(e.target.value as BodyRole)}
              className="p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none cursor-pointer"
            >
              <option value="BODY_MEMBER">Member</option>
              <option value="BODY_MANAGER">Manager</option>
              <option value="BODY_ADMIN">Admin</option>
            </select>
            <button
                type="submit"
                disabled={addingMember}
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all text-xs"
            >
                Add Pulsar
            </button>
          </form>

          <div className="space-y-3">
            {members.map(member => (
              <div key={member.user_id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">{member.first_name[0]}</div>
                  <div>
                    <p className="font-bold text-white text-sm">{member.first_name} {member.last_name}</p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                  <select
                    value={member.role}
                    onChange={e => changeRole(member.user_id, e.target.value as BodyRole)}
                    className="p-2 bg-transparent text-slate-300 text-xs font-bold outline-none border-none cursor-pointer hover:text-white"
                  >
                    <option value="BODY_MEMBER" className="bg-background-dark text-white">Member</option>
                    <option value="BODY_MANAGER" className="bg-background-dark text-white">Manager</option>
                    <option value="BODY_ADMIN" className="bg-background-dark text-white">Admin</option>
                  </select>
                  <button
                    onClick={() => removeMember(member.user_id)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">person_remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex bg-white/5 p-1 rounded-xl w-fit">
            <button
              className={`px-8 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'posts' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setActiveTab('posts')}
            >
              Feed
            </button>
            <button
              className={`px-8 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'events' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
            <button
              className={`px-8 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'openings' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setActiveTab('openings')}
            >
              Openings
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
                {activeTab === 'posts' && (
                    <div className="space-y-6">
                    {canPost && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                            <div className="flex gap-4">
                                <div className="h-10 w-10 rounded-xl bg-primary flex-shrink-0 flex items-center justify-center text-white font-bold">
                                    {body.name[0]}
                                </div>
                                <textarea
                                    className="w-full bg-transparent border-none resize-none focus:ring-0 text-lg placeholder-slate-600 text-white"
                                    placeholder={`Echo a pulse for ${body.name}...`}
                                    rows={2}
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end pt-3 border-t border-white/5">
                                <button
                                    onClick={onCreatePost}
                                    disabled={!newPostContent.trim() || posting}
                                    className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all text-xs"
                                >
                                    {posting ? 'Syncing...' : 'Broadcast Pulse'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        {posts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onLike={() => onLikeToggle(post)}
                                onCommentAdded={onCommentAdded}
                            />
                        ))}
                        {posts.length === 0 && (
                            <div className="py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl">
                                <p className="text-slate-500 italic">This body has no pulse posts yet.</p>
                            </div>
                        )}
                    </div>
                    </div>
                )}

                {activeTab === 'events' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Upcoming Pulse Events</h2>
                            {canCreateEvent && (
                                <button
                                    onClick={() => setShowCreateEvent(true)}
                                    className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow-lg transition-all text-xs"
                                >
                                    + Add Event
                                </button>
                            )}
                        </div>

                        {showCreateEvent && (
                            <div className="fixed inset-0 z-[70] bg-background-dark/80 backdrop-blur-md flex items-center justify-center p-4">
                                <div className="bg-[#1a1223] border border-primary/20 p-8 rounded-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                                    <h3 className="text-2xl font-bold text-white mb-6">Create New Pulse Event</h3>
                                    <form onSubmit={handleCreateEvent} className="space-y-4">
                                        <input
                                            placeholder="Pulse Title"
                                            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-primary"
                                            value={newEventTitle}
                                            onChange={e => setNewEventTitle(e.target.value)}
                                            required
                                        />
                                        <textarea
                                            placeholder="Event Heartbeat (Description)"
                                            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-primary"
                                            rows={3}
                                            value={newEventDesc}
                                            onChange={e => setNewEventDesc(e.target.value)}
                                            required
                                        />
                                        <input
                                            placeholder="Location Coordinate"
                                            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-primary"
                                            value={newEventLocation}
                                            onChange={e => setNewEventLocation(e.target.value)}
                                            required
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Starts</label>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs outline-none"
                                                    value={newEventStartTime}
                                                    onChange={e => setNewEventStartTime(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Ends</label>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs outline-none"
                                                    value={newEventEndTime}
                                                    onChange={e => setNewEventEndTime(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-6">
                                            <button type="button" onClick={() => setShowCreateEvent(false)} className="flex-1 py-3 text-slate-400 font-bold">Cancel</button>
                                            <button type="submit" className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl shadow-lg">Broadcast Event</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {events.map(event => (
                                <EventCard key={event.id} event={event} onJoin={() => fetchBodyData()} />
                            ))}
                            {events.length === 0 && (
                                <div className="py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl text-slate-500">
                                    No scheduled pulses yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'openings' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Body Openings</h2>
                            {canCreateEvent && (
                                <button
                                    onClick={() => setShowCreateOpening(true)}
                                    className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow-lg transition-all text-xs"
                                >
                                    + Add Opening
                                </button>
                            )}
                        </div>

                        {showCreateOpening && (
                            <div className="fixed inset-0 z-[70] bg-background-dark/80 backdrop-blur-md flex items-center justify-center p-4">
                                <div className="bg-[#1a1223] border border-primary/20 p-8 rounded-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                                    <h3 className="text-2xl font-bold text-white mb-6">New Pulse Opening</h3>
                                    <form onSubmit={handleCreateOpening} className="space-y-4">
                                        <input
                                            placeholder="Role Title"
                                            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none"
                                            value={newOpeningTitle}
                                            onChange={e => setNewOpeningTitle(e.target.value)}
                                            required
                                        />
                                        <textarea
                                            placeholder="Role Mission (Description)"
                                            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none"
                                            rows={3}
                                            value={newOpeningDesc}
                                            onChange={e => setNewOpeningDesc(e.target.value)}
                                            required
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                placeholder="Location"
                                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none"
                                                value={newOpeningLocationCity}
                                                onChange={e => setNewOpeningLocationCity(e.target.value)}
                                                required
                                            />
                                            <select
                                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none"
                                                value={newOpeningJobType}
                                                onChange={e => setNewOpeningJobType(e.target.value)}
                                            >
                                                <option value="full_time" className="bg-background-dark text-white">Full Time</option>
                                                <option value="part_time" className="bg-background-dark text-white">Part Time</option>
                                                <option value="internship" className="bg-background-dark text-white">Internship</option>
                                            </select>
                                            <select
                                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none mt-3"
                                                value={newOpeningExpLevel}
                                                onChange={e => setNewOpeningExpLevel(e.target.value)}
                                            >
                                                <option value="fresher" className="bg-background-dark text-white">Fresher</option>
                                                <option value="1-2_years" className="bg-background-dark text-white">1-2 Years</option>
                                                <option value="3+_years" className="bg-background-dark text-white">3+ Years</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-3 pt-6">
                                            <button type="button" onClick={() => setShowCreateOpening(false)} className="flex-1 py-3 text-slate-400 font-bold">Cancel</button>
                                            <button type="submit" className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl shadow-lg">Open Role</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            {openings.map(opening => (
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
                            ))}
                            {openings.length === 0 && (
                                <div className="py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl text-slate-500">
                                    No roles available in this heartbeat.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="lg:col-span-4 space-y-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">groups</span>
                        Top Pulsars
                    </h3>
                    <div className="space-y-4">
                        {members.slice(0, 5).map(member => (
                            <div key={member.user_id} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {member.first_name[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white leading-none">{member.first_name} {member.last_name}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{member.role.replace('BODY_', '')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
