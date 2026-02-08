import { useEffect, useState, useRef } from 'react';
import Keycloak from 'keycloak-js';
import Feed from './components/Feed';
import Notifications from './components/Notifications';

import ProfilePosts from './components/ProfilePosts';

// ⚠️ CHANGE ME: Update these values to match your Keycloak setup
const KEYCLOAK_CONFIG = {
  url: 'http://localhost:8080',
  realm: 'noticeboard',
  clientId: 'noticeboard-frontend'
};

// Initialize Keycloak instance
const keycloak = new Keycloak(KEYCLOAK_CONFIG);

interface Profile {
  about?: string;
  error?: string;
  // ... other fields from /me
}

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
  const [activeTab, setActiveTab] = useState<'profile' | 'connections' | 'feed' | 'notifications'>('profile');

  // Profile State
  const [profile, setProfile] = useState<any>(null); // Raw user data
  const [about, setAbout] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Connections State
  const [incoming, setIncoming] = useState<Connection[]>([]);
  const [outgoing, setOutgoing] = useState<Connection[]>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [connectStatus, setConnectStatus] = useState<string | null>(null);

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
    fetchMe();
    fetchProfile();
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

  // --- Profile Actions ---

  const fetchProfile = async () => {
    try {
      const res = await authenticatedFetch('http://localhost:3000/me/profile');
      if (res.ok) {
        const data = await res.json();
        setAbout(data.about || '');
      }
    } catch (e) { console.error(e); }
  };

  const fetchMe = async () => {
    try {
      const res = await authenticatedFetch('http://localhost:3000/me');
      const json = await res.json();
      setProfile(json);
    } catch (e) { setProfile({ error: 'Fetch failed' }); }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await authenticatedFetch('http://localhost:3000/me/profile', {
        method: 'PUT',
        body: JSON.stringify({ about })
      });

      if (res.ok) {
        setSaveStatus('Profile saved successfully!');
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus('Failed to save.');
      }
    } catch (e) {
      setSaveStatus('Error saving profile.');
    } finally {
      setIsSaving(false);
    }
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
    <div className="p-8 font-sans max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Noticeboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {profile?.email || 'Loading...'}
          </span>
          <button
            onClick={() => keycloak.logout()}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('profile')}
        >
          My Profile
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'connections' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('connections')}
        >
          Connections
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'feed' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('feed')}
        >
          Feed
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'notifications' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Edit Info</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">About Me</label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
              {saveStatus && <span className="text-sm text-gray-600">{saveStatus}</span>}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 mb-2">RAW USER DATA</h3>
            <pre className="text-xs overflow-auto h-48">
              {profile ? JSON.stringify(profile, null, 2) : 'Loading...'}
            </pre>
          </div>
        </div>
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
              <p>Your ID: <span className="font-mono bg-gray-100 p-1 rounded">{profile?.id}</span></p>
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
        <Feed authenticatedFetch={authenticatedFetch} userId={profile?.id} />
      )}
      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Notifications authenticatedFetch={authenticatedFetch} />
      )}
    </div>
  );
}

export default App;
