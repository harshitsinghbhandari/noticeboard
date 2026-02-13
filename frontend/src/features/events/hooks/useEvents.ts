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
        if (!navigator.geolocation) {
            // Geolocation not supported, use default (Mumbai)
            fetchEvents({ lat: 19.1240, lng: 72.9112, radius: 50000 });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchEvents({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    radius: 50000
                });
            },
            (error) => {
                console.warn("Geolocation denied or error, using default location", error);
                // Default to Mumbai on error
                fetchEvents({ lat: 19.1240, lng: 72.9112, radius: 50000 });
            }
        );
    }, [fetchEvents]);

    return {
        events: events || [],
        isLoading,
        error,
        refreshEvents: fetchEvents
    };
}
