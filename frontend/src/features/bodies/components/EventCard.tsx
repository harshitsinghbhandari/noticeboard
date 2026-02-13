import type { Event } from '../../../types';
import { Button } from '../../../components/ui/Button';
import apiClient from '../../../api/client';
import { useState } from 'react';

interface EventCardProps {
    event: Event;
    onJoin?: () => void;
    currentUserId?: string;
}

export default function EventCard({ event, onJoin, currentUserId }: EventCardProps) {
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (!onJoin) return;
        setLoading(true);
        try {
            await apiClient.post(`/events/${event.id}/join`);
            onJoin();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to join event');
        } finally {
            setLoading(false);
        }
    };

    const isPublished = event.status === 'published';

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{event.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {new Date(event.start_time).toLocaleString()} - {new Date(event.end_time).toLocaleString()}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 mb-2 whitespace-pre-wrap">{event.description}</p>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        <span>{event.location_name}</span>
                    </div>

                    {event.capacity && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <span className="material-symbols-outlined text-sm">group</span>
                            <span>Capacity: {event.capacity}</span>
                        </div>
                    )}
                </div>
                <div>
                    {isPublished && (
                        <Button size="sm" onClick={handleJoin} disabled={loading}>
                            {loading ? 'Joining...' : 'Join Event'}
                        </Button>
                    )}
                    {!isPublished && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-300 capitalize">
                            {event.status}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
