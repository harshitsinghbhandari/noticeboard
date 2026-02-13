import apiClient from '../../../api/client';
import type { Opening } from '../../../types';

export const getOpenings = (filters: { job_type?: string; experience_level?: string; body_id?: string }) => {
    let url = '/openings?';
    if (filters.job_type) url += `job_type=${filters.job_type}&`;
    if (filters.experience_level) url += `experience_level=${filters.experience_level}&`;
    if (filters.body_id) url += `body_id=${filters.body_id}&`;
    return apiClient.get<Opening[]>(url);
};

export const createOpening = (data: any) => apiClient.post<Opening>('/openings', data);
export const updateOpening = (id: string, data: any) => apiClient.put<Opening>(`/openings/${id}`, data);
export const deleteOpening = (id: string) => apiClient.delete(`/openings/${id}`);
