import { useEffect, useState, useCallback, type ReactNode } from 'react';
import apiClient from '../api/client';
import { socket } from '../utils/socket';
import { UnreadContext } from './UnreadContextCore';

interface UnreadState {
    totalUnread: number;
    unreadBySender: { [key: string]: number };
}

export function UnreadProvider({ children, currentUserId }: { children: ReactNode; currentUserId?: string }) {
    const [state, setState] = useState<UnreadState>({
        totalUnread: 0,
        unreadBySender: {},
    });

    const fetchUnreadSummary = useCallback(async () => {
        if (!currentUserId) return;
        try {
            const [msgRes, groupRes] = await Promise.all([
                apiClient.get('/messages/unread-summary'),
                apiClient.get('/groups/unread-summary')
            ]);

            const { totalUnread: msgTotal, conversations } = msgRes.data;
            const { totalUnread: groupTotal, groups } = groupRes.data;

            const unreadMap: { [key: string]: number } = {};

            // 1:1 messages
            conversations.forEach((c: { userId: string; unreadCount: number }) => {
                unreadMap[c.userId] = c.unreadCount;
            });

            // Group messages
            groups.forEach((g: { groupId: string; unreadCount: number }) => {
                unreadMap[g.groupId] = g.unreadCount;
            });

            setState({
                totalUnread: msgTotal + groupTotal,
                unreadBySender: unreadMap,
            });
        } catch (err) {
            console.error('Failed to fetch unread summary', err);
        }
    }, [currentUserId]);

    const clearUnread = (senderId: string) => {
        setState(prev => {
            const count = prev.unreadBySender[senderId] || 0;
            if (count === 0) return prev;

            const newMap = { ...prev.unreadBySender };
            delete newMap[senderId];

            return {
                totalUnread: Math.max(0, prev.totalUnread - count),
                unreadBySender: newMap,
            };
        });
    };

    useEffect(() => {
        if (currentUserId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            void fetchUnreadSummary();
        } else {
            setState({ totalUnread: 0, unreadBySender: {} });
        }
    }, [currentUserId, fetchUnreadSummary]);

    useEffect(() => {
        if (!currentUserId) return;

        const onUnreadUpdate = (data: { from: string; increment: number }) => {
            setState(prev => {
                const currentCount = prev.unreadBySender[data.from] || 0;
                return {
                    totalUnread: prev.totalUnread + data.increment,
                    unreadBySender: {
                        ...prev.unreadBySender,
                        [data.from]: currentCount + data.increment,
                    },
                };
            });
        };

        const onUnreadDecrement = (data: { from: string; count: number }) => {
            setState(prev => {
                const currentCount = prev.unreadBySender[data.from] || 0;
                const newCount = Math.max(0, currentCount - data.count);
                const diff = currentCount - newCount;

                return {
                    totalUnread: Math.max(0, prev.totalUnread - diff),
                    unreadBySender: {
                        ...prev.unreadBySender,
                        [data.from]: newCount,
                    },
                };
            });
        };

        // Group Events
        const onGroupMessageNew = (message: { sender_id: string; group_id: string }) => {
            if (message.sender_id === currentUserId) return;
            // Assuming message structure has group_id. 
            // Check if it's already read? Unlikely for new message.
            const groupId = message.group_id;

            setState(prev => {
                const currentCount = prev.unreadBySender[groupId] || 0;
                return {
                    totalUnread: prev.totalUnread + 1,
                    unreadBySender: {
                        ...prev.unreadBySender,
                        [groupId]: currentCount + 1
                    }
                };
            });
        };

        const onGroupRead = (data: { userId: string, groupId: string }) => {
            if (data.userId === currentUserId) {
                // We read it, so clear it locally
                setState(prev => {
                    const currentCount = prev.unreadBySender[data.groupId] || 0;
                    if (currentCount === 0) return prev;

                    const newMap = { ...prev.unreadBySender };
                    delete newMap[data.groupId];

                    return {
                        totalUnread: Math.max(0, prev.totalUnread - currentCount),
                        unreadBySender: newMap
                    };
                });
            }
        };

        const onConnect = () => {
            fetchUnreadSummary();
        };

        socket.on('unread:update', onUnreadUpdate);
        socket.on('unread:decrement', onUnreadDecrement);
        socket.on('group:message:new', onGroupMessageNew);
        socket.on('group:read', onGroupRead);
        socket.on('connect', onConnect);

        return () => {
            socket.off('unread:update', onUnreadUpdate);
            socket.off('unread:decrement', onUnreadDecrement);
            socket.off('group:message:new', onGroupMessageNew);
            socket.off('group:read', onGroupRead);
            socket.off('connect', onConnect);
        };
    }, [currentUserId, fetchUnreadSummary]);

    return (
        <UnreadContext.Provider value={{ ...state, clearUnread, refreshUnread: fetchUnreadSummary }}>
            {children}
        </UnreadContext.Provider>
    );
}

