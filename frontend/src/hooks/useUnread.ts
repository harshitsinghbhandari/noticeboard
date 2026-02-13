import { useContext } from 'react';
import { UnreadContext } from '../context/UnreadContextCore';

export function useUnread() {
    const context = useContext(UnreadContext);
    if (context === undefined) {
        throw new Error('useUnread must be used within an UnreadProvider');
    }
    return context;
}
