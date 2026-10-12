import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  User,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  AtSign,
  KeyRound,
  ArrowLeft,
  X
} from 'lucide-react';
import Logo from '../components/Logo';

export default function AuthPage({ onClose, onSuccess, initialMode = 'login' }) {
  // Mode: 'login', 'signup', 'forgot_email', 'forgot_code', 'forgot_success'
  const [mode, setMode] = useState(initialMode);

  // Form Fields
  const [identifier, setIdentifier] = useState(''); // username or email for login
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const resetFormState = () => {
    setError('');
    setInfoMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!identifier.trim()) {
      setError('Please enter your username or email address.');
      setLoading(false);
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      setLoading(false);
      return;
    }

    try {
      await login(identifier.trim(), password);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Invalid username/email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!fullName.trim()) {
      setError('Full name is required.');
      setLoading(false);
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      setLoading(false);
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError('Username can only contain letters, numbers, and underscores.');
      setLoading(false);
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      await register({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
        confirm_password: confirmPassword
      });
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.auth.forgotPassword(email.trim().toLowerCase());
      if (res.smtp_configured === false) {
        // Clear message explaining that SMTP must be configured
        setInfoMessage(res.message);
      } else {
        setInfoMessage(res.message || 'If this email is registered, a 6-digit verification code has been sent.');
      }
      setMode('forgot_code');
    } catch (err) {
      setError(err.message || 'Failed to request password reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!resetCode.trim() || resetCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('New password must be at least 6 characters.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.auth.resetPassword({
        email: email.trim().toLowerCase(),
        reset_code: resetCode.trim(),
        new_password: password,
        confirm_password: confirmPassword
      });
      setInfoMessage(res.message || 'Your password has been reset successfully.');
      setMode('forgot_success');
    } catch (err) {
      setError(err.message || 'Password reset failed. Please verify your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20, 36, 27, 0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.25rem',
          backgroundColor: 'var(--bg-card, #FFFFFF)',
          borderRadius: '20px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.15)',
          position: 'relative'
        }}
      >
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #79877E)',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        )}

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Logo size="lg" />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-heading, #14241B)' }}>
            {mode === 'login' && 'Sign In to Your Account'}
            {mode === 'signup' && 'Create Your Account'}
            {(mode === 'forgot_email' || mode === 'forgot_code') && 'Password Recovery'}
            {mode === 'forgot_success' && 'Password Updated'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #536258)', marginTop: '0.25rem' }}>
            {mode === 'login' && 'Enter your username or email to access your skincare history.'}
            {mode === 'signup' && 'Register to save your skin checks and track your daily routine.'}
            {mode === 'forgot_email' && 'Enter your registered email address to receive a verification code.'}
            {mode === 'forgot_code' && 'Enter the 6-digit code sent to your email along with your new password.'}
            {mode === 'forgot_success' && 'Your password has been changed successfully. You can now log in.'}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              padding: '0.75rem 0.9rem',
              backgroundColor: '#FDF2EB',
              border: '1px solid #F7D5C5',
              borderRadius: '10px',
              color: '#B55835',
              fontSize: '0.8125rem',
              marginBottom: '1.25rem'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Info / Notice banner */}
        {infoMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              padding: '0.75rem 0.9rem',
              backgroundColor: 'var(--primary-subtle, #E8F5EE)',
              border: '1px solid var(--green-border, #C8E3D4)',
              borderRadius: '10px',
              color: 'var(--primary-deep, #1E4A37)',
              fontSize: '0.8125rem',
              marginBottom: '1.25rem'
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* ================= 1. LOGIN FORM ================= */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-identifier">
                Username or Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-identifier"
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. skin_user or name@example.com"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <User
                  size={16}
                  color="var(--text-muted, #79877E)"
                  style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="login-password" style={{ marginBottom: 0 }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    resetFormState();
                    setMode('forgot_email');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary, #2D6A4F)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative', marginTop: '0.35rem' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <Lock
                  size={16}
                  color="var(--text-muted, #79877E)"
                  style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted, #79877E)',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
            >
              {loading ? 'Signing In...' : 'Login'}
            </button>

            <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary, #536258)' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  resetFormState();
                  setMode('signup');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary, #2D6A4F)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Create an Account
              </button>
            </div>
          </form>
        )}

        {/* ================= 2. SIGN UP FORM ================= */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="signup-fullname">
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-fullname"
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <User
                  size={16}
                  color="var(--text-muted, #79877E)"
                  style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-username">
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alex_skincare"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <AtSign
                  size={16}
                  color="var(--text-muted, #79877E)"
                  style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Mail
                  size={16}
                  color="var(--text-muted, #79877E)"
                  style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">
                Password (min. 6 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <Lock
                  size={16}
                  color="var(--text-muted, #79877E)"
                  style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted, #79877E)',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-confirm-password">
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <Lock
                  size={16}
                  color="var(--text-muted, #79877E)"
                  style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  style={{
                    position: 'absolute',
                    right: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted, #79877E)',
                    padding: 0
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary, #536258)' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  resetFormState();
                  setMode('login');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary, #2D6A4F)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Log In
              </button>
            </div>
          </form>
        )}

        {/* ================= 3. FORGOT PASSWORD - ENTER EMAIL ================= */}
        {mode === 'forgot_email' && (
          <form onSubmit={handleRequestResetCode}>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">
                Registered Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Mail
                  size={16}
                  color="var(--text-muted, #79877E)"
                  style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
            >
              {loading ? 'Sending Request...' : 'Send Verification Code'}
            </button>

            <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  resetFormState();
                  setMode('login');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary, #2D6A4F)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to Login</span>
              </button>
            </div>
          </form>
        )}

        {/* ================= 4. FORGOT PASSWORD - ENTER CODE & NEW PASSWORD ================= */}
        {mode === 'forgot_code' && (
          <form onSubmit={handleConfirmResetPassword}>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-code">
                6-Digit Verification Code
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reset-code"
                  type="text"
                  maxLength={6}
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="form-input"
                  style={{
                    paddingLeft: '2.5rem',
                    letterSpacing: '0.2em',
                    fontSize: '1.1rem',
                    fontWeight: 700
                  }}
                />
                <KeyRound
                  size={16}
                  color="var(--text-muted, #79877E)"
                  style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #79877E)', marginTop: '2px' }}>
                Valid for 10 minutes from request.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-new-password">
                New Password (min. 6 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <Lock
                  size={16}
                  color="var(--text-muted, #79877E)"
                  style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted, #79877E)',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-confirm-password">
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <Lock
                  size={16}
                  color="var(--text-muted, #79877E)"
                  style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  style={{
                    position: 'absolute',
                    right: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted, #79877E)',
                    padding: 0
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
            >
              {loading ? 'Updating Password...' : 'Set New Password'}
            </button>

            <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  resetFormState();
                  setMode('login');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary, #2D6A4F)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to Login</span>
              </button>
            </div>
          </form>
        )}

        {/* ================= 5. SUCCESS CONFIRMATION ================= */}
        {mode === 'forgot_success' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: 'var(--primary-subtle, #E8F5EE)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <CheckCircle2 size={32} color="var(--primary, #2D6A4F)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-heading, #14241B)', marginBottom: '0.5rem' }}>
              Password Reset Complete
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #536258)', marginBottom: '1.5rem' }}>
              Your account password has been updated. All previous sessions have been logged out for security.
            </p>
            <button
              onClick={() => {
                resetFormState();
                setMode('login');
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
            >
              <span>Return to Login</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
