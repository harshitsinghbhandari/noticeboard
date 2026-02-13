import { useEffect, useCallback } from 'react';
import * as bodiesApi from '../api/bodies';
import { useApi } from '../../../hooks/useApi';

export const useBodyProfile = (id: string | undefined) => {
    const {
        data: body,
        isLoading: loadingBody,
        execute: executeFetchBody,
        setData: setBody
    } = useApi(bodiesApi.getBody);

    const {
        data: openings,
        execute: executeFetchOpenings
    } = useApi(bodiesApi.getBodyOpenings);

    const {
        data: posts,
        execute: executeFetchPosts,
        setData: setPosts
    } = useApi(bodiesApi.getBodyPosts);

    const {
        data: members,
        execute: executeFetchMembers,
        setData: setMembers
    } = useApi(bodiesApi.getBodyMembers);

    const fetchBodyData = useCallback(async () => {
        if (!id) return;
        try {
            const bodyData = await executeFetchBody(id);
            await Promise.all([
                executeFetchOpenings(id),
                executeFetchPosts(id)
            ]);

            if (bodyData?.user_role === 'BODY_ADMIN') {
                await executeFetchMembers(id);
            }
        } catch (err) {
            console.error('Failed to fetch body data', err);
        }
    }, [id, executeFetchBody, executeFetchOpenings, executeFetchPosts, executeFetchMembers]);

    useEffect(() => {
        fetchBodyData();
    }, [fetchBodyData]);

    const { execute: executeFollow } = useApi(bodiesApi.followBody);
    const { execute: executeUnfollow } = useApi(bodiesApi.unfollowBody);

    const toggleFollow = async () => {
        if (!body || !id) return;
        try {
            if (body.is_following) {
                await executeUnfollow(id);
            } else {
                await executeFollow(id);
            }
            setBody({ ...body, is_following: !body.is_following });
        } catch (err) {
            console.error('Failed to toggle follow', err);
        }
    };

    const { execute: executeAddMember } = useApi(bodiesApi.addBodyMember);
    const { execute: executeRemoveMember } = useApi(bodiesApi.removeBodyMember);
    const { execute: executeUpdateRole } = useApi(bodiesApi.updateBodyMember);

    const handleAddMember = async (userId: string, role: any) => {
        if (!id) return;
        await executeAddMember(id, { user_id: userId, role });
        await executeFetchMembers(id);
    };

    const handleRemoveMember = async (userId: string) => {
        if (!id) return;
        await executeRemoveMember(id, userId);
        setMembers(prev => (prev || []).filter(m => m.user_id !== userId));
    };

    const handleChangeRole = async (userId: string, role: any) => {
        if (!id) return;
        await executeUpdateRole(id, userId, role);
        setMembers(prev => (prev || []).map(m => m.user_id === userId ? { ...m, role } : m));
    };

    return {
        body,
        posts: posts || [],
        setPosts,
        openings: openings || [],
        members: members || [],
        loading: loadingBody,
        fetchBodyData,
        toggleFollow,
        handleAddMember,
        handleRemoveMember,
        handleChangeRole
    };
};
