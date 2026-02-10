import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
    children: ReactNode;
    userEmail?: string;
    currentUserId?: string;
    onLogout: () => void;
}

export default function Layout({ children, userEmail, currentUserId, onLogout }: LayoutProps) {
    const location = useLocation();
    const activeTab = location.pathname.split('/')[1] || 'feed';

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 w-full bg-white dark:bg-[#1a242f] border-b border-[#e8edf3] dark:border-gray-800 px-4 md:px-10 py-3">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <Link to="/feed" className="flex items-center gap-2.5">
                            <div className="bg-primary text-white p-1.5 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">school</span>
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white hidden sm:block">CampusConnect</h1>
                        </Link>

                        {/* Search Bar */}
                        <label className="hidden md:flex flex-col min-w-40 h-10 max-w-64">
                            <div className="flex w-full flex-1 items-stretch rounded-lg h-full bg-[#e8edf3] dark:bg-gray-800">
                                <div className="text-gray-500 flex items-center justify-center pl-4">
                                    <span className="material-symbols-outlined text-xl">search</span>
                                </div>
                                <input
                                    className="w-full border-none bg-transparent focus:ring-0 h-full placeholder:text-gray-500 px-2 text-sm font-normal"
                                    placeholder="Search campus..."
                                />
                            </div>
                        </label>
                    </div>

                    {/* Nav Actions */}
                    <div className="flex items-center gap-4">
                        <nav className="hidden md:flex items-center gap-6 mr-4">
                            <Link
                                to="/feed"
                                className={`${activeTab === 'feed' ? 'text-primary font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary font-medium'} text-sm transition-colors flex items-center gap-1`}
                            >
                                <span className="material-symbols-outlined text-lg">home</span>
                                Feed
                            </Link>
                            <Link
                                to="/connections"
                                className={`${activeTab === 'connections' ? 'text-primary font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary font-medium'} text-sm transition-colors flex items-center gap-1`}
                            >
                                <span className="material-symbols-outlined text-lg">group</span>
                                Connections
                            </Link>
                            <Link
                                to="/clubs"
                                className={`${activeTab === 'clubs' ? 'text-primary font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary font-medium'} text-sm transition-colors flex items-center gap-1`}
                            >
                                <span className="material-symbols-outlined text-lg">groups</span>
                                Clubs
                            </Link>
                            <Link
                                to="/openings"
                                className={`${activeTab === 'openings' ? 'text-primary font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary font-medium'} text-sm transition-colors flex items-center gap-1`}
                            >
                                <span className="material-symbols-outlined text-lg">work</span>
                                Openings
                            </Link>
                            <Link
                                to="/messages"
                                className={`${activeTab === 'messages' ? 'text-primary font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary font-medium'} text-sm transition-colors flex items-center gap-1`}
                            >
                                <span className="material-symbols-outlined text-lg">mail</span>
                                Messages
                            </Link>
                            <Link
                                to="/notifications"
                                className={`${activeTab === 'notifications' ? 'text-primary font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary font-medium'} text-sm transition-colors flex items-center gap-1`}
                            >
                                <span className="material-symbols-outlined text-lg">notifications</span>
                                Notifications
                            </Link>
                        </nav>

                        <div className="flex items-center gap-2">
                            {/* Logout */}
                            <button
                                onClick={onLogout}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                title="Logout"
                            >
                                <span className="material-symbols-outlined">logout</span>
                            </button>

                            {/* Profile Menu */}
                            <Link
                                to={`/profile/${currentUserId || 'me'}`}
                                className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700 ml-2"
                            >
                                <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 overflow-hidden">
                                    <div className="h-full w-full flex items-center justify-center text-primary font-bold text-xs">
                                        {userEmail?.[0].toUpperCase() || 'U'}
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-gray-400">expand_more</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-[1200px] mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
