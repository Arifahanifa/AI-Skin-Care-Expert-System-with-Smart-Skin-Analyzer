import React from 'react';
import {
  Menu,
  Camera,
  LogOut,
  User,
  LogIn
} from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

export default function Navbar({
  activeTab,
  onNavigate,
  onToggleMobileSidebar,
  onNewAssessment,
  onOpenAuth
}) {
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'analyzer', label: 'Skin Analysis' },
    { id: 'report', label: 'My Reports' },
    { id: 'my-routine', label: 'My Routine' },
    { id: 'twin', label: 'Skin History' },
    { id: 'profile', label: 'My Profile' }
  ];

  return (
    <header
      className="topbar"
      style={{
        height: '66px',
        backgroundColor: 'var(--bg-card, #FFFFFF)',
        borderBottom: '1px solid var(--border, #E8E2D8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Left: Mobile Menu & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleMobileSidebar}
          className="btn btn-outline btn-sm mobile-menu-btn"
          style={{ padding: '6px 8px' }}
          title="Open Menu"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        <div style={{ cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('dashboard')}>
          <Logo size="md" />
        </div>
      </div>

      {/* Desktop Main Navigation Links (Only the 6 primary sections) */}
      <nav
        className="desktop-nav"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}
      >
        {navLinks.map((link) => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onNavigate && onNavigate(link.id)}
              style={{
                background: isActive ? 'var(--primary-subtle, #E8F5EE)' : 'transparent',
                color: isActive ? 'var(--primary, #2D6A4F)' : 'var(--text-secondary, #536258)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.45rem 0.8rem',
                fontSize: '0.875rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-warm, #FAF8F5)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {link.label}
            </button>
          );
        })}
      </nav>

      {/* Right: Theme Toggle, Quick Action & User Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Google-style Light/Dark Theme Toggle Button */}
        <ThemeToggle />

        {/* Start Skin Check CTA button */}
        <button
          onClick={onNewAssessment}
          className="btn btn-primary btn-sm"
          style={{ gap: '0.4rem', padding: '0.45rem 0.9rem' }}
        >
          <Camera size={15} />
          <span>Start Skin Check</span>
        </button>

        {/* Real User Auth controls - no demo logins */}
        {!isAuthenticated ? (
          <button
            onClick={onOpenAuth}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', gap: '0.4rem' }}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => onNavigate && onNavigate('profile')}
              className="btn btn-outline btn-sm"
              style={{ gap: '0.4rem', padding: '0.4rem 0.75rem' }}
              title="View Profile"
            >
              <User size={14} />
              <span className="hide-mobile">
                {user?.full_name ? user.full_name.split(' ')[0] : user?.username || 'Profile'}
              </span>
            </button>
            <button
              onClick={logout}
              className="btn btn-outline btn-sm"
              style={{ padding: '0.4rem 0.6rem' }}
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
