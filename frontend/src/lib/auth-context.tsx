'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from './api';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  street_address: string | null;
  address_line_2: string | null;
  city: string | null;
  province: string | null;
  knows_shariah_insurance: string | null;
  insurance_experience: string | null;
  expectation: string | null;
  profile_picture: string | null;
  email_verified_at: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setLoading(false);
      return;
    }
    try {
      const userData = await authApi.getUser(storedToken) as User;
      setUser(userData);
      setToken(storedToken);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password }) as { user: User & { profile_picture_url?: string }; token: string };
    localStorage.setItem('token', res.token);
    setToken(res.token);
    // Normalize: login returns profile_picture_url (full URL) via $appends,
    // but user() endpoint returns it as profile_picture
    const userData = {
      ...res.user,
      profile_picture: res.user.profile_picture_url || res.user.profile_picture,
    };
    setUser(userData);
    router.push('/dashboard');
  };

  const logout = async () => {
    if (token) {
      try { await authApi.logout(token); } catch { /* ignore */ }
    }
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
