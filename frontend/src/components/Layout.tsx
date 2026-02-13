import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDarkMode } from './DarkModeContext';
import { useUnread } from '../context/UnreadContext';

interface LayoutProps {
    children: ReactNode;
    userEmail?: string;
    currentUserId?: string;
    onLogout: () => void;
}

export default function Layout({ children, userEmail, currentUserId, onLogout }: LayoutProps) {
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const { totalUnread } = useUnread();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const activeTab = location.pathname.split('/')[1] || 'feed';

    // We need to import useUnread. Since we can't add imports with this tool easily in one go without replacing the whole top,
    // we will assume valid import is added in a separate step or we rely on the next step to add it. 
    // Wait, I can't assume. I should split this. 
    // Actually, I can use multi_replace to do both.
    // But I am restricted to replace_file_content for "single contiguous block".
    // I will use multi_replace instead.


    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 w-full bg-white dark:bg-[#1a242f] border-b border-[#e8edf3] dark:border-gray-800 px-4 md:px-10 py-3">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 md:gap-8">
                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined">
                                {isMenuOpen ? 'close' : 'menu'}
                            </span>
                        </button>

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
                                to="/bodies"
                                className={`${activeTab === 'bodies' ? 'text-primary font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary font-medium'} text-sm transition-colors flex items-center gap-1`}
                            >
                                <span className="material-symbols-outlined text-lg">groups</span>
                                Bodies
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
                                className={`${activeTab === 'messages' ? 'text-primary font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary font-medium'} text-sm transition-colors flex items-center gap-1 relative`}
                            >
                                <div className="relative">
                                    <span className="material-symbols-outlined text-lg">mail</span>
                                    {totalUnread > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                                            {totalUnread > 99 ? '99+' : totalUnread}
                                        </span>
                                    )}
                                </div>
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
                            {/* Dark Mode Toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            >
                                <span className="material-symbols-outlined">
                                    {isDarkMode ? 'light_mode' : 'dark_mode'}
                                </span>
                            </button>

                            {/* Logout */}
                            <button
                                onClick={onLogout}
                                className="hidden md:flex p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                title="Logout"
                            >
                                <span className="material-symbols-outlined">logout</span>
                            </button>

                            {/* Profile Menu */}
                            <Link
                                to={`/profile/${currentUserId || 'me'}`}
                                className="hidden md:flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700 ml-2"
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

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Mobile Menu Sidebar */}
            <div className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-[#1a242f] border-r border-[#e8edf3] dark:border-gray-800 transform transition-transform duration-300 ease-in-out md:hidden ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 flex flex-col h-full">
                    <div className="flex items-center gap-2.5 mb-8 pt-2">
                        <div className="bg-primary text-white p-1.5 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">school</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">CampusConnect</h1>
                    </div>

                    <nav className="flex flex-col gap-2">
                        {[
                            { to: '/feed', label: 'Feed', icon: 'home', tab: 'feed' },
                            { to: '/connections', label: 'Connections', icon: 'group', tab: 'connections' },
                            { to: '/bodies', label: 'Bodies', icon: 'groups', tab: 'bodies' },
                            { to: '/openings', label: 'Openings', icon: 'work', tab: 'openings' },
                            { to: '/messages', label: 'Messages', icon: 'mail', tab: 'messages' },
                            { to: '/notifications', label: 'Notifications', icon: 'notifications', tab: 'notifications' },
                        ].map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === link.tab
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <div className="relative">
                                    <span className="material-symbols-outlined">{link.icon}</span>
                                    {link.tab === 'messages' && totalUnread > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                                            {totalUnread > 99 ? '99+' : totalUnread}
                                        </span>
                                    )}
                                </div>
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-auto pt-4 border-t border-[#e8edf3] dark:border-gray-800">
                        <Link
                            to={`/profile/${currentUserId || 'me'}`}
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                {userEmail?.[0].toUpperCase() || 'U'}
                            </div>
                            My Profile
                        </Link>
                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                onLogout();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-2"
                        >
                            <span className="material-symbols-outlined">logout</span>
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="max-w-[1200px] mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
