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
  PreCompData,
  TeamMatch,
  DEFAULT_SETTINGS,
} from "./types";
import { supabase } from "./supabase-browser";

export async function uploadImage(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("photos")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error("Upload error:", error.message);
    return null;
  }

  const { data } = supabase.storage.from("photos").getPublicUrl(path);
  return data?.publicUrl ?? null;
}

export async function getTeams(): Promise<Team[]> {
  const [teamsResult, matchesResult, photosResult, trialPhotosResult, precompPhotosResult] =
    await Promise.all([
      supabase.from("teams").select("*").order("number", { ascending: true }),
      supabase.from("matches").select("*").order("match_number", { ascending: true }),
      supabase.from("photos").select("*"),
      supabase.from("trial_photos").select("*"),
      supabase.from("precomp_photos").select("*"),
    ]);

  if (teamsResult.error) {
    console.error("Get teams error:", teamsResult.error.message);
    return [];
  }
  if (!teamsResult.data) return [];

  const allMatches = matchesResult.data ?? [];
  const allPhotos = photosResult.data ?? [];
  const allTrialPhotos = trialPhotosResult.data ?? [];
  const allPrecompPhotos = precompPhotosResult.data ?? [];

  return teamsResult.data.map((t) => {
    const teamMatches = allMatches.filter((m) => m.team_id === t.id);
    const teamPhotos = allPhotos.filter((p) => p.team_id === t.id);
    const teamTrialPhotos = allTrialPhotos.filter((tp) => tp.team_id === t.id);
    const teamPrecompPhotos = allPrecompPhotos.filter((pp) => pp.team_id === t.id);

    const matches: MatchData[] = teamMatches.map((m) => ({
      id: m.id,
      matchNumber: m.match_number,
      alliance: m.alliance as "red" | "blue",
      autoScore: m.auto_score,
      teleopScore: m.teleop_score,
      endgameScore: m.endgame_score,
      cycleEfficiency: m.cycle_efficiency,
      reliabilityRating: m.reliability_rating,
      performanceOpinion: m.performance_opinion as PerformanceOpinion,
      biggestStrength: m.biggest_strength,
      unitStruggledWith: m.unit_struggled_with,
      allianceConsideration: m.alliance_consideration as "Yes" | "No" | "Maybe",
      warpScore: m.warp_score,
      conditionalMalfunctioned: m.conditional_malfunctioned,
      conditionalAutoFailed: m.conditional_auto_failed,
      conditionalEndgameAttempted: m.conditional_endgame_attempted,
      driveSystem: m.drive_system as "swerve" | "tank" | "other",
      trialPhotos: teamTrialPhotos
        .filter((tp) => tp.match_id === m.id)
        .map((tp) => ({
          id: tp.id,
          url: tp.url,
          photoType: tp.photo_type as "trial-action" | "breakdown" | "auto-path" | "general",
          uploadedBy: tp.uploaded_by,
          uploadedAt: tp.uploaded_at,
          trialId: tp.trial_id,
          teamNumber: tp.team_number,
        })),
      scoutName: m.scout_name,
      timestamp: m.timestamp,
    }));

    return {
      id: t.id,
      number: t.number,
      name: t.name,
      notes: t.notes,
      installNotes: t.install_notes ?? "",
      driveType: t.drive_type ?? "other",
      photos: teamPhotos.map((p) => ({
        id: p.id,
        url: p.url,
        label: p.label,
        photoType: p.photo_type as "robot" | "intake" | "shooter" | "auto-path",
        teamNumber: p.team_number,
        uploadedBy: p.uploaded_by,
        uploadedAt: p.uploaded_at,
      })),
      preComp: {
        ...(t.pre_comp as PreCompData),
        preCompPhotos: teamPrecompPhotos.map((pp) => ({
          id: pp.id,
          url: pp.url,
          photoType: pp.photo_type as "unit-photo" | "system-closeup" | "sensor-layout" | "auto-path",
          teamNumber: pp.team_number,
          uploadedBy: pp.uploaded_by,
          uploadedAt: pp.uploaded_at,
        })),
      } as PreCompData,
      matches,
    };
  });
}

export async function saveTeams(): Promise<void> {
  // Teams are saved individually via addTeam/updateTeam
}

export async function getTeam(id: string): Promise<Team | undefined> {
  const teams = await getTeams();
  return teams.find((t) => t.id === id);
}

export async function getTeamByNumber(number: number): Promise<Team | undefined> {
  const teams = await getTeams();
  return teams.find((t) => t.number === number);
}

export async function addTeam(team: Team): Promise<{ error?: string }> {
  console.log("Adding team:", team.number, team.name);
  const { data, error } = await supabase
    .from("teams")
    .insert({
      number: team.number,
      name: team.name,
      notes: team.notes,
      install_notes: team.installNotes ?? "",
      drive_type: team.driveType ?? "other",
      pre_comp: team.preComp ?? {
        predictedAuto: 5,
        predictedTeleop: 5,
        predictedEndgame: 5,
        predictedReliability: 5,
        performanceOpinion: "Average",
        strongestSystem: "",
        mayStruggleWith: "",
        driveSystem: "swerve",
        notes: "",
        videoLinks: [],
        preCompPhotos: [],
      },
    });

  if (error) {
    console.error("Add team error:", error.message, error.details, error.hint);
    if (error.code === "23505") {
      return { error: "A team with that number already exists" };
    }
    return { error: error.message };
  }

  return {};
}

export async function updateTeam(updated: Team): Promise<void> {
  await supabase
    .from("teams")
    .update({
      name: updated.name,
      notes: updated.notes,
      install_notes: updated.installNotes ?? "",
      drive_type: updated.driveType ?? "other",
      pre_comp: updated.preComp,
    })
    .eq("id", updated.id);
}

export async function deleteTeam(id: string): Promise<void> {
  await supabase.from("teams").delete().eq("id", id);
}

export async function addMatchToTeam(teamId: string, match: MatchData): Promise<void> {
  const { data, error } = await supabase
    .from("matches")
    .insert({
      team_id: teamId,
      match_number: match.matchNumber,
      alliance: match.alliance,
      auto_score: match.autoScore,
      teleop_score: match.teleopScore,
      endgame_score: match.endgameScore,
      cycle_efficiency: match.cycleEfficiency,
      reliability_rating: match.reliabilityRating,
      performance_opinion: match.performanceOpinion,
      biggest_strength: match.biggestStrength,
      unit_struggled_with: match.unitStruggledWith,
      alliance_consideration: match.allianceConsideration,
      warp_score: match.warpScore,
      conditional_malfunctioned: match.conditionalMalfunctioned,
      conditional_auto_failed: match.conditionalAutoFailed,
      conditional_endgame_attempted: match.conditionalEndgameAttempted,
      drive_system: match.driveSystem,
      scout_name: match.scoutName,
      timestamp: match.timestamp,
    })
    .select()
    .single();

  if (error || !data) return;

  if (match.trialPhotos) {
    for (const photo of match.trialPhotos) {
      await supabase.from("trial_photos").insert({
        match_id: data.id,
        team_id: teamId,
        url: photo.url,
        photo_type: photo.photoType,
        uploaded_by: photo.uploadedBy,
        uploaded_at: photo.uploadedAt,
        trial_id: photo.trialId,
        team_number: photo.teamNumber,
      });
    }
  }
}

export async function getSettings(): Promise<Settings> {
  return DEFAULT_SETTINGS;
}

export async function saveSettings(): Promise<void> {
  // Settings are now per-account in profiles table
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

export function calculateAllianceSynergy(teamNumbers: number[]): AllianceSynergy {
  if (teamNumbers.length < 2) {
    return { teamNumbers, score: 0, level: "Low", autoSynergy: 0, teleopSynergy: 0, endgameSynergy: 0, driveCompatibility: false };
  }

  // For sync functions, we need to compute from already-loaded teams
  // These functions should be called after teams are loaded
  return { teamNumbers, score: 0, level: "Low", autoSynergy: 0, teleopSynergy: 0, endgameSynergy: 0, driveCompatibility: false };
}

export function calculateAllianceSynergyFromTeams(teams: Team[]): AllianceSynergy {
  const teamNumbers = teams.map((t) => t.number);
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

export function predictMatchOutcome(
  alliance1Teams: Team[],
  alliance2Teams: Team[]
): MatchPrediction {
  const getAvgWarp = (teams: Team[]) => {
    if (teams.length === 0) return 5;
    const stats = teams.map((t) => calculateTeamStats(t));
    return stats.reduce((a, s) => a + s.avgWarpScore, 0) / stats.length;
  };

  const warp1 = getAvgWarp(alliance1Teams);
  const warp2 = getAvgWarp(alliance2Teams);
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
    alliance1: { teamNumbers: alliance1Teams.map((t) => t.number), warpScore: Math.round(warp1 * 10) / 10 },
    alliance2: { teamNumbers: alliance2Teams.map((t) => t.number), warpScore: Math.round(warp2 * 10) / 10 },
    alliance1WinPct,
    alliance2WinPct,
    predictedScoreRange,
    strengths,
    weaknesses,
  };
}

export interface HeatMapEntry {
  teamNumber: number;
  teamName: string;
  trend: "improving" | "stable" | "declining";
  warpDelta: number;
  reliabilityDelta: number;
}

export function getHeatMapData(teams: Team[]): HeatMapEntry[] {
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

export async function getRecommendedAlliances(teams: Team[]): Promise<AllianceSynergy[]> {
  if (teams.length < 3) return [];
  const topTeams = teams
    .map((t) => ({ team: t, stats: calculateTeamStats(t) }))
    .sort((a, b) => b.stats.avgWarpScore - a.stats.avgWarpScore)
    .slice(0, 10);

  const combos: AllianceSynergy[] = [];
  for (let i = 0; i < topTeams.length && combos.length < 5; i++) {
    for (let j = i + 1; j < topTeams.length && combos.length < 5; j++) {
      for (let k = j + 1; k < topTeams.length && combos.length < 5; k++) {
        const synergy = calculateAllianceSynergyFromTeams([
          topTeams[i].team,
          topTeams[j].team,
          topTeams[k].team,
        ]);
        if (synergy.level === "High") combos.push(synergy);
      }
    }
  }
  if (combos.length === 0 && topTeams.length >= 2) {
    for (let i = 0; i < Math.min(topTeams.length, 5); i++) {
      for (let j = i + 1; j < Math.min(topTeams.length, 5); j++) {
        const synergy = calculateAllianceSynergyFromTeams([topTeams[i].team, topTeams[j].team]);
        if (synergy.level !== "Low") combos.push(synergy);
      }
    }
  }
  return combos.slice(0, 5);
}

export async function getScoutAccuracy(scoutName: string): Promise<{ total: number; consistency: number }> {
  const { data: matches } = await supabase
    .from("matches")
    .select("warp_score")
    .eq("scout_name", scoutName);

  if (!matches || matches.length === 0) return { total: 0, consistency: 0 };

  const avg = matches.reduce((a, b) => a + b.warp_score, 0) / matches.length;
  const variance =
    matches.reduce((a, b) => a + Math.pow(b.warp_score - avg, 2), 0) /
    matches.length;
  const consistency = Math.max(0, 100 - Math.round(Math.sqrt(variance) * 10));
  return { total: matches.length, consistency };
}

export function suggestPhotoLabel(trialPhotos: { photoType: string }[]): string {
  const counts: Record<string, number> = {};
  for (const p of trialPhotos) {
    counts[p.photoType] = (counts[p.photoType] || 0) + 1;
  }
  const order: string[] = ["trial-action", "auto-path", "breakdown", "general"];
  for (const t of order) {
    if (!counts[t]) return t;
  }
  return "general";
}

export async function replaceScoutName(oldName: string, newName: string): Promise<void> {
  await supabase
    .from("matches")
    .update({ scout_name: newName })
    .eq("scout_name", oldName);
}

export async function exportData(): Promise<string> {
  const teams = await getTeams();
  return JSON.stringify({ teams }, null, 2);
}

export async function importData(json: string): Promise<boolean> {
  try {
    const data = JSON.parse(json);
    if (data.teams) {
      for (const team of data.teams) {
        await addTeam(team);
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function resetAllData(): Promise<void> {
  await supabase.from("trial_photos").delete().neq("id", "");
  await supabase.from("matches").delete().neq("id", "");
  await supabase.from("photos").delete().neq("id", "");
  await supabase.from("precomp_photos").delete().neq("id", "");
  await supabase.from("teams").delete().neq("id", "");
}

export async function getTeamMatches(teamNumber: number): Promise<TeamMatch[]> {
  const { data, error } = await supabase
    .from("team_matches")
    .select("*")
    .eq("team_number", teamNumber)
    .order("match_number", { ascending: true });

  if (error || !data) return [];

  return data.map((m) => ({
    id: m.id,
    teamNumber: m.team_number,
    teamName: m.team_name,
    matchNumber: m.match_number,
    day: m.day,
    time: m.time,
    alliance: m.alliance,
    startPosition: m.start_position,
    createdBy: m.created_by ?? "",
    createdAt: m.created_at,
  }));
}

export async function addTeamMatch(match: Omit<TeamMatch, "id" | "createdAt">): Promise<{ error?: string }> {
  const { error } = await supabase.from("team_matches").insert({
    team_number: match.teamNumber,
    team_name: match.teamName,
    match_number: match.matchNumber,
    day: match.day,
    time: match.time,
    alliance: match.alliance,
    start_position: match.startPosition,
    created_by: match.createdBy,
  });

  if (error) {
    console.error("Add team match error:", error.message);
    return { error: error.message };
  }
  return {};
}

export async function deleteTeamMatch(id: string): Promise<void> {
  await supabase.from("team_matches").delete().eq("id", id);
}
