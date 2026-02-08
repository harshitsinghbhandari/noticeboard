import { useState, useEffect, useCallback } from 'react';

interface Connection {
    id: string;
    requester_id: string;
    receiver_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
}

interface ConnectionsProps {
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export default function Connections({ authenticatedFetch }: ConnectionsProps) {
    const [incoming, setIncoming] = useState<Connection[]>([]);
    const [outgoing, setOutgoing] = useState<Connection[]>([]);
    const [targetUserId, setTargetUserId] = useState('');
    const [connectStatus, setConnectStatus] = useState<string | null>(null);

    const fetchConnections = useCallback(async () => {
        try {
            const [incRes, outRes] = await Promise.all([
                authenticatedFetch('http://localhost:3000/connections/incoming'),
                authenticatedFetch('http://localhost:3000/connections/outgoing')
            ]);
            if (incRes.ok) setIncoming(await incRes.json());
            if (outRes.ok) setOutgoing(await outRes.json());
        } catch (e) { console.error(e); }
    }, [authenticatedFetch]);

    useEffect(() => {
        const load = async () => {
            await fetchConnections();
        };
        load();
    }, [fetchConnections]);

    const sendRequest = async () => {
        setConnectStatus(null);
        if (!targetUserId.trim()) return;

        try {
            const res = await authenticatedFetch('http://localhost:3000/connections/request', {
                method: 'POST',
                body: JSON.stringify({ receiver_id: targetUserId })
            });

            if (res.ok) {
                setConnectStatus('Request sent!');
                setTargetUserId('');
                fetchConnections();
            } else {
                const err = await res.json();
                setConnectStatus(`Error: ${err.error}`);
            }
        } catch (error) {
            console.error(error);
            setConnectStatus('Failed to send request');
        }
    };

    const respondToRequest = async (id: string, action: 'accept' | 'reject') => {
        try {
            await authenticatedFetch(`http://localhost:3000/connections/${id}/${action}`, {
                method: 'POST'
            });
            fetchConnections();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="space-y-8">
            {/* Connect Section */}
            <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Connect with Users</h3>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        placeholder="Enter User ID (UUID)"
                        value={targetUserId}
                        onChange={(e) => setTargetUserId(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                        onClick={sendRequest}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                        Send Request
                    </button>
                </div>
                {connectStatus && <p className="mt-2 text-sm text-gray-600">{connectStatus}</p>}

                <div className="mt-4 text-xs text-gray-500">
                    <p><strong>Note:</strong> You can find user IDs in the backend logs or by creating another user.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Incoming Requests */}
                <div>
                    <h3 className="text-lg font-semibold mb-3">Incoming Requests</h3>
                    {incoming.length === 0 ? (
                        <p className="text-gray-500 italic">No pending requests.</p>
                    ) : (
                        <div className="space-y-3">
                            {incoming.map((conn) => (
                                <div key={conn.id} className="p-3 border border-gray-200 rounded bg-white flex justify-between items-center">
                                    <div className="text-sm">
                                        <span className="font-bold">From:</span>
                                        <div className="font-mono text-xs text-gray-600 truncate w-32">{conn.requester_id}</div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => respondToRequest(conn.id, 'accept')}
                                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => respondToRequest(conn.id, 'reject')}
                                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Outgoing Requests */}
                <div>
                    <h3 className="text-lg font-semibold mb-3">Outgoing Requests</h3>
                    {outgoing.length === 0 ? (
                        <p className="text-gray-500 italic">No sent requests.</p>
                    ) : (
                        <div className="space-y-3">
                            {outgoing.map((conn) => (
                                <div key={conn.id} className="p-3 border border-gray-200 rounded bg-white flex justify-between items-center">
                                    <div className="text-sm">
                                        <span className="font-bold">To:</span>
                                        <div className="font-mono text-xs text-gray-600 truncate w-32">{conn.receiver_id}</div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded capitalize ${conn.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                        conn.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {conn.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
