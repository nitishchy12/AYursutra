import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, getAccessToken } from '../services/api';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        const data = getAccessToken() ? await authApi.me() : await authApi.refresh();
        if (active) setCurrentUser(data.user);
      } catch {
        if (active) setCurrentUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    restoreSession();
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    currentUser,
    userData: currentUser,
    loading,
    async login(email, password) {
      const data = await authApi.login({ email, password });
      setCurrentUser(data.user);
      return data;
    },
    async register(name, email, password, role = 'patient', extra = {}) {
      const data = await authApi.register({ name, email, password, role, ...extra });
      setCurrentUser(data.user);
      return data;
    },
    async logout() {
      try {
        await authApi.logout();
      } finally {
        setCurrentUser(null);
      }
    },
    async refreshUserData() {
      const data = await authApi.me();
      setCurrentUser(data.user);
      return data.user;
    },
  }), [currentUser, loading]);

  if (loading) return <div className="page container">Loading AyurSutra...</div>;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
