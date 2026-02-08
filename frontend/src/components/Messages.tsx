import { useState, useEffect } from 'react';
import type { Message, Conversation, AuthenticatedFetch } from '../types';
import { Button } from './ui/Button';

export default function Messages({ authenticatedFetch }: { authenticatedFetch: AuthenticatedFetch }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchChat(selectedUser);
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => fetchChat(selectedUser), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  const fetchConversations = async () => {
    try {
      const res = await authenticatedFetch('/messages');
      if (res.ok) {
        setConversations(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChat = async (userId: string) => {
    try {
      const res = await authenticatedFetch(`/messages/${userId}`);
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch chat', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newMessage.trim()) return;

    try {
      const res = await authenticatedFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
          receiver_id: selectedUser,
          message_text: newMessage
        })
      });
      if (res.ok) {
        setNewMessage('');
        fetchChat(selectedUser);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 flex h-[calc(100vh-100px)] gap-4">
      {/* Sidebar */}
      <div className="w-1/3 bg-white rounded-lg shadow border border-gray-200 overflow-y-auto">
        <h2 className="p-4 text-xl font-bold border-b">Messages</h2>
        {conversations.map(conv => (
          <div
            key={conv.other_id}
            onClick={() => setSelectedUser(conv.other_id)}
            className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedUser === conv.other_id ? 'bg-blue-50' : ''}`}
          >
            <p className="font-bold">{conv.first_name} {conv.last_name}</p>
            <p className="text-sm text-gray-600 truncate">{conv.message_text}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(conv.created_at).toLocaleDateString()}</p>
          </div>
        ))}
        {!loading && conversations.length === 0 && (
          <p className="p-4 text-gray-500 text-center">No conversations yet.</p>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-lg shadow border border-gray-200 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">
                {conversations.find(c => c.other_id === selectedUser)?.first_name || 'Chat'}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === selectedUser ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[70%] p-3 rounded-lg ${
                    msg.sender_id === selectedUser
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-600 text-white'
                  }`}>
                    <p>{msg.message_text}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender_id === selectedUser ? 'text-gray-500' : 'text-blue-100'}`}>
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <Button type="submit">Send</Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
