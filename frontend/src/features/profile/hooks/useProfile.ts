import { useEffect, useCallback } from 'react';
import * as profileApi from '../api/profile';
import { useApi } from '../../../hooks/useApi';

export const useProfile = (id: string | undefined, currentUserId: string | undefined) => {
    const isMe = id === 'me' || (currentUserId && id === currentUserId);
    const targetUserId = isMe ? currentUserId : id;

    const {
        data: profile,
        isLoading: loading,
        execute: executeFetchUser,
        setData: setProfile
    } = useApi(isMe ? profileApi.getMe : () => profileApi.getUser(id!));

    const {
        execute: fetchProfileData
    } = useApi(profileApi.getMyProfile);

    const {
        data: posts,
        isLoading: isLoadingPosts,
        execute: executeFetchPosts,
        setData: setPosts
    } = useApi(profileApi.getUserPosts);

    const fetchData = useCallback(async () => {
        if (!id) return;
        try {
            const userData = await executeFetchUser();
            if (isMe) {
                const pData = await fetchProfileData();
                if (userData && pData) {
                    setProfile({ ...userData, ...pData });
                }
            }
            if (targetUserId) {
                await executeFetchPosts(targetUserId);
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
        }
    }, [id, isMe, targetUserId, executeFetchUser, fetchProfileData, executeFetchPosts, setProfile]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const { execute: executeUpdateProfile } = useApi(profileApi.updateMyProfile);
    const { execute: executeBlock } = useApi(profileApi.blockUser);
    const { execute: executeUnblock } = useApi(profileApi.unblockUser);
    const { execute: executeReport } = useApi(profileApi.reportUser);

    const updateProfile = async (about: string) => {
        await executeUpdateProfile(about);
        setProfile(prev => prev ? { ...prev, about } : null);
    };

    const handleBlockUser = async () => {
        if (!targetUserId || isMe) return;
        await executeBlock(targetUserId);
        setProfile(prev => prev ? { ...prev, is_blocked: true, connection_status: null } : null);
    };

    const handleUnblockUser = async () => {
        if (!targetUserId || isMe) return;
        await executeUnblock(targetUserId);
        setProfile(prev => prev ? { ...prev, is_blocked: false } : null);
    };

    const handleReportUser = async (reason: string) => {
        if (!targetUserId || isMe) return;
        await executeReport(targetUserId, reason);
    };

    return {
        profile,
        posts: posts || [],
        setPosts,
        loading,
        isLoadingPosts,
        isMe,
        targetUserId,
        fetchProfileData: fetchData,
        fetchPosts: () => targetUserId && executeFetchPosts(targetUserId),
        updateProfile,
        handleBlockUser,
        handleUnblockUser,
        handleReportUser
    };
};
