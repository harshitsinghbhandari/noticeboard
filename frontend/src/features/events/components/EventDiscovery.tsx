import { useNavigate } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import { Link } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi';
import { joinEvent } from '../api/events';
import { useState, useEffect } from 'react';

export default function EventDiscovery() {
    const { events, isLoading } = useEvents();
    const navigate = useNavigate();

    // Track join status for each event: 'idle' | 'joining' | 'joined'
    const [joinStatus, setJoinStatus] = useState<Record<string, 'idle' | 'joining' | 'joined'>>({});

    const { execute: joinEventExecute } = useApi(joinEvent);

    useEffect(() => {
        console.log("[EventDiscovery] Component Mounted/Updated. Events count:", events.length);
    }, [events]);

    const handleJoinEvent = async (e: React.MouseEvent, eventId: string) => {
        console.log(`[EventDiscovery] handleJoinEvent called for ${eventId}`);
        e.preventDefault();
        e.stopPropagation();
        // optimistic update
        setJoinStatus(prev => ({ ...prev, [eventId]: 'joining' }));

        try {
            console.log(`[EventDiscovery] Calling API for event: ${eventId}`);
            await joinEventExecute(eventId);
            console.log(`[EventDiscovery] Join successful for event: ${eventId}`);
            setJoinStatus(prev => ({ ...prev, [eventId]: 'joined' }));

            // Delay redirect to show "Joined" state
            setTimeout(() => {
                console.log(`[EventDiscovery] Redirecting to /events/${eventId}`);
                navigate(`/events/${eventId}`);
            }, 1000);
        } catch (error) {
            console.error("[EventDiscovery] Failed to join event", error);
            alert(`Failed to join event: ${error}`);
            setJoinStatus(prev => ({ ...prev, [eventId]: 'idle' }));
        }
    };

    // In a real app, these would be filtered by the backend or categorized here
    const happeningSoon = events.slice(0, 3);
    const yourPeopleAreGoing = events.slice(3, 5);
    const recommended = events.slice(5);

    if (isLoading && events.length === 0) return <div className="p-10 text-center">Loading discovery...</div>;

    const getEventImage = (idx: number) => {
        const images = [
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCB_9oVyuzQXuTVaR20uQtxhQxe4QQn2ULGHhBeoRNj42ePmOLT-9_6ko0kgjcOVJzqoAwwWyFiHT3cWhXNaLv_y5VEYEVhe8sJio2YfkfzKRBEVqIulq9BXYpsZrdX7fImkcYeSLNQG6NozUGBOIyn6xku2DE03SxTQpMfegra_JULobaqyc1e9G3rSN4cJWXJAJwfnwiJ6WbJnKrGjOyCO-SIlTOl2Nbu12UuEB8AuOStmnZCzWmTE-teoTh4Eo8DxgMiwW36LA8",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBD-dV2NWbNc2WL80PXJ1Dc5yEYcPzoLzGH7yxxVN1ob7w1Xf91JKDZfMZKWI-gToZU5uERK4V3aKgBUoES-6LvCDD17b3yHaRNe7SmQ-0TjUkhVmLjp8BQ1GBIeXZ0xUfWFuvpyN4qHX3j5Fi5jr1rBAjnuV0-JA4ypyHY3xmBRPeZhUdyZ2TD5GEpKyKP9-FV0gVhayQ0WhDXQyI6CqCGssXcwWs20mjHLhtirhAmqhSPWg-baoPFuOXIaDBHmA11t5bMTVtApkg",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBeDbworlv8en4HesSRxIxHbFEcHaPo5oTk7z4z25OpkvS6ESG8bWmlvHqQs55r294rJnBQsKWmoyt1cow3gqBmO9a8wd0iqv5jasNCvMbxwyt_bUZ0qhpaVV9jkPEBUKOF5vW5o3wr2wSof6vcH_WoMSwfpV0VZ-cmXnArjJfnR3AJXRL-Hrjd5h9w4cGCNzPI2YGOWAvPIrwLUMzk5OafPvbMRfNivVHeXFfrJMwS0prLeqTMjplEls_7gUpE2kBGpTY-GC0oKMU",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAZ8lKDMi8Cws2GLZICR2Cd4MoSPlBWfa9ir_pQqCBttf2t6tPqN32w9m3afTW9Gvi3earLDBCVoynocCmUsTTtvT611nyxllb8FgwXu9ojtKZydKHxwJrnZVrNZ_yuhlWQiI5F3iXkg66HCAwQA3cEOLRIir8jL8yG9O1bV2UwOUBEJftlzXo1WCxlZE4N-Ga3UIE5Xs1hcIgf3ahL8_3QiY0xwtNlSijALvRkyjxBvPxXiSnneaTAWCGgr3f2G3r2OkB0TreDcAA",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCzMPxVTMCDRtsDKvy2DaH6_G4iRnUQW6bNsQYR8_ZGhJsuKoGa3VQxaoEd6jA0s5l36YINqC1fKlSemAZQaBWiMYLyb7QqrGBY_ZI73m8UA5x1x-vWz-NOcR5pvt-bJHKNhLsDcQv9p9WVCJ3w7qdlaOcxNAqlYHUvrXRbmClJKD6zEacU7i8cCYHibbSSnCwsJ4JtD_63QXOSoQUnaenJ2St_mwdO4oSbJJJ3rfddUCR3Pqn-tk0e_xO8MRM41lIhuxkfszFWdAQ",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCs2W7_qcWK4Uu0izaQ0ZcjFQBrljxuzj72hzr9wdsdo952hGs45ka-6_AAph-epLUlsGrjaxTrn5pSJ935_4vWsXVmZMy-tdSgFjpGQGLBlA8EpGriYnE9n8SQezC0n0HkzcIieMaIn6LrVkKSnDvw8vMoQyV_A52GIY20vnlfySu81q1EJf9caKwc-Pyif4cP8atugsQAaV_G-d0JqjHROtGs7hQMot-SfrquL2g1DhskukPZxZDsGdIlEq6ne0ZOc5c9qun69NI"
        ];
        return images[idx % images.length];
    }

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            {/* Horizontal Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                <button className="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-semibold whitespace-nowrap">All Events</button>
                {[
                    { icon: 'terminal', label: 'Tech' },
                    { icon: 'theater_comedy', label: 'Cult' },
                    { icon: 'sports_basketball', label: 'Sports' },
                    { icon: 'auto_stories', label: 'Acad' },
                    { icon: 'more_horiz', label: 'Other' }
                ].map((filter) => (
                    <button key={filter.label} className="px-4 py-1.5 rounded-full bg-primary/10 text-slate-300 hover:bg-primary/20 text-xs font-semibold whitespace-nowrap flex items-center gap-1.5">
                        <span className="material-symbols-outlined !text-sm">{filter.icon}</span>
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Section 1: Happening Soon */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Happening Soon
                    </h2>
                    <button className="text-xs font-semibold text-primary">View All</button>
                </div>
                <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                    {happeningSoon.map((event, idx) => (
                        <Link to={`/events/${event.id}`} key={event.id} className="min-w-[280px] group relative rounded-xl overflow-hidden aspect-[16/9] bg-slate-800 shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10"></div>
                            <img src={getEventImage(idx)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={event.title} />
                            <div className="absolute top-3 left-3 z-20 px-2 py-1 bg-red-600 text-[10px] font-bold uppercase rounded text-white flex items-center gap-1">
                                <span className="material-symbols-outlined !text-[12px]">sensors</span> Starting Now
                            </div>
                            <div className="absolute bottom-3 left-3 z-20">
                                <p className="text-xs text-primary font-bold uppercase mb-0.5">{event.body_name || event.location_name}</p>
                                <h3 className="font-bold text-white text-base leading-tight">{event.title}</h3>
                                <p className="text-[11px] text-slate-300">Today {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Section 2: Your People Are Going */}
            <section className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-white">Your People Are Going</h2>
                        <p className="text-xs text-slate-400">Events popular in your circle</p>
                    </div>
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full border-2 border-background-dark bg-slate-700"></div>
                        <div className="w-8 h-8 rounded-full border-2 border-background-dark bg-slate-600"></div>
                        <div className="w-8 h-8 rounded-full border-2 border-background-dark bg-slate-500"></div>
                        <div className="w-8 h-8 rounded-full border-2 border-background-dark bg-primary flex items-center justify-center text-[10px] font-bold">+12</div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {yourPeopleAreGoing.map((event, idx) => (
                        <Link to={`/events/${event.id}`} key={event.id} className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-primary/30 transition-all cursor-pointer">
                            <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                                <img src={getEventImage(idx + 3)} className="w-full h-full object-cover" alt={event.title} />
                            </div>
                            <div className="flex flex-col justify-between py-1">
                                <div>
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">{event.body_name || 'Featured'}</span>
                                    <h3 className="font-bold text-white mt-1">{event.title}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined !text-sm text-primary">groups</span>
                                    <p className="text-xs font-medium text-slate-300">3 Friends Going</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Main Feed: Recommended For You */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Recommended For You</h2>
                    <div className="flex items-center gap-2 text-slate-400">
                        <span className="material-symbols-outlined !text-base">sort</span>
                        <span className="text-xs font-semibold">Latest First</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                    {recommended.map((event, idx) => (
                        <div key={event.id} className="group bg-white/5 rounded-2xl overflow-hidden border border-white/5 hover:border-primary/20 transition-all">
                            <div className="relative aspect-[21/9] md:aspect-[3/1] bg-slate-800">
                                <img src={getEventImage(idx + 5)} className="w-full h-full object-cover" alt={event.title} />
                                <div className="absolute top-4 right-4 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-wider">
                                    Cultural
                                </div>
                            </div>
                            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                                        <span className="text-primary">{event.body_name}</span>
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined !text-sm">calendar_today</span> {new Date(event.start_time).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined !text-sm">location_on</span> {event.location_name}</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">{event.title}</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-600 border border-background-dark"></div>
                                            <div className="w-6 h-6 rounded-full bg-slate-500 border border-background-dark"></div>
                                        </div>
                                        <p className="text-sm font-medium text-slate-300"><span className="text-primary font-bold">5 friends</span> & 142 others going</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => {
                                            console.log("Inline onClick triggered");
                                            handleJoinEvent(e, event.id);
                                        }}
                                        disabled={joinStatus[event.id] === 'joining' || joinStatus[event.id] === 'joined'}
                                        className={`px-6 py-3 font-bold rounded-xl transition-all active:scale-95 shadow-lg ${joinStatus[event.id] === 'joined'
                                            ? 'bg-green-600 text-white shadow-green-600/20'
                                            : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'
                                            } disabled:opacity-90 disabled:cursor-not-allowed`}
                                    >
                                        {joinStatus[event.id] === 'joining' ? 'Joining...' :
                                            joinStatus[event.id] === 'joined' ? 'Joined' : 'RSVP Now'}
                                    </button>
                                    <button className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-all">
                                        <span className="material-symbols-outlined">share</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="py-10 flex justify-center">
                    <button className="px-8 py-2.5 border border-primary/30 text-primary font-bold rounded-full hover:bg-primary/5 transition-colors">
                        Load More Events
                    </button>
                </div>
            </section>
        </div>
    );
}
