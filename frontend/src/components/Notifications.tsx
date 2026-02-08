import { useState, useEffect, useCallback } from 'react';
import { timeAgo } from '../utils/timeAgo';
import type { Notification } from '../types';

interface NotificationsProps {
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
    onNotificationClick: (notification: Notification) => void;
}

export default function Notifications({ authenticatedFetch, onNotificationClick }: NotificationsProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await authenticatedFetch('http://localhost:3000/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setIsLoading(false);
        }
    }, [authenticatedFetch]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleClick = async (notification: Notification) => {
        // Mark as read if not already
        if (!notification.read_at) {
            // Optimistic update
            setNotifications(notifications.map(n =>
                n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
            ));

            try {
                await authenticatedFetch(`http://localhost:3000/notifications/${notification.id}/read`, {
                    method: 'POST'
                });
            } catch (error) {
                console.error('Failed to mark read', error);
            }
        }

        // Navigate
        onNotificationClick(notification);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <span className="material-symbols-outlined text-[12px] font-bold">favorite</span>;
            case 'comment': return <span className="material-symbols-outlined text-[12px] font-bold">chat_bubble</span>;
            case 'connection': return <span className="material-symbols-outlined text-[12px] font-bold">person_add</span>;
            default: return <span className="material-symbols-outlined text-[12px] font-bold">notifications</span>;
        }
    };

    const getIconBg = (type: string) => {
        switch (type) {
            case 'like': return 'bg-red-500';
            case 'comment': return 'bg-green-500';
            case 'connection': return 'bg-primary';
            default: return 'bg-slate-500';
        }
    };

    const filteredNotifications = filter === 'all'
        ? notifications
        : notifications.filter(n => !n.read_at);

    return (
        <div className="layout-content-container flex flex-col max-w-[800px] flex-1 mx-auto">
            {/* Notification Header */}
            <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
                <div>
                    <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold tracking-tight">Notifications</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Stay updated with your campus activity</p>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-semibold transition-colors"
                    onClick={() => fetchNotifications()}
                >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-2">
                <button
                    className={`px-6 py-3 border-b-2 text-sm font-bold transition-all ${filter === 'all' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`px-6 py-3 border-b-2 text-sm font-bold transition-all ${filter === 'unread' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    onClick={() => setFilter('unread')}
                >
                    Unread
                </button>
            </div>

            {/* Notifications List */}
            <div className="flex flex-col gap-1">
                {isLoading ? (
                    <div className="py-10 text-center text-slate-400 animate-pulse">Loading notifications...</div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 italic">
                        {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                    </div>
                ) : (
                    filteredNotifications.map((n) => (
                        <div
                            key={n.id}
                            onClick={() => handleClick(n)}
                            className={`group flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer relative ${
                                !n.read_at
                                    ? 'bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20'
                                    : 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            {!n.read_at && (
                                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-full"></div>
                            )}
                            <div className="relative">
                                <div className="size-12 rounded-full border-2 border-white dark:border-slate-800 bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {n.actor_first_name?.[0]}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 ${getIconBg(n.type)} text-white rounded-full size-5 flex items-center justify-center border-2 border-white dark:border-slate-800`}>
                                    {getIcon(n.type)}
                                </div>
                            </div>
                            <div className="flex flex-col flex-1">
                                <p className={`text-sm md:text-base ${!n.read_at ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                                    <span className="font-bold">{n.actor_first_name} {n.actor_last_name}</span>
                                    {n.type === 'like' && ' liked your post'}
                                    {n.type === 'comment' && ' commented on your post'}
                                    {n.type === 'connection' && ' accepted your connection request'}
                                </p>
                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{timeAgo(n.created_at)}</p>
                            </div>
                            {!n.read_at && (
                                <div className="shrink-0 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>
                                </div>
                            )}
                            <div className="shrink-0">
                                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined">more_horiz</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Load More Button */}
            {filteredNotifications.length > 0 && (
                <div className="flex justify-center mt-8 pb-12">
                    <button className="flex items-center gap-2 px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                        Load more notifications
                    </button>
                </div>
            )}
        </div>
    );
}
