"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTeams, calculateTeamStats } from "@/lib/store";
import { Team, TeamStats } from "@/lib/types";
import {
  Trophy,
  Zap,
  Target,
  Shield,
  Clock,
  Star,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface RankedTeam {
  team: Team;
  stats: TeamStats;
  value: number;
}

function rankBy(
  teams: Team[],
  getValue: (stats: TeamStats) => number
): RankedTeam[] {
  return teams
    .map((t) => {
      const stats = calculateTeamStats(t);
      return { team: t, stats, value: getValue(stats) };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

const categories = [
  {
    key: "overall",
    label: "Overall Rating",
    icon: Star,
    getValue: (s: TeamStats) => s.overallRating,
  },
  {
    key: "auto",
    label: "Best Auto",
    icon: Zap,
    getValue: (s: TeamStats) => s.avgAuto,
  },
  {
    key: "teleop",
    label: "Best Teleop",
    icon: TrendingUp,
    getValue: (s: TeamStats) => s.avgTeleop,
  },
  {
    key: "endgame",
    label: "Best Endgame",
    icon: Trophy,
    getValue: (s: TeamStats) => s.avgEndgame,
  },
  {
    key: "reliability",
    label: "Most Reliable",
    icon: Shield,
    getValue: (s: TeamStats) => s.avgReliability,
  },
  {
    key: "warp",
    label: "Best WARP Score",
    icon: Target,
    getValue: (s: TeamStats) => s.avgWarpScore,
  },
  {
    key: "cycles",
    label: "Fastest Cycles",
    icon: Clock,
    getValue: (s: TeamStats) => s.avgCycleEfficiency,
  },
];

function getRankBadgeColor(rank: number) {
  if (rank === 0) return "bg-yellow-500 text-white";
  if (rank === 1) return "bg-gray-400 text-white";
  if (rank === 2) return "bg-amber-700 text-white";
  return "bg-secondary text-secondary-foreground";
}

export default function LeaderboardsPage() {
  const [teams] = useState<Team[]>(() => {
    return getTeams();
  });

  const renderLeaderboard = (ranked: RankedTeam[]) => {
    if (ranked.length === 0) {
      return (
        <p className="text-muted-foreground text-center py-8">
          No data available. Add teams and match data first.
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {ranked.map((item, i) => (
          <Link
            key={item.team.id}
            href={`/teams/${item.team.id}`}
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <Badge className={`w-8 justify-center ${getRankBadgeColor(i)}`}>
                {i + 1}
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
              <div className="text-lg font-bold">{item.value.toFixed(1)}</div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leaderboards</h1>
        <p className="text-muted-foreground">
          Team rankings across all categories
        </p>
      </div>

      <Tabs defaultValue="overall">
        <TabsList className="grid grid-cols-4 md:grid-cols-7 h-auto">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat.key}
              value={cat.key}
              className="text-xs md:text-sm"
            >
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {categories.map((cat) => (
          <TabsContent key={cat.key} value={cat.key}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <cat.icon className="h-5 w-5" />
                  {cat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderLeaderboard(rankBy(teams, cat.getValue))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
