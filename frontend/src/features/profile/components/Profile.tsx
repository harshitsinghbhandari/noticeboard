import { useParams, useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { usePostActions } from '../../feed/hooks/usePostActions';
import type { Post, FeedItem } from '../../../types';

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
        isMe,
        targetUserId,
    } = useProfile(id, currentUserId);

    const onPostAdded = (newPost: FeedItem) => {
        setPosts(prev => [newPost as unknown as Post, ...(prev || [])]);
    };

    const { handleLikeToggle } = usePostActions(onPostAdded);

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

    if (loading) return <div className="text-center py-20 text-white">Loading Pulsar...</div>;
    if (!profile) return <div className="text-center py-20 text-white">Pulsar not found.</div>;

    const stats = [
        { label: 'Events', value: '42' },
        { label: 'Mutuals', value: '156' },
        { label: 'Clubs', value: '12' }
    ];

    const clubs = [
        { name: 'ACM Student Chapter', members: '2.4k', icon: 'code', color: 'bg-orange-500/20', iconColor: 'text-orange-500' },
        { name: 'Aperture Photo Club', members: '840', icon: 'photo_camera', color: 'bg-blue-500/20', iconColor: 'text-blue-500' },
        { name: 'Varsity Sports', members: '1.1k', icon: 'sports_basketball', color: 'bg-emerald-500/20', iconColor: 'text-emerald-500' }
    ];

    const upcomingEvents = [
        { title: 'Web3 Developers Summit', location: 'Main Auditorium', mutuals: 5, date: { month: 'Oct', day: '14' }, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPbVLc8ocKZx60H0tKB9fdIS470y5dhurRcbKDyC4VftctVYWfM66hO0LJrz2VWW8ymA-7F8V3HaXBGfNO0Y1ZVj-pJdTatx7O9hmjMuScuV23wEYll7r8HeoNNEaJ4kiBBERnd4sNILwIr8k3loN6i33eWaWxjjNHfSMhxNOMEOCNTNnquQO3A17p9fucLRuBAssXa7Cerl4oaazajFYp59AFs3Eq2i-YG53_lKgzDlwswgcnB57aSjwT4tJ-2-hNZh2D4iba8y8' },
        { title: 'Hostel Night \'23', location: 'Hostel Lawns', mutuals: 12, date: { month: 'Oct', day: '19' }, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQJxedrIB61TlMwUptZixcVJaTjz2DKrM-CEvTJPQLkyjrCmlPrrGMSEatEtXCw5cYygFXeIGBz_pGznBa72vur6qonnZ13Jbn62GbW4wL7cnPwQ3Rd9YLkgTBZLJZbUpV4ptEiM4_JGeMTi738lWl2tHVX_0e23uO4voI6BZiigS3HSfUDV2tPB3euoKJX-3MgUISoCFKg6ni4ZBIpADUng8tMD4nl8tVjF8FKOlTTMg98ABSoWRQTTUNK1_Ebbr7g9Zdp1y4i4g' },
        { title: 'Unplugged Sessions', location: 'Student Center', mutuals: 0, date: { month: 'Oct', day: '22' }, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkJiFRB2ITOk63nWld9cUah-b8PISHjNtnotbYxWIc9w6iQ0gV7mOcgOD55y_FLunwfeKZIR3fG_OyjLw_epYWXiNmIDy7Ql3mojcYYAtHNbRTrGHAkcuykGAlxXNNEdloNGxQ9lG5sIwusUjs9I88FdzdbGJv7WFUgp-Ghxx6Gs3d4WGqRo7hnnF9Y_2IJCXsznmgKyO1cyLPBrUJ3cl5JxhMak5clWk9btLZMWPDOpvyjbYRzizd4dT1XODLRAmi737oyvVIen0' }
    ];

    return (
        <main className="max-w-7xl mx-auto px-4 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24">
            {/* Left Column: Identity & Social Density */}
            <div className="lg:col-span-4 space-y-6">
                {/* Profile Card */}
                <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 p-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-purple-400 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative w-32 h-32 rounded-full border-4 border-background-dark mb-4 bg-primary/20 flex items-center justify-center text-primary font-bold text-4xl overflow-hidden">
                                {profile.first_name?.[0]}
                            </div>
                            <div className="absolute bottom-6 right-2 w-6 h-6 bg-green-500 border-4 border-background-dark rounded-full"></div>
                        </div>
                        <h2 className="text-2xl font-bold text-white">{profile.first_name} {profile.last_name}</h2>
                        <p className="text-primary font-semibold text-sm">{profile.headline || 'Pulsar Student'}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Campus Ground, Pulseray</p>

                        <div className="grid grid-cols-3 w-full gap-4 mt-8 border-t border-slate-200 dark:border-white/10 pt-6">
                            {stats.map(stat => (
                                <div key={stat.label}>
                                    <p className="text-lg font-bold text-white">{stat.value}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 w-full mt-6">
                            {isMe ? (
                                <button className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2 rounded-lg transition-all text-sm">Edit Pulse</button>
                            ) : (
                                <button className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2 rounded-lg transition-all text-sm">Follow</button>
                            )}
                            <button
                                onClick={() => navigate(`/messages/${targetUserId}`)}
                                className="px-3 bg-slate-200 dark:bg-white/10 hover:bg-primary/20 hover:text-primary rounded-lg transition-all text-white"
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
                        Social Pulse
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-300">
                        You and {profile.first_name} have a high social overlap. You attended <span className="font-bold text-primary">5 events</span> together this month.
                    </p>
                    <a className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest hover:gap-3 transition-all" href="#">
                        View Shared History
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </a>
                </div>

                {/* Clubs Followed */}
                <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-white">Clubs Followed</h3>
                        <button className="text-xs font-bold text-primary">See All</button>
                    </div>
                    <div className="space-y-4">
                        {clubs.map(club => (
                            <div key={club.name} className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg ${club.color} flex items-center justify-center`}>
                                    <span className={`material-symbols-outlined ${club.iconColor}`}>{club.icon}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{club.name}</p>
                                    <p className="text-[10px] text-slate-500">{club.members} Members</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Events & Networking */}
            <div className="lg:col-span-8 space-y-8">
                {/* Going to Events (Horizontal) */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                            <span className="material-symbols-outlined text-primary">event_upcoming</span>
                            Going to Events
                        </h3>
                        <div className="flex gap-2">
                            <button className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-primary/20 transition-colors">
                                <span className="material-symbols-outlined text-sm text-white">chevron_left</span>
                            </button>
                            <button className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-primary/20 transition-colors">
                                <span className="material-symbols-outlined text-sm text-white">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                        {upcomingEvents.map(event => (
                            <div key={event.title} className="min-w-[280px] bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden snap-start group cursor-pointer hover:border-primary/50 transition-all">
                                <div className="h-32 relative">
                                    <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={event.image} alt={event.title} />
                                    <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-lg px-2 py-1 text-center min-w-[40px]">
                                        <p className="text-[10px] uppercase font-bold text-primary leading-none">{event.date.month}</p>
                                        <p className="text-lg font-bold leading-tight text-white">{event.date.day}</p>
                                    </div>
                                    {event.mutuals > 0 && (
                                        <div className="absolute bottom-3 right-3 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                            {event.mutuals} Mutuals
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h4 className="font-bold text-sm mb-1 truncate text-white">{event.title}</h4>
                                    <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">location_on</span>
                                        {event.location}
                                    </p>
                                    <button className="w-full py-2 bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all text-slate-300">Join Event</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Pulse Posts */}
                    <section>
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
                            <span className="material-symbols-outlined text-primary">rss_feed</span>
                            Pulse Posts
                        </h3>
                        <div className="space-y-4">
                            {posts.map(post => (
                                <div key={post.id} className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 group hover:border-primary/30 transition-all">
                                    <p className="text-sm text-slate-200 mb-3">{post.content}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => onLikeToggle(post)}
                                                className={`flex items-center gap-1 text-xs font-bold transition-colors ${post.has_liked ? 'text-primary' : 'text-slate-500'}`}
                                            >
                                                <span className="material-symbols-outlined text-base">local_fire_department</span>
                                                {post.likes_count}
                                            </button>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-base">chat_bubble</span>
                                                {post.comments_count}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{timeAgo(post.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                            {posts.length === 0 && <p className="text-slate-500 italic text-center py-10">No pulse posts yet.</p>}
                        </div>
                    </section>

                    {/* Friends/Connections */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold flex items-center gap-2 text-white">
                                <span className="material-symbols-outlined text-slate-500">group</span>
                                Pulsars
                            </h3>
                            <p className="text-xs text-slate-500">1,240 Total</p>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                <div key={i} className="flex flex-col items-center gap-1 group cursor-pointer">
                                    <div className="w-12 h-12 rounded-full border-2 border-transparent group-hover:border-primary transition-all bg-primary/20 flex items-center justify-center text-primary font-bold">
                                        P
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400">Pulsar {i}</p>
                                </div>
                            ))}
                            <div className="flex flex-col items-center gap-1 group cursor-pointer">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                                    <span className="material-symbols-outlined text-primary text-xl">add</span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400">More</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}

function timeAgo(date: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
}
