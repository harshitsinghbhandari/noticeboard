import { useEffect, useCallback, useMemo } from 'react';
import * as messagesApi from '../api/messages';
import { useApi } from '../../../hooks/useApi';
import { useUnread } from '../../../hooks/useUnread';
import { socket } from '../../../utils/socket';

export const useConversations = () => {
    const { unreadBySender } = useUnread();

    const {
        data: conversations,
        isLoading: loadingConversations,
        execute: fetchConversations,
        setData: setConversations
    } = useApi(messagesApi.getConversations);

    const {
        data: groups,
        isLoading: loadingGroups,
        execute: fetchGroups,
        setData: setGroups
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

    // --- Socket Listeners for Real-time Updates ---
    useEffect(() => {
        const onMessageReceive = (data: { message: any }) => {
            const { message } = data;
            // Update Conversations
            setConversations(prev => {
                if (!prev) return prev;
                const index = prev.findIndex(c => c.other_id === message.sender_id);
                if (index !== -1) {
                    const updated = { ...prev[index], message_text: message.message_text, created_at: message.created_at };
                    const newList = [...prev];
                    newList.splice(index, 1);
                    newList.unshift(updated);
                    return newList;
                }
                void fetchConversations();
                return prev;
            });
        };

        const onGroupMessageNew = (data: any) => {
            const message = data.message || data;

            setGroups(prev => {
                if (!prev) return prev;
                const index = prev.findIndex(g => g.id === message.group_id);
                if (index !== -1) {
                    const updated = {
                        ...prev[index], last_message: {
                            content: message.content,
                            sender_first_name: message.sender_first_name,
                            sender_last_name: message.sender_last_name || '',
                            created_at: message.created_at
                        }
                    };
                    const newList = [...prev];
                    newList.splice(index, 1);
                    newList.unshift(updated);
                    return newList;
                }
                void fetchGroups();
                return prev;
            });
        };

        socket.on('message:receive', onMessageReceive);
        socket.on('group:message:new', onGroupMessageNew);

        return () => {
            socket.off('message:receive', onMessageReceive);
            socket.off('group:message:new', onGroupMessageNew);
        };
    }, [setConversations, setGroups, fetchConversations, fetchGroups]);

    return {
        conversations: conversations || [],
        groups: groups || [],
        allChats,
        loading: loadingConversations || loadingGroups,
        fetchData
    };
};
