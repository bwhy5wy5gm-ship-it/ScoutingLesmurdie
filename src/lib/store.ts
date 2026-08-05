import {
  Team,
  Settings,
  MatchData,
  PerformanceOpinion,
  UnitRole,
  StabilityIndex,
  SynergyLevel,
  AllianceSynergy,
  MatchPrediction,
  DEFAULT_SETTINGS,
} from "./types";

const TEAMS_KEY = "frc-scout-teams";
const SETTINGS_KEY = "frc-scout-settings";

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

export function getTeams(): Team[] {
  return getFromStorage<Team[]>(TEAMS_KEY, []);
}

export function saveTeams(teams: Team[]): void {
  setToStorage(TEAMS_KEY, teams);
}

export function getTeam(id: string): Team | undefined {
  return getTeams().find((t) => t.id === id);
}

export function getTeamByNumber(number: number): Team | undefined {
  return getTeams().find((t) => t.number === number);
}

export function addTeam(team: Team): void {
  const teams = getTeams();
  teams.push(team);
  saveTeams(teams);
}

export function updateTeam(updated: Team): void {
  const teams = getTeams().map((t) => (t.id === updated.id ? updated : t));
  saveTeams(teams);
}

export function deleteTeam(id: string): void {
  const teams = getTeams().filter((t) => t.id !== id);
  saveTeams(teams);
}

export function addMatchToTeam(teamId: string, match: MatchData): void {
  const team = getTeam(teamId);
  if (!team) return;
  team.matches = [...(team.matches ?? []), match];
  updateTeam(team);
}

export function getSettings(): Settings {
  return getFromStorage<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
}

export function saveSettings(settings: Settings): void {
  setToStorage(SETTINGS_KEY, settings);
}

function opinionToScore(opinion: PerformanceOpinion): number {
  switch (opinion) {
    case "Excellent": return 10;
    case "Good": return 7.5;
    case "Average": return 5;
    case "Poor": return 2.5;
    case "Very Poor": return 0;
  }
}

export function calculateWarpScore(match: {
  autoScore: number;
  teleopScore: number;
  endgameScore: number;
  cycleEfficiency: number;
  reliabilityRating: number;
  performanceOpinion: PerformanceOpinion;
}): number {
  const sliderAvg =
    (match.autoScore + match.teleopScore + match.endgameScore + match.cycleEfficiency + match.reliabilityRating) / 5;
  const opinionScore = opinionToScore(match.performanceOpinion);
  return Math.round(((sliderAvg * 0.7 + opinionScore * 0.3) * 10) / 10);
}

export function calculatePreCompWarpScore(data: {
  predictedAuto: number;
  predictedTeleop: number;
  predictedEndgame: number;
  predictedReliability: number;
  performanceOpinion: PerformanceOpinion;
}): number {
  const sliderAvg =
    (data.predictedAuto + data.predictedTeleop + data.predictedEndgame + data.predictedReliability) / 4;
  const opinionScore = opinionToScore(data.performanceOpinion);
  return Math.round(((sliderAvg * 0.7 + opinionScore * 0.3) * 10) / 10);
}

export function calculateTeamStats(team: Team) {
  const matches = team.matches ?? [];
  const preComp = team.preComp;

  if (matches.length === 0) {
    return {
      avgAuto: preComp?.predictedAuto ?? 0,
      avgTeleop: preComp?.predictedTeleop ?? 0,
      avgEndgame: preComp?.predictedEndgame ?? 0,
      avgCycleEfficiency: 0,
      avgReliability: preComp?.predictedReliability ?? 0,
      avgWarpScore: preComp ? calculatePreCompWarpScore(preComp) : 0,
      totalMatches: 0,
      overallRating: 0,
    };
  }

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const avgAuto = avg(matches.map((m) => m.autoScore));
  const avgTeleop = avg(matches.map((m) => m.teleopScore));
  const avgEndgame = avg(matches.map((m) => m.endgameScore));
  const avgCycleEfficiency = avg(matches.map((m) => m.cycleEfficiency));
  const avgReliability = avg(matches.map((m) => m.reliabilityRating));
  const avgWarpScore = avg(matches.map((m) => m.warpScore));

  const overallRating = Math.round(
    (avgAuto + avgTeleop + avgEndgame + avgReliability + avgWarpScore) / 5
  );

  return {
    avgAuto: Math.round(avgAuto * 10) / 10,
    avgTeleop: Math.round(avgTeleop * 10) / 10,
    avgEndgame: Math.round(avgEndgame * 10) / 10,
    avgCycleEfficiency: Math.round(avgCycleEfficiency * 10) / 10,
    avgReliability: Math.round(avgReliability * 10) / 10,
    avgWarpScore: Math.round(avgWarpScore * 10) / 10,
    totalMatches: matches.length,
    overallRating,
  };
}

// ── Role Recommendation Engine ──
export function recommendRole(stats: {
  avgAuto: number;
  avgTeleop: number;
  avgEndgame: number;
  avgReliability: number;
  avgCycleEfficiency: number;
  avgWarpScore: number;
}): UnitRole {
  const { avgAuto, avgTeleop, avgEndgame, avgReliability, avgCycleEfficiency, avgWarpScore } = stats;
  if (avgEndgame >= 8 && avgWarpScore >= 7) return "Endgame Specialist";
  if (avgCycleEfficiency >= 8 && avgTeleop >= 7) return "Cycle Runner";
  if (avgReliability <= 4 && avgAuto >= 6) return "Defense";
  if (avgWarpScore >= 6) return "Offense";
  if (avgAuto >= 7) return "Offense";
  return "Defense";
}

// ── Stability Index ──
export function calculateStability(team: Team): StabilityIndex {
  const matches = team.matches ?? [];
  if (matches.length < 2) return "Semi-Stable";

  const breakdownPhotos = matches.flatMap((m) => (m.trialPhotos ?? []).filter((p) => p.photoType === "breakdown")).length;
  const malfunctionCount = matches.filter((m) => m.conditionalMalfunctioned).length;
  const lowScoreMatches = matches.filter((m) => m.warpScore < 4).length;
  const reliabilityDrops = matches.filter((m) => m.reliabilityRating < 4).length;

  const issues = breakdownPhotos + malfunctionCount + lowScoreMatches + reliabilityDrops;
  const ratio = issues / matches.length;

  if (ratio >= 0.4 || malfunctionCount >= 3) return "Unstable";
  if (ratio >= 0.15 || malfunctionCount >= 1) return "Semi-Stable";
  return "Stable";
}

// ── Alliance Synergy Score ──
export function calculateAllianceSynergy(teamNumbers: number[]): AllianceSynergy {
  const teams = teamNumbers.map((n) => getTeamByNumber(n)).filter(Boolean) as Team[];
  if (teams.length < 2) {
    return { teamNumbers, score: 0, level: "Low", autoSynergy: 0, teleopSynergy: 0, endgameSynergy: 0, driveCompatibility: false };
  }

  const stats = teams.map((t) => calculateTeamStats(t));
  const avgAuto = stats.reduce((a, s) => a + s.avgAuto, 0) / stats.length;
  const avgTeleop = stats.reduce((a, s) => a + s.avgTeleop, 0) / stats.length;
  const avgEndgame = stats.reduce((a, s) => a + s.avgEndgame, 0) / stats.length;
  const avgReliability = stats.reduce((a, s) => a + s.avgReliability, 0) / stats.length;
  const avgWarp = stats.reduce((a, s) => a + s.avgWarpScore, 0) / stats.length;

  const driveSystems = teams.map((t) => t.preComp?.driveSystem ?? t.matches?.[0]?.driveSystem ?? "other");
  const driveCompatibility = new Set(driveSystems).size <= 2;

  const autoSynergy = Math.round(avgAuto * 10) / 10;
  const teleopSynergy = Math.round(avgTeleop * 10) / 10;
  const endgameSynergy = Math.round(avgEndgame * 10) / 10;

  const score = Math.round(((avgAuto * 0.2 + avgTeleop * 0.25 + avgEndgame * 0.2 + avgReliability * 0.15 + avgWarp * 0.2) * (driveCompatibility ? 1.1 : 0.9)) * 10) / 10;

  let level: SynergyLevel = "Low";
  if (score >= 7) level = "High";
  else if (score >= 4.5) level = "Medium";

  return { teamNumbers, score, level, autoSynergy, teleopSynergy, endgameSynergy, driveCompatibility };
}

// ── Match Outcome Predictor ──
export function predictMatchOutcome(
  alliance1Numbers: number[],
  alliance2Numbers: number[]
): MatchPrediction {
  const getAvgWarp = (nums: number[]) => {
    const teams = nums.map((n) => getTeamByNumber(n)).filter(Boolean) as Team[];
    if (teams.length === 0) return 5;
    const stats = teams.map((t) => calculateTeamStats(t));
    return stats.reduce((a, s) => a + s.avgWarpScore, 0) / stats.length;
  };

  const warp1 = getAvgWarp(alliance1Numbers);
  const warp2 = getAvgWarp(alliance2Numbers);
  const total = warp1 + warp2 || 1;

  const alliance1WinPct = Math.round((warp1 / total) * 100);
  const alliance2WinPct = 100 - alliance1WinPct;

  const estimatedScore = (warp: number) => Math.round(warp * 12 + 20);
  const predictedScoreRange = {
    min: Math.min(estimatedScore(warp1), estimatedScore(warp2)) - 10,
    max: Math.max(estimatedScore(warp1), estimatedScore(warp2)) + 10,
  };

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (warp1 > warp2 + 1) strengths.push("Alliance 1 has higher average WARP Score");
  else if (warp2 > warp1 + 1) strengths.push("Alliance 2 has higher average WARP Score");
  if (warp1 < 4) weaknesses.push("Alliance 1 has low overall ratings");
  if (warp2 < 4) weaknesses.push("Alliance 2 has low overall ratings");

  return {
    alliance1: { teamNumbers: alliance1Numbers, warpScore: Math.round(warp1 * 10) / 10 },
    alliance2: { teamNumbers: alliance2Numbers, warpScore: Math.round(warp2 * 10) / 10 },
    alliance1WinPct,
    alliance2WinPct,
    predictedScoreRange,
    strengths,
    weaknesses,
  };
}

// ── Heat Map Data ──
export interface HeatMapEntry {
  teamNumber: number;
  teamName: string;
  trend: "improving" | "stable" | "declining";
  warpDelta: number;
  reliabilityDelta: number;
}

export function getHeatMapData(): HeatMapEntry[] {
  const teams = getTeams();
  return teams
    .filter((t) => (t.matches ?? []).length >= 2)
    .map((team) => {
      const matches = [...(team.matches ?? [])].sort((a, b) => a.matchNumber - b.matchNumber);
      const mid = Math.floor(matches.length / 2);
      const firstHalf = matches.slice(0, mid);
      const secondHalf = matches.slice(mid);

      const avgWarp = (ms: MatchData[]) => ms.length ? ms.reduce((a, m) => a + m.warpScore, 0) / ms.length : 0;
      const avgRel = (ms: MatchData[]) => ms.length ? ms.reduce((a, m) => a + m.reliabilityRating, 0) / ms.length : 0;

      const warpDelta = Math.round((avgWarp(secondHalf) - avgWarp(firstHalf)) * 10) / 10;
      const reliabilityDelta = Math.round((avgRel(secondHalf) - avgRel(firstHalf)) * 10) / 10;

      let trend: "improving" | "stable" | "declining" = "stable";
      if (warpDelta > 0.5) trend = "improving";
      else if (warpDelta < -0.5) trend = "declining";

      return { teamNumber: team.number, teamName: team.name, trend, warpDelta, reliabilityDelta };
    });
}

// ── Reliability Alert ──
export function hasReliabilityDrop(team: Team): { alert: boolean; message: string } {
  const matches = team.matches ?? [];
  if (matches.length < 3) return { alert: false, message: "" };
  const sorted = [...matches].sort((a, b) => a.matchNumber - b.matchNumber);
  const last2 = sorted.slice(-2);
  const prev = sorted.slice(0, -2);
  const last2Avg = last2.reduce((a, m) => a + m.reliabilityRating, 0) / last2.length;
  const prevAvg = prev.length ? prev.reduce((a, m) => a + m.reliabilityRating, 0) / prev.length : last2Avg;
  if (last2Avg < prevAvg - 1) {
    return { alert: true, message: "This unit's reliability dropped in the last two matches." };
  }
  return { alert: false, message: "" };
}

// ── Recommended Alliances ──
export function getRecommendedAlliances(): AllianceSynergy[] {
  const teams = getTeams();
  if (teams.length < 3) return [];
  const topTeams = teams
    .map((t) => ({ team: t, stats: calculateTeamStats(t) }))
    .sort((a, b) => b.stats.avgWarpScore - a.stats.avgWarpScore)
    .slice(0, 10);

  const combos: AllianceSynergy[] = [];
  for (let i = 0; i < topTeams.length && combos.length < 5; i++) {
    for (let j = i + 1; j < topTeams.length && combos.length < 5; j++) {
      for (let k = j + 1; k < topTeams.length && combos.length < 5; k++) {
        const synergy = calculateAllianceSynergy([
          topTeams[i].team.number,
          topTeams[j].team.number,
          topTeams[k].team.number,
        ]);
        if (synergy.level === "High") combos.push(synergy);
      }
    }
  }
  if (combos.length === 0 && topTeams.length >= 2) {
    for (let i = 0; i < Math.min(topTeams.length, 5); i++) {
      for (let j = i + 1; j < Math.min(topTeams.length, 5); j++) {
        const synergy = calculateAllianceSynergy([topTeams[i].team.number, topTeams[j].team.number]);
        if (synergy.level !== "Low") combos.push(synergy);
      }
    }
  }
  return combos.slice(0, 5);
}

// ── Scout Accuracy ──
export function getScoutAccuracy(scoutName: string): { total: number; consistency: number } {
  const teams = getTeams();
  const allMatches: { scoutName: string; warpScore: number }[] = [];
  for (const team of teams) {
    for (const m of team.matches ?? []) {
      allMatches.push({ scoutName: m.scoutName, warpScore: m.warpScore });
    }
  }
  const scoutMatches = allMatches.filter((m) => m.scoutName === scoutName);
  if (scoutMatches.length === 0) return { total: 0, consistency: 0 };
  const avg = scoutMatches.reduce((a, b) => a + b.warpScore, 0) / scoutMatches.length;
  const variance =
    scoutMatches.reduce((a, b) => a + Math.pow(b.warpScore - avg, 2), 0) /
    scoutMatches.length;
  const consistency = Math.max(0, 100 - Math.round(Math.sqrt(variance) * 10));
  return { total: scoutMatches.length, consistency };
}

// ── Smart Photo Label Suggestion ──
export function suggestPhotoLabel(trialPhotos: { photoType: string }[]): string {
  const counts: Record<string, number> = {};
  for (const p of trialPhotos) {
    counts[p.photoType] = (counts[p.photoType] || 0) + 1;
  }
  const order: TrialPhotoType[] = ["trial-action", "auto-path", "breakdown", "general"];
  for (const t of order) {
    if (!counts[t]) return t;
  }
  return "general";
}

type TrialPhotoType = "trial-action" | "breakdown" | "auto-path" | "general";

export function replaceScoutName(oldName: string, newName: string): void {
  const teams = getTeams();
  for (const team of teams) {
    if (team.matches) {
      for (const match of team.matches) {
        if (match.scoutName === oldName) {
          match.scoutName = newName;
        }
      }
    }
  }
  saveTeams(teams);
}

export function exportData(): string {
  return JSON.stringify({ teams: getTeams(), settings: getSettings() }, null, 2);
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data.teams) saveTeams(data.teams);
    if (data.settings) saveSettings(data.settings);
    return true;
  } catch {
    return false;
  }
}

export function resetAllData(): void {
  localStorage.removeItem(TEAMS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}
