import { useEffect, useState, useRef } from 'react';
import Keycloak from 'keycloak-js';
import Feed from './components/Feed';
import Notifications from './components/Notifications';
import Layout from './components/Layout';

import Profile from './components/Profile';
import SinglePost from './components/SinglePost';

// ⚠️ CHANGE ME: Update these values to match your Keycloak setup
const KEYCLOAK_CONFIG = {
  url: 'http://localhost:8080',
  realm: 'noticeboard',
  clientId: 'noticeboard-frontend'
};

// Initialize Keycloak instance
const keycloak = new Keycloak(KEYCLOAK_CONFIG);



interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

function App() {
  const isRun = useRef(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'connections' | 'feed' | 'notifications' | 'post'>('profile');



  // Connections State
  const [incoming, setIncoming] = useState<Connection[]>([]);
  const [outgoing, setOutgoing] = useState<Connection[]>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [connectStatus, setConnectStatus] = useState<string | null>(null);

  // Navigation State
  const [viewPostId, setViewPostId] = useState<string | null>(null);

  const handleNotificationClick = (notification: any) => {
    if (notification.type === 'like' || notification.type === 'comment') {
      if (notification.post_id) {
        setViewPostId(notification.post_id);
        setActiveTab('post' as any); // Force cast for now, will update state type next
      }
    }
  };

  const handleBackToFeed = () => {
    setViewPostId(null);
    setActiveTab('feed');
  };

  useEffect(() => {
    if (isRun.current) return;
    isRun.current = true;

    keycloak
      .init({ onLoad: 'login-required' })
      .then((auth) => {
        setAuthenticated(auth);
        if (auth) {
          fetchInitialData();
        }
      })
      .catch((err) => {
        console.error('Keycloak init error:', err);
      });
  }, []);

  const fetchInitialData = () => {
    fetchConnections();
  };

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${keycloak.token}`,
        'Content-Type': 'application/json',
      },
    });
  };



  // --- Connection Actions ---

  const fetchConnections = async () => {
    try {
      const [incRes, outRes] = await Promise.all([
        authenticatedFetch('http://localhost:3000/connections/incoming'),
        authenticatedFetch('http://localhost:3000/connections/outgoing')
      ]);
      if (incRes.ok) setIncoming(await incRes.json());
      if (outRes.ok) setOutgoing(await outRes.json());
    } catch (e) { console.error(e); }
  };

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
    } catch (e) {
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

  if (!authenticated) {
    return <div className="p-4">Redirecting to Keycloak Login...</div>;
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      userEmail={keycloak.tokenParsed?.email}
      onLogout={() => keycloak.logout()}
    >

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Profile authenticatedFetch={authenticatedFetch} />
      )}

      {/* Connections Tab */}
      {activeTab === 'connections' && (
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
      )}
      {/* Feed Tab */}
      {activeTab === 'feed' && (
        <Feed
          authenticatedFetch={authenticatedFetch}
          userId={keycloak.tokenParsed?.sub || ''}
        />
      )}
      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Notifications authenticatedFetch={authenticatedFetch} onNotificationClick={handleNotificationClick} />
      )}

      {/* Single Post Tab (Hidden from Nav) */}
      {activeTab === 'post' && viewPostId && (
        <SinglePost
          postId={viewPostId}
          authenticatedFetch={authenticatedFetch}
          onBack={handleBackToFeed}
        />
      )}
    </Layout>
  );
}

export default App;
