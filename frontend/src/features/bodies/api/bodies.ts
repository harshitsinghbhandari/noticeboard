import apiClient from '../../../api/client';
import type { Body, Post, BodyMember, BodyRole, Opening } from '../../../types';

export const getBodies = () => apiClient.get<Body[]>('/bodies');
export const getFollowedBodies = () => apiClient.get<Body[]>('/bodies/followed');
export const getBody = (id: string) => apiClient.get<Body>(`/bodies/${id}`);

export const createBody = (data: { name: string; description: string; website_url: string; initial_admin_id: string }) =>
    apiClient.post('/bodies', data);

export const updateBody = (id: string, data: { name: string; description: string; website_url: string }) =>
    apiClient.put(`/bodies/${id}`, data);

export const deleteBody = (id: string) => apiClient.delete(`/bodies/${id}`);

export const followBody = (id: string) => apiClient.post(`/bodies/${id}/follow`);
export const unfollowBody = (id: string) => apiClient.delete(`/bodies/${id}/follow`);

export const getBodyMembers = (id: string) => apiClient.get<BodyMember[]>(`/bodies/${id}/members`);
export const addBodyMember = (id: string, data: { user_id: string; role: BodyRole }) =>
    apiClient.post(`/bodies/${id}/members`, data);

export const updateBodyMember = (id: string, userId: string, role: BodyRole) =>
    apiClient.put(`/bodies/${id}/members/${userId}`, { role });

export const removeBodyMember = (id: string, userId: string) =>
    apiClient.delete(`/bodies/${id}/members/${userId}`);

export const getBodyPosts = (id: string, limit: number = 20, cursor?: string) => {
    let url = `/bodies/${id}/posts?limit=${limit}`;
    if (cursor) url += `&cursor=${cursor}`;
    return apiClient.get<Post[]>(url);
};

export const getBodyOpenings = (id: string) => apiClient.get<Opening[]>(`/openings?body_id=${id}`);
