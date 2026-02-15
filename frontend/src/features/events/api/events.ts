import apiClient from '../../../api/client';
import type { Event, UserProfile } from '../../../types';

export const getEvents = (params?: { lat?: number; lng?: number; radius?: number }) =>
    apiClient.get<Event[]>('/events', { params });

export const getEventById = (id: string) =>
    apiClient.get<Event>(`/events/${id}`);

export const getEventByGroupId = (groupId: string) =>
    apiClient.get<Event>(`/events/group/${groupId}`);

export const joinEvent = (id: string) =>
    apiClient.post(`/events/${id}/join`);

export const getEventAttendees = (id: string) =>
    apiClient.get<UserProfile[]>(`/events/${id}/attendees`);

export const publishEvent = (id: string) =>
    apiClient.patch(`/events/${id}/publish`);

export const deleteEvent = (id: string) =>
    apiClient.delete(`/events/${id}`);

export const updateEvent = (id: string, data: any) =>
    apiClient.patch<Event>(`/events/${id}`, data);
