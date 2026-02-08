import { useEffect, useState, useRef, useCallback } from 'react';
import Keycloak from 'keycloak-js';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Feed from './components/Feed';
import Notifications from './components/Notifications';
import Layout from './components/Layout';
import Connections from './components/Connections';

import Profile from './components/Profile';
import SinglePost from './components/SinglePost';
import Login from './components/Login';
import Register from './components/Register';
import type { Notification, AuthenticatedFetch } from './types';

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

  // Need to use useNavigate inside Router context, so creating a wrapper or moving logic
  // But AppContent is inside BrowserRouter in App

  // Note: keycloak initialization should ideally happen once. 
  // If we move it inside a component that re-renders, use refs or outside effect.

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
        checkLoginIframe: false, // Sometimes causes issues in local dev
      })
      .then((auth) => {
        setAuthenticated(auth);
      })
      .catch((err) => {
        console.error('Keycloak init error:', err);
      })
      .finally(() => {
        setIsInitialized(true);
      });
  }, []);

  const authenticatedFetch: AuthenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    // Prefer keycloak.token if available (it might be fresher due to silent refresh),
    // but fallback to localStorage immediately.
    let token = keycloak.token || localStorage.getItem('token');

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }, []);

  const handleLoginSuccess = (token: string, refreshToken?: string) => {
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    // Force reload to re-init keycloak with new token or just navigate
    // Simple state update might not be enough for keycloak-js to adopt the token without init, 
    // but we can try to navigate first. For robust auth, reload is safer.
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

  // Strict reliance on Keycloak state
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
          <Layout
            userEmail={parsedToken?.email}
            currentUserId={parsedToken?.sub}
            onLogout={handleLogout}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/feed" replace />} />
              <Route path="/feed" element={<Feed authenticatedFetch={authenticatedFetch} />} />
              <Route path="/connections" element={<Connections authenticatedFetch={authenticatedFetch} />} />
              <Route path="/notifications" element={<NotificationsWithNavigation authenticatedFetch={authenticatedFetch} />} />
              <Route path="/profile/:id" element={<Profile authenticatedFetch={authenticatedFetch} currentUserId={parsedToken?.sub} />} />
              <Route path="/posts/:id" element={<SinglePostWrapper authenticatedFetch={authenticatedFetch} />} />
            </Routes>
          </Layout>
        )
      } />
    </Routes>
  );
}

// Wrapper to handle navigation from Notifications
function NotificationsWithNavigation({ authenticatedFetch }: { authenticatedFetch: AuthenticatedFetch }) {
  const navigate = useNavigate();
  const handleNotificationClick = (notification: Notification) => {
    if ((notification.type === 'like' || notification.type === 'comment') && notification.post_id) {
      navigate(`/posts/${notification.post_id}`);
    }
  };

  return <Notifications authenticatedFetch={authenticatedFetch} onNotificationClick={handleNotificationClick} />;
}

// Wrapper for SinglePost to extract ID from params
import { useParams } from 'react-router-dom';

function SinglePostWrapper({ authenticatedFetch }: { authenticatedFetch: AuthenticatedFetch }) {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) return <div>Invalid Post ID</div>;

  return (
    <SinglePost
      postId={id}
      authenticatedFetch={authenticatedFetch}
      onBack={() => navigate('/feed')}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
