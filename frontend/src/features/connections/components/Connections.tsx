import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        myConnections,
        handleRequestConnection,
        handleRespondToRequest
    } = useConnections();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);

    const onSendRequest = async (userId: string) => {
        try {
            await handleRequestConnection(userId);
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Failed to send request', error);
        }
    };

    const suggestions = [
        { id: 's1', name: 'Ishita Gupta', hostel: 'Hostel 12', branch: 'BioTech', mutual: 12, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCB8qV66Saln01MOxpXtahRmw431PfEgbbzpA-2DmKCFO_e170_55QWIU0cZBR2bVKzCgo4YCelKAP546_1KpFWBBnp3sGPbSl198AARhiXZuuotn9heIA2FWHceRKR2BD8PiuO4pS5vLcp_yWOZtJdJA8EyA4S6Q74rv_9XzpjAsRx56UfYEzKo785TVnPkGC0SaBLG7ivSoYmn2dzW4I_KuPtmSUdqyabfCWpHImgKnfr-Ta2ZBGBeCWirkMSTjtj9qjAzp8in0s' },
        { id: 's2', name: 'Kabir Singh', hostel: 'Hostel 1', branch: 'Mech', mutual: 'Attending Tech-Fest', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3NCrDpjVT_TXGib5ogS5YezAXpatI6TOcXGSDESNk4GdHWPwf0LLO292JVmempAjk-BsHh5VxiuXTc7lZVjc7e3J7K7PEDPue6HPincqSsxu3mljgLcT0yKRw-0vuKPldCeXmAX3wF4l8-gw3yoDU0FZ8-MxwACsKE0lhKoUPh0FWMRyRgE35mCOlWMxXyiBNdLlmMKbeGLl2Auw-lC1Ee5ah9XEVuoR_XuIYVyO7D71GBLOKUjZvmusINmRgcYORDwNZI7cZHcs' },
        { id: 's3', name: 'Meera Rao', hostel: 'Hostel 8', branch: 'Design', mutual: 8, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnjF3KAizOx10hDz04H3JBKGhL1sDtpG0yC4vz1lNUqqBCPg3TV7iuqX0aBKRJRqkwzSbv2PFqqHVzQGdFtiSql-FIJBsfjPsdodyM4CIbaDrhPVG0ljUe6yztgQr9HpSPaKA3Njv2aBAPASOqP20obxZUVIeztg2UT-0BzK72l2o1-Xf6yfx_r6P5ko05n11MI3av-4PoQMeZVnaL-gwOLlZARGBkRYFQWWpftSSyhOHKw64qpDEDE4NVl_qFCiEC0BhJrEOs7gg' }
    ];

    return (
        <main className="max-w-6xl mx-auto px-4 py-6 space-y-8 pb-24">
            {/* Top Search (Mobile/Inline) */}
            <div className="md:hidden">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary/60 group-focus-within:text-primary">
                        <span className="material-symbols-outlined">search</span>
                    </div>
                    <input
                        className="block w-full pl-10 pr-3 py-2 bg-primary/10 border border-primary/20 rounded-xl leading-5 text-white placeholder-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                        placeholder="Search by name, hostel, or branch..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (e.target.value.length >= 2) {
                                connectionsApi.searchUsers(e.target.value).then(res => setSearchResults(res.data));
                            } else {
                                setSearchResults([]);
                            }
                        }}
                    />
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-background-dark border border-primary/20 mt-2 rounded-xl shadow-2xl z-50 overflow-hidden">
                            {searchResults.map(user => (
                                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-primary/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                            {user.first_name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{user.first_name} {user.last_name}</p>
                                            <p className="text-xs text-slate-400">{user.email}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => onSendRequest(user.id)} className="bg-primary px-3 py-1.5 rounded-lg text-xs font-bold text-white">Connect</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Requests Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                        <span className="material-symbols-outlined text-primary">person_add</span>
                        Friend Requests
                    </h3>
                    <div className="flex bg-primary/10 p-1 rounded-lg">
                        <button className="px-3 py-1 text-xs font-bold rounded-md bg-primary text-white">Incoming ({incoming.length})</button>
                        <button className="px-3 py-1 text-xs font-medium text-primary/60 hover:text-white transition-colors">Sent</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {incoming.length === 0 ? (
                        <div className="col-span-full p-8 text-center bg-primary/5 border border-primary/10 rounded-xl text-slate-500 italic">
                            No pending pulses.
                        </div>
                    ) : (
                        incoming.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-xl hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border-2 border-primary/20">
                                        {req.requester_first_name?.[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{req.requester_first_name} {req.requester_last_name}</p>
                                        <div className="flex gap-2 mt-0.5">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold uppercase tracking-wider">
                                                {req.requester_headline || 'Student'}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 font-medium italic">Campus Pulse</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleRespondToRequest(req.id, 'accept')}
                                        className="p-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">check</span>
                                    </button>
                                    <button
                                        onClick={() => handleRespondToRequest(req.id, 'reject')}
                                        className="p-2 bg-white/5 text-white/40 hover:text-white/80 rounded-lg transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* People You May Know */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                        <span className="material-symbols-outlined text-primary">diversity_3</span>
                        People You May Know
                    </h3>
                    <button className="text-sm font-semibold text-primary hover:underline">See all</button>
                </div>
                <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-4 px-4 snap-x">
                    {suggestions.map(s => (
                        <div key={s.id} className="flex-none w-48 bg-primary/5 border border-primary/10 rounded-xl p-4 snap-start group hover:bg-primary/10 transition-all">
                            <div className="relative mb-3">
                                <img className="w-full aspect-square object-cover rounded-lg grayscale group-hover:grayscale-0 transition-all" src={s.image} alt={s.name} />
                                <div className="absolute top-2 right-2 bg-primary rounded-full size-6 flex items-center justify-center border-2 border-background-dark">
                                    <span className="material-symbols-outlined text-xs text-white">bolt</span>
                                </div>
                            </div>
                            <p className="font-bold text-sm truncate text-white">{s.name}</p>
                            <p className="text-[11px] text-primary font-bold mb-1">{s.hostel} | {s.branch}</p>
                            <p className="text-[10px] text-white/50 mb-4">{typeof s.mutual === 'number' ? `${s.mutual} mutual friends` : s.mutual}</p>
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
                    <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                        <span className="material-symbols-outlined text-primary">groups</span>
                        Your Friends ({myConnections.length})
                    </h3>
                    <button className="p-2 bg-white/5 rounded-lg text-white/60 hover:text-white">
                        <span className="material-symbols-outlined text-sm">filter_list</span>
                    </button>
                </div>
                <div className="space-y-3">
                    {myConnections.map(conn => {
                        const isRequester = conn.requester_id === currentUserId;
                        const firstName = isRequester ? conn.receiver_first_name : conn.requester_first_name;
                        const lastName = isRequester ? conn.receiver_last_name : conn.requester_last_name;
                        const headline = isRequester ? conn.receiver_headline : conn.requester_headline;
                        const otherUserId = isRequester ? conn.receiver_id : conn.requester_id;

                        return (
                            <div key={conn.id} className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:bg-primary/10 transition-all cursor-pointer">
                                <div className="flex items-center gap-4 w-full">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-xl bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-xl overflow-hidden shadow-lg">
                                            {firstName?.[0]}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 size-4 bg-green-500 rounded-full border-2 border-background-dark"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-lg text-white">{firstName} {lastName}</p>
                                            <span className="material-symbols-outlined text-primary text-sm fill-1">verified</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/20 text-primary font-bold uppercase truncate">{headline || 'Pulse Student'}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/70 font-semibold italic">Campus Pulsar</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                                    <div className="flex items-center gap-1 text-xs text-primary font-semibold bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap">
                                        <span className="material-symbols-outlined text-sm">event_available</span>
                                        Active Pulsar
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => navigate(`/messages/${otherUserId}`)}
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
            </section>
        </main>
    );
}
