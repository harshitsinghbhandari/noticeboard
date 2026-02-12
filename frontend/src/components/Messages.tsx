import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import type { Message, Conversation, UserProfile } from '../types';
import { Button } from './ui/Button';
import apiClient from '../api/client';
import { socket } from '../utils/socket';

export default function Messages() {
  const { userId } = useParams();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [newChatId, setNewChatId] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isBlocked, setIsBlocked] = useState(false);

  // Close menu when clicking outside (simple version: just close on selection change)
  useEffect(() => {
    setIsMenuOpen(false);
    if (selectedUser) {
      apiClient.get(`/users/${selectedUser}`)
        .then(res => setIsBlocked(!!res.data.is_blocked))
        .catch(err => console.error("Failed to check block status", err));
    } else {
      setIsBlocked(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    fetchConversations();
  }, []);
  // ... (existing code)
  // ...


  useEffect(() => {
    if (userId) {
      setSelectedUser(userId);
      // Check if we passed user details via state (from Profile)
      if (location.state?.user) {
        setConversations(prev => {
          if (prev.find(c => c.other_id === userId)) return prev;
          // Add temporary conversation entry for UI
          const tempConv: Conversation = {
            other_id: userId,
            first_name: location.state.user.first_name,
            last_name: location.state.user.last_name,
            message_text: 'Start a conversation',
            created_at: new Date().toISOString()
          };
          return [tempConv, ...prev];
        });
      }
    }
  }, [userId, location.state]);

  useEffect(() => {
    if (selectedUser) {
      fetchChat(selectedUser);

      const onMessageNew = (message: Message) => {
        if (message.sender_id === selectedUser || message.receiver_id === selectedUser) {
          setMessages(prev => {
            if (prev.find(m => m.id === message.id)) return prev;
            return [...prev, message];
          });
        }
        fetchConversations();
      };

      const onMessageRead = (data: { messageId: string, readerId: string }) => {
        setMessages(prev => prev.map(m =>
          m.id === data.messageId ? { ...m, read_at: new Date().toISOString() } : m
        ));
      };

      const onUserBlocked = (data: { by: string }) => {
        if (data.by === selectedUser) {
          setIsBlocked(true);
        }
      };

      const onReconnect = () => {
        fetchChat(selectedUser);
        fetchConversations();
      };

      socket.on("message:new", onMessageNew);
      socket.on("message:read", onMessageRead);
      socket.on("user:blocked", onUserBlocked);
      socket.on("connect", onReconnect);

      return () => {
        socket.off("message:new", onMessageNew);
        socket.off("message:read", onMessageRead);
        socket.off("user:blocked", onUserBlocked);
        socket.off("connect", onReconnect);
      };
    }
  }, [selectedUser]);

  const handleBlockUser = async () => {
    if (!selectedUser) return;
    if (!confirm('Are you sure you want to block this user? They will not be able to message you.')) return;

    try {
      await apiClient.post(`/users/${selectedUser}/block`);
      alert('User blocked successfully.');
      // Ideally, refresh or redirect. For now, clear selection.
      setSelectedUser(null);
      fetchConversations();
    } catch (err) {
      console.error('Failed to block user', err);
      alert('Failed to block user.');
    }
    setIsMenuOpen(false);
  };

  const handleReportUser = async () => {
    if (!selectedUser) return;
    const reason = prompt('Please provide a reason for reporting this user:');
    if (!reason) return;

    try {
      await apiClient.post(`/users/${selectedUser}/report`, { reason });
      alert('User reported successfully.');
    } catch (err: any) {
      console.error('Failed to report user', err);
      if (err.response?.data?.error) {
        alert(`Error: ${err.response.data.error}`);
      } else {
        alert('Failed to report user.');
      }
    }
    setIsMenuOpen(false);
  };

  const handleUnblockUser = async () => {
    if (!selectedUser) return;
    if (!confirm('Are you sure you want to unblock this user?')) return;

    try {
      await apiClient.delete(`/users/${selectedUser}/block`);
      alert('User unblocked successfully.');
      setIsBlocked(false);
      fetchConversations();
    } catch (err) {
      console.error('Failed to unblock user', err);
      alert('Failed to unblock user.');
    }
    setIsMenuOpen(false);
  };

  const fetchConversations = async () => {
    try {
      const res = await apiClient.get('/messages');
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChat = async (userId: string) => {
    try {
      const res = await apiClient.get(`/messages/${userId}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch chat', err);
    }
  };

  const handleSelectUser = async (user: UserProfile) => {
    setNewChatId('');
    setSearchResults([]);

    // Check if conversation exists
    const existing = conversations.find(c => c.other_id === user.id);
    if (existing) {
      setSelectedUser(user.id);
      return;
    }

    // Add temporary conversation
    const tempConv: Conversation = {
      other_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      message_text: 'Start a conversation',
      created_at: new Date().toISOString()
    };
    setConversations(prev => [tempConv, ...prev]);
    setSelectedUser(user.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newMessage.trim()) return;

    try {
      await apiClient.post('/messages', {
        receiver_id: selectedUser,
        message_text: newMessage
      });
      setNewMessage('');
      fetchChat(selectedUser);
      // Refresh conversations to show the new message snippet
      fetchConversations();
    } catch (err: any) {
      console.error('Failed to send message', err);
      if (err.response?.data?.error) {
        alert(`Error: ${err.response.data.error}`);
      } else {
        alert('Failed to send message');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 flex h-[calc(100vh-100px)] gap-4">
      {/* Sidebar */}
      <div className="w-1/3 bg-white rounded-lg shadow border border-gray-200 overflow-y-auto hidden md:block">
        <h2 className="p-4 text-xl font-bold border-b text-black">Messages</h2>
        <div className="p-4 border-b bg-gray-50 relative">
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search users to message..."
                className="w-full border p-2 rounded text-black border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newChatId}
                onChange={(e) => {
                  setNewChatId(e.target.value);
                  if (e.target.value.length >= 2) {
                    apiClient.get(`/users/search?q=${e.target.value}`)
                      .then(res => setSearchResults(res.data))
                      .catch(console.error);
                  } else {
                    setSearchResults([]);
                  }
                }}
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 mt-1 max-h-48 overflow-y-auto rounded shadow-lg z-10">
                  {searchResults.map(user => (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-black"
                    >
                      <div className="font-bold">{user.first_name} {user.last_name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>
        {conversations.map(conv => (
          <div
            key={conv.other_id}
            onClick={() => setSelectedUser(conv.other_id)}
            className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedUser === conv.other_id ? 'bg-blue-50' : ''}`}
          >
            <p className="font-bold text-blue-500">{conv.first_name} {conv.last_name}</p>
            <p className="text-sm text-gray-500 truncate">{conv.message_text}</p>
            <p className="text-xs text-gray-500 mt-1">{new Date(conv.created_at).toLocaleDateString()}</p>
          </div>
        ))}
        {!loading && conversations.length === 0 && (
          <p className="p-4 text-gray-500 text-center">No conversations yet.</p>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-lg shadow border border-gray-200 flex flex-col w-full relative">
        {selectedUser ? (
          <>
            <div className="p-4 border-b flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button className="md:hidden mr-2" onClick={() => setSelectedUser(null)}>
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="text-xl font-bold text-black">
                  {conversations.find(c => c.other_id === selectedUser)?.first_name || 'Chat'} {conversations.find(c => c.other_id === selectedUser)?.last_name}
                </h2>
              </div>

              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                >
                  <span className="material-symbols-outlined">more_vert</span>
                </button>

                {isMenuOpen && (

                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border rounded shadow-lg z-20 overflow-hidden">
                    {isBlocked ? (
                      <button
                        onClick={handleUnblockUser}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-black flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Unblock User
                      </button>
                    ) : (
                      <button
                        onClick={handleBlockUser}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">block</span>
                        Block User
                      </button>
                    )}
                    <button
                      onClick={handleReportUser}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">flag</span>
                      Report User
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">Send a message to start chatting!</div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === selectedUser ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[70%] p-3 rounded-lg ${msg.sender_id === selectedUser
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-blue-600 text-white'
                      }`}>
                      <p>{msg.message_text}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender_id === selectedUser ? 'text-gray-500' : 'text-blue-100'}`}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
              <input
                type="text"
                placeholder={isBlocked ? "You cannot message this user" : "Type a message..."}
                className="flex-1 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isBlocked}
              />
              <Button
                type="submit"
                disabled={isBlocked || !newMessage.trim()}
                className={isBlocked ? "!bg-gray-400 !hover:bg-gray-400 cursor-not-allowed text-white" : ""}
              >
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <span className="material-symbols-outlined text-6xl mb-4 text-gray-400">chat</span>
            <p>Select a conversation to start messaging</p>
            <div className="md:hidden w-full mt-8">
              <h3 className="text-center font-bold mb-2">Recent Conversations</h3>
              {conversations.map(conv => (
                <div
                  key={conv.other_id}
                  onClick={() => setSelectedUser(conv.other_id)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50`}
                >
                  <p className="font-bold">{conv.first_name} {conv.last_name}</p>
                  <p className="text-sm text-gray-500 truncate">{conv.message_text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
