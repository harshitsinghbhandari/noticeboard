import { useEffect, useCallback, useState } from 'react';
import * as messagesApi from '../api/messages';
import { useUnread } from '../../../hooks/useUnread';
import { socket } from '../../../utils/socket';
import { useApi } from '../../../hooks/useApi';
import type { Message, GroupMessage } from '../../../types';

export const useChat = (chatId: string | null, chatType: 'user' | 'group' | null, currentUserId?: string) => {
    const { clearUnread } = useUnread();
    const [isBlocked, setIsBlocked] = useState(false);

    const {
        data: messages,
        isLoading: loadingMessages,
        execute: executeFetchMessages,
        setData: setMessages
    } = useApi<(Message | GroupMessage)[], [string]>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        chatType === 'user' ? (messagesApi.getUserChat as any) : (messagesApi.getGroupChat as any)
    );

    const fetchMessages = useCallback(async () => {
        if (!chatId || !chatType) return;
        try {
            await executeFetchMessages(chatId);
            if (chatType === 'user') {
                const contextRes = await messagesApi.getUserContext(chatId);
                setIsBlocked(!!contextRes.data.is_blocked);
            } else {
                messagesApi.markGroupRead(chatId).catch(console.error);
            }
            clearUnread(chatId);
        } catch (err) {
            console.error('Failed to fetch chat', err);
        }
    }, [chatId, chatType, clearUnread, executeFetchMessages]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        if (!chatId || !chatType) return;

        const onMessageNew = (msg: Message) => {
            if (chatType === 'user' && (msg.sender_id === chatId || msg.receiver_id === chatId)) {
                setMessages(prev => {
                    // Check if message already exists (by ID or optimistic match)
                    if (!prev || prev.find(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        };

        const onGroupMessageNew = (msg: GroupMessage) => {
            if (chatType === 'group' && chatId === msg.group_id) {
                setMessages(prev => {
                    if (!prev || prev.find(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                messagesApi.markGroupRead(chatId).catch(console.error);
            }
        };

        socket.on('message:new', onMessageNew);
        socket.on('group:message:new', onGroupMessageNew);

        return () => {
            socket.off('message:new', onMessageNew);
            socket.off('group:message:new', onGroupMessageNew);
        };
    }, [chatId, chatType, setMessages]);

    const { execute: executeSendMessage } = useApi(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        chatType === 'user' ? messagesApi.sendMessage : (messagesApi.sendGroupMessage as any)
    );

    const sendMessage = async (text: string) => {
        if (!chatId || !chatType || !text.trim()) return;

        // Optimistic Update
        const tempId = `temp-${Date.now()}`;
        const optimisticMsg = {
            id: tempId,
            sender_id: currentUserId || 'me',
            created_at: new Date().toISOString(),
            ...(chatType === 'user'
                ? { message_text: text, receiver_id: chatId }
                : { content: text, group_id: chatId }
            )
        } as Message | GroupMessage;

        setMessages(prev => [...(prev || []), optimisticMsg]);

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = await executeSendMessage(chatId, text) as any;

            // Replace optimistic message with real message from server
            setMessages(prev => prev?.map(m => m.id === tempId ? response : m) || []);
            return response;
        } catch (error) {
            // Revert optimistic update on failure
            setMessages(prev => prev?.filter(m => m.id !== tempId) || []);
            throw error;
        }
    };

    return {
        messages: messages || [],
        isLoading: loadingMessages,
        isBlocked,
        setIsBlocked,
        sendMessage,
        fetchMessages
    };
};
