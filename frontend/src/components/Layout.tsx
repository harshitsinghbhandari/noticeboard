import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUnread } from '../context/UnreadContext';

interface LayoutProps {
    children: ReactNode;
    userEmail?: string;
    currentUserId?: string;
    onLogout: () => void;
}

export default function Layout({ children, currentUserId }: LayoutProps) {
    const { totalUnread } = useUnread();
    const location = useLocation();
    const navigate = useNavigate();
    const activeTab = location.pathname.split('/')[1] || 'feed';

    // Different headers based on route
    const isEventDetail = location.pathname.startsWith('/posts/');
    const isMessages = location.pathname.startsWith('/messages');

    if (isMessages) {
        // Chat uses its own layout structure in Screen 5, but we'll try to keep it consistent here
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans">
            {/* Top Navigation Bar */}
            {!isEventDetail && (
                <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 px-4 lg:px-40 py-3">
                    <div className="max-w-[1200px] mx-auto flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-4">
                            {/* Logo */}
                            <Link to="/feed" className="flex items-center gap-2">
                                <div className="bg-primary p-1.5 rounded-lg text-white flex items-center justify-center">
                                    <span className="material-symbols-outlined !text-2xl">bolt</span>
                                </div>
                                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">CampusPulse</h1>
                            </Link>

                            {/* Search & Filters */}
                            <div className="flex-1 max-w-xl hidden md:flex items-center gap-3">
                                <div className="relative w-full">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                    <input
                                        className="w-full bg-primary/10 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary placeholder:text-slate-500 text-white"
                                        placeholder="Search events, clubs, or venues..."
                                        type="text"
                                    />
                                </div>
                                <button className="bg-primary/10 p-2 rounded-xl text-primary hover:bg-primary/20 transition-colors">
                                    <span className="material-symbols-outlined">tune</span>
                                </button>
                            </div>

                            {/* User Actions */}
                            <div className="flex items-center gap-4">
                                <Link to="/notifications" className="relative p-2 text-slate-400 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">notifications</span>
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background-dark"></span>
                                </Link>
                                <Link to={`/profile/${currentUserId}`} className="h-9 w-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden">
                                    <img
                                        className="w-full h-full object-cover"
                                        alt="User profile"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7u2z1lGCgUI-H14Uy2v8-aYxCtySu7mRApvYxoucdcjb6Kp_M_qNczcjcQ3ZdeofYW6BXnzeMHsz9NO_JxEixSEaPcHmoaWC8odgts1Fwr8smNEmzCfFDrN8JChhOsb1XBZfPU1s66yNzZmw-9v5cHpgRibtKXXNkPKrPDyfFr5va2FRczvhBaAzYNVlLV0ZLEl3dsEPT_9HyCKF6yTKDKJ6l_aF6j5UzDOFwfT4hB8G5UEFperT526V0qzvxeh9THbLCXoEtMXY"
                                    />
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>
            )}

            {isEventDetail && (
                <header className="sticky top-0 z-50 w-full border-b border-white/10 glass-effect px-4 md:px-10 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <span className="material-symbols-outlined text-white">arrow_back</span>
                        </button>
                        <h1 className="text-white font-bold text-lg tracking-tight">Event Details</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <span className="material-symbols-outlined text-white">share</span>
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <span className="material-symbols-outlined text-white">more_vert</span>
                        </button>
                    </div>
                </header>
            )}

            {/* Main Content Area */}
            <main className={`${!isMessages && !isEventDetail ? 'max-w-[1200px] mx-auto px-4 lg:px-40 py-6' : ''}`}>
                {children}
            </main>

            {/* Navigation Tab Bar (Mobile) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background-dark/95 backdrop-blur-lg border-t border-white/5 px-6 py-3 flex justify-between items-center z-50">
                <Link to="/feed" className={`flex flex-col items-center gap-1 ${activeTab === 'feed' ? 'text-primary' : 'text-slate-500'}`}>
                    <span className="material-symbols-outlined">home</span>
                    <span className="text-[10px] font-bold">Home</span>
                </Link>
                <Link to="/feed" className={`flex flex-col items-center gap-1 ${activeTab === 'explore' ? 'text-primary' : 'text-slate-500'}`}>
                    <span className="material-symbols-outlined">explore</span>
                    <span className="text-[10px] font-bold">Explore</span>
                </Link>
                <Link to="/messages" className={`flex flex-col items-center gap-1 ${activeTab === 'messages' ? 'text-primary' : 'text-slate-500'} relative`}>
                    <span className="material-symbols-outlined">chat</span>
                    {totalUnread > 0 && (
                        <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full ring-1 ring-background-dark"></span>
                    )}
                    <span className="text-[10px] font-bold">Chats</span>
                </Link>
                <Link to="/connections" className={`flex flex-col items-center gap-1 ${activeTab === 'connections' ? 'text-primary' : 'text-slate-500'}`}>
                    <span className="material-symbols-outlined">group</span>
                    <span className="text-[10px] font-bold">Friends</span>
                </Link>
                <Link to={`/profile/${currentUserId}`} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-primary' : 'text-slate-500'}`}>
                    <span className="material-symbols-outlined">person</span>
                    <span className="text-[10px] font-bold">Profile</span>
                </Link>
            </nav>
        </div>
    );
}
