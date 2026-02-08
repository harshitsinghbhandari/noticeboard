import { useState, useEffect } from 'react';
import { timeAgo } from '../utils/timeAgo';
import type { Notification } from '../types';

interface NotificationsProps {
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
    onNotificationClick: (notification: Notification) => void;
}

export default function Notifications({ authenticatedFetch, onNotificationClick }: NotificationsProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
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
    };

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

    const getMessage = (n: Notification) => {
        const name = `${n.actor_first_name} ${n.actor_last_name}`;
        switch (n.type) {
            case 'like': return `${name} liked your post.`;
            case 'comment': return `${name} commented on your post.`;
            case 'connection': return `${name} accepted your connection request.`;
            default: return 'New notification';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Notifications</h3>
                <button
                    onClick={fetchNotifications}
                    className="text-sm text-blue-600 hover:text-blue-800"
                >
                    Refresh
                </button>
            </div>

            {isLoading ? (
                <p className="text-gray-500">Loading...</p>
            ) : notifications.length === 0 ? (
                <p className="text-gray-500 italic">No notifications.</p>
            ) : (
                <div className="bg-white rounded shadow-sm border border-gray-200 divide-y divide-gray-100">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            onClick={() => handleClick(n)}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read_at ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                        >
                            <p className="text-sm text-gray-800">{getMessage(n)}</p>
                            <p className="text-xs text-gray-500 mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
