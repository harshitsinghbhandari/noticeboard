import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import type { Message, GroupMessage, Conversation, Group } from '../../../types';
import apiClient from '../../../api/client';
import * as messagesApi from '../api/messages';
import { socket } from '../../../utils/socket';
import { useConversations } from '../hooks/useConversations';
import { useChat } from '../hooks/useChat';
import CreateGroupModal from './CreateGroupModal';
import { timeAgo } from '../../../utils/timeAgo';

type ChatType = 'user' | 'group';

interface ChatSelection {
  id: string;
  type: ChatType;
}

export default function Messages() {
  const { userId: urlUserId } = useParams();
  const location = useLocation();

  const { allChats, fetchData: refreshConversations, conversations, groups } = useConversations();
  const [selectedChat, setSelectedChat] = useState<ChatSelection | null>(null);
  const [activeTab, setActiveTab] = useState<'groups' | 'dms'>('groups');

  const {
    messages,
    isBlocked,
    setIsBlocked,
    sendMessage
  } = useChat(selectedChat?.id || null, selectedChat?.type || null);

  const [newMessage, setNewMessage] = useState('');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // sync url to selected chat
  useEffect(() => {
    if (urlUserId) {
      setSelectedChat({ id: urlUserId, type: 'user' });
      setActiveTab('dms');
    }
  }, [urlUserId, location.state]);

  useEffect(() => {
    const onGroupCreated = () => refreshConversations();
    const onGroupAdded = () => refreshConversations();
    const onMessageNew = () => refreshConversations();

    socket.on('group:created', onGroupCreated);
    socket.on('group:added', onGroupAdded);
    socket.on('message:new', onMessageNew);

    return () => {
      socket.off('group:created', onGroupCreated);
      socket.off('group:added', onGroupAdded);
      socket.off('message:new', onMessageNew);
    };
  }, [refreshConversations]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (err: any) {
      console.error(err);
    }
  };

  const filteredChats = allChats.filter(chat =>
    activeTab === 'groups' ? chat.type === 'group' : chat.type === 'user'
  );

  const currentChatInfo = selectedChat ? (
    selectedChat.type === 'user'
    ? (conversations.find(c => c.other_id === selectedChat.id) as Conversation | undefined)
    : (groups.find(g => g.id === selectedChat.id) as Group | undefined)
  ) : null;

  return (
    <div className="flex h-[calc(100vh-80px)] w-full flex-col md:flex-row overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Sidebar navigation (already in Layout for mobile, but Screen 5 has a side nav for desktop) */}
      {/* We'll skip the extra left side nav to avoid redundancy with our Layout.tsx */}

      <div className="flex flex-1 overflow-hidden">
        {/* Chat List Sidebar */}
        <aside className={`w-full md:w-[380px] flex flex-col border-r border-slate-200 dark:border-white/5 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
            <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold tracking-tight text-white">Messages</h1>
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                        {allChats.reduce((acc, c) => acc + c.unread, 0)} New
                    </span>
                </div>
                <button onClick={() => setIsCreateGroupOpen(true)} className="p-2 rounded-lg bg-slate-100 dark:bg-[#251832] text-slate-500 dark:text-slate-300 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">group_add</span>
                </button>
            </header>

            {/* Toggle Switch */}
            <div className="p-4 border-b border-slate-200 dark:border-white/5">
                <div className="flex bg-slate-100 dark:bg-[#251832] p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'groups' ? 'bg-white dark:bg-primary text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-200'}`}
                    >
                        Groups
                    </button>
                    <button
                        onClick={() => setActiveTab('dms')}
                        className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'dms' ? 'bg-white dark:bg-primary text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-200'}`}
                    >
                        DMs
                    </button>
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="py-2">
                    <div className="px-4 py-2 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {activeTab === 'groups' ? 'Event & Pulse Groups' : 'Direct Messages'}
                        </h3>
                        <span className="material-symbols-outlined text-slate-400 text-sm">stars</span>
                    </div>

                    {filteredChats.map(chat => (
                        <div key={`${chat.type}-${chat.id}`} className="px-2 mb-1">
                            <div
                                onClick={() => setSelectedChat({ id: chat.id, type: chat.type })}
                                className={`p-3 flex gap-3 rounded-xl cursor-pointer transition-all group ${selectedChat?.id === chat.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-primary/5 border border-transparent'}`}
                            >
                                <div className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border ${selectedChat?.id === chat.id ? 'border-primary/30' : 'border-white/10'}`}>
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-primary font-bold text-xl">
                                        {chat.name[0]}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent opacity-50"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`font-bold text-sm truncate ${selectedChat?.id === chat.id ? 'text-white' : 'text-slate-300'}`}>{chat.name}</h4>
                                        {chat.unread > 0 && (
                                            <span className="text-[10px] font-bold text-primary flex items-center gap-1 shrink-0">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                </span>
                                                ACTIVE
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {chat.lastMessage || 'No pulses yet...'}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-[10px] text-slate-400">{timeAgo(chat.timestamp)}</span>
                                        {chat.unread > 0 && (
                                            <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{chat.unread}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredChats.length === 0 && (
                        <p className="p-10 text-center text-slate-500 text-sm italic">No pulse conversations found.</p>
                    )}
                </div>
            </div>
        </aside>

        {/* Active Chat Content */}
        <main className={`flex-1 flex flex-col bg-slate-50 dark:bg-[#150d1b] ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
            {selectedChat ? (
                <>
                    <div className="h-16 flex items-center justify-between px-6 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSelectedChat(null)} className="md:hidden text-slate-400 p-1">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-primary/20 bg-slate-800 flex items-center justify-center text-primary font-bold">
                                {(currentChatInfo as Group)?.name ? (currentChatInfo as Group).name[0] : (currentChatInfo as Conversation)?.first_name?.[0]}
                            </div>
                            <div>
                                <h2 className="font-bold text-sm text-white">{(currentChatInfo as Group)?.name || `${(currentChatInfo as Conversation)?.first_name} ${(currentChatInfo as Conversation)?.last_name}`}</h2>
                                <p className="text-[10px] text-primary font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                    Pulse Connected
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">call</span>
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="p-2 text-slate-400 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-[#251a30] border border-primary/20 rounded-xl shadow-2xl z-[100] overflow-hidden text-white animate-in fade-in zoom-in-95 duration-100">
                                        {selectedChat.type === 'user' ? (
                                            <>
                                                {isBlocked ? (
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Unblock?')) return;
                                                            try { await apiClient.delete(`/users/${selectedChat.id}/block`); setIsBlocked(false); setIsMenuOpen(false); } catch (error) { console.error(error); }
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-primary/10 flex items-center gap-2 text-sm font-bold"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">check_circle</span> Unblock Pulsar
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Block?')) return;
                                                            try { await apiClient.post(`/users/${selectedChat.id}/block`); setIsBlocked(true); setIsMenuOpen(false); } catch (error) { console.error(error); }
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-primary/10 text-red-400 flex items-center gap-2 text-sm font-bold"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">block</span> Block Pulsar
                                                    </button>
                                                )}
                                                <button
                                                    onClick={async () => {
                                                        const r = prompt('Reason:');
                                                        if (r) { try { await apiClient.post(`/users/${selectedChat.id}/report`, { reason: r }); setIsMenuOpen(false); alert('Reported'); } catch (error) { console.error(error); } }
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-primary/10 flex items-center gap-2 text-sm font-bold"
                                                >
                                                    <span className="material-symbols-outlined text-sm">flag</span> Report Pulse
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm('Leave Group?')) return;
                                                        try { await messagesApi.leaveGroup(selectedChat.id); setSelectedChat(null); refreshConversations(); } catch (error) { console.error(error); }
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-primary/10 text-red-400 flex items-center gap-2 text-sm font-bold"
                                                >
                                                    <span className="material-symbols-outlined text-sm">logout</span> Leave Pulse
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                        <div className="flex justify-center">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">Pulse History</span>
                        </div>

                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}
                        {messages.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-50">
                                <span className="material-symbols-outlined text-6xl mb-2">bolt</span>
                                <p>Start the pulse.</p>
                            </div>
                        )}
                    </div>

                    {/* Input Bar */}
                    <div className="p-4 bg-white dark:bg-background-dark border-t border-slate-200 dark:border-white/5">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-slate-100 dark:bg-[#251832] rounded-xl px-4 py-2 border border-transparent focus-within:border-primary transition-all">
                            <button type="button" className="text-slate-400 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">add_circle</span>
                            </button>
                            <input
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 text-white placeholder-slate-500"
                                placeholder={isBlocked ? "Pulse Blocked" : "Send a pulse..."}
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                disabled={isBlocked}
                            />
                            <button type="submit" disabled={!newMessage.trim() || isBlocked} className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg active:scale-95 hover:bg-primary/90 transition-all">
                                <span className="material-symbols-outlined">send</span>
                            </button>
                        </form>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <div className="bg-primary/10 p-6 rounded-full mb-4">
                        <span className="material-symbols-outlined text-6xl text-primary animate-pulse">chat</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Your Pulse Messages</h2>
                    <p className="text-slate-400">Select a conversation to start chatting.</p>
                </div>
            )}
        </main>
      </div>

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={() => { refreshConversations(); setIsCreateGroupOpen(false); }}
      />
    </div>
  );
}

function MessageBubble({ message }: { message: Message | GroupMessage }) {
  const token = localStorage.getItem('token');
  let myId = '';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      myId = payload.sub || payload.id;
    } catch (e) { }
  }

  const isMe = message.sender_id === myId;
  const isOrganizer = (message as GroupMessage).is_organizer;

  return (
    <div className={`flex items-end gap-3 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-sm border ${isMe ? 'border-primary/20' : 'border-white/10'} bg-slate-800 flex items-center justify-center text-[10px] font-bold text-primary`}>
            {message.sender_first_name?.[0] || 'U'}
        </div>
        <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : ''}`}>
            {!isMe && (
                <span className="text-[10px] font-bold text-slate-500 ml-1">
                    {message.sender_first_name} {message.sender_last_name}
                    {isOrganizer && <span className="text-indigo-400 ml-1 uppercase">Organizer</span>}
                </span>
            )}
            <div className={`p-3 rounded-2xl shadow-sm border ${isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white dark:bg-[#251832] text-slate-100 border-slate-200 dark:border-white/5 rounded-bl-none'}`}>
                <p className="text-sm">{(message as Message).message_text}</p>
            </div>
            <div className={`flex items-center gap-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                <span className="text-[10px] text-slate-400">{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {isMe && <span className="material-symbols-outlined text-xs text-primary">done_all</span>}
            </div>
        </div>
    </div>
  );
}
