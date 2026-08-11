"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getTeams,
  calculateTeamStats,
  getScoutAccuracy,
  getHeatMapData,
  hasReliabilityDrop,
  getRecommendedAlliances,
  calculateStability,
} from "@/lib/store";
import type { HeatMapEntry } from "@/lib/store";
import { Team, TeamStats, AllianceSynergy } from "@/lib/types";
import {
  Trophy,
  Zap,
  Target,
  Shield,
  Clock,
  Star,
  TrendingUp,
  Users,
  BarChart3,
  Activity,
  AlertTriangle,
  Flame,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface RankedTeam {
  team: Team;
  stats: TeamStats;
  value: number;
}

interface ScoutActivity {
  name: string;
  matchesScouted: number;
  avgWarpScore: number;
  consistency: number;
}

export default function DashboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [heatMapData, setHeatMapData] = useState<HeatMapEntry[]>([]);
  const [alliances, setAlliances] = useState<AllianceSynergy[]>([]);
  const [scoutStats, setScoutStats] = useState<Record<string, { total: number; consistency: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const t = await getTeams();
      setTeams(t);
      setHeatMapData(await getHeatMapData(t));
      setAlliances(await getRecommendedAlliances(t));
      const names = [...new Set(t.flatMap(team => (team.matches ?? []).map(m => m.scoutName)))];
      const stats: Record<string, { total: number; consistency: number }> = {};
      for (const name of names) {
        stats[name] = await getScoutAccuracy(name);
      }
      setScoutStats(stats);
      setLoading(false);
    }
    load();
  }, []);

  const rankedTeams: RankedTeam[] = teams
    .map((t) => {
      const stats = calculateTeamStats(t);
      return { team: t, stats, value: stats.avgWarpScore };
    })
    .sort((a, b) => b.value - a.value);

  const top5 = rankedTeams.slice(0, 5);

  const bestAuto = [...rankedTeams].sort((a, b) => b.stats.avgAuto - a.stats.avgAuto)[0];
  const bestTeleop = [...rankedTeams].sort((a, b) => b.stats.avgTeleop - a.stats.avgTeleop)[0];
  const mostReliable = [...rankedTeams].sort((a, b) => b.stats.avgReliability - a.stats.avgReliability)[0];
  const fastestCycles = [...rankedTeams].sort((a, b) => a.stats.avgCycleEfficiency - b.stats.avgCycleEfficiency)[0];
  const highestWarp = rankedTeams[0];

  const scoutMap = new Map<string, { totalWarp: number; count: number }>();
  for (const team of teams) {
    for (const m of team.matches ?? []) {
      const existing = scoutMap.get(m.scoutName) ?? { totalWarp: 0, count: 0 };
      scoutMap.set(m.scoutName, {
        totalWarp: existing.totalWarp + m.warpScore,
        count: existing.count + 1,
      });
    }
  }

  const scoutActivity: ScoutActivity[] = Array.from(scoutMap.entries()).map(
    ([name, data]) => {
      const { consistency } = scoutStats[name] ?? { total: 0, consistency: 0 };
      return {
        name,
        matchesScouted: data.count,
        avgWarpScore: Math.round((data.totalWarp / data.count) * 10) / 10,
        consistency,
      };
    }
  );

  const totalTeams = teams.length;
  const totalMatches = teams.reduce((sum, t) => sum + (t.matches ?? []).length, 0);
  const allWarpScores = teams.flatMap((t) => (t.matches ?? []).map((m) => m.warpScore));
  const avgEventWarp =
    allWarpScores.length > 0
      ? Math.round((allWarpScores.reduce((a, b) => a + b, 0) / allWarpScores.length) * 10) / 10
      : 0;

  const categoryLeaders = [
    { label: "Best Auto", icon: Zap, leader: bestAuto, value: bestAuto?.stats.avgAuto, color: "text-blue-500" },
    { label: "Best Teleop", icon: TrendingUp, leader: bestTeleop, value: bestTeleop?.stats.avgTeleop, color: "text-purple-500" },
    { label: "Most Reliable", icon: Shield, leader: mostReliable, value: mostReliable?.stats.avgReliability, color: "text-green-500" },
    { label: "Fastest Cycles", icon: Clock, leader: fastestCycles, value: fastestCycles?.stats.avgCycleEfficiency, color: "text-orange-500" },
    { label: "Highest WARP Score", icon: Target, leader: highestWarp, value: highestWarp?.stats.avgWarpScore, color: "text-red-500" },
  ];

  const reliabilityAlerts = teams
    .filter((t) => (t.matches ?? []).length >= 3)
    .map((t) => ({ team: t, ...hasReliabilityDrop(t) }))
    .filter((entry) => entry.alert);

  const sortedHeatMap = [...heatMapData].sort((a, b) => b.warpDelta - a.warpDelta);

  const getRankBadge = (rank: number) => {
    if (rank === 0) return "bg-yellow-500 text-white";
    if (rank === 1) return "bg-gray-400 text-white";
    if (rank === 2) return "bg-amber-700 text-white";
    return "bg-secondary text-secondary-foreground";
  };

  const getStabilityBadge = (stability: string) => {
    if (stability === "Stable") return "bg-green-500/15 text-green-500 border-green-500/30";
    if (stability === "Semi-Stable") return "bg-yellow-500/15 text-yellow-500 border-yellow-500/30";
    return "bg-red-500/15 text-red-500 border-red-500/30";
  };

  const getTrendBadge = (trend: string) => {
    if (trend === "improving") return "bg-green-500/15 text-green-500 border-green-500/30";
    if (trend === "stable") return "bg-yellow-500/15 text-yellow-500 border-yellow-500/30";
    return "bg-red-500/15 text-red-500 border-red-500/30";
  };

  const getHeatMapRowBg = (trend: string) => {
    if (trend === "improving") return "bg-green-500/5";
    if (trend === "stable") return "bg-yellow-500/5";
    return "bg-red-500/5";
  };

  const getSynergyBadge = (level: string) => {
    if (level === "High") return "bg-green-500/15 text-green-500 border-green-500/30";
    if (level === "Medium") return "bg-yellow-500/15 text-yellow-500 border-yellow-500/30";
    return "bg-red-500/15 text-red-500 border-red-500/30";
  };

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
      <>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Event Dashboard</h1>
          <p className="text-muted-foreground">Overview of event performance and statistics</p>
        </div>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-semibold">Top Units</h2>
        </div>
        {top5.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No match data available yet. Scout some matches to see the top units.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {top5.map((item, i) => {
              const stability = calculateStability(item.team);
              return (
                <Link key={item.team.id} href={`/teams/${item.team.id}`}>
                  <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="absolute top-2 left-2">
                      <Badge className={`w-7 justify-center ${getRankBadge(i)}`}>
                        {i + 1}
                      </Badge>
                    </div>
                    <CardHeader className="pb-2 pt-8">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {item.team.number} - {item.team.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-3xl font-bold warp-score glass-accent">
                        {item.value.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        WARP Score
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${getStabilityBadge(stability)}`}>
                          {stability}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-blue-500" />
                          <span>{item.stats.avgAuto.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-purple-500" />
                          <span>{item.stats.avgTeleop.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>{item.stats.avgEndgame.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3 text-green-500" />
                          <span>{item.stats.avgReliability.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.stats.totalMatches} match{item.stats.totalMatches !== 1 ? "es" : ""} scouted
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          <h2 className="text-xl font-semibold">Category Leaders</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {categoryLeaders.map((cat) => (
            <Card key={cat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <cat.icon className={`h-4 w-4 ${cat.color}`} />
                  <span className="text-sm font-medium text-muted-foreground">{cat.label}</span>
                </div>
                {cat.leader ? (
                  <>
                    <div className="text-2xl font-bold mb-1">
                      {cat.value?.toFixed(1) ?? "N/A"}
                    </div>
                    <Link
                      href={`/teams/${cat.leader.team.id}`}
                      className="text-sm font-medium hover:underline text-primary"
                    >
                      {cat.leader.team.number} - {cat.leader.team.name}
                    </Link>
                  </>
                ) : (
                  <div className="text-muted-foreground text-sm">No data</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-5 w-5 text-orange-500" />
          <h2 className="text-xl font-semibold">Event Heat Map</h2>
        </div>
        {sortedHeatMap.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No trend data available. Scout at least 2 matches per team to see trends.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 sm:p-4 font-medium text-muted-foreground">Team #</th>
                    <th className="text-left p-2 sm:p-4 font-medium text-muted-foreground">Team Name</th>
                    <th className="text-left p-2 sm:p-4 font-medium text-muted-foreground">Trend</th>
                    <th className="text-right p-2 sm:p-4 font-medium text-muted-foreground">WARP Delta</th>
                    <th className="text-right p-2 sm:p-4 font-medium text-muted-foreground">Reliability Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHeatMap.map((entry) => (
                    <tr key={entry.teamNumber} className={`border-b last:border-0 ${getHeatMapRowBg(entry.trend)}`}>
                      <td className="p-2 sm:p-4 font-semibold whitespace-nowrap">{entry.teamNumber}</td>
                      <td className="p-2 sm:p-4 whitespace-nowrap">{entry.teamName}</td>
                      <td className="p-2 sm:p-4">
                        <Badge variant="outline" className={`text-xs capitalize ${getTrendBadge(entry.trend)}`}>
                          {entry.trend}
                        </Badge>
                      </td>
                      <td className={`p-2 sm:p-4 text-right font-medium ${entry.warpDelta >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {entry.warpDelta >= 0 ? "+" : ""}{entry.warpDelta.toFixed(1)}
                      </td>
                      <td className={`p-2 sm:p-4 text-right font-medium ${entry.reliabilityDelta >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {entry.reliabilityDelta >= 0 ? "+" : ""}{entry.reliabilityDelta.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-semibold">Reliability Alerts</h2>
        </div>
        {reliabilityAlerts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No reliability drops detected. All units are performing consistently.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reliabilityAlerts.map((entry) => (
              <Card key={entry.team.id} className="border-amber-500/50 bg-amber-500/5">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-amber-500">Reliability Warning</span>
                  </div>
                  <div className="font-bold text-lg">{entry.team.number} - {entry.team.name}</div>
                  <div className="text-sm text-muted-foreground">{entry.message}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-green-500" />
          <h2 className="text-xl font-semibold">Scout Activity</h2>
        </div>
        {scoutActivity.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No scout activity recorded yet.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {scoutActivity.map((scout) => (
                  <div
                    key={scout.name}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {scout.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{scout.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {scout.matchesScouted} match{scout.matchesScouted !== 1 ? "es" : ""} scouted
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-6 text-right">
                      <div>
                        <div className="text-lg font-bold">{scout.avgWarpScore}</div>
                        <div className="text-xs text-muted-foreground">Avg WARP</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          <span className="text-lg font-bold">{scout.consistency}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Consistency</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-cyan-500" />
          <h2 className="text-xl font-semibold">Recommended Alliances</h2>
        </div>
        {alliances.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Not enough team data to recommend alliances.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alliances.map((alliance, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-lg">
                      {alliance.teamNumbers.join(" / ")}
                    </div>
                    <Badge variant="outline" className={`text-xs ${getSynergyBadge(alliance.level)}`}>
                      {alliance.level} Synergy
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold warp-score glass-accent">
                    {alliance.score.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Synergy Score
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-blue-500" />
                      <span>Auto: {alliance.autoSynergy.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-purple-500" />
                      <span>Teleop: {alliance.teleopSynergy.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span>Endgame: {alliance.endgameSynergy.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-green-500" />
                      <span>Drive: {alliance.driveCompatibility ? "Compatible" : "Mixed"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-purple-500" />
          <h2 className="text-xl font-semibold">Event Stats Summary</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-primary mb-1">{totalTeams}</div>
              <div className="text-sm text-muted-foreground font-medium">Total Teams</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-primary mb-1">{totalMatches}</div>
              <div className="text-sm text-muted-foreground font-medium">Total Matches Scouted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold warp-score glass-accent mb-1">{avgEventWarp}</div>
              <div className="text-sm text-muted-foreground font-medium">Avg WARP Score</div>
            </CardContent>
          </Card>
        </div>
      </section>
      </>
      )}
    </div>
  );
}
