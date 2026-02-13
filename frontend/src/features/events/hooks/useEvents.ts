import { useEffect } from 'react';
import { useApi } from '../../../hooks/useApi';
import * as eventsApi from '../api/events';

export function useEvents() {
    const {
        data: events,
        isLoading,
        error,
        execute: fetchEvents
    } = useApi(eventsApi.getEvents);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return {
        events: events || [],
        isLoading,
        error,
        refreshEvents: fetchEvents
    };
}
