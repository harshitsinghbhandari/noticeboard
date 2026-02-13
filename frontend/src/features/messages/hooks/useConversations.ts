import { useEffect, useCallback, useMemo } from 'react';
import * as messagesApi from '../api/messages';
import { useApi } from '../../../hooks/useApi';
import { useUnread } from '../../../hooks/useUnread';

export const useConversations = () => {
    const { unreadBySender } = useUnread();

    const {
        data: conversations,
        isLoading: loadingConversations,
        execute: fetchConversations,
    } = useApi(messagesApi.getConversations);

    const {
        data: groups,
        isLoading: loadingGroups,
        execute: fetchGroups,
    } = useApi(messagesApi.getGroups);

    const fetchData = useCallback(async () => {
        await Promise.all([
            fetchConversations(),
            fetchGroups()
        ]);
    }, [fetchConversations, fetchGroups]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const allChats = useMemo(() => {
        const mappedConversations = (conversations || []).map(c => ({
            id: c.other_id,
            type: 'user' as const,
            name: `${c.first_name} ${c.last_name}`,
            lastMessage: c.message_text,
            timestamp: c.created_at,
            unread: unreadBySender[c.other_id] || 0
        }));

        const mappedGroups = (groups || []).map(g => ({
            id: g.id,
            type: 'group' as const,
            name: g.name,
            lastMessage: g.last_message ? g.last_message.content : 'No messages',
            timestamp: g.last_message ? g.last_message.created_at : g.created_at,
            unread: unreadBySender[g.id] || 0
        }));

        return [...mappedConversations, ...mappedGroups].sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }, [conversations, groups, unreadBySender]);

    return {
        conversations: conversations || [],
        groups: groups || [],
        allChats,
        loading: loadingConversations || loadingGroups,
        fetchData
    };
};
