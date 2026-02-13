import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventDetail } from '../hooks/useEventDetail';
import { Button } from '../../../components/ui/Button';

export default function EventDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { event, isLoading, error, handleJoin, isJoining, handlePublish, isPublishing } = useEventDetail(id);
    const [activeTab, setActiveTab] = useState<'posts' | 'chat' | 'info'>('posts');

    if (isLoading && !event) return <div className="p-10 text-center">Loading event...</div>;
    if (error || !event) return <div className="p-10 text-center text-red-500">Event not found</div>;

    const startDate = new Date(event.start_time);

    return (
        <div className="max-w-4xl mx-auto px-0 md:px-6 pb-24 animate-fade-in">
            {/* Hero Banner Section */}
            <div className="relative w-full aspect-[21/9] md:aspect-[3/1] overflow-hidden md:rounded-xl mt-0 md:mt-4">
                <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent z-10"></div>
                <img
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzJ1fBenYlnlrfeJpNZuctvAd6wJFrmoLueNXhwPhFjeJ3vo30E0WF99jPRcWjCQcrB-3aY0s_d-8GHuJcciJe-H2k6WO4JHteQ2mVsqYciyvVy7tTcMM7WwQGt9-_26t0NgP8H3k3xT9zpQPgLUHKyhSxS1Fzi_mAHzTJ7vz8eghj0KHSJYO90L9Ctea2973uG6M2ctWTqgPrVWCy3BI-8TizkReoKMQYDhEUReW0CwpTe8H1ZpK5eejlXVjxhol_sMkAmv-UN8o"
                    alt="Event Hero"
                />
                <div className="absolute bottom-4 left-4 z-20">
                    <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-wider">Music & Arts</span>
                    <h2 className="text-white text-3xl md:text-4xl font-extrabold mt-2 leading-tight">{event.title}</h2>
                    <p className="text-white/80 text-sm font-medium mt-1">Organized by {event.body_name || event.body_id} • Campus</p>
                </div>
            </div>

            {/* Social Proof Section */}
            <div className="mx-4 md:mx-0 -mt-6 relative z-30">
                <div className="bg-white dark:bg-[#251a30] p-4 rounded-xl shadow-2xl border border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-3 overflow-hidden">
                            <img className="inline-block h-10 w-10 rounded-full ring-2 ring-[#251a30]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCt_NkHvvKR_jhOI_u2UX8xd2MMjAfCuZ9KLC0psV6npbSgx1YS9pncT_HAcIiNJ4xSLh3pHWDWHoLkn5Lq6xhQQ1p5CoIdg2FtJ8btNk0h5406eY2uTQGFSRwRBU3uPXCeSl8NRqLZedpZyelBJcWP88hB2tn3AfnRCtbpG-rPha4_uTvMNVODtX7q49p3KpGDy5-rXqhpem-PKnnj78ecxgkLb9exUSwBDPCCvwEexll9X_v_b4Kcfv3tqcSrmU-sALRUpB0XE2A" alt="Avatar 1" />
                            <img className="inline-block h-10 w-10 rounded-full ring-2 ring-[#251a30]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzPr5_KgyZjWDHfQS4mZZ7VcDovTG0MGBuV2KJ--csZpnaEbjPxvHfc8Coj-3LOiS6efzH5w1lXQ7ux85TfSCMedmREiJgddD49YWyryI980hfOM5HMFuUNEF1IglpQ0DeyspnoNW2lIKnzI4gdE48PUjNWCcobolmt06FiIWNS45FkimFXDJoFOzdbC4CHqVIybNETMpE1IqQu7lg2rx9N7ovgI8xJpl0t7rOPPuzsBreITw_kKXW_Ni4vlkGfMwp4Wwz3xfwRAw" alt="Avatar 2" />
                            <img className="inline-block h-10 w-10 rounded-full ring-2 ring-[#251a30]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVRtDtTKFk5aqZX96tdtUAuKEs5eKS8DNyKcROBp_qEDigA2lSVSEFau1X5vwHMwPMhlGBDLS3GnDIY3ln4ZxyVbKbcsNrm0XXbWvqWUiZHJZCtkKBI8qpDnTpLEIFI1sOWgTpaKXzB5m4XE48Fx0EdPPjwwb2gk7PQzGzSqNHrmBwG0ys9s2Cf4vREas_ZpXFFywwAE0HmTRA4GPT9aY-h9qtGOXnN9FvJ2-u8YohYquIcOCDwG16zEO5m-dyB4FrrLmJJd6r66M" alt="Avatar 3" />
                            <div className="flex items-center justify-center h-10 w-10 rounded-full ring-2 ring-[#251a30] bg-primary text-[10px] font-bold text-white uppercase">+15</div>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">18 students going</p>
                            <p className="text-xs text-primary font-semibold">5 from your circle</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                            <span className="material-symbols-outlined text-primary text-sm">local_fire_department</span>
                            <span className="text-xs font-bold text-primary">Trending #1</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Info Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 md:px-0 mt-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-primary mb-2">calendar_today</span>
                    <span className="text-xs uppercase text-slate-400 font-bold tracking-widest">Date</span>
                    <span className="text-sm font-bold text-white mt-1">{startDate.toLocaleDateString()}</span>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-primary mb-2">schedule</span>
                    <span className="text-xs uppercase text-slate-400 font-bold tracking-widest">Time</span>
                    <span className="text-sm font-bold text-white mt-1">{startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center text-center col-span-2 md:col-span-1">
                    <span className="material-symbols-outlined text-primary mb-2">location_on</span>
                    <span className="text-xs uppercase text-slate-400 font-bold tracking-widest">Location</span>
                    <span className="text-sm font-bold text-white mt-1 truncate w-full px-2">{event.location_name}</span>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-primary mb-2">confirmation_number</span>
                    <span className="text-xs uppercase text-slate-400 font-bold tracking-widest">Entry</span>
                    <span className="text-sm font-bold text-white mt-1">Free for IDs</span>
                </div>
            </div>

            {/* Tab System */}
            <div className="sticky top-[60px] z-40 glass-effect border-b border-white/10 px-4 mt-2">
                <div className="flex gap-8">
                    {(['posts', 'chat', 'info'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 border-b-2 text-sm font-bold capitalize transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'}`}
                        >
                            {tab}
                            {tab === 'chat' && <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-[10px] rounded">12</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="p-4 md:px-0 mt-4">
                {activeTab === 'posts' && (
                    <div className="space-y-6">
                        {/* Create Post Input */}
                        <div className="bg-white/5 rounded-xl border border-white/10 p-4 flex gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-700"></div>
                            <div className="flex-1">
                                <input className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 p-2" placeholder="Post a hype message..." type="text" />
                            </div>
                            <button className="bg-primary text-white p-2 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined">send</span>
                            </button>
                        </div>

                        {/* Hype Feed (Dummy for now) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden flex flex-col">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-slate-700"></div>
                                        <div>
                                            <p className="text-sm font-bold text-white leading-none">Sarah Chen</p>
                                            <p className="text-[10px] text-slate-500">2 hours ago</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-400 text-sm">more_horiz</span>
                                </div>
                                <div className="px-4 pb-3">
                                    <p className="text-sm text-slate-200 font-medium">Can't wait for the surprise headliner! Last year was insane. 🎸🎉</p>
                                </div>
                                <div className="p-3 flex items-center justify-between">
                                    <div className="flex gap-4">
                                        <button className="flex items-center gap-1.5 text-primary">
                                            <span className="material-symbols-outlined text-lg">local_fire_department</span>
                                            <span className="text-xs font-bold">24</span>
                                        </button>
                                        <button className="flex items-center gap-1.5 text-slate-400">
                                            <span className="material-symbols-outlined text-lg">chat_bubble_outline</span>
                                            <span className="text-xs font-bold">3</span>
                                        </button>
                                    </div>
                                    <button className="text-slate-400">
                                        <span className="material-symbols-outlined text-lg">bookmark_border</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'info' && (
                    <div className="bg-white/5 rounded-xl border border-white/10 p-6 text-slate-200">
                        <h3 className="text-xl font-bold mb-4">Event Description</h3>
                        <p className="whitespace-pre-wrap">{event.description}</p>
                    </div>
                )}
                {activeTab === 'chat' && (
                    <div className="p-10 text-center text-slate-400">
                        <p className="mb-4">Connect with other attendees in the event group chat.</p>
                        <Button onClick={() => navigate(`/messages/group/${event.group_id}`)}>
                            Open Group Chat
                        </Button>
                    </div>
                )}
            </div>

            {/* Sticky Bottom RSVP Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 md:pb-4 bg-[#191022]/80 backdrop-blur-md border-t border-white/10 flex items-center justify-center">
                <div className="max-w-4xl w-full flex items-center justify-between gap-4">
                    <div className="hidden md:flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Capacity</span>
                        <span className="text-sm font-bold text-white">{event.capacity ? `${event.capacity} seats` : 'Unlimited'}</span>
                    </div>
                    <div className="flex flex-1 md:flex-initial gap-3">
                        {event.status === 'draft' && (
                            <button
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className="flex-1 md:w-48 py-3.5 bg-green-600 hover:bg-green-700 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-green-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-lg">publish</span>
                                {isPublishing ? 'Publishing...' : 'Publish Event'}
                            </button>
                        )}
                        <button
                            onClick={handleJoin}
                            disabled={isJoining || event.status === 'draft'}
                            className="flex-1 md:w-48 py-3.5 bg-primary hover:bg-primary/90 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                            {isJoining ? 'Joining...' : 'Join Event'}
                        </button>
                        <button className="p-3.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all">
                            <span className="material-symbols-outlined text-white">calendar_add_on</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
