import { useEffect, useCallback } from 'react';
import * as notificationsApi from '../api/notifications';
import { useApi } from '../../../hooks/useApi';

export const useNotifications = () => {
    const {
        data: notifications,
        isLoading,
        execute: executeFetch,
        setData: setNotifications
    } = useApi(notificationsApi.getNotifications);

    const {
        execute: executeMarkAsRead
    } = useApi(notificationsApi.markAsRead);

    const fetchNotifications = useCallback(async () => {
        await executeFetch();
    }, [executeFetch]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAsRead = async (notificationId: string) => {
        // Optimistic update
        setNotifications(prev => (prev || []).map(n =>
            n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        ));

        try {
            await executeMarkAsRead(notificationId);
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    };

    return {
        notifications: notifications || [],
        isLoading,
        fetchNotifications,
        handleMarkAsRead
    };
};
