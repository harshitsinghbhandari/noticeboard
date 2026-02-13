import { useEffect } from 'react';
import { useApi } from '../../../hooks/useApi';
import * as eventsApi from '../api/events';

export function useEventDetail(eventId: string | undefined) {
    const {
        data: event,
        isLoading,
        error,
        execute: fetchEvent
    } = useApi(eventsApi.getEventById);

    const {
        execute: join,
        isLoading: isJoining
    } = useApi(eventsApi.joinEvent);

    useEffect(() => {
        if (eventId) {
            fetchEvent(eventId);
        }
    }, [eventId, fetchEvent]);

    const handleJoin = async () => {
        if (eventId) {
            await join(eventId);
            await fetchEvent(eventId); // Refresh data
        }
    };

    return {
        event,
        isLoading,
        error,
        handleJoin,
        isJoining
    };
}
