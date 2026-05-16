import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './Navbar.css';

const Navbar = ({ currentPage, onNavigate }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'upload', label: 'Upload' },
    { id: 'files', label: 'My Files' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'logs', label: 'Logs' }
  ];

  const handleNav = (id) => {
    onNavigate(id);
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => handleNav('home')}>
          <div className="logo-icon">
            <svg viewBox="0 0 32 32" fill="none">
              <rect x="4" y="4" width="10" height="10" rx="2" fill="var(--azure-blue)" opacity="0.9"/>
              <rect x="18" y="4" width="10" height="10" rx="2" fill="var(--azure-blue)" opacity="0.6"/>
              <rect x="4" y="18" width="10" height="10" rx="2" fill="var(--azure-blue)" opacity="0.6"/>
              <rect x="18" y="18" width="10" height="10" rx="2" fill="var(--accent-green)" opacity="0.9"/>
            </svg>
          </div>
          <span className="logo-text">Docu<span>Stream</span></span>
        </div>

        {/* Desktop nav */}
        <div className="navbar-links">
          {navLinks.map(link => (
            <button
              key={link.id}
              className={`nav-link ${currentPage === link.id ? 'active' : ''}`}
              onClick={() => handleNav(link.id)}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Auth section */}
        <div className="navbar-auth">
          {user ? (
            <div className="user-menu">
              <div className="user-avatar">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="user-name">{user.name}</span>
              <button className="btn-logout" onClick={logout}>Logout</button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button className="btn-ghost" onClick={() => handleNav('login')}>Login</button>
              <button className="btn-primary-sm" onClick={() => handleNav('register')}>Sign Up</button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span className={menuOpen ? 'open' : ''}></span>
          <span className={menuOpen ? 'open' : ''}></span>
          <span className={menuOpen ? 'open' : ''}></span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {navLinks.map(link => (
            <button key={link.id} className={`mobile-link ${currentPage === link.id ? 'active' : ''}`} onClick={() => handleNav(link.id)}>
              {link.label}
            </button>
          ))}
          <div className="mobile-auth">
            {user ? (
              <button className="btn-logout" onClick={() => { logout(); setMenuOpen(false); }}>Logout</button>
            ) : (
              <>
                <button className="btn-ghost" onClick={() => handleNav('login')}>Login</button>
                <button className="btn-primary-sm" onClick={() => handleNav('register')}>Sign Up</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;