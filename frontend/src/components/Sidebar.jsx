import React from 'react';
import {
  LayoutDashboard,
  Camera,
  Sparkles,
  FileText,
  Calendar,
  User,
  LogOut,
  LogIn,
  X
} from 'lucide-react';
import Logo from './Logo';

export default function Sidebar({
  activeTab,
  setActiveTab,
  user,
  logout,
  onOpenAuth,
  isOpen,
  onClose
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analyzer', label: 'Skin Analysis', icon: Camera },
    { id: 'report', label: 'My Reports', icon: FileText },
    { id: 'my-routine', label: 'My Routine', icon: Sparkles },
    { id: 'twin', label: 'Skin History', icon: Calendar },
    { id: 'profile', label: 'My Profile', icon: User }
  ];

  return (
    <aside
      className={`sidebar ${isOpen ? 'open' : ''}`}
      style={{
        width: '240px',
        backgroundColor: 'var(--bg-card, #FFFFFF)',
        borderRight: '1px solid var(--border, #E8E2D8)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
        flexShrink: 0
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '1.25rem 1.25rem 1rem',
          borderBottom: '1px solid var(--border, #E8E2D8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
          <Logo size="md" />
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="mobile-close-btn"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: 4,
              color: 'var(--text-secondary, #536258)'
            }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Primary Navigation Links */}
      <nav
        style={{
          flex: 1,
          padding: '0.85rem 0.75rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}
      >
        <div
          style={{
            padding: '0.35rem 0.5rem',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--text-muted, #79877E)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}
        >
          Main Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: isActive ? 'var(--primary-subtle, #E8F5EE)' : 'transparent',
                color: isActive ? 'var(--primary, #2D6A4F)' : 'var(--text-primary, #223127)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 150ms ease',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-warm, #FAF8F5)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon size={18} color={isActive ? 'var(--primary, #2D6A4F)' : 'var(--text-muted, #79877E)'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Status / Account Footer */}
      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid var(--border, #E8E2D8)',
          backgroundColor: 'var(--bg-card-subtle, #FAF8F5)'
        }}
      >
        {user ? (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'var(--text-heading, #14241B)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  {user.full_name || user.username}
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted, #79877E)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  {user.email}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => setActiveTab('profile')}
                className="btn btn-outline btn-sm"
                style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
              >
                <User size={13} />
                <span>Profile</span>
              </button>
              <button
                onClick={logout}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.35rem 0.6rem' }}
                title="Sign Out"
                aria-label="Sign out"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '0.85rem', padding: '0.65rem' }}
          >
            <LogIn size={15} />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </aside>
  );
}
