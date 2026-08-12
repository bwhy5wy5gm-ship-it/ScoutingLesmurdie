const TBA_BASE = "https://www.thebluealliance.com/api/v3";
const TBA_KEY = process.env.NEXT_PUBLIC_TBA_AUTH_KEY ?? "";

const headers = { "X-TBA-Auth-Key": TBA_KEY };

async function tbaFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${TBA_BASE}${path}`, { headers });
    if (!res.ok) {
      console.error("TBA fetch failed:", res.status, path);
      return null;
    }
    return res.json();
  } catch (e) {
    console.error("TBA fetch error:", e);
    return null;
  }
}

export interface TBATeam {
  key: string;
  team_number: number;
  nickname: string;
  name: string;
  city: string;
  state_prov: string;
  country: string;
  rookie_year: number;
  motto: string | null;
}

export interface TBAEvent {
  key: string;
  name: string;
  short_name: string;
  event_code: string;
  city: string;
  state_prov: string;
  country: string;
  start_date: string;
  end_date: string;
  year: number;
  event_type: number;
}

export interface TBAMatch {
  key: string;
  comp_level: string;
  match_number: number;
  set_number: number;
  year: number;
  time: number;
  actual_time: number;
  red: {
    team_keys: string[];
    score: number;
    rp: { teleop_rp: number; endgame_rp: number; ranking_point_played: boolean };
  };
  blue: {
    team_keys: string[];
    score: number;
    rp: { teleop_rp: number; endgame_rp: number; ranking_point_played: boolean };
  };
  winning_alliance: "red" | "blue" | "tie" | "";
}

export interface TBARanking {
  rankings: {
    team_key: string;
    rank: number;
    record: { wins: number; losses: number; ties: number };
    qual_points: number;
    sort_orders: number[];
  }[];
}

export interface TBATeamEventStatus {
  team_key: string;
  qual?: {
    ranking?: {
      rank: number;
      record: { wins: number; losses: number; ties: number };
      qual_points: number;
      sort_orders: number[];
    };
    num_matches: number;
  };
  alliance?: {
    name: string;
    number: number;
    pick: number;
  };
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export async function getTBATeams(page: number, year?: number): Promise<TBATeam[]> {
  const y = year ?? getCurrentYear();
  const data = await tbaFetch<TBATeam[]>(`/teams/${page}/${y}`);
  return data ?? [];
}

export async function getTBATeam(teamKey: string): Promise<TBATeam | null> {
  return tbaFetch<TBATeam>(`/team/${teamKey}`);
}

export async function getTBAEvents(year: number): Promise<TBAEvent[]> {
  const data = await tbaFetch<TBAEvent[]>(`/events/${year}`);
  return data ?? [];
}

export async function getTBAEventTeams(eventKey: string): Promise<TBATeam[]> {
  const data = await tbaFetch<TBATeam[]>(`/event/${eventKey}/teams`);
  return data ?? [];
}

export async function getTBAEventMatches(eventKey: string): Promise<TBAMatch[]> {
  const data = await tbaFetch<TBAMatch[]>(`/event/${eventKey}/matches`);
  return data ?? [];
}

export async function getTBAEventRankings(eventKey: string): Promise<TBARanking | null> {
  return tbaFetch<TBARanking>(`/event/${eventKey}/rankings`);
}

export async function getTBATeamEventStatus(
  teamKey: string,
  eventKey: string
): Promise<TBATeamEventStatus | null> {
  return tbaFetch<TBATeamEventStatus>(`/team/${teamKey}/event/${eventKey}/status`);
}

export function teamKeyFromNumber(num: number): string {
  return `frc${num}`;
}

export function teamNumberFromKey(key: string): number {
  return parseInt(key.replace("frc", ""), 10);
}

export function matchTime(iso: number): string {
  if (!iso) return "TBD";
  const d = new Date(iso * 1000);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
