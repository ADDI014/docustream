import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useToast } from './hooks/useToast';

import Navbar from './components/Navbar';
import ToastContainer from './components/ToastContainer';

import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import UploadPage from './pages/UploadPage';
import FilesPage from './pages/FilesPage';
import DashboardPage from './pages/DashboardPage';
import LogsPage from './pages/LogsPage';

/* ─── Inner app (has access to auth context) ─────────────────────────────── */
const AppInner = () => {
  const { user, loading } = useAuth();
  const { toasts, toast } = useToast();

  // Simple client-side routing via state
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.replace('#', '') || 'home';
    return hash;
  });

  // Sync hash with page state
  useEffect(() => {
    window.location.hash = page;
  }, [page]);

  // Listen to browser back/forward
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      setPage(hash);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (p) => setPage(p);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px',
        color: 'var(--text-muted)'
      }}>
        <div style={{
          width: 48, height: 48,
          borderRadius: '50%',
          border: '3px solid rgba(0,120,212,0.2)',
          borderTopColor: 'var(--azure-blue)',
          animation: 'spin 0.9s linear infinite'
        }} />
        <span>Loading DocuStream...</span>
      </div>
    );
  }

  /* ─── Page renderer ─────────────────────────────────────────────────── */
  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage onNavigate={navigate} />;

      case 'login':
        return user
          ? <DashboardPage toast={toast} onNavigate={navigate} />
          : <AuthPage initialMode="login" toast={toast} onNavigate={navigate} />;

      case 'register':
        return user
          ? <DashboardPage toast={toast} onNavigate={navigate} />
          : <AuthPage initialMode="register" toast={toast} onNavigate={navigate} />;

      case 'upload':
        return <UploadPage toast={toast} onNavigate={navigate} />;

      case 'files':
        return <FilesPage toast={toast} onNavigate={navigate} />;

      case 'dashboard':
        return <DashboardPage toast={toast} onNavigate={navigate} />;

      case 'logs':
        return <LogsPage toast={toast} onNavigate={navigate} />;

      default:
        return (
          <div style={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            color: 'var(--text-muted)'
          }}>
            <div style={{ fontSize: 80 }}>404</div>
            <h2 style={{ color: 'var(--text-secondary)' }}>Page not found</h2>
            <button
              onClick={() => navigate('home')}
              style={{
                background: 'var(--azure-blue)',
                color: 'white',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Go Home
            </button>
          </div>
        );
    }
  };

  return (
    <>
      <Navbar currentPage={page} onNavigate={navigate} />
      <main>{renderPage()}</main>
      <ToastContainer toasts={toasts} />
    </>
  );
};

/* ─── Root App wrapped in AuthProvider ─────────────────────────────────────── */
const App = () => (
  <AuthProvider>
    <AppInner />
  </AuthProvider>
);

export default App;