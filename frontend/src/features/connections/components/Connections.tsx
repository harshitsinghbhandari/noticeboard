import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { timeAgo } from '../../../utils/timeAgo';
import * as connectionsApi from '../api/connections';
import { useConnections } from '../hooks/useConnections';
import type { UserProfile } from '../../../types';

interface ConnectionsProps {
    currentUserId?: string;
}

export default function Connections({ currentUserId }: ConnectionsProps) {
    const navigate = useNavigate();
    const {
        incoming,
        outgoing,
        myConnections,
        isLoading,
        handleRequestConnection,
        handleRespondToRequest
    } = useConnections();

    const [targetUserId, setTargetUserId] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [connectStatus, setConnectStatus] = useState<string | null>(null);

    const onSendRequest = async (userId: string) => {
        setConnectStatus(null);
        try {
            await handleRequestConnection(userId);
            setConnectStatus('Request sent!');
            setTargetUserId('');
            setSearchResults([]);
        } catch (error: any) {
            const errormsg = error.response?.data?.error || 'Failed to send request';
            setConnectStatus(`Error: ${errormsg}`);
        }
    };

    return (
        <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Incoming Connections */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Connections</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your campus network</p>
                        </div>
                    </div>

                    {/* Add Connection Search */}
                    <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                        <h3 className="text-sm font-bold mb-3">Find Students to Connect</h3>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search students by name or email..."
                                value={targetUserId}
                                onChange={(e) => {
                                    setTargetUserId(e.target.value);
                                    if (e.target.value.length >= 2) {
                                        connectionsApi.searchUsers(e.target.value)
                                            .then(res => setSearchResults(res.data))
                                            .catch(console.error);
                                    } else {
                                        setSearchResults([]);
                                    }
                                }}
                                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 px-4 text-sm focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white"
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mt-1 max-h-60 overflow-y-auto rounded-lg shadow-xl z-20">
                                    {searchResults.map(user => (
                                        <div
                                            key={user.id}
                                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between group transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {user.first_name[0]}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm text-slate-900 dark:text-white">{user.first_name} {user.last_name}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => onSendRequest(user.id)}
                                                className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-md hover:bg-primary/90 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                            >
                                                Connect
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {connectStatus && <p className="mt-2 text-xs font-medium text-primary">{connectStatus}</p>}
                    </section>

                    <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                            <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                Incoming Requests <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">{incoming.length}</span>
                            </h2>
                            <button className="text-xs text-primary font-medium hover:underline">View All</button>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                <div className="p-8 text-center text-slate-400">Loading connections...</div>
                            ) : incoming.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 italic text-sm">No pending requests</div>
                            ) : (
                                incoming.map((conn) => (
                                    <div key={conn.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl overflow-hidden shadow-sm">
                                                    {conn.requester_first_name?.[0]}
                                                </div>
                                                <span className="absolute bottom-0 right-0 size-3.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                                    {conn.requester_first_name} {conn.requester_last_name}
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {conn.requester_headline || 'Student'} • {timeAgo(conn.created_at)}
                                                </p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="material-symbols-outlined text-[14px] text-slate-400">group</span>
                                                    <span className="text-[11px] text-slate-400">Wants to connect with you</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleRespondToRequest(conn.id, 'accept')}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleRespondToRequest(conn.id, 'reject')}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column: Outgoing Connections */}
                <div className="lg:col-span-5 space-y-6">
                    <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Outgoing Requests</h2>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {outgoing.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 italic text-sm">No outgoing requests</div>
                            ) : (
                                outgoing.map((conn) => (
                                    <div key={conn.id} className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold overflow-hidden grayscale opacity-80">
                                                    {conn.receiver_first_name?.[0]}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                        {conn.receiver_first_name} {conn.receiver_last_name}
                                                    </h4>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        {conn.receiver_headline || 'Student'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${conn.status === 'accepted'
                                                ? 'text-green-600 bg-green-50 dark:bg-green-900/30'
                                                : conn.status === 'rejected'
                                                    ? 'text-red-600 bg-red-50 dark:bg-red-900/30'
                                                    : 'text-amber-600 bg-amber-50 dark:bg-amber-900/30'
                                                }`}>
                                                {conn.status}
                                            </span>
                                        </div>
                                        {conn.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button className="w-full py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                                    Withdraw Request
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-[11px] text-center text-slate-400">Sent requests automatically expire after 14 days if no action is taken.</p>
                        </div>
                    </section>

                    {/* My Connections Section */}
                    <div className="bg-white dark:bg-slate-900 Rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">My Connections</h3>
                        <div className="space-y-4">
                            {myConnections.length === 0 ? (
                                <p className="text-center text-slate-400 text-sm py-4">You haven't connected with anyone yet.</p>
                            ) : (
                                myConnections.map((conn) => {
                                    const isRequester = conn.requester_id === currentUserId;
                                    const firstName = isRequester ? conn.receiver_first_name : conn.requester_first_name;
                                    const lastName = isRequester ? conn.receiver_last_name : conn.requester_last_name;
                                    const headline = isRequester ? conn.receiver_headline : conn.requester_headline;

                                    return (
                                        <div key={conn.id} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden">
                                                    {firstName?.[0]}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                        {firstName} {lastName}
                                                    </h4>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        {headline || 'Student'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const otherUserId = conn.requester_id === currentUserId ? conn.receiver_id : conn.requester_id;
                                                    navigate(`/messages/${otherUserId}`);
                                                }}
                                                className="text-xs text-slate-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                                                Message
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
