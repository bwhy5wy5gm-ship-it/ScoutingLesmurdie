"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getTeams,
  calculateTeamStats,
  calculateAllianceSynergy,
  predictMatchOutcome,
} from "@/lib/store";
import { Team, TeamStats, AllianceSynergy, MatchPrediction } from "@/lib/types";
import {
  Scale,
  Zap,
  TrendingUp,
  Trophy,
  Clock,
  Shield,
  Target,
  Camera,
  BarChart3,
  Users,
  Swords,
  CheckCircle,
  XCircle,
  Sparkles,
} from "lucide-react";

interface StatRow {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  getValue: (s: TeamStats) => number;
}

const stats: StatRow[] = [
  { key: "auto", label: "Auto Score", icon: Zap, getValue: (s) => s.avgAuto },
  {
    key: "teleop",
    label: "Teleop Score",
    icon: TrendingUp,
    getValue: (s) => s.avgTeleop,
  },
  {
    key: "endgame",
    label: "Endgame Score",
    icon: Trophy,
    getValue: (s) => s.avgEndgame,
  },
  {
    key: "cycles",
    label: "Cycle Efficiency",
    icon: Clock,
    getValue: (s) => s.avgCycleEfficiency,
  },
  {
    key: "reliability",
    label: "Reliability",
    icon: Shield,
    getValue: (s) => s.avgReliability,
  },
  {
    key: "warp",
    label: "WARP Score",
    icon: Target,
    getValue: (s) => s.avgWarpScore,
  },
];

function StatBar({
  label,
  icon: Icon,
  valueA,
  valueB,
  max,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  valueA: number;
  valueB: number;
  max: number;
}) {
  const pctA = max > 0 ? (valueA / max) * 100 : 0;
  const pctB = max > 0 ? (valueB / max) * 100 : 0;
  const winner = valueA > valueB ? "a" : valueB > valueA ? "b" : "tie";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-medium">
        <div className="flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </div>
        {winner !== "tie" && (
          <Badge
            variant={winner === "a" ? "default" : "secondary"}
            className={
              winner === "a"
                ? "bg-emerald-500 text-white"
                : "bg-blue-500 text-white"
            }
          >
            {winner === "a" ? "Team A" : "Team B"}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono tabular-nums w-10 text-right">
            {valueA.toFixed(1)}
          </span>
          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                winner === "a"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                  : "bg-emerald-500/60"
              }`}
              style={{ width: `${pctA}%` }}
            />
          </div>
        </div>
        <div className="w-px h-6 bg-border" />
        <div className="flex items-center gap-2">
          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                winner === "b"
                  ? "bg-gradient-to-r from-blue-400 to-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                  : "bg-blue-500/60"
              }`}
              style={{ width: `${pctB}%` }}
            />
          </div>
          <span className="text-sm font-mono tabular-nums w-10">
            {valueB.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

function TeamMultiSelect({
  label,
  teams,
  selected,
  onChange,
  color,
}: {
  label: string;
  teams: Team[];
  selected: string[];
  onChange: (ids: string[]) => void;
  color: string;
}) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else if (selected.length < 3) {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${color}`}>{label}</span>
        <Badge variant="secondary">{selected.length}/3</Badge>
      </div>
      <div className="space-y-1">
        {selected.map((id) => {
          const team = teams.find((t) => t.id === id);
          if (!team) return null;
          return (
            <div
              key={id}
              className={`flex items-center justify-between px-2 py-1 rounded text-sm ${color === "text-emerald-500" ? "bg-emerald-500/10" : "bg-blue-500/10"}`}
            >
              <span>
                {team.number} - {team.name}
              </span>
              <button
                onClick={() => toggle(id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
      <Select
        value=""
        onValueChange={(val) => {
          if (val) toggle(val);
        }}
        disabled={selected.length >= 3}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={selected.length >= 3 ? "Max 3 teams" : "Add team..."} />
        </SelectTrigger>
        <SelectContent>
          {teams
            .filter((t) => !selected.includes(t.id))
            .map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.number} - {t.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function ComparePage() {
  const [teams] = useState<Team[]>(() => getTeams());
  const [teamAId, setTeamAId] = useState<string>("");
  const [teamBId, setTeamBId] = useState<string>("");
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");

  // Alliance Synergy state
  const [synergySelected, setSynergySelected] = useState<string[]>([]);

  // Match Predictor state
  const [alliance1Ids, setAlliance1Ids] = useState<string[]>([]);
  const [alliance2Ids, setAlliance2Ids] = useState<string[]>([]);

  const teamA = useMemo(
    () => teams.find((t) => t.id === teamAId) ?? null,
    [teams, teamAId]
  );
  const teamB = useMemo(
    () => teams.find((t) => t.id === teamBId) ?? null,
    [teams, teamBId]
  );

  const statsA = useMemo(
    () => (teamA ? calculateTeamStats(teamA) : null),
    [teamA]
  );
  const statsB = useMemo(
    () => (teamB ? calculateTeamStats(teamB) : null),
    [teamB]
  );

  const filteredA = useMemo(() => {
    const q = searchA.toLowerCase();
    return teams.filter(
      (t) =>
        t.number.toString().includes(q) ||
        t.name.toLowerCase().includes(q)
    );
  }, [teams, searchA]);

  const filteredB = useMemo(() => {
    const q = searchB.toLowerCase();
    return teams.filter(
      (t) =>
        t.number.toString().includes(q) ||
        t.name.toLowerCase().includes(q)
    );
  }, [teams, searchB]);

  const maxValues = useMemo(() => {
    if (!statsA || !statsB) return null;
    return {
      auto: Math.max(statsA.avgAuto, statsB.avgAuto, 1),
      teleop: Math.max(statsA.avgTeleop, statsB.avgTeleop, 1),
      endgame: Math.max(statsA.avgEndgame, statsB.avgEndgame, 1),
      cycles: Math.max(statsA.avgCycleEfficiency, statsB.avgCycleEfficiency, 1),
      reliability: Math.max(statsA.avgReliability, statsB.avgReliability, 1),
      warp: Math.max(statsA.avgWarpScore, statsB.avgWarpScore, 1),
    };
  }, [statsA, statsB]);

  const maxForStat = (key: string): number => {
    if (!maxValues) return 1;
    const map: Record<string, number> = {
      auto: maxValues.auto,
      teleop: maxValues.teleop,
      endgame: maxValues.endgame,
      cycles: maxValues.cycles,
      reliability: maxValues.reliability,
      warp: maxValues.warp,
    };
    return map[key] ?? 1;
  };

  const statsAWins = useMemo(() => {
    if (!statsA || !statsB) return 0;
    let wins = 0;
    for (const s of stats) {
      if (s.getValue(statsA) > s.getValue(statsB)) wins++;
    }
    return wins;
  }, [statsA, statsB]);

  const statsBWins = useMemo(() => {
    if (!statsA || !statsB) return 0;
    let wins = 0;
    for (const s of stats) {
      if (s.getValue(statsB) > s.getValue(statsA)) wins++;
    }
    return wins;
  }, [statsA, statsB]);

  // Alliance Synergy
  const synergyResult = useMemo((): AllianceSynergy | null => {
    const numbers = synergySelected
      .map((id) => teams.find((t) => t.id === id)?.number)
      .filter((n): n is number => n !== undefined);
    if (numbers.length < 2) return null;
    return calculateAllianceSynergy(numbers);
  }, [synergySelected, teams]);

  // Match Prediction
  const predictionResult = useMemo((): MatchPrediction | null => {
    const nums1 = alliance1Ids
      .map((id) => teams.find((t) => t.id === id)?.number)
      .filter((n): n is number => n !== undefined);
    const nums2 = alliance2Ids
      .map((id) => teams.find((t) => t.id === id)?.number)
      .filter((n): n is number => n !== undefined);
    if (nums1.length === 0 || nums2.length === 0) return null;
    return predictMatchOutcome(nums1, nums2);
  }, [alliance1Ids, alliance2Ids, teams]);

  const synergyLevelColor = (level: string) => {
    switch (level) {
      case "High": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
      case "Medium": return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      default: return "bg-red-500/10 text-red-500 border-red-500/30";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Scale className="h-8 w-8" />
          Unit Comparison
        </h1>
        <p className="text-muted-foreground">
          Compare two WARP Units side-by-side
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-emerald-500">Team A</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={teamAId}
              onValueChange={(val) => {
                setTeamAId(val ?? "");
                setSearchA("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Team A" />
              </SelectTrigger>
              <SelectContent>
                {filteredA.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.number} - {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-500">Team B</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={teamBId}
              onValueChange={(val) => {
                setTeamBId(val ?? "");
                setSearchB("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Team B" />
              </SelectTrigger>
              <SelectContent>
                {filteredB.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.number} - {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {!teamA && !teamB && teams.length > 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <Scale className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">Select two teams to compare</p>
              <p className="text-sm">
                Use the dropdowns above to choose WARP Units
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {teamA && statsA && teamB && statsB && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-emerald-500/30">
              <CardHeader>
                <CardTitle className="text-emerald-500">
                  {teamA.number} - {teamA.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm">
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                    {statsA.totalMatches} matches
                  </Badge>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                    Overall: {statsA.overallRating}
                  </Badge>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                    {statsAWins} category wins
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-blue-500">
                  {teamB.number} - {teamB.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm">
                  <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                    {statsB.totalMatches} matches
                  </Badge>
                  <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                    Overall: {statsB.overallRating}
                  </Badge>
                  <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                    {statsBWins} category wins
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Stat Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center mb-4 text-sm text-muted-foreground">
                <div className="text-emerald-500 font-medium">
                  {teamA.number}
                </div>
                <div />
                <div className="text-blue-500 font-medium">{teamB.number}</div>
              </div>
              <div className="space-y-5">
                {stats.map((s) => (
                  <StatBar
                    key={s.key}
                    label={s.label}
                    icon={s.icon}
                    valueA={s.getValue(statsA)}
                    valueB={s.getValue(statsB)}
                    max={maxForStat(s.key)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photo Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-emerald-500 mb-3">
                    {teamA.number} - {teamA.name}
                  </h3>
                  {(teamA.photos ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No photos yet
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {(teamA.photos ?? []).map((photo) => (
                        <div
                          key={photo.id}
                          className="relative aspect-square rounded-lg overflow-hidden border"
                        >
                          <Image
                            src={photo.url}
                            alt={photo.label}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1.5 py-0.5">
                            {photo.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-500 mb-3">
                    {teamB.number} - {teamB.name}
                  </h3>
                  {(teamB.photos ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No photos yet
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {(teamB.photos ?? []).map((photo) => (
                        <div
                          key={photo.id}
                          className="relative aspect-square rounded-lg overflow-hidden border"
                        >
                          <Image
                            src={photo.url}
                            alt={photo.label}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1.5 py-0.5">
                            {photo.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Match History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-500">
                    {statsA.totalMatches}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    matches scouted
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {teamA.number}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-500">
                    {statsB.totalMatches}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    matches scouted
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {teamB.number}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Alliance Synergy Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Alliance Synergy Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TeamMultiSelect
            label="Select teams for synergy analysis"
            teams={teams}
            selected={synergySelected}
            onChange={setSynergySelected}
            color="text-emerald-500"
          />
          {synergyResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-5xl font-bold">
                    {synergyResult.score.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Synergy Score
                  </div>
                </div>
                <Badge
                  className={`text-lg px-4 py-1 border ${synergyLevelColor(synergyResult.level)}`}
                >
                  {synergyResult.level}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <Zap className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
                  <div className="text-lg font-bold">{synergyResult.autoSynergy}</div>
                  <div className="text-xs text-muted-foreground">Auto Synergy</div>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <TrendingUp className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                  <div className="text-lg font-bold">{synergyResult.teleopSynergy}</div>
                  <div className="text-xs text-muted-foreground">Teleop Synergy</div>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <Trophy className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                  <div className="text-lg font-bold">{synergyResult.endgameSynergy}</div>
                  <div className="text-xs text-muted-foreground">Endgame Synergy</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                {synergyResult.driveCompatibility ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-500">
                      Drive Systems Compatible
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium text-red-500">
                      Drive Systems Incompatible
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Select 2-3 teams to calculate synergy</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Match Outcome Predictor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5" />
            Match Outcome Predictor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TeamMultiSelect
              label="Red Alliance"
              teams={teams}
              selected={alliance1Ids}
              onChange={setAlliance1Ids}
              color="text-red-500"
            />
            <TeamMultiSelect
              label="Blue Alliance"
              teams={teams}
              selected={alliance2Ids}
              onChange={setAlliance2Ids}
              color="text-blue-500"
            />
          </div>
          {predictionResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-500">Red Alliance</span>
                    <span className="text-sm font-bold text-red-500">
                      {predictionResult.alliance1WinPct}%
                    </span>
                  </div>
                  <div className="h-8 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${predictionResult.alliance1WinPct}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    WARP: {predictionResult.alliance1.warpScore}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-500">Blue Alliance</span>
                    <span className="text-sm font-bold text-blue-500">
                      {predictionResult.alliance2WinPct}%
                    </span>
                  </div>
                  <div className="h-8 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${predictionResult.alliance2WinPct}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    WARP: {predictionResult.alliance2.warpScore}
                  </div>
                </div>
              </div>

              <div className="text-center bg-muted rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Predicted Score Range</div>
                <div className="text-xl font-bold">
                  {predictionResult.predictedScoreRange.min} - {predictionResult.predictedScoreRange.max}
                </div>
              </div>

              {(predictionResult.strengths.length > 0 || predictionResult.weaknesses.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {predictionResult.strengths.length > 0 && (
                    <div className="bg-emerald-500/10 rounded-lg p-3">
                      <div className="text-sm font-medium text-emerald-500 mb-1">Strengths</div>
                      <ul className="text-xs space-y-1">
                        {predictionResult.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <Sparkles className="h-3 w-3 mt-0.5 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {predictionResult.weaknesses.length > 0 && (
                    <div className="bg-red-500/10 rounded-lg p-3">
                      <div className="text-sm font-medium text-red-500 mb-1">Weaknesses</div>
                      <ul className="text-xs space-y-1">
                        {predictionResult.weaknesses.map((s, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <XCircle className="h-3 w-3 mt-0.5 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Swords className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Select teams for both alliances to predict outcome</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
