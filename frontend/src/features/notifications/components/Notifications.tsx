import { useState } from 'react';
import { timeAgo } from '../../../utils/timeAgo';
import type { Notification } from '../../../types';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationsProps {
    onNotificationClick: (notification: Notification) => void;
}

export default function Notifications({ onNotificationClick }: NotificationsProps) {
    const { notifications, isLoading, fetchNotifications, handleMarkAsRead } = useNotifications();
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const handleClick = async (notification: Notification) => {
        if (!notification.read_at) {
            await handleMarkAsRead(notification.id);
        }
        onNotificationClick(notification);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return 'local_fire_department';
            case 'comment': return 'chat_bubble';
            case 'connection': return 'person_add';
            default: return 'notifications';
        }
    };

    const filteredNotifications = filter === 'all'
        ? notifications
        : notifications.filter(n => !n.read_at);

    return (
        <div className="max-w-[800px] mx-auto space-y-8 animate-fade-in pb-20">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Pulse Notifications</h1>
                    <p className="text-slate-400">Stay in the rhythm of your campus.</p>
                </div>
                <button
                    className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                    onClick={() => fetchNotifications()}
                >
                    <span className="material-symbols-outlined">refresh</span>
                </button>
            </header>

            <div className="flex bg-white/5 p-1 rounded-xl w-fit">
                <button
                    className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${filter === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
                    onClick={() => setFilter('all')}
                >
                    All Activities
                </button>
                <button
                    className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${filter === 'unread' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
                    onClick={() => setFilter('unread')}
                >
                    Unread Pulse
                </button>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    <div className="py-20 text-center text-slate-500 animate-pulse">Checking your pulse...</div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl">
                        <p className="text-slate-500 italic">
                            {filter === 'unread' ? 'No unread pulses found.' : 'Your pulse is steady. No notifications.'}
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map((n) => (
                        <div
                            key={n.id}
                            onClick={() => handleClick(n)}
                            className={`group flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer border ${!n.read_at
                                    ? 'bg-primary/10 border-primary/20 hover:bg-primary/15'
                                    : 'bg-white/5 border-transparent hover:bg-white/10'
                                }`}
                        >
                            <div className="relative">
                                <div className="size-12 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-primary font-bold text-xl">
                                    {n.actor_first_name?.[0]}
                                </div>
                                <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full size-5 flex items-center justify-center border-2 border-background-dark shadow-lg">
                                    <span className="material-symbols-outlined !text-[12px] font-bold">{getIcon(n.type)}</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm md:text-base ${!n.read_at ? 'text-white' : 'text-slate-300'}`}>
                                    <span className="font-bold text-primary">{n.actor_first_name} {n.actor_last_name}</span>
                                    {n.type === 'like' && ' interested in your pulse'}
                                    {n.type === 'comment' && ' added hype to your post'}
                                    {n.type === 'connection' && ' joined your network'}
                                </p>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">{timeAgo(n.created_at)}</p>
                            </div>
                            {!n.read_at && (
                                <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(140,37,244,0.8)]"></div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {filteredNotifications.length > 10 && (
                <div className="flex justify-center pt-6">
                    <button className="px-8 py-2.5 border border-primary/30 text-primary font-bold rounded-full hover:bg-primary/5 transition-all text-sm">
                        Load More Pulses
                    </button>
                </div>
            )}
        </div>
    );
}
