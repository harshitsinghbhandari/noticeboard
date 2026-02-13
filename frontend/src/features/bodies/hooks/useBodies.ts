import { useEffect } from 'react';
import * as bodiesApi from '../api/bodies';
import { useApi } from '../../../hooks/useApi';
import apiClient from '../../../api/client';

export const useBodies = () => {
    const {
        data: bodies,
        isLoading: loadingBodies,
        execute: fetchBodies,
    } = useApi(bodiesApi.getBodies);

    const {
        data: currentUser,
        execute: fetchCurrentUser,
    } = useApi(() => apiClient.get('/me'));

    useEffect(() => {
        fetchBodies();
        fetchCurrentUser();
    }, [fetchBodies, fetchCurrentUser]);

    const { execute: executeCreate } = useApi(bodiesApi.createBody);

    const handleCreateBody = async (data: { name: string; description: string; website_url: string; initial_admin_id: string }) => {
        await executeCreate(data);
        fetchBodies();
    };

    return {
        bodies: bodies || [],
        loading: loadingBodies,
        currentUser: currentUser?.data || currentUser, // apiClient.get returns AxiosResponse, but useApi sets data to response.data
        fetchBodies,
        handleCreateBody
    };
};
