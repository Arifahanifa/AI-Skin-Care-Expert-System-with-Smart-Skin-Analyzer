import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dermatwin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('dermatwin_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthChange = () => {
      const savedUser = localStorage.getItem('dermatwin_user');
      const savedToken = localStorage.getItem('dermatwin_token');
      setUser(savedUser ? JSON.parse(savedUser) : null);
      setToken(savedToken);
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const res = await api.auth.getMe();
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('dermatwin_user', JSON.stringify(res.user));
          }
        } catch {
          setUser(null);
          setToken(null);
          localStorage.removeItem('dermatwin_token');
          localStorage.removeItem('dermatwin_user');
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, [token]);

  const login = async (identifier, password) => {
    const res = await api.auth.login({ username_or_email: identifier, password });
    if (res?.token) {
      localStorage.setItem('dermatwin_token', res.token);
      localStorage.setItem('dermatwin_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (payload) => {
    const res = await api.auth.register(payload);
    if (res?.token) {
      localStorage.setItem('dermatwin_token', res.token);
      localStorage.setItem('dermatwin_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('dermatwin_token');
      localStorage.removeItem('dermatwin_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
