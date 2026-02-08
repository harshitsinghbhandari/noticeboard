import { useEffect, useState, useRef, useCallback } from 'react';
import Keycloak from 'keycloak-js';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Feed from './components/Feed';
import Notifications from './components/Notifications';
import Layout from './components/Layout';
import Connections from './components/Connections';

import Profile from './components/Profile';
import SinglePost from './components/SinglePost';
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

  // Need to use useNavigate inside Router context, so creating a wrapper or moving logic
  // But AppContent is inside BrowserRouter in App

  // Note: keycloak initialization should ideally happen once. 
  // If we move it inside a component that re-renders, use refs or outside effect.

  useEffect(() => {
    if (isRun.current) return;
    isRun.current = true;

    keycloak
      .init({ onLoad: 'login-required' })
      .then((auth) => {
        setAuthenticated(auth);
      })
      .catch((err) => {
        console.error('Keycloak init error:', err);
      });
  }, []);

  const authenticatedFetch: AuthenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${keycloak.token}`,
        'Content-Type': 'application/json',
      },
    });
  }, []);

  if (!authenticated) {
    return <div className="p-4">Redirecting to Keycloak Login...</div>;
  }

  return (
    <Layout
      userEmail={keycloak.tokenParsed?.email}
      currentUserId={keycloak.tokenParsed?.sub}
      onLogout={() => keycloak.logout()}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="/feed" element={<Feed authenticatedFetch={authenticatedFetch} />} />
        <Route path="/connections" element={<Connections authenticatedFetch={authenticatedFetch} />} />
        <Route path="/notifications" element={<NotificationsWithNavigation authenticatedFetch={authenticatedFetch} />} />
        <Route path="/profile/:id" element={<Profile authenticatedFetch={authenticatedFetch} currentUserId={keycloak.tokenParsed?.sub} />} />
        <Route path="/posts/:id" element={<SinglePostWrapper authenticatedFetch={authenticatedFetch} />} />
      </Routes>
    </Layout>
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
