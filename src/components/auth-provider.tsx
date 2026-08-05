"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import {
  Account,
  Session,
  getCurrentSession,
  getCurrentAccount,
  login as authLogin,
  logout as authLogout,
  createAccount as authCreate,
  updateAccountSettings,
} from "@/lib/auth";
import { Settings, DEFAULT_SETTINGS } from "@/lib/types";
import { supabase } from "@/lib/supabase-browser";

interface AuthContextType {
  session: Session | null;
  account: Account | null;
  settings: Settings;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, securityQuestion: string, securityAnswer: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAccount: () => Promise<void>;
  updateSettings: (s: Partial<Settings>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const loadedRef = useRef(false);

  const loadSession = useCallback(async () => {
    const s = await getCurrentSession();
    setSession(s);
    if (s) {
      const a = await getCurrentAccount();
      setAccount(a);
      setSettings(a?.settings ?? DEFAULT_SETTINGS);
    } else {
      setAccount(null);
      setSettings(DEFAULT_SETTINGS);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const init = async () => {
      await loadSession();
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });

    init();

    return () => subscription.unsubscribe();
  }, [loadSession]);

  const login = useCallback(async (username: string, password: string) => {
    const result = await authLogin(username, password);
    if (result.success) await loadSession();
    return result;
  }, [loadSession]);

  const register = useCallback(async (username: string, password: string, securityQuestion: string, securityAnswer: string) => {
    const result = await authCreate(username, password, securityQuestion, securityAnswer);
    if (result.success) await loadSession();
    return result;
  }, [loadSession]);

  const logout = useCallback(async () => {
    await authLogout();
    setSession(null);
    setAccount(null);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const refreshAccount = useCallback(async () => {
    await loadSession();
  }, [loadSession]);

  const updateSettings = useCallback(async (s: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...s }));
    await updateAccountSettings(s);
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      account,
      settings,
      isLoading,
      login,
      register,
      logout,
      refreshAccount,
      updateSettings,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
