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

    const {
        execute: publish,
        isLoading: isPublishing
    } = useApi(eventsApi.publishEvent);

    const {
        data: attendees,
        isLoading: isLoadingAttendees,
        execute: fetchAttendees
    } = useApi(eventsApi.getEventAttendees);

    useEffect(() => {
        if (eventId) {
            fetchEvent(eventId);
            fetchAttendees(eventId);
        }
    }, [eventId, fetchEvent, fetchAttendees]);

    const handleJoin = async () => {
        if (eventId) {
            await join(eventId);
            await fetchEvent(eventId); // Refresh data
            await fetchAttendees(eventId); // Refresh attendees
        }
    };

    const handlePublish = async () => {
        if (eventId) {
            await publish(eventId);
            await fetchEvent(eventId); // Refresh data
        }
    };

    return {
        event,
        isLoading,
        error,
        handleJoin,
        isJoining,
        handlePublish,
        isPublishing,
        attendees,
        isLoadingAttendees
    };
}
