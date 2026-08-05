"use client";

import { createContext, useContext, useState, useCallback } from "react";
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

interface AuthContextType {
  session: Session | null;
  account: Account | null;
  settings: Settings;
  isLoading: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  register: (username: string, password: string, securityQuestion: string, securityAnswer: string) => { success: boolean; error?: string };
  logout: () => void;
  refreshAccount: () => void;
  updateSettings: (s: Partial<Settings>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getInitialState() {
  if (typeof window === "undefined") return { session: null, account: null, settings: DEFAULT_SETTINGS };
  const s = getCurrentSession();
  const a = getCurrentAccount();
  return { session: s, account: a, settings: a?.settings ?? DEFAULT_SETTINGS };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(getInitialState);

  const refreshAccount = useCallback(() => {
    const s = getCurrentSession();
    const a = getCurrentAccount();
    setState({ session: s, account: a, settings: a?.settings ?? DEFAULT_SETTINGS });
  }, []);

  const login = useCallback((username: string, password: string) => {
    const result = authLogin(username, password);
    if (result.success) refreshAccount();
    return result;
  }, [refreshAccount]);

  const register = useCallback((username: string, password: string, securityQuestion: string, securityAnswer: string) => {
    const result = authCreate(username, password, securityQuestion, securityAnswer);
    if (result.success) refreshAccount();
    return result;
  }, [refreshAccount]);

  const logout = useCallback(() => {
    authLogout();
    setState({ session: null, account: null, settings: DEFAULT_SETTINGS });
  }, []);

  const updateSettings = useCallback((s: Partial<Settings>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...s } }));
    updateAccountSettings(s);
  }, []);

  return (
    <AuthContext.Provider value={{
      session: state.session,
      account: state.account,
      settings: state.settings,
      isLoading: false,
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
