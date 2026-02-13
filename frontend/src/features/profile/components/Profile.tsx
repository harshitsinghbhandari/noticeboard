import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useApi } from '../../../hooks/useApi';
import { usePostActions } from '../../feed/hooks/usePostActions';
import * as bodiesApi from '../../bodies/api/bodies';
import * as eventsApi from '../../events/api/events';
import PostCard from '../../feed/components/PostCard';
import type { Body, Event, Post } from '../../../types';

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
        updateProfile,
    } = useProfile(id, currentUserId);

    const [isEditing, setIsEditing] = useState(false);
    const [about, setAbout] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const { data: followedClubs } = useApi(bodiesApi.getFollowedBodies);
    const { data: goingEvents } = useApi(() => eventsApi.getEvents());

    const { handleLikeToggle } = usePostActions();

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

    if (loading) return <div className="text-center py-20">Loading profile...</div>;
    if (!profile) return <div className="text-center py-20">Profile not found</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 animate-fade-in">
            {/* Left Column: Identity & Social Density */}
            <div className="lg:col-span-4 space-y-6">
                {/* Profile Card */}
                <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 p-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-purple-400 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <img
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDeQHhqu9qYMlLqME_TYHru-ajD0aOiwiedNSKBbtIXMEUTj72RAbb-oXUPqAUOQJvv-o4RfS-pGH6nbssBmA8Y-uh6GSG2SQIll_eUdRvTuop6K1FoozciGOC-02Nwb3_kDXSa69kMBmI-wQs99wV9uQqHIHrc7cyOmHnvDqfgCk1PskMbbgzVLucgSiY6HdCNv8fWwOrUxAdZOAASs0DVmo5HkzTQ4bUS4f9b4M-NmQbKLGzuove-75pXvpJR3UyQp0s5MzscLZs"
                                alt="Profile Avatar"
                                className="relative w-32 h-32 rounded-full border-4 border-background-dark mb-4 object-cover"
                            />
                            <div className="absolute bottom-6 right-2 w-6 h-6 bg-green-500 border-4 border-background-dark rounded-full"></div>
                        </div>
                        <h2 className="text-2xl font-bold text-white">{profile.first_name} {profile.last_name}</h2>
                        <p className="text-primary font-semibold text-sm">{profile.headline || 'Student'}</p>

                        {isEditing ? (
                            <div className="mt-2 w-full space-y-2">
                                <textarea
                                    className="w-full bg-background-dark/50 border border-primary/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                                    value={about}
                                    onChange={(e) => setAbout(e.target.value)}
                                    rows={3}
                                />
                                <div className="flex gap-2">
                                    <button onClick={onSave} disabled={isSaving} className="flex-1 py-1.5 bg-primary text-white text-xs font-bold rounded-lg disabled:opacity-50">Save</button>
                                    <button onClick={() => setIsEditing(false)} className="flex-1 py-1.5 bg-white/5 text-white text-xs font-bold rounded-lg">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{profile.about || 'Campus Member'}</p>
                        )}

                        <div className="grid grid-cols-3 w-full gap-4 mt-8 border-t border-slate-200 dark:border-white/10 pt-6">
                            <div>
                                <p className="text-lg font-bold text-white">42</p>
                                <p className="text-[10px] uppercase tracking-wider text-slate-500">Events</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-white">156</p>
                                <p className="text-[10px] uppercase tracking-wider text-slate-500">Mutuals</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-white">12</p>
                                <p className="text-[10px] uppercase tracking-wider text-slate-500">Clubs</p>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full mt-6">
                            {isMe ? (
                                <button
                                    onClick={() => { setIsEditing(true); setAbout(profile.about || ''); }}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2 rounded-lg transition-all text-sm"
                                >
                                    Edit Profile
                                </button>
                            ) : (
                                <button className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2 rounded-lg transition-all text-sm">Follow</button>
                            )}
                            <button
                                onClick={() => navigate(`/messages/user/${profile.id}`)}
                                className="px-3 bg-slate-200 dark:bg-white/10 hover:bg-primary/20 hover:text-primary rounded-lg transition-all text-slate-400"
                            >
                                <span className="material-symbols-outlined text-lg align-middle">mail</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Social Density Card */}
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-primary">diversity_3</span>
                    </div>
                    <h3 className="text-primary font-bold flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-sm">bolt</span>
                        Social Density
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-300">
                        You and {profile.first_name} have a high social overlap. You attended <span className="font-bold text-primary">5 events</span> together recently.
                    </p>
                    <a className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest hover:gap-3 transition-all cursor-pointer">
                        View Shared History
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </a>
                </div>

                {/* Clubs Followed */}
                <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 p-6">
                    <div className="flex justify-between items-center mb-4 text-white">
                        <h3 className="font-bold">Clubs Followed</h3>
                        <button className="text-xs font-bold text-primary">See All</button>
                    </div>
                    <div className="space-y-4">
                        {(followedClubs || []).slice(0, 3).map((club: Body) => (
                            <div key={club.id} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary">groups</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{club.name}</p>
                                    <p className="text-[10px] text-slate-500">Member</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Events & Networking + Post Feed */}
            <div className="lg:col-span-8 space-y-8">
                {/* Going to Events (Horizontal) */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                            <span className="material-symbols-outlined text-primary">event_upcoming</span>
                            Going to Events
                        </h3>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
                        {(goingEvents || []).map((event: Event) => (
                            <div key={event.id} onClick={() => navigate(`/events/${event.id}`)} className="min-w-[280px] bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden snap-start group cursor-pointer hover:border-primary/50 transition-all shrink-0">
                                <div className="h-32 relative bg-slate-800 flex items-center justify-center">
                                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPbVLc8ocKZx60H0tKB9fdIS470y5dhurRcbKDyC4VftctVYWfM66hO0LJrz2VWW8ymA-7F8V3HaXBGfNO0Y1ZVj-pJdTatx7O9hmjMuScuV23wEYll7r8HeoNNEaJ4kiBBERnd4sNILwIr8k3loN6i33eWaWxjjNHfSMhxNOMEOCNTNnquQO3A17p9fucLRuBAssXa7Cerl4oaazajFYp59AFs3Eq2i-YG53_lKgzDlwswgcnB57aSjwT4tJ-2-hNZh2D4iba8y8" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={event.title} />
                                    <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-lg px-2 py-1 text-center min-w-[40px]">
                                        <p className="text-[10px] uppercase font-bold text-primary leading-none">{new Date(event.start_time).toLocaleString('default', { month: 'short' })}</p>
                                        <p className="text-lg font-bold leading-tight text-white">{new Date(event.start_time).getDate()}</p>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h4 className="font-bold text-sm mb-1 truncate text-white">{event.title}</h4>
                                    <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">location_on</span>
                                        {event.location_name}
                                    </p>
                                    <button className="w-full py-2 bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all text-slate-300">Join Event</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Past Events */}
                    <section>
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
                            <span className="material-symbols-outlined text-slate-500">history</span>
                            Past Events
                        </h3>
                        <div className="space-y-3">
                            <div className="bg-white dark:bg-white/5 p-3 rounded-lg border border-slate-200 dark:border-white/10 flex gap-3 group hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer text-white">
                                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-primary">emoji_events</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">Inter-Hostel Cricket Finale</p>
                                    <p className="text-xs text-slate-500">Winner • Sept 2023</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Friends/Connections */}
                    <section>
                        <div className="flex justify-between items-center mb-4 text-white">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-500">group</span>
                                Friends
                            </h3>
                            <p className="text-xs text-slate-500">1,240 Total</p>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="flex flex-col items-center gap-1 group cursor-pointer">
                                <img className="w-12 h-12 rounded-full border-2 border-transparent group-hover:border-primary transition-all" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6BvIVOVr3kop8dh8p8IqKoMUP-HGwQozcFasm162EYMT-0ycSjymLEU_ScL-jLYsC_PCiVXprZW3NcjTaRVHqPgKhWo-7STCDVfR6R-ZNVzr0Z7OSWvhABVJpyceCyrkRo3UCEpPGM82dU6OY0Ia9jS1MmuGFsWZobkvygfSxhpPqag3lFMeaRWZlUd0kSbacTN4-mVInpvjaJtMK64zu07wEI2WDjOdRWd4bPbl-gsZhHRksTINf8T9rE9fuB6_EM1Mg3VCMQ4k" alt="Sarah" />
                                <p className="text-[10px] font-bold text-slate-300">Sarah J.</p>
                            </div>
                            <div className="flex flex-col items-center gap-1 group cursor-pointer">
                                <img className="w-12 h-12 rounded-full border-2 border-transparent group-hover:border-primary transition-all" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVIph_1nfdqIQ4NB9hiBPttrSaYc_fNS5Sa0_jh57_NmOTWvDEoBkzw41A4sAupNYeKPzHQVqaHFWz36ePEVBmtU1q8vPffGn07IsXZdzvfpay9IYR_hahaV1eFPU9sF3tLeXWtgAiHPADW09OSXSv73kxGEG-FykltxjvLumJnpKyF_0fTXHXxxh9_ZOWVntcZ6APvyBHlOPyjNmUbn0UkzkYFbYTRKODtOWYGXCswsNdtLXCAReJyDfsCAVDMJBy5OOqsmvahEA" alt="Mike" />
                                <p className="text-[10px] font-bold text-slate-300">Mike R.</p>
                            </div>
                            <div className="flex flex-col items-center gap-1 group cursor-pointer">
                                <img className="w-12 h-12 rounded-full border-2 border-transparent group-hover:border-primary transition-all" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9bjGIYvuv1FrmCB6dv4O5SbZNJwyiEW86KJghlOJ2FPBVC8hrMXm8zzka-hw5BTn5VJ-cUfscj8HeTQIxPharYND9b81CKvFL0IezMxY3Xcp4QjBW2OqV5c0THYTD4eu3Qen4FXWaBxzXw77Fhni72156V7fIzHSU4zk_Nb9ono24xmLS52ACjsKiutF9MDHBPdzA0hsx8muc882N6RaKsIEJRtLb1xbHRQ0AI-6ETXpVg_D9hLWQFhmsLD3TT0cxAKN877ff5A8" alt="Priya" />
                                <p className="text-[10px] font-bold text-slate-300">Priya K.</p>
                            </div>
                            <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => navigate('/connections')}>
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                                    <span className="material-symbols-outlined text-primary text-xl">add</span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-300">More</p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Restore Post Feed */}
                <section className="pt-8 border-t border-white/5">
                    <h3 className="text-xl font-bold mb-6 text-white">Posts</h3>
                    <div className="space-y-6">
                        {isLoadingPosts ? (
                            <div className="text-center py-10 text-slate-500">Loading posts...</div>
                        ) : posts.length === 0 ? (
                            <p className="text-slate-500 italic">No posts yet.</p>
                        ) : (
                            posts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    onLike={() => onLikeToggle(post)}
                                    onCommentAdded={() => {}}
                                />
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
