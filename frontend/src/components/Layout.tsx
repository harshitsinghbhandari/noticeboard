import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/Button';

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
        <div className="min-h-screen bg-surface-muted font-sans text-text-primary">
            {/* Top Navigation */}
            <nav className="sticky top-0 z-50 w-full border-b border-border bg-surface/80 backdrop-blur-md">
                <div className="max-w-screen-md mx-auto px-4 h-14 flex items-center justify-between">
                    {/* App Name */}
                    <div className="flex items-center gap-4">
                        <Link
                            to="/feed"
                            className="text-lg font-bold text-primary hover:opacity-80 transition-opacity"
                        >
                            Noticeboard
                        </Link>
                    </div>

                    {/* Navigation Items */}
                    <div className="flex items-center gap-2">
                        <Link
                            to="/feed"
                            className={`p-2 rounded-md transition-colors ${activeTab === 'feed' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-surface-muted hover:text-text-primary'}`}
                            title="Feed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        </Link>

                        <Link
                            to="/connections"
                            className={`p-2 rounded-md transition-colors ${activeTab === 'connections' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-surface-muted hover:text-text-primary'}`}
                            title="Connections"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        </Link>

                        <Link
                            to="/notifications"
                            className={`p-2 rounded-md transition-colors ${activeTab === 'notifications' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-surface-muted hover:text-text-primary'}`}
                            title="Notifications"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                        </Link>

                        <div className="h-6 w-px bg-border mx-2"></div>

                        {/* Profile Dropdown Trigger (Simple for now) */}
                        <Link
                            to={`/profile/${currentUserId || 'me'}`}
                            className={`flex items-center gap-2 p-1 pl-2 pr-3 rounded-full border transition-colors ${activeTab === 'profile' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent hover:bg-surface-muted text-text-muted hover:text-text-primary'}`}
                            title="Profile"
                        >
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                {userEmail ? userEmail[0].toUpperCase() : 'U'}
                            </div>
                            <span className="text-sm font-medium hidden sm:block">
                                {userEmail?.split('@')[0]}
                            </span>
                        </Link>

                        {/* Logout - could be in dropdown but putting here for simplicity as requested 'Profile dropdown (right)' - technically this is part of profile area actions */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:text-danger hover:bg-danger/10 ml-1"
                            onClick={onLogout}
                            title="Logout"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-screen-md mx-auto px-4 py-6">
                {children}
            </main>
        </div>
    );
}
