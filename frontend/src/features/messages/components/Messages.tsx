import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import type { Message, UserProfile, GroupMessage } from '../../../types';
import { Button } from '../../../components/ui/Button';
import apiClient from '../../../api/client';
import { socket } from '../../../utils/socket';
import { useConversations } from '../hooks/useConversations';
import { useChat } from '../hooks/useChat';
import CreateGroupModal from './CreateGroupModal';
import * as messagesApi from '../api/messages';

type ChatType = 'user' | 'group';

interface ChatSelection {
  id: string;
  type: ChatType;
}

export default function Messages() {
  const { userId: urlUserId } = useParams();
  const location = useLocation();

  const { allChats, fetchData: refreshConversations, loading: loadingConversations, conversations, groups } = useConversations();
  const [selectedChat, setSelectedChat] = useState<ChatSelection | null>(null);

  const {
    messages,
    isBlocked,
    setIsBlocked,
    sendMessage
  } = useChat(selectedChat?.id || null, selectedChat?.type || null);

  const [newMessage, setNewMessage] = useState('');
  const [newChatId, setNewChatId] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<UserProfile[]>([]);
  const [createGroupInitialMembers, setCreateGroupInitialMembers] = useState<UserProfile[]>([]);

  // sync url to selected chat
  useEffect(() => {
    if (urlUserId) {
      setSelectedChat({ id: urlUserId, type: 'user' });

      if (location.state?.user) {
        // This is handled by useConversations implicitly if it exists in conversations
        // If not, it won't show in the sidebar unless we force it.
        // The original logic had a way to inject it into local conversations state.
        // For now, let's just allow it to be selected.
      }
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
      alert(err.response?.data?.error || 'Failed to send message');
    }
  };

  const handleCreateGroupWithUser = async () => {
    if (selectedChat?.type !== 'user') return;
    try {
      const res = await messagesApi.getUserContext(selectedChat.id);
      setCreateGroupInitialMembers([res.data]);
      setIsMenuOpen(false);
      setIsCreateGroupOpen(true);
    } catch (err) {
      console.error(err);
      alert('Failed to prepare group creation');
    }
  };

  const handleBlockUser = async () => {
    if (selectedChat?.type !== 'user') return;
    if (!confirm('Block user?')) return;
    try {
      await apiClient.post(`/users/${selectedChat.id}/block`);
      alert('User blocked');
      setIsBlocked(true);
    } catch (e) { alert('Failed'); }
  };

  const handleUnblockUser = async () => {
    if (selectedChat?.type !== 'user') return;
    if (!confirm('Unblock user?')) return;
    try {
      await apiClient.delete(`/users/${selectedChat.id}/block`);
      alert('User unblocked');
      setIsBlocked(false);
    } catch (e) { alert('Failed'); }
  };

  const handleReportUser = async () => {
    if (selectedChat?.type !== 'user') return;
    const reason = prompt('Reason:');
    if (reason) {
      try {
        await apiClient.post(`/users/${selectedChat.id}/report`, { reason });
        alert('Reported');
      } catch (e) { alert('Failed'); }
    }
  };

  const handleLeaveGroup = async () => {
    if (selectedChat?.type !== 'group') return;
    if (!confirm('Leave group?')) return;
    try {
      await messagesApi.leaveGroup(selectedChat.id);
      setSelectedChat(null);
      refreshConversations();
    } catch (e: any) { alert(e.response?.data?.error || 'Failed'); }
  };

  const handleAddMemberSearch = (query: string) => {
    setMemberSearchQuery(query);
    if (query.length >= 2) {
      apiClient.get(`/users/search?q=${query}`)
        .then(res => setMemberSearchResults(res.data))
        .catch(console.error);
    } else {
      setMemberSearchResults([]);
    }
  };

  const handleAddMember = async (user: UserProfile) => {
    if (selectedChat?.type !== 'group') return;
    try {
      await messagesApi.addGroupMember(selectedChat.id, user.id);
      alert('Member added');
      setShowAddMember(false);
      setMemberSearchQuery('');
    } catch (e: any) { alert(e.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 flex h-[calc(100vh-100px)] gap-4">
      {/* Sidebar */}
      <div className="w-1/3 bg-white rounded-lg shadow border border-gray-200 overflow-y-auto hidden md:flex flex-col">
        <div className="p-4 border-b flex justify-between items-center text-black">
          <h2 className="text-xl font-bold">Messages</h2>
          <button onClick={() => setIsCreateGroupOpen(true)} className="text-blue-600 hover:bg-blue-50 p-1 rounded" title="Create Group">
            <span className="material-symbols-outlined">group_add</span>
          </button>
        </div>

        {/* Search New User */}
        <div className="p-4 border-b bg-gray-50 relative">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full border p-2 rounded text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={newChatId}
            onChange={(e) => {
              setNewChatId(e.target.value);
              if (e.target.value.length >= 2) {
                apiClient.get(`/users/search?q=${e.target.value}`)
                  .then(res => setSearchResults(res.data))
                  .catch(console.error);
              } else { setSearchResults([]); }
            }}
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 mt-1 max-h-48 overflow-y-auto rounded shadow-lg z-10">
              {searchResults.map(user => (
                <div key={user.id} onClick={() => {
                  setSelectedChat({ id: user.id, type: 'user' });
                  setNewChatId('');
                  setSearchResults([]);
                }} className="p-2 hover:bg-gray-100 cursor-pointer text-black">
                  <div className="font-bold">{user.first_name} {user.last_name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {allChats.length === 0 && !loadingConversations && (
            <p className="p-4 text-center text-gray-500">No conversations yet</p>
          )}
          {allChats.map(chat => (
            <div
              key={`${chat.type}-${chat.id}`}
              onClick={() => setSelectedChat({ id: chat.id, type: chat.type })}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedChat?.id === chat.id ? 'bg-blue-50' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {chat.type === 'group' && <span className="material-symbols-outlined text-gray-500 text-sm">group</span>}
                  <p className="font-bold text-gray-900">{chat.name}</p>
                </div>
                {chat.unread > 0 && (
                  <span className="bg-red-500 text-white text-[10px] h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full">
                    {chat.unread > 99 ? '99+' : chat.unread}
                  </span>
                )}
              </div>
              <p className={`text-sm truncate ${chat.unread > 0 ? 'font-bold text-black' : 'text-gray-500'}`}>
                {chat.lastMessage || (chat.type === 'group' ? 'No messages' : '')}
              </p>
              <p className="text-xs text-gray-400 mt-1">{new Date(chat.timestamp).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-lg shadow border border-gray-200 flex flex-col w-full relative">
        {selectedChat ? (
          <>
            <div className="p-4 border-b flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="text-xl font-bold text-black flex items-center gap-2">
                  {selectedChat.type === 'group' && <span className="material-symbols-outlined text-gray-600">group</span>}
                  {selectedChat.type === 'user'
                    ? conversations.find(c => c.other_id === selectedChat.id)
                      ? `${conversations.find(c => c.other_id === selectedChat.id)?.first_name} ${conversations.find(c => c.other_id === selectedChat.id)?.last_name}`
                      : 'User'
                    : groups.find(g => g.id === selectedChat.id)?.name || 'Group'
                  }
                </div>
              </div>
              <div className="relative">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border rounded shadow-lg z-20 overflow-hidden text-black">
                    {selectedChat.type === 'user' ? (
                      <>
                        {isBlocked ? (
                          <button onClick={handleUnblockUser} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">check_circle</span> Unblock
                          </button>
                        ) : (
                          <button onClick={handleBlockUser} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">block</span> Block
                          </button>
                        )}
                        <button onClick={handleCreateGroupWithUser} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">group_add</span> Create Group with User
                        </button>
                        <button onClick={handleReportUser} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">flag</span> Report
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setShowAddMember(true)} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">person_add</span> Add Member
                        </button>
                        <button onClick={handleLeaveGroup} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">logout</span> Leave Group
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Add Member Area */}
            {showAddMember && selectedChat.type === 'group' && (
              <div className="p-4 bg-gray-50 border-b relative">
                <div className="flex gap-2 relative">
                  <input
                    type="text"
                    placeholder="Search user to add..."
                    className="border p-2 rounded flex-1 text-black"
                    value={memberSearchQuery}
                    onChange={(e) => handleAddMemberSearch(e.target.value)}
                  />
                  <Button variant="ghost" onClick={() => setShowAddMember(false)}>Cancel</Button>
                </div>
                {memberSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border shadow-lg max-h-40 overflow-y-auto z-10 mx-4">
                    {memberSearchResults.map(u => (
                      <div key={u.id} onClick={() => handleAddMember(u)} className="p-2 hover:bg-gray-100 cursor-pointer text-black">
                        {u.first_name} {u.last_name} ({u.email})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">Send a message to start chatting!</div>
              ) : (
                messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isGroup={selectedChat.type === 'group'}
                  />
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
              <input
                type="text"
                placeholder={isBlocked && selectedChat.type === 'user' ? "Blocked" : "Type a message..."}
                className="flex-1 border p-2 rounded text-black disabled:bg-gray-100"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isBlocked && selectedChat.type === 'user'}
              />
              <Button type="submit" disabled={!newMessage.trim() || (isBlocked && selectedChat.type === 'user')}>
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <span className="material-symbols-outlined text-6xl mb-4 text-gray-400">chat</span>
            <p>Select a chat or create a group</p>
          </div>
        )}
      </div>

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={() => { refreshConversations(); setIsCreateGroupOpen(false); }}
        initialMembers={createGroupInitialMembers}
      />
    </div>
  );
}

// Helper component for bubbles to handle "Me" vs "Other" logic cleaner
function MessageBubble({ message, isGroup }: { message: Message | GroupMessage, isGroup: boolean }) {
  const token = localStorage.getItem('token');
  let myId = '';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      myId = payload.sub || payload.id;
    } catch (e) { }
  }

  const isMe = message.sender_id === myId;

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] p-3 rounded-lg ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
        {isGroup && !isMe && (
          <p className="text-xs font-bold text-gray-500 mb-1">
            {message.sender_first_name} {message.sender_last_name}
          </p>
        )}
        {/* @ts-ignore */}
        <p>{message.message_text || message.content}</p>
        <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
          {new Date(message.created_at).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
