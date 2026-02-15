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
        // Initial fetch handled by component or if needed here without filters
        // But better to expose a refetch that allows params
    }, []);

    const fetchEventsWithLocation = (filters?: { type?: string }) => {
        if (!navigator.geolocation) {
            fetchEvents({ lat: 19.1240, lng: 72.9112, radius: 50000, ...filters });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchEvents({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    radius: 50000,
                    ...filters
                });
            },
            (error) => {
                console.warn("Geolocation denied or error, using default location", error);
                fetchEvents({ lat: 19.1240, lng: 72.9112, radius: 50000, ...filters });
            }
        );
    };

    // Initial load
    useEffect(() => {
        fetchEventsWithLocation();
    }, []);

    return {
        events: events || [],
        isLoading,
        error,
        refreshEvents: fetchEventsWithLocation
    };
}
