import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';
import { useUnread } from '../hooks/useUnread';

interface LayoutProps {
    children: ReactNode;
    userEmail?: string;
    currentUserId?: string;
    onLogout: () => void;
}

export default function Layout({ children, userEmail, currentUserId, onLogout }: LayoutProps) {
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const { totalUnread } = useUnread();
    const location = useLocation();
    const activeTab = location.pathname.split('/')[1] || 'events';

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans antialiased pb-24 md:pb-0">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <Link to="/events" className="flex items-center gap-2 text-primary">
                            <span className="material-symbols-outlined text-3xl font-bold">pulse_alert</span>
                            <h1 className="text-xl font-bold tracking-tight hidden sm:block">CampusPulse</h1>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-6">
                            <Link to="/events" className={`text-sm font-semibold transition-colors ${activeTab === 'events' ? 'text-primary' : 'hover:text-primary text-slate-400'}`}>Discover</Link>
                            <Link to="/feed" className={`text-sm font-semibold transition-colors ${activeTab === 'feed' ? 'text-primary' : 'hover:text-primary text-slate-400'}`}>Feed</Link>
                            <Link to="/bodies" className={`text-sm font-semibold transition-colors ${activeTab === 'bodies' ? 'text-primary' : 'hover:text-primary text-slate-400'}`}>Bodies</Link>
                            <Link to="/messages" className={`text-sm font-semibold transition-colors ${activeTab === 'messages' ? 'text-primary' : 'hover:text-primary text-slate-400'}`}>Messages</Link>
                            <Link to="/connections" className={`text-sm font-semibold transition-colors ${activeTab === 'connections' ? 'text-primary' : 'hover:text-primary text-slate-400'}`}>Network</Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="relative hidden sm:block">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input
                                className="bg-slate-100 dark:bg-white/5 border-none rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary transition-all text-white"
                                placeholder="Search events, clubs..."
                                type="text"
                            />
                        </div>

                        {/* Notifications */}
                        <Link to="/notifications" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors relative">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background-dark"></span>
                        </Link>

                        {/* Dark Mode */}
                        <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
                        </button>

                        {/* Profile/Logout */}
                        <div className="flex items-center gap-2 pl-4 border-l border-white/10 ml-2">
                            <Link to={`/profile/${currentUserId || 'me'}`} className="h-9 w-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden">
                                <span className="text-primary font-bold text-sm">{userEmail?.[0].toUpperCase()}</span>
                            </Link>
                            <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors hidden md:block" title="Logout">
                                <span className="material-symbols-outlined">logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto">
                {children}
            </main>

            {/* Bottom Tab Bar (Mobile) */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-xl z-50 md:hidden">
                <div className="bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-1 flex items-center justify-between shadow-2xl">
                    <Link to="/events" className={`p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition-all group relative ${activeTab === 'events' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-500 dark:text-slate-400'}`}>
                        <span className="material-symbols-outlined block group-hover:text-primary transition-colors">home</span>
                    </Link>
                    <Link to="/feed" className={`p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition-all group relative ${activeTab === 'feed' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-500 dark:text-slate-400'}`}>
                        <span className="material-symbols-outlined block group-hover:text-primary transition-colors">rss_feed</span>
                    </Link>
                    <Link to="/bodies" className={`p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition-all group relative ${activeTab === 'bodies' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-500 dark:text-slate-400'}`}>
                        <span className="material-symbols-outlined block group-hover:text-primary transition-colors">hub</span>
                    </Link>
                    <Link to="/messages" className={`p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition-all group relative ${activeTab === 'messages' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-500 dark:text-slate-400'}`}>
                        <span className="material-symbols-outlined block group-hover:text-primary transition-colors">chat_bubble</span>
                        {totalUnread > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>}
                    </Link>
                    <Link to="/connections" className={`p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition-all group relative ${activeTab === 'connections' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-500 dark:text-slate-400'}`}>
                        <span className="material-symbols-outlined block group-hover:text-primary transition-colors">group</span>
                    </Link>
                    <Link to="/notifications" className={`p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition-all group relative ${activeTab === 'notifications' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-500 dark:text-slate-400'}`}>
                        <span className="material-symbols-outlined block group-hover:text-primary transition-colors">notifications</span>
                    </Link>
                    <Link to={`/profile/${currentUserId || 'me'}`} className={`p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition-all group relative ${activeTab === 'profile' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-500 dark:text-slate-400'}`}>
                        <span className="material-symbols-outlined block group-hover:text-primary transition-colors">person</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
}
