import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApiError, AUTH_EXPIRED, storeToken, token } from './services/apiClient';
import { authApi } from './services/authApi';
import type { UserProfile } from './types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  useEffect(() => {
    let live = true;
    if (!token()) {setLoading(false); return;}
    authApi.me().then(identity => {
      if (live) setUser(identity as UserProfile);
    }).catch(error => {
      if (!live) return;
      if (error instanceof ApiError && error.status === 401) {storeToken(null); setUser(null);}
      else setSessionError(error instanceof Error ? error.message : 'Unable to verify session');
    }).finally(() => { if (live) setLoading(false); });
    return () => {live = false;};
  }, []);

  useEffect(() => {const expire = () => setUser(null); window.addEventListener(AUTH_EXPIRED, expire); return () => window.removeEventListener(AUTH_EXPIRED, expire);}, []);
  async function login(email: string, password: string) {
    try { const identity = await authApi.login(email, password); setUser(identity as UserProfile); return {error:null}; }
    catch (e) { return {error:{message: e instanceof Error ? e.message : 'Login unavailable'}}; }
  }
  async function logout() { try {await authApi.logout();} finally {setUser(null);} }
  if (sessionError) return <main className="p-8" role="alert">{sessionError}<button className="ml-4 underline" onClick={() => window.location.reload()}>Try again</button></main>;
  return <AuthContext.Provider value={{user,loading,login,logout,isAdmin:user?.role==='admin'}}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
