import apiClient from '../../../api/client';
import type { UserProfile } from '../../../types';

export interface Connection {
    id: string;
    requester_id: string;
    receiver_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    requester_first_name?: string;
    requester_last_name?: string;
    requester_headline?: string;
    receiver_first_name?: string;
    receiver_last_name?: string;
    receiver_headline?: string;
}

export const getIncoming = () => apiClient.get<Connection[]>('/connections/incoming');
export const getOutgoing = () => apiClient.get<Connection[]>('/connections/outgoing');
export const getConnections = () => apiClient.get<Connection[]>('/connections');

export const requestConnection = (receiverId: string) =>
    apiClient.post('/connections/request', { receiver_id: receiverId });

export const respondToRequest = (id: string, action: 'accept' | 'reject') =>
    apiClient.post(`/connections/${id}/${action}`);

export const searchUsers = (query: string) =>
    apiClient.get<UserProfile[]>(`/users/search?q=${query}`);
