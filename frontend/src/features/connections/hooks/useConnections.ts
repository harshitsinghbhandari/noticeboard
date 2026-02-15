import { useEffect, useCallback } from 'react';
import * as connectionsApi from '../api/connections';
import { useApi } from '../../../hooks/useApi';
import { socket } from '../../../utils/socket';

export const useConnections = () => {
    const {
        data: incoming,
        isLoading: loadingInc,
        execute: fetchIncoming,
    } = useApi(connectionsApi.getIncoming);

    const {
        data: outgoing,
        isLoading: loadingOut,
        execute: fetchOutgoing,
    } = useApi(connectionsApi.getOutgoing);

    const {
        data: myConnections,
        isLoading: loadingMine,
        execute: fetchMine,
    } = useApi(connectionsApi.getConnections);

    const fetchConnections = useCallback(async () => {
        try {
            await Promise.all([
                fetchIncoming(),
                fetchOutgoing(),
                fetchMine()
            ]);
        } catch (e) {
            console.error(e);
        }
    }, [fetchIncoming, fetchOutgoing, fetchMine]);

    useEffect(() => {
        fetchConnections();

        const handleUpdate = () => {
            fetchConnections();
        };

        socket.on('connection:request', handleUpdate);
        socket.on('connection:accepted', handleUpdate);
        socket.on('connection:rejected', handleUpdate);

        return () => {
            socket.off('connection:request', handleUpdate);
            socket.off('connection:accepted', handleUpdate);
            socket.off('connection:rejected', handleUpdate);
        };
    }, [fetchConnections]);

    const { execute: executeRequest } = useApi(connectionsApi.requestConnection);
    const { execute: executeRespond } = useApi(connectionsApi.respondToRequest);

    const handleRequestConnection = async (userId: string) => {
        await executeRequest(userId);
        fetchConnections();
        return true;
    };

    const handleRespondToRequest = async (id: string, action: 'accept' | 'reject') => {
        await executeRespond(id, action);
        fetchConnections();
    };

    return {
        incoming: incoming || [],
        outgoing: outgoing || [],
        myConnections: myConnections || [],
        isLoading: loadingInc || loadingOut || loadingMine,
        fetchConnections,
        handleRequestConnection,
        handleRespondToRequest
    };
};
