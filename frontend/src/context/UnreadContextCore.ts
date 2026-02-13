import { createContext } from 'react';

interface UnreadContextType {
    totalUnread: number;
    unreadBySender: { [key: string]: number };
    clearUnread: (senderId: string) => void;
    refreshUnread: () => void;
}

export const UnreadContext = createContext<UnreadContextType | undefined>(undefined);
