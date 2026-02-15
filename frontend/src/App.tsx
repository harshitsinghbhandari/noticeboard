import { useEffect, useState, useRef } from 'react';
import Keycloak from 'keycloak-js';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { socket } from './utils/socket';
import Feed from './features/feed/components/Feed';
import EventDiscovery from './features/events/components/EventDiscovery';
import EventDetail from './features/events/components/EventDetail';
import Notifications from './features/notifications/components/Notifications';
import Layout from './components/Layout';
import Connections from './features/connections/components/Connections';
import Bodies from './features/bodies/components/Bodies';
import BodyProfile from './features/bodies/components/BodyProfile';
import Openings from './features/openings/components/Openings';
import Messages from './features/messages/components/Messages';

import Profile from './features/profile/components/Profile';
import SinglePost from './features/feed/components/SinglePost';
import Login from './features/auth/components/Login';
import Register from './features/auth/components/Register';
import type { Notification } from './types';
import { DarkModeProvider } from './components/DarkModeContext';
import { UnreadProvider } from './context/UnreadContext';

// ⚠️ CHANGE ME: Update these values to match your Keycloak setup
const KEYCLOAK_CONFIG = {
  url: 'http://localhost:8080',
  realm: 'noticeboard',
  clientId: 'noticeboard-frontend'
};

// Initialize Keycloak instance
const keycloak = new Keycloak(KEYCLOAK_CONFIG);

function AppContent() {
  const isRun = useRef(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isRun.current) return;
    isRun.current = true;

    const storedToken = localStorage.getItem('token') || undefined;
    const storedRefreshToken = localStorage.getItem('refreshToken') || undefined;

    keycloak
      .init({
        onLoad: 'check-sso',
        token: storedToken,
        refreshToken: storedRefreshToken,
        pkceMethod: 'S256',
        checkLoginIframe: false,
      })
      .then((auth) => {
        setAuthenticated(auth);
        if (auth && keycloak.token) {
          localStorage.setItem('token', keycloak.token);

          socket.auth = { token: keycloak.token };
          socket.connect();

          if (keycloak.refreshToken) {
            localStorage.setItem('refreshToken', keycloak.refreshToken);
          }
        }

      })
      .catch(console.error)
      .finally(() => {
        setIsInitialized(true);
      });

    keycloak.onTokenExpired = () => {
      keycloak.updateToken(70).then((refreshed) => {
        if (refreshed && keycloak.token) {
          localStorage.setItem('token', keycloak.token);
          socket.auth = { token: keycloak.token };
          socket.connect();
        }
      }).catch(err => {
        console.error('Failed to refresh token', err);
      });
    };
  }, []);

  const handleLoginSuccess = (token: string, refreshToken?: string) => {
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    window.location.href = '/feed';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    keycloak.logout();
  };

  if (!isInitialized) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  const parsedToken = keycloak.tokenParsed;

  return (
    <Routes>
      <Route path="/login" element={!authenticated ? <Login onLogin={handleLoginSuccess} /> : <Navigate to="/feed" replace />} />
      <Route path="/register" element={!authenticated ? <Register /> : <Navigate to="/feed" replace />} />

      {/* Protected Routes */}
      <Route path="*" element={
        !authenticated ? (
          <Navigate to="/login" replace />
        ) : (
          <UnreadProvider currentUserId={parsedToken?.sub}>
            <Layout
              userEmail={parsedToken?.email}
              currentUserId={parsedToken?.sub}
              onLogout={handleLogout}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/events" replace />} />
                <Route path="/events" element={<EventDiscovery />} />
                <Route path="/events/:id" element={<EventDetail currentUserId={parsedToken?.sub} />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/connections" element={<Connections currentUserId={parsedToken?.sub} />} />
                <Route path="/bodies" element={<Bodies />} />
                <Route path="/bodies/:id" element={<BodyProfile />} />
                <Route path="/openings" element={<Openings />} />
                <Route path="/messages" element={<Messages currentUserId={parsedToken?.sub} />} />
                <Route path="/messages/:type/:id" element={<Messages currentUserId={parsedToken?.sub} />} />
                <Route path="/notifications" element={<NotificationsWithNavigation />} />
                <Route path="/profile/:id" element={<Profile currentUserId={parsedToken?.sub} />} />
                <Route path="/posts/:id" element={<SinglePostWrapper />} />
              </Routes>
            </Layout>
          </UnreadProvider>
        )
      } />
    </Routes>
  );
}

// Wrapper to handle navigation from Notifications
function NotificationsWithNavigation() {
  const navigate = useNavigate();
  const handleNotificationClick = (notification: Notification) => {
    if ((notification.type === 'like' || notification.type === 'comment') && notification.post_id) {
      navigate(`/posts/${notification.post_id}`);
    }
  };

  return <Notifications onNotificationClick={handleNotificationClick} />;
}

// Wrapper for SinglePost to extract ID from params
function SinglePostWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) return <div>Invalid Post ID</div>;

  return (
    <SinglePost
      postId={id}
      onBack={() => navigate('/feed')}
    />
  );
}

export default function App() {
  return (
    <DarkModeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </DarkModeProvider>
  );
}
