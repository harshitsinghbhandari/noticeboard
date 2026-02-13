import apiClient from '../../../api/client';
import type { FeedItem, Post, Comment } from '../../../types';

export const getFeed = (limit: number, cursor?: string | null) => {
    let url = `/posts?limit=${limit}`;
    if (cursor) {
        url += `&cursor=${cursor}`;
    }
    return apiClient.get<FeedItem[]>(url);
};

export const createPost = (content: string, visibility: 'public' | 'connections_only', bodyId?: string) => {
    return apiClient.post('/posts', { content, visibility, body_id: bodyId });
};

export const getPost = (postId: string) => {
    return apiClient.get<Post>(`/posts/${postId}`);
};

export const likePost = (postId: string) => {
    return apiClient.post(`/posts/${postId}/like`);
};

export const unlikePost = (postId: string) => {
    return apiClient.delete(`/posts/${postId}/like`);
};

export const getComments = (postId: string) => {
    return apiClient.get<Comment[]>(`/posts/${postId}/comments`);
};

export const addComment = (postId: string, content: string) => {
    return apiClient.post(`/posts/${postId}/comments`, { content });
};
