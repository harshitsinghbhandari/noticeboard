import apiClient from '../../../api/client';
import type { Message, Conversation, Group, GroupMessage } from '../../../types';

export const getConversations = () => apiClient.get<Conversation[]>('/messages');
export const getGroups = () => apiClient.get<Group[]>('/groups');
export const getUnreadSummary = () => apiClient.get('/messages/unread-summary');

export const getUserChat = (userId: string) => apiClient.get<Message[]>(`/messages/${userId}`);
export const getGroupChat = (groupId: string) => apiClient.get<GroupMessage[]>(`/groups/${groupId}/messages`);

export const sendMessage = (receiverId: string, text: string) =>
    apiClient.post('/messages', { receiver_id: receiverId, message_text: text });

export const sendGroupMessage = (groupId: string, content: string) =>
    apiClient.post(`/groups/${groupId}/messages`, { content });

export const createGroup = (name: string, description: string, memberIds: string[]) =>
    apiClient.post<Group>('/groups', { name, description, memberIds });

export const addGroupMember = (groupId: string, userId: string) =>
    apiClient.post(`/groups/${groupId}/members`, { userId });

export const leaveGroup = (groupId: string) =>
    apiClient.patch(`/groups/${groupId}/leave`);

export const markGroupRead = (groupId: string) =>
    apiClient.patch(`/groups/${groupId}/read`);

export const getUserContext = (userId: string) =>
    apiClient.get(`/users/${userId}`);

import type { User } from '../../../types';

export const searchUsers = (query: string) =>
    apiClient.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
