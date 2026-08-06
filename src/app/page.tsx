"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTeams, getSettings, calculateTeamStats } from "@/lib/store";
import { Team, Settings, MatchData, DEFAULT_SETTINGS } from "@/lib/types";
import {
  Users,
  Trophy,
  ClipboardList,
  Timer,
  BarChart3,
  GitCompareArrows,
  Activity,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const t = await getTeams();
      setTeams(t);
      const s = await getSettings();
      setSettings(s);
      setLoading(false);
    }
    load();
  }, []);

  const totalMatches = teams.reduce(
    (sum, t) => sum + (t.matches ?? []).length,
    0
  );

  const avgWarp =
    teams.length > 0
      ? (
          teams.reduce(
            (sum, t) =>
              sum + calculateTeamStats(t).avgWarpScore * (t.matches ?? []).length,
            0
          ) / (totalMatches || 1)
        ).toFixed(1)
      : "0.0";

  const recentMatches: (MatchData & { teamNumber: number; teamName: string })[] =
    teams
      .flatMap((t) =>
        (t.matches ?? []).map((m) => ({
          ...m,
          teamNumber: t.number,
          teamName: t.name,
        }))
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

  const topTeams = [...teams]
    .map((t) => ({ team: t, stats: calculateTeamStats(t) }))
    .sort((a, b) => b.stats.avgWarpScore - a.stats.avgWarpScore)
    .slice(0, 3);

  const quickLinks = [
    { href: "/pre-comp", label: "Pre-Comp", icon: ClipboardList },
    { href: "/in-comp", label: "WARP Trial", icon: Timer },
    { href: "/leaderboards", label: "Leaderboards", icon: Trophy },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/compare", label: "Compare", icon: GitCompareArrows },
  ];

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              {settings.currentEvent} &middot; Scout: {settings.scoutName}
            </p>
          </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMatches}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg WARP Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgWarp}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <link.icon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Top Teams by WARP
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topTeams.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No teams added yet.{" "}
                <Link href="/teams" className="text-primary underline">
                  Add teams
                </Link>{" "}
                to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {topTeams.map((item, i) => (
                  <Link
                    key={item.team.id}
                    href={`/teams/${item.team.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={i === 0 ? "default" : "secondary"}>
                        #{i + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">
                          {item.team.number} - {item.team.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.stats.totalMatches} matches
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {item.stats.avgWarpScore}
                      </div>
                      <div className="text-xs text-muted-foreground">WARP</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMatches.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No matches recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentMatches.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <div className="font-medium">
                        Match #{m.matchNumber} &mdash; {m.teamNumber}{" "}
                        {m.teamName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {m.alliance.toUpperCase()} alliance &middot;{" "}
                        {new Date(m.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="outline">{m.warpScore} WARP</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </>
      )}
    </div>
  );
}
