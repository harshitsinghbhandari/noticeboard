import apiClient from '../../../api/client';
import type { UserProfile, Post } from '../../../types';

export const getMe = () => apiClient.get<UserProfile>('/me');
export const getUser = (id: string) => apiClient.get<UserProfile>(`/users/${id}`);

export const getMyProfile = () => apiClient.get<UserProfile>('/me/profile');
export const updateMyProfile = (about: string) => apiClient.put('/me/profile', { about });

export const getUserPosts = (userId: string) => apiClient.get<Post[]>(`/users/${userId}/posts`);

export const blockUser = (userId: string) => apiClient.post(`/users/${userId}/block`);
export const unblockUser = (userId: string) => apiClient.delete(`/users/${userId}/block`);
export const reportUser = (userId: string, reason: string) => apiClient.post(`/users/${userId}/report`, { reason });
