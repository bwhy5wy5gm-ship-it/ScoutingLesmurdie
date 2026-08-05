import { Settings, DEFAULT_SETTINGS } from "./types";
import { getTeams, replaceScoutName } from "./store";

const ACCOUNTS_KEY = "frc-scout-accounts";
const SESSION_KEY = "frc-scout-session";

export interface Account {
  id: string;
  username: string;
  passwordHash: string;
  profilePicture: string;
  driveTeamRole: string;
  bio: string;
  securityQuestion: string;
  securityAnswer: string;
  createdAt: string;
  settings: Settings;
}

export interface Session {
  accountId: string;
  username: string;
  loginAt: string;
}

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return "h_" + Math.abs(hash).toString(36) + "_" + password.length;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function getAccounts(): Account[] {
  return getFromStorage<Account[]>(ACCOUNTS_KEY, []);
}

function saveAccounts(accounts: Account[]): void {
  setToStorage(ACCOUNTS_KEY, accounts);
}

export function getCurrentSession(): Session | null {
  return getFromStorage<Session | null>(SESSION_KEY, null);
}

export function getCurrentAccount(): Account | null {
  const session = getCurrentSession();
  if (!session) return null;
  return getAccounts().find((a) => a.id === session.accountId) ?? null;
}

export function isLoggedIn(): boolean {
  return getCurrentSession() !== null;
}

export function createAccount(
  username: string,
  password: string,
  securityQuestion: string,
  securityAnswer: string
): { success: boolean; error?: string } {
  const accounts = getAccounts();
  if (accounts.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, error: "Username already exists" };
  }
  if (username.length < 2) return { success: false, error: "Username must be at least 2 characters" };
  if (password.length < 4) return { success: false, error: "Password must be at least 4 characters" };
  if (!securityQuestion.trim()) return { success: false, error: "Security question is required" };
  if (!securityAnswer.trim()) return { success: false, error: "Security answer is required" };

  const account: Account = {
    id: generateId(),
    username,
    passwordHash: hashPassword(password),
    profilePicture: "",
    driveTeamRole: "",
    bio: "",
    securityQuestion: securityQuestion.trim(),
    securityAnswer: securityAnswer.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
    settings: { ...DEFAULT_SETTINGS, scoutName: username },
  };

  accounts.push(account);
  saveAccounts(accounts);

  const session: Session = { accountId: account.id, username, loginAt: new Date().toISOString() };
  setToStorage(SESSION_KEY, session);

  return { success: true };
}

export function login(username: string, password: string): { success: boolean; error?: string } {
  const accounts = getAccounts();
  const account = accounts.find((a) => a.username.toLowerCase() === username.toLowerCase());
  if (!account) return { success: false, error: "Account not found" };
  if (account.passwordHash !== hashPassword(password)) return { success: false, error: "Incorrect password" };

  const session: Session = { accountId: account.id, username: account.username, loginAt: new Date().toISOString() };
  setToStorage(SESSION_KEY, session);
  return { success: true };
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function updateAccount(updates: Partial<Omit<Account, "id" | "createdAt">>): boolean {
  const session = getCurrentSession();
  if (!session) return false;
  const accounts = getAccounts();
  const idx = accounts.findIndex((a) => a.id === session.accountId);
  if (idx === -1) return false;
  accounts[idx] = { ...accounts[idx], ...updates };
  saveAccounts(accounts);
  if (updates.username) {
    session.username = updates.username;
    setToStorage(SESSION_KEY, session);
  }
  return true;
}

export function updateAccountSettings(settings: Partial<Settings>): boolean {
  const account = getCurrentAccount();
  if (!account) return false;
  return updateAccount({ settings: { ...account.settings, ...settings } });
}

export function getAccountSettings(): Settings {
  const account = getCurrentAccount();
  return account?.settings ?? DEFAULT_SETTINGS;
}

export function deleteAccount(): boolean {
  const session = getCurrentSession();
  if (!session) return false;
  const accounts = getAccounts();
  const account = accounts.find((a) => a.id === session.accountId);
  if (!account) return false;

  replaceDeletedUser(account.username);
  const updated = accounts.filter((a) => a.id !== session.accountId);
  saveAccounts(updated);
  localStorage.removeItem(SESSION_KEY);
  return true;
}

function replaceDeletedUser(username: string): void {
  replaceScoutName(username, "Deleted User");
}

export function getSecurityQuestion(username: string): { success: boolean; question?: string; error?: string } {
  const accounts = getAccounts();
  const account = accounts.find((a) => a.username.toLowerCase() === username.toLowerCase());
  if (!account) return { success: false, error: "Account not found" };
  return { success: true, question: account.securityQuestion };
}

export function resetPassword(username: string, securityAnswer: string, newPassword: string): { success: boolean; error?: string } {
  const accounts = getAccounts();
  const idx = accounts.findIndex((a) => a.username.toLowerCase() === username.toLowerCase());
  if (idx === -1) return { success: false, error: "Account not found" };
  if (accounts[idx].securityAnswer !== securityAnswer.trim().toLowerCase()) {
    return { success: false, error: "Incorrect answer" };
  }
  if (newPassword.length < 4) return { success: false, error: "Password must be at least 4 characters" };
  accounts[idx].passwordHash = hashPassword(newPassword);
  saveAccounts(accounts);
  return { success: true };
}

export function getAllScoutStats(): {
  username: string;
  accountId: string;
  teamsScouted: number;
  formsCompleted: number;
  accuracy: number;
  consistency: number;
}[] {
  const accounts = getAccounts();
  const teams = getTeams();

  return accounts.map((account) => {
    let formsCompleted = 0;
    const teamNumbers = new Set<number>();

    for (const team of teams) {
      for (const match of team.matches ?? []) {
        if (match.scoutName === account.username) {
          formsCompleted++;
          teamNumbers.add(team.number);
        }
      }
    }

    const scoutMatches = (teams.flatMap((t: { matches: Array<{ scoutName: string; warpScore: number }> }) => t.matches ?? [])).filter(
      (m: { scoutName: string }) => m.scoutName === account.username
    );

    let accuracy = 50;
    let consistency = 50;
    if (scoutMatches.length > 0) {
      const avg = scoutMatches.reduce((a: number, m: { warpScore: number }) => a + m.warpScore, 0) / scoutMatches.length;
      const variance = scoutMatches.reduce((a: number, m: { warpScore: number }) => a + Math.pow(m.warpScore - avg, 2), 0) / scoutMatches.length;
      consistency = Math.max(0, 100 - Math.round(Math.sqrt(variance) * 10));
      accuracy = Math.min(100, 50 + Math.round(scoutMatches.length * 3));
    }

    return {
      username: account.username,
      accountId: account.id,
      teamsScouted: teamNumbers.size,
      formsCompleted,
      accuracy,
      consistency,
    };
  });
}
