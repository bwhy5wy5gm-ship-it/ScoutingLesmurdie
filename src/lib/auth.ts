import { Settings, DEFAULT_SETTINGS } from "./types";
import { supabase } from "./supabase-browser";

export interface Account {
  id: string;
  username: string;
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

function usernameToEmail(username: string): string {
  return `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@warpscout.app`;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  return {
    accountId: session.user.id,
    username: session.user.user_metadata?.username ?? "",
    loginAt: session.user.created_at,
  };
}

export async function getCurrentAccount(): Promise<Account | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    username: data.username,
    profilePicture: data.profile_picture ?? "",
    driveTeamRole: data.drive_team_role ?? "",
    bio: data.bio ?? "",
    securityQuestion: data.security_question ?? "",
    securityAnswer: data.security_answer ?? "",
    createdAt: data.created_at,
    settings: data.settings ?? DEFAULT_SETTINGS,
  };
}

export async function isLoggedIn(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
}

export async function createAccount(
  username: string,
  password: string,
  securityQuestion: string,
  securityAnswer: string
): Promise<{ success: boolean; error?: string }> {
  if (username.length < 2) return { success: false, error: "Username must be at least 2 characters" };
  if (password.length < 4) return { success: false, error: "Password must be at least 4 characters" };
  if (!securityQuestion.trim()) return { success: false, error: "Security question is required" };
  if (!securityAnswer.trim()) return { success: false, error: "Security answer is required" };

  const email = usernameToEmail(username);

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (existingProfile) {
    return { success: false, error: "Username already exists" };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.user && !data.session) {
    return { success: false, error: "Registration succeeded but email confirmation is required. Please disable email confirmation in Supabase Dashboard → Authentication → Providers → Email." };
  }

  if (data.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        username,
        profile_picture: "",
        drive_team_role: "",
        bio: "",
        security_question: securityQuestion.trim(),
        security_answer: securityAnswer.trim().toLowerCase(),
        settings: { ...DEFAULT_SETTINGS, scoutName: username },
      });

    if (profileError) {
      return { success: false, error: "Failed to create profile" };
    }
  }

  return { success: true };
}

export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const email = usernameToEmail(username);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: "Invalid username or password" };
  }

  return { success: true };
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function updateAccount(
  updates: Partial<Omit<Account, "id" | "createdAt">>
): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.username !== undefined) dbUpdates.username = updates.username;
  if (updates.profilePicture !== undefined) dbUpdates.profile_picture = updates.profilePicture;
  if (updates.driveTeamRole !== undefined) dbUpdates.drive_team_role = updates.driveTeamRole;
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
  if (updates.settings !== undefined) dbUpdates.settings = updates.settings;

  const { error } = await supabase
    .from("profiles")
    .update(dbUpdates)
    .eq("id", session.user.id);

  return !error;
}

export async function updateAccountSettings(
  settings: Partial<Settings>
): Promise<boolean> {
  const account = await getCurrentAccount();
  if (!account) return false;
  return updateAccount({ settings: { ...account.settings, ...settings } });
}

export async function getAccountSettings(): Promise<Settings> {
  const account = await getCurrentAccount();
  return account?.settings ?? DEFAULT_SETTINGS;
}

export async function deleteAccount(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const account = await getCurrentAccount();
  if (!account) return false;

  await replaceDeletedUser(account.username);

  await supabase.from("profiles").delete().eq("id", session.user.id);

  await supabase.auth.admin.deleteUser(session.user.id);

  return true;
}

async function replaceDeletedUser(username: string): Promise<void> {
  const { data: teams } = await supabase.from("teams").select("id");
  if (!teams) return;

  for (const team of teams) {
    const { data: matches } = await supabase
      .from("matches")
      .select("id, scout_name")
      .eq("team_id", team.id)
      .eq("scout_name", username);

    if (matches) {
      for (const match of matches) {
        await supabase
          .from("matches")
          .update({ scout_name: "Deleted User" })
          .eq("id", match.id);
      }
    }
  }
}

export async function getSecurityQuestion(
  username: string
): Promise<{ success: boolean; question?: string; error?: string }> {
  const { data } = await supabase
    .from("profiles")
    .select("security_question")
    .eq("username", username)
    .single();

  if (!data) return { success: false, error: "Account not found" };
  return { success: true, question: data.security_question };
}

export async function resetPassword(
  username: string,
  securityAnswer: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, security_answer")
    .eq("username", username)
    .single();

  if (!profile) return { success: false, error: "Account not found" };
  if (profile.security_answer !== securityAnswer.trim().toLowerCase()) {
    return { success: false, error: "Incorrect answer" };
  }
  if (newPassword.length < 4) {
    return { success: false, error: "Password must be at least 4 characters" };
  }

  const { error } = await supabase.auth.admin.updateUserById(
    profile.id,
    { password: newPassword }
  );

  if (error) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user.id === profile.id) {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) return { success: false, error: updateError.message };
    } else {
      return { success: false, error: "Cannot reset password for other users" };
    }
  }

  return { success: true };
}

export async function getAllScoutStats(): Promise<{
  username: string;
  accountId: string;
  teamsScouted: number;
  formsCompleted: number;
  accuracy: number;
  consistency: number;
}[]> {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username");

  if (!profiles) return [];

  const { data: allMatches } = await supabase
    .from("matches")
    .select("team_id, warp_score, scout_name");

  const { data: allTeams } = await supabase
    .from("teams")
    .select("id, pre_comp");

  return profiles.map((profile) => {
    const myMatches = (allMatches ?? []).filter(
      (m) => m.scout_name?.toLowerCase().trim() === profile.username.toLowerCase().trim()
    );
    const matchCount = myMatches.length;
    const matchTeamIds = new Set(myMatches.map((m) => m.team_id));

    const myPreCompTeams = (allTeams ?? []).filter((t) => {
      const pc = t.pre_comp as Record<string, unknown> | null;
      if (!pc || typeof pc !== "object") return false;
      const sc = typeof pc.scoutName === "string" ? pc.scoutName : "";
      return sc.toLowerCase().trim() === profile.username.toLowerCase().trim();
    });
    const preCompTeamIds = new Set(myPreCompTeams.map((t) => t.id));

    const allScoutedTeamIds = new Set([...matchTeamIds, ...preCompTeamIds]);
    const formsCompleted = matchCount + myPreCompTeams.length;

    let accuracy = 50;
    let consistency = 50;
    if (myMatches.length > 0) {
      const avg = myMatches.reduce((a, m) => a + m.warp_score, 0) / myMatches.length;
      const variance =
        myMatches.reduce((a, m) => a + Math.pow(m.warp_score - avg, 2), 0) /
        myMatches.length;
      consistency = Math.max(0, 100 - Math.round(Math.sqrt(variance) * 10));
      accuracy = Math.min(100, 50 + Math.round(formsCompleted * 3));
    } else if (myPreCompTeams.length > 0) {
      accuracy = Math.min(100, 50 + Math.round(myPreCompTeams.length * 5));
    }

    return {
      username: profile.username,
      accountId: profile.id,
      teamsScouted: allScoutedTeamIds.size,
      formsCompleted,
      accuracy,
      consistency,
    };
  });
}
