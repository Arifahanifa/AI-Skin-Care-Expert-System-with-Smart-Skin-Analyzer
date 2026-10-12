import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Calendar,
  AtSign,
  ShieldCheck,
  Server,
  Trash2,
  LogOut,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

export default function ProfilePage({ onNavigate }) {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmPurge, setConfirmPurge] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.user.getProfile();
        setProfileData(res);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handlePurgeData = async () => {
    try {
      await api.privacy.purgeUserData();
      setActionMessage('Your assessment history and routine logs have been cleared.');
      setConfirmPurge(false);
      // Reload stats
      const res = await api.user.getProfile();
      setProfileData(res);
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Could not clear data.');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div
          className="spinner"
          style={{
            width: 36,
            height: 36,
            border: '3px solid var(--border)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            margin: '0 auto 1.25rem'
          }}
        />
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading profile...</p>
      </div>
    );
  }

  const stats = profileData?.stats || { total_assessments: 0, total_routine_steps: 0 };
  const smtpConfigured = profileData?.smtp_configured || false;

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-heading)' }}>
          My Profile
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Manage your personal account details, view your assessment statistics, and configure app settings.
        </p>
      </div>

      {actionMessage && (
        <div
          style={{
            backgroundColor: 'var(--primary-subtle)',
            border: '1px solid var(--green-border)',
            color: 'var(--primary-deep)',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{actionMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            backgroundColor: '#FDF2EB',
            border: '1px solid #F7D5C5',
            color: '#B55835',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Account Info Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem'
              }}
            >
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                {user?.full_name || 'Skincare User'}
              </h2>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                @{user?.username || 'user'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggle />
            <button
              onClick={logout}
              className="btn btn-outline btn-sm"
              style={{ gap: '0.4rem' }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', borderRadius: '10px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Email Address
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              {user?.email || '—'}
            </div>
          </div>

          <div style={{ padding: '0.85rem', borderRadius: '10px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Username
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              {user?.username || '—'}
            </div>
          </div>

          <div style={{ padding: '0.85rem', borderRadius: '10px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Member Since
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              {user?.created_at ? user.created_at.split(' ')[0] : 'Today'}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Statistics Card */}
      <div className="card">
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1rem' }}>
          Your Skincare Activity
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Camera size={18} color="var(--primary)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Completed Checks
              </span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-heading)' }}>
              {stats.total_assessments}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {stats.total_assessments > 0 ? 'Saved in your personal timeline' : 'No checks completed yet'}
            </p>
          </div>

          <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Sparkles size={18} color="var(--primary)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Routine Steps Completed
              </span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
              {stats.total_routine_steps}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Logged morning & evening actions
            </p>
          </div>
        </div>
      </div>

      {/* Email Delivery Configuration Status Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
          <Server size={20} color="var(--primary)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-heading)' }}>
            Email Delivery & Password Recovery
          </h2>
        </div>

        <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-heading)' }}>
              Backend SMTP Status:
            </span>
            <span
              className={`badge ${smtpConfigured ? 'badge-primary' : 'badge-amber'}`}
              style={{ fontSize: '0.75rem' }}
            >
              {smtpConfigured ? 'Configured & Active' : 'Configuration Required'}
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.45 }}>
            {smtpConfigured
              ? 'SMTP credentials are fully detected in backend environment variables. One-time verification codes are dispatched via this service.'
              : 'Password recovery email delivery requires SMTP environment variables to be defined on the server.'}
          </p>
        </div>

        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
            Required Environment Variables for Email Delivery:
          </div>
          <ul style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
            <li><code>SMTP_SERVER</code> (e.g. <code>smtp.gmail.com</code> or <code>smtp.sendgrid.net</code>)</li>
            <li><code>SMTP_PORT</code> (e.g. <code>587</code> or <code>465</code>)</li>
            <li><code>SMTP_USERNAME</code> (Your email server username or address)</li>
            <li><code>SMTP_PASSWORD</code> (App password or secret key)</li>
            <li><code>SMTP_FROM_EMAIL</code> (e.g. <code>noreply@dermatwin.app</code>)</li>
          </ul>
        </div>
      </div>

      {/* Privacy & Data Management */}
      <div className="card" style={{ border: '1px solid var(--peach-border)' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
          Privacy Controls
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.45 }}>
          Your data is private to your authenticated account. Photos are analyzed in traditional computer vision and face photos are not stored permanently.
        </p>

        {!confirmPurge ? (
          <button
            onClick={() => setConfirmPurge(true)}
            className="btn btn-peach-outline btn-sm"
            style={{ gap: '0.4rem' }}
          >
            <Trash2 size={14} />
            <span>Clear My Assessment History</span>
          </button>
        ) : (
          <div style={{ padding: '0.85rem', backgroundColor: '#FFF8F6', borderRadius: '10px', border: '1px solid #F7D5C5' }}>
            <p style={{ fontSize: '0.8125rem', color: '#B55835', fontWeight: 600, marginBottom: '0.75rem' }}>
              Are you sure? This will delete all your past skin checks and routine task logs.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handlePurgeData} className="btn btn-peach btn-sm">
                Yes, Clear My History
              </button>
              <button onClick={() => setConfirmPurge(false)} className="btn btn-outline btn-sm">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
