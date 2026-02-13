import apiClient from '../../../api/client';
import type { Notification } from '../../../types';

export const getNotifications = () => apiClient.get<Notification[]>('/notifications');

export const markAsRead = (notificationId: string) =>
    apiClient.post(`/notifications/${notificationId}/read`);
