import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnections } from '../hooks/useConnections';
import * as connectionsApi from '../api/connections';
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
        handleRequestConnection,
        handleRespondToRequest
    } = useConnections();

    const [activeTab, setActiveTab] = useState<'incoming' | 'sent'>('incoming');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);

    const handleSearch = (q: string) => {
        setSearchQuery(q);
        if (q.length >= 2) {
            connectionsApi.searchUsers(q)
                .then(res => setSearchResults(res.data))
                .catch(console.error);
        } else {
            setSearchResults([]);
        }
    };

    return (
        <main className="max-w-6xl mx-auto px-4 py-6 space-y-8 pb-20 animate-fade-in">
            {/* Search Section */}
            <div className="max-w-xl mx-auto mb-8">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary/60 group-focus-within:text-primary">
                        <span className="material-symbols-outlined">search</span>
                    </div>
                    <input
                        className="block w-full pl-10 pr-3 py-2 bg-primary/10 border border-primary/20 rounded-xl leading-5 text-white placeholder-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                        placeholder="Search by name, hostel, or branch..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-[#191022] border border-primary/20 mt-2 rounded-xl shadow-2xl z-50 overflow-hidden">
                            {searchResults.map(user => (
                                <div key={user.id} className="p-3 hover:bg-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                            {user.first_name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{user.first_name} {user.last_name}</p>
                                            <p className="text-[10px] text-slate-400">{user.headline || 'Student'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRequestConnection(user.id)} className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/80 transition-colors">
                                        Connect
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Requests Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person_add</span>
                        Friend Requests
                    </h3>
                    <div className="flex bg-primary/10 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('incoming')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'incoming' ? 'bg-primary text-white' : 'text-primary/60 hover:text-white'}`}
                        >
                            Incoming ({incoming.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('sent')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'sent' ? 'bg-primary text-white' : 'text-primary/60 hover:text-white'}`}
                        >
                            Sent ({outgoing.length})
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeTab === 'incoming' ? (
                        incoming.length === 0 ? (
                            <div className="col-span-full py-8 text-center text-sm text-slate-500">No incoming requests</div>
                        ) : (
                            incoming.map((req) => (
                                <div key={req.id} className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-xl hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-700 border-2 border-primary/20 flex items-center justify-center text-white font-bold">
                                            {req.requester_first_name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{req.requester_first_name} {req.requester_last_name}</p>
                                            <div className="flex gap-2 mt-0.5">
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold uppercase tracking-wider">{req.requester_headline || 'Campus'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleRespondToRequest(req.id, 'accept')} className="p-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors">
                                            <span className="material-symbols-outlined text-sm">check</span>
                                        </button>
                                        <button onClick={() => handleRespondToRequest(req.id, 'reject')} className="p-2 bg-white/5 text-white/40 hover:text-white/80 rounded-lg transition-colors">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        outgoing.length === 0 ? (
                            <div className="col-span-full py-8 text-center text-sm text-slate-500">No sent requests</div>
                        ) : (
                            outgoing.map((req) => (
                                <div key={req.id} className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-xl hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-700 border-2 border-primary/20 flex items-center justify-center text-white font-bold">
                                            {req.receiver_first_name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{req.receiver_first_name} {req.receiver_last_name}</p>
                                            <div className="flex gap-2 mt-0.5">
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold uppercase tracking-wider">{req.receiver_headline || 'Student'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-white/5 text-white/40 text-xs font-bold rounded-lg border border-white/10">
                                        Pending
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            </section>

            {/* People You May Know */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">diversity_3</span>
                        People You May Know
                    </h3>
                    <button className="text-sm font-semibold text-primary hover:underline">See all</button>
                </div>
                <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar -mx-4 px-4 snap-x">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex-none w-48 bg-primary/5 border border-primary/10 rounded-xl p-4 snap-start group hover:bg-primary/10 transition-all">
                            <div className="relative mb-3 aspect-square bg-slate-800 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-4xl">person</span>
                                <div className="absolute top-2 right-2 bg-primary rounded-full size-6 flex items-center justify-center border-2 border-background-dark">
                                    <span className="material-symbols-outlined text-xs text-white">bolt</span>
                                </div>
                            </div>
                            <p className="font-bold text-sm truncate text-white">Suggested Student</p>
                            <p className="text-[11px] text-primary font-bold mb-1">Hostel 7 | CSE</p>
                            <p className="text-[10px] text-white/50 mb-4">12 mutual friends</p>
                            <button className="w-full py-2 bg-primary/20 text-primary text-xs font-bold rounded-lg group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-sm">person_add</span>
                                Connect
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Friends List */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">groups</span>
                        Your Friends ({myConnections.length})
                    </h3>
                    <div className="flex gap-2">
                        <button className="p-2 bg-white/5 rounded-lg text-white/60 hover:text-white">
                            <span className="material-symbols-outlined text-sm">filter_list</span>
                        </button>
                    </div>
                </div>
                <div className="space-y-3">
                    {myConnections.map((conn, idx) => {
                        const isRequester = conn.requester_id === currentUserId;
                        const otherUser = isRequester
                            ? { firstName: conn.receiver_first_name, lastName: conn.receiver_last_name, headline: conn.receiver_headline, id: conn.receiver_id }
                            : { firstName: conn.requester_first_name, lastName: conn.requester_last_name, headline: conn.requester_headline, id: conn.requester_id };

                        const avatars = [
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuDw0G_vSlO3UM8xImApilv6TPBY_81-ci6SEUBWrv6E4qr19Lyx13kOKkk3JdKRqmbsy0fM3DzLZ7g8n1C9_bEFeNW4xvtR-bzo-2dm-AiCSF9UnxKyMgg1IuHpJt_BJscvMz_rqfv47k1OX3JBbc8b3w1la3nai8LxfMuWO2h-Ioc7B125XXgQcGWZF5_TjmOMcnzLPWTeqtezKBZMImeE2w8biPK3zELEsJ5qx2-UEGsiPDtGtrplU7-u4Eg5xO1m48VK8NVcU8s",
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuAxNMpILzj8bbk2GMJZvBxVlNUWXvjQgKgedX1shSyC7t5AHl5G3UjJWfOp-Gd-hP4koT7p34IwHampgFZN3teSWPib4Bg38lAKDGEKIFl47AMgFtcMdZiVPliO-MuRIzioe4mXyd4qac13AO92hqrk7BXo75M2mfJkzIDIIAPD8gkzyKbBeCMfRYg1wD8HmpsP5Yq2TNW8v4mTyCbGcwFB2C9FYvUIKhGwxiIS52xjByvt2-PkU_yBLeI65ZmrqO_FZyspVarxrmw",
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuCZoz8wOkl-tFaRDz18094sbYFM_xixLlEBR_HN4uqIEtCCEppw_gYpCqZdFa4F8xmcZFjEVp-4aULJKz6WS2h3rkpBEWB8uJerlMHOd08SWz_7iVzVBv3xAt-v4rp4dHuk_mZoVY8GviEt8u4hkB1MDMu0H2VMFQocF1Ep9gh4LkhBvAs5K6xOeadOjxtwrvlQvgs8cNxn_6DrNqVt92oMsw_iyyMylMKy9D6JProyuu3nyr6opLnMPQIFBLiZTkeJT3cmu5iRVlc"
                        ];

                        return (
                            <div key={conn.id} className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:bg-primary/10 transition-all cursor-pointer">
                                <div className="flex items-center gap-4 w-full">
                                    <div className="relative shrink-0">
                                        <img src={avatars[idx % avatars.length]} className="w-14 h-14 rounded-xl object-cover border border-primary/20" alt={otherUser.firstName} />
                                        <div className="absolute -bottom-1 -right-1 size-4 bg-green-500 rounded-full border-2 border-background-dark"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-lg text-white">{otherUser.firstName} {otherUser.lastName}</p>
                                            <span className="material-symbols-outlined text-primary text-sm filled-icon">verified</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/20 text-primary font-bold uppercase">{otherUser.headline || 'Campus Member'}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/70 font-semibold italic">Hostel 4</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                                    <div className="flex items-center gap-1 text-xs text-primary font-semibold bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap">
                                        <span className="material-symbols-outlined text-sm">event_available</span>
                                        Active this week
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/messages/user/${otherUser.id}`); }}
                                            className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white"
                                        >
                                            <span className="material-symbols-outlined text-sm">chat</span>
                                        </button>
                                        <button className="p-2 bg-white/5 text-white/40 rounded-lg hover:text-white">
                                            <span className="material-symbols-outlined text-sm">more_horiz</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <button className="w-full mt-6 py-3 border border-dashed border-primary/30 rounded-xl text-primary/60 font-semibold hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">expand_more</span>
                    Show more friends
                </button>
            </section>

            {/* Floating Action Button (Mobile) */}
            <button className="fixed bottom-24 right-6 size-14 bg-primary rounded-full shadow-lg shadow-primary/40 flex items-center justify-center text-white md:hidden">
                <span className="material-symbols-outlined text-3xl">person_add</span>
            </button>
        </main>
    );
}
