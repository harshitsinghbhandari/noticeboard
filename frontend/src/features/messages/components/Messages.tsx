import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Group, GroupMessage, Message } from '../../../types';
import { useConversations } from '../hooks/useConversations';
import { useChat } from '../hooks/useChat';
import apiClient from '../../../api/client';
import CreateGroupModal from './CreateGroupModal';

type ChatView = 'groups' | 'dms';

interface MessagesProps {
    currentUserId?: string;
}

export default function Messages({ currentUserId }: MessagesProps) {
    const { type: urlType, id: urlId } = useParams();
    const { conversations, groups, fetchData: refreshConversations } = useConversations();

    const [chatView, setChatView] = useState<ChatView>(urlType === 'group' ? 'groups' : 'dms');
    const [selectedChat, setSelectedChat] = useState<{ id: string, type: 'user' | 'group' } | null>(
        urlId && (urlType === 'user' || urlType === 'group') ? { id: urlId, type: urlType as 'user' | 'group' } : null
    );

    const {
        messages,
        isBlocked,
        setIsBlocked,
        sendMessage
    } = useChat(selectedChat?.id || null, selectedChat?.type || null);

    const [newMessage, setNewMessage] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isBlocked) return;
        try {
            await sendMessage(newMessage);
            setNewMessage('');
        } catch (err) {
            console.error('Failed to send message', err);
        }
    };

    const handleBlockUser = async () => {
        if (selectedChat?.type !== 'user') return;
        if (!confirm('Block user?')) return;
        try {
            await apiClient.post(`/users/${selectedChat.id}/block`);
            setIsBlocked(true);
            setIsMenuOpen(false);
        } catch (e) { alert('Failed'); }
    };

    const handleUnblockUser = async () => {
        if (selectedChat?.type !== 'user') return;
        try {
            await apiClient.delete(`/users/${selectedChat.id}/block`);
            setIsBlocked(false);
            setIsMenuOpen(false);
        } catch (e) { alert('Failed'); }
    };

    const handleReportUser = async () => {
        if (selectedChat?.type !== 'user') return;
        const reason = prompt('Reason:');
        if (reason) {
            try {
                await apiClient.post(`/users/${selectedChat.id}/report`, { reason });
                alert('Reported');
                setIsMenuOpen(false);
            } catch (e) { alert('Failed'); }
        }
    };

    const activeChatData = selectedChat?.type === 'group'
        ? groups.find(g => g.id === selectedChat.id)
        : conversations.find(c => c.other_id === selectedChat?.id);

    const otherUser = selectedChat?.type === 'user' ? conversations.find(c => c.other_id === selectedChat.id) : null;

    return (
        <div className="flex h-[calc(100vh-80px)] w-full bg-background-light dark:bg-background-dark -mx-4 md:mx-0 overflow-hidden">
            {/* Chat List Sidebar */}
            <aside className={`w-full md:w-[380px] flex flex-col border-r border-slate-200 dark:border-white/5 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                {/* Header Area */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold tracking-tight text-white">Messages</h1>
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">12 Unread</span>
                    </div>
                    <button onClick={() => setIsCreateGroupOpen(true)} className="p-2 rounded-lg bg-slate-100 dark:bg-[#251832] text-slate-500 dark:text-slate-300 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">group_add</span>
                    </button>
                </div>

                {/* Toggle Switch */}
                <div className="p-4 border-b border-slate-200 dark:border-white/5">
                    <div className="flex bg-slate-100 dark:bg-[#251832] p-1 rounded-lg">
                        <button
                            onClick={() => setChatView('groups')}
                            className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${chatView === 'groups' ? 'bg-white dark:bg-primary text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-200'}`}
                        >
                            Groups
                        </button>
                        <button
                            onClick={() => setChatView('dms')}
                            className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${chatView === 'dms' ? 'bg-white dark:bg-primary text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-200'}`}
                        >
                            DMs
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto hide-scrollbar">
                    {chatView === 'groups' ? (
                        <div className="py-2">
                            <div className="px-4 py-2 flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Event Chats</h3>
                                <span className="material-symbols-outlined text-slate-400 text-sm">stars</span>
                            </div>
                            {groups.filter(g => g.type === 'event').map((group, idx) => (
                                <div key={group.id} onClick={() => setSelectedChat({ id: group.id, type: 'group' })} className={`px-2 mb-1 cursor-pointer`}>
                                    <div className={`p-3 flex gap-3 rounded-xl transition-all group ${selectedChat?.id === group.id ? 'bg-primary/15 border border-primary/20' : 'hover:bg-primary/10'}`}>
                                        <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-primary/30 bg-slate-800 flex items-center justify-center">
                                            <img src={idx === 0 ? "https://lh3.googleusercontent.com/aida-public/AB6AXuBtc3tFHfPABe8iDfb6N7R1VNCKJtcY701c9dNv6u_gKPIKhuzVjLWbzPwjF7GJ3vSG5nSqcxX1MFCq80q6iTiFTR-v4tS09fUQXtNz9OsGvV3BSeTEO59vgZiipOLdPkvCeP6VDmfCu_jlItxE83cgQ4Vbo_bP1ApsReb5oRY5cZr_T_vOVXI1-C10qpQIzv9F6hrR4jriO-HUUy-TFkxR0_hVaF7ivNTS4yFSIZauJdReoxkGcul5iDERKp1lLa7rNnCUXF1bh4o" : "https://lh3.googleusercontent.com/aida-public/AB6AXuBZWwp20A0jt6t_RvnDvabwMDbBxzeQsOQpWzsJLYl4AjvCSas_QsJp5arZiNbdcgFadmfO3r7vR6cO1hHcGIzaCcDn3JQ48noLCnQkvWsymc5hu9M4r4knN2Q3GkO6UlB_GzxUF9jPCbDKKT8YhmQmES-ozyTClCluMGyr5Mg41GO8RNVbg7uAJ_OYu8fA_Z3pOM4bAXKfV2kTswmo9shNltJ-H90raZJJvxbGv11pxVORgQYQjHNRwX83oiUjAY47RxlfvuuC7Pg"} className="w-full h-full object-cover" alt={group.name} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-sm truncate text-white">{group.name}</h4>
                                                {group.is_active && (
                                                    <span className="text-[10px] font-bold text-primary flex items-center gap-1 shrink-0">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                        </span>
                                                        ACTIVE
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 truncate mt-0.5">
                                                {group.last_message ? `${group.last_message.sender_first_name}: ${group.last_message.content}` : 'No messages yet'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="px-4 py-2 mt-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">General Groups</h3>
                            </div>
                            {groups.filter(g => g.type !== 'event').map(group => (
                                <div key={group.id} onClick={() => setSelectedChat({ id: group.id, type: 'group' })} className="px-2">
                                    <div className={`p-3 flex items-center gap-3 rounded-xl cursor-pointer transition-all ${selectedChat?.id === group.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                                        <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30 text-indigo-500">
                                            <span className="material-symbols-outlined">terminal</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-semibold text-sm truncate text-white">{group.name}</h4>
                                                <span className="text-[10px] text-slate-500">14:05</span>
                                            </div>
                                            <p className="text-xs text-slate-400 truncate">
                                                {group.last_message?.content || 'Join the conversation'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-2">
                            {conversations.map(conv => (
                                <div key={conv.other_id} onClick={() => setSelectedChat({ id: conv.other_id, type: 'user' })} className="px-2">
                                    <div className={`p-3 flex items-center gap-3 rounded-xl cursor-pointer transition-all ${selectedChat?.id === conv.other_id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold">
                                            {conv.first_name[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-semibold text-sm truncate text-white">{conv.first_name} {conv.last_name}</h4>
                                                <span className="text-[10px] text-slate-500">Now</span>
                                            </div>
                                            <p className="text-xs text-slate-400 truncate">{conv.message_text}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            {/* Active Chat Content */}
            <main className={`flex-1 flex flex-col bg-slate-50 dark:bg-[#150d1b] ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 flex items-center justify-between px-6 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-white/5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedChat(null)} className="md:hidden p-2 text-slate-400">
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </button>
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-primary/20 bg-slate-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-xl">
                                        {selectedChat.type === 'group' ? 'groups' : 'person'}
                                    </span>
                                </div>
                                <div>
                                    <h2 className="font-bold text-sm text-white">
                                        {selectedChat.type === 'group' ? (activeChatData as Group)?.name : `${otherUser?.first_name} ${otherUser?.last_name}`}
                                    </h2>
                                    <p className="text-[10px] text-primary font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                        Active Now
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">videocam</span>
                                </button>
                                <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">call</span>
                                </button>
                                <div className="relative">
                                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined">more_vert</span>
                                    </button>
                                    {isMenuOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#251a30] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                            {selectedChat.type === 'user' ? (
                                                <>
                                                    <button onClick={isBlocked ? handleUnblockUser : handleBlockUser} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-lg">block</span>
                                                        {isBlocked ? 'Unblock' : 'Block User'}
                                                    </button>
                                                    <button onClick={handleReportUser} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-lg">flag</span>
                                                        Report User
                                                    </button>
                                                </>
                                            ) : (
                                                <button onClick={() => setIsMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-lg">info</span>
                                                    Group Info
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Messages Window */}
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 hide-scrollbar">
                            <div className="flex justify-center">
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">Today</span>
                            </div>

                            {messages.map((msg, idx) => {
                                const isMe = msg.sender_id === currentUserId;
                                const groupMsg = msg as GroupMessage;
                                const dmMsg = msg as Message;
                                const senderName = groupMsg.sender_first_name
                                    ? `${groupMsg.sender_first_name} ${groupMsg.sender_last_name}`
                                    : 'Other';

                                return (
                                    <div key={idx} className={`flex items-end gap-3 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-sm border ${isMe ? 'border-primary/20' : 'border-white/10'} bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white`}>
                                            {senderName[0]}
                                        </div>
                                        <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : ''}`}>
                                            {!isMe && <span className="text-[10px] font-bold text-slate-500 ml-1">{senderName}</span>}
                                            <div className={`p-3 rounded-2xl shadow-sm border ${isMe ? 'bg-primary text-white rounded-br-none border-transparent active-glow' : 'bg-white dark:bg-[#251832] rounded-bl-none border-slate-200 dark:border-white/5'}`}>
                                                <p className="text-sm">{dmMsg.message_text || groupMsg.content}</p>
                                            </div>
                                            <div className="flex items-center gap-1 mx-1">
                                                <span className="text-[10px] text-slate-400">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {isMe && <span className="material-symbols-outlined text-xs text-primary">done_all</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input Bar */}
                        <div className="p-4 bg-white dark:bg-background-dark border-t border-slate-200 dark:border-white/5">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-slate-100 dark:bg-[#251832] rounded-xl px-4 py-2 border border-transparent focus-within:border-primary transition-all">
                                <button type="button" className="text-slate-400 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">add_circle</span>
                                </button>
                                <input
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 text-white"
                                    placeholder={isBlocked ? "User is blocked" : "Type a message..."}
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={isBlocked}
                                />
                                <button type="button" className="text-slate-400 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">mood</span>
                                </button>
                                <button type="submit" disabled={isBlocked} className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg active-glow hover:bg-primary/90 disabled:opacity-50">
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined text-6xl mb-4 opacity-20 text-primary">chat_bubble</span>
                        <p className="text-lg font-bold">Select a conversation</p>
                        <p className="text-sm">Start chatting with your campus network</p>
                    </div>
                )}
            </main>

            <CreateGroupModal
                isOpen={isCreateGroupOpen}
                onClose={() => setIsCreateGroupOpen(false)}
                onGroupCreated={() => { refreshConversations(); setIsCreateGroupOpen(false); }}
                initialMembers={[]}
            />
        </div>
    );
}
