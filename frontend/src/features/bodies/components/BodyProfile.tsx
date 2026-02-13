import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../../api/client';
import type { Post } from '../../../types';
import { Button } from '../../../components/ui/Button';
import PostCard from '../../feed/components/PostCard';
import { useBodyProfile } from '../hooks/useBodyProfile';
import { usePostActions } from '../../feed/hooks/usePostActions';
import { createEvent } from '../api/bodies';

export default function BodyProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    body,
    posts,
    setPosts,
    openings,
    members,
    loading,
    fetchBodyData,
    toggleFollow,
    handleRemoveMember: removeMember,
    events
  } = useBodyProfile(id);

  const [newPostContent, setNewPostContent] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onPostAdded = (item: any) => {
    setPosts(prev => [item as Post, ...(prev || [])]);
    setNewPostContent('');
  };

  const {
    posting,
    handleCreatePost,
    handleLikeToggle,
  } = usePostActions(onPostAdded);
  const [showMembers, setShowMembers] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'openings' | 'events'>('posts');

  // Create Modals states
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

  const onToggleFollow = async () => {
    await toggleFollow();
  };

  const onCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleCreatePost(newPostContent, 'public', id);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      alert(axiosError.response?.data?.error || 'Failed to create post');
    }
  };

  const onLikeToggle = (postToLike: Post) => {
    handleLikeToggle(postToLike.id, postToLike.has_liked, (newHasLiked) => {
      setPosts(prev => (prev || []).map(post => {
        if (post.id === postToLike.id) {
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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEvent({
        bodyId: id,
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
      fetchBodyData();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      alert(axiosError.response?.data?.error || 'Failed');
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
        job_type: 'full_time',
        experience_level: 'fresher'
      });
      setShowCreateOpening(false);
      fetchBodyData();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      alert(axiosError.response?.data?.error || 'Failed');
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading body profile...</div>;
  if (!body) return <div className="p-10 text-center text-red-500">Body not found</div>;

  const userRole = body.user_role;
  const canAdmin = userRole === 'BODY_ADMIN' || userRole === 'BODY_MANAGER';
  const isAdmin = userRole === 'BODY_ADMIN';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in pb-24">
      {/* Hero Header */}
      <div className="relative w-full aspect-[21/9] md:aspect-[4/1] overflow-hidden rounded-2xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-purple-900/60 z-10"></div>
        <img
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzJ1fBenYlnlrfeJpNZuctvAd6wJFrmoLueNXhwPhFjeJ3vo30E0WF99jPRcWjCQcrB-3aY0s_d-8GHuJcciJe-H2k6WO4JHteQ2mVsqYciyvVy7tTcMM7WwQGt9-_26t0NgP8H3k3xT9zpQPgLUHKyhSxS1Fzi_mAHzTJ7vz8eghj0KHSJYO90L9Ctea2973uG6M2ctWTqgPrVWCy3BI-8TizkReoKMQYDhEUReW0CwpTe8H1ZpK5eejlXVjxhol_sMkAmv-UN8o"
            alt="Hero"
        />
        <div className="absolute bottom-6 left-8 z-20">
            <div className="flex items-center gap-4">
                <div className="size-20 rounded-2xl bg-[#191022] border-2 border-white/10 flex items-center justify-center text-primary text-3xl font-extrabold shadow-2xl">
                    {body.name[0]}
                </div>
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{body.name}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Verified Organization</span>
                        {userRole && (
                            <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/10">
                                {userRole.replace('BODY_', '')}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
        <div className="absolute bottom-6 right-8 z-20 flex gap-3">
            <button
                onClick={onToggleFollow}
                className={`px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-lg ${body.is_following ? 'bg-white/10 text-white border border-white/20' : 'bg-primary text-white shadow-primary/30'}`}
            >
                {body.is_following ? 'Unfollow' : 'Follow Body'}
            </button>
            {canAdmin && (
                <button onClick={() => setShowMembers(!showMembers)} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all">
                    <span className="material-symbols-outlined">settings</span>
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Info Column */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-slate-500">
                    <span className="material-symbols-outlined text-sm">info</span>
                    About
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{body.description}</p>

                <div className="mt-6 space-y-4">
                    {body.website_url && (
                        <a href={body.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-primary text-sm font-semibold hover:underline">
                            <span className="material-symbols-outlined text-lg">language</span>
                            Official Website
                        </a>
                    )}
                    <div className="flex items-center gap-3 text-slate-400 text-sm">
                        <span className="material-symbols-outlined text-lg">groups</span>
                        1.2k Followers
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-sm">
                        <span className="material-symbols-outlined text-lg">history</span>
                        Created {new Date(body.created_at).getFullYear()}
                    </div>
                </div>
            </div>

            {/* Social Density Card (Placeholder logic) */}
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
                <h3 className="text-primary font-bold flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    Social Hub
                </h3>
                <p className="text-sm leading-relaxed text-slate-300">
                    This body is very active in your branch. <span className="font-bold text-primary">12 friends</span> are members here.
                </p>
            </div>
        </div>

        {/* Right Content Column */}
        <div className="lg:col-span-8">
            {showMembers && isAdmin ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-in fade-in slide-in-from-top-4">
                    <h2 className="text-xl font-bold text-white mb-6">Member Management</h2>
                    {/* Simplified management list for consistency */}
                    <div className="space-y-3">
                        {members.map(member => (
                            <div key={member.user_id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">{member.first_name[0]}</div>
                                    <div>
                                        <p className="text-white font-bold text-sm">{member.first_name} {member.last_name}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{member.role.replace('BODY_', '')}</p>
                                    </div>
                                </div>
                                <Button variant="danger" size="sm" onClick={() => removeMember(member.user_id)}>Remove</Button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="sticky top-[64px] z-30 bg-[#191022]/80 backdrop-blur-md border-b border-white/10">
                        <div className="flex gap-8">
                            {(['posts', 'events', 'openings'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-4 border-b-2 text-sm font-bold capitalize transition-all ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4">
                        {activeTab === 'posts' && (
                            <div className="space-y-6">
                                {canAdmin && (
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex gap-4">
                                        <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">{body.name[0]}</div>
                                        <div className="flex-1">
                                            <textarea
                                                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 py-2 resize-none"
                                                placeholder={`Post an update as ${body.name}...`}
                                                rows={2}
                                                value={newPostContent}
                                                onChange={e => setNewPostContent(e.target.value)}
                                            />
                                            <div className="flex justify-end pt-3 border-t border-white/5">
                                                <Button onClick={onCreatePost} disabled={posting || !newPostContent.trim()}>Post Update</Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {posts.map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onLike={() => onLikeToggle(post)}
                                        onCommentAdded={() => fetchBodyData()}
                                    />
                                ))}
                            </div>
                        )}

                        {activeTab === 'events' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
                                    {canAdmin && <Button size="sm" onClick={() => setShowCreateEvent(true)}>+ New Event</Button>}
                                </div>
                                {events.map(event => (
                                    <div key={event.id} onClick={() => navigate(`/events/${event.id}`)} className="bg-white/5 rounded-2xl border border-white/10 p-4 hover:border-primary/30 transition-all cursor-pointer group">
                                        <div className="flex gap-4">
                                            <div className="size-16 rounded-xl bg-slate-800 flex flex-col items-center justify-center border border-white/5">
                                                <span className="text-[10px] font-bold text-primary uppercase">{new Date(event.start_time).toLocaleString('default', { month: 'short' })}</span>
                                                <span className="text-xl font-extrabold text-white">{new Date(event.start_time).getDate()}</span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{event.title}</h4>
                                                <div className="flex items-center gap-3 mt-1 text-slate-500 text-xs">
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span> {event.location_name}</span>
                                                    <span>•</span>
                                                    <span>{new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'openings' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white">Openings</h2>
                                    {canAdmin && <Button size="sm" onClick={() => setShowCreateOpening(true)}>+ New Opening</Button>}
                                </div>
                                {openings.map(opening => (
                                    <PostCard
                                        key={opening.id}
                                        post={{
                                            id: opening.id,
                                            type: 'opening',
                                            content: opening.description,
                                            created_at: opening.created_at,
                                            title: opening.title,
                                            body_name: body.name,
                                            location_city: opening.location_city,
                                            location_country: opening.location_country,
                                            job_type: opening.job_type,
                                            experience_level: opening.experience_level,
                                            likes_count: 0,
                                            comments_count: 0,
                                            has_liked: false
                                        }}
                                        onLike={() => {}}
                                        onCommentAdded={() => {}}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>

      {showCreateOpening && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#191022] border border-white/10 rounded-2xl max-w-lg w-full p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                <h2 className="text-2xl font-bold text-white mb-6">Create New Opening</h2>
                <form onSubmit={handleCreateOpening} className="space-y-4">
                    <input className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none" placeholder="Job Title" value={newOpeningTitle} onChange={e => setNewOpeningTitle(e.target.value)} required />
                    <textarea className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none" placeholder="Description" rows={3} value={newOpeningDesc} onChange={e => setNewOpeningDesc(e.target.value)} required />
                    <div className="grid grid-cols-2 gap-4">
                        <input className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none" placeholder="City" value={newOpeningLocationCity} onChange={e => setNewOpeningLocationCity(e.target.value)} required />
                        <input className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none" placeholder="Country" value={newOpeningLocationCountry} onChange={e => setNewOpeningLocationCountry(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setShowCreateOpening(false)} className="px-6 py-2 text-white font-bold">Cancel</button>
                        <Button type="submit">Create Opening</Button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {showCreateEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#191022] border border-white/10 rounded-2xl max-w-lg w-full p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                <h2 className="text-2xl font-bold text-white mb-6">Create New Event</h2>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                    <input className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none" placeholder="Event Title" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} required />
                    <textarea className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none" placeholder="Description" rows={3} value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} required />
                    <input className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none" placeholder="Location Name" value={newEventLocation} onChange={e => setNewEventLocation(e.target.value)} required />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 font-bold mb-1 block">Start</label>
                            <input type="datetime-local" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none" value={newEventStartTime} onChange={e => setNewEventStartTime(e.target.value)} required />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold mb-1 block">End</label>
                            <input type="datetime-local" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none" value={newEventEndTime} onChange={e => setNewEventEndTime(e.target.value)} required />
                        </div>
                    </div>
                    <input type="number" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none" placeholder="Capacity (Optional)" value={newEventCapacity} onChange={e => setNewEventCapacity(e.target.value)} />
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setShowCreateEvent(false)} className="px-6 py-2 text-white font-bold">Cancel</button>
                        <Button type="submit">Create Event</Button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
