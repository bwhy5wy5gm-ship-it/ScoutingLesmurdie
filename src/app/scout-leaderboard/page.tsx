"use client";

import { useMemo, useState, useEffect } from "react";
import { getAllScoutStats } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Target, BarChart3, Loader2 } from "lucide-react";

type SortKey = "formsCompleted" | "accuracy" | "consistency";

interface ScoutStat {
  username: string;
  accountId: string;
  teamsScouted: number;
  formsCompleted: number;
  accuracy: number;
  consistency: number;
}

function getXpLevel(forms: number): string {
  if (forms >= 50) return "Master Scout";
  if (forms >= 31) return "Lead Scout";
  if (forms >= 16) return "Senior Scout";
  if (forms >= 5) return "Scout";
  return "Rookie";
}

function getXpLevelBadgeColor(forms: number): string {
  if (forms >= 50) return "bg-yellow-500 text-white";
  if (forms >= 31) return "bg-purple-500 text-white";
  if (forms >= 16) return "bg-blue-500 text-white";
  if (forms >= 5) return "bg-green-500 text-white";
  return "bg-secondary text-secondary-foreground";
}

function getRankBadgeColor(rank: number): string {
  if (rank === 0) return "bg-yellow-500 text-white";
  if (rank === 1) return "bg-gray-400 text-white";
  if (rank === 2) return "bg-amber-700 text-white";
  return "bg-secondary text-secondary-foreground";
}

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "formsCompleted", label: "Forms Completed" },
  { key: "accuracy", label: "Accuracy" },
  { key: "consistency", label: "Consistency" },
];

export default function ScoutLeaderboardPage() {
  const [sortKey, setSortKey] = useState<SortKey>("formsCompleted");
  const [stats, setStats] = useState<ScoutStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllScoutStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  const sorted = useMemo(() => {
    return [...stats].sort((a, b) => b[sortKey] - a[sortKey]);
  }, [stats, sortKey]);

  const totalScouts = stats.length;
  const avgAccuracy =
    totalScouts > 0
      ? Math.round(stats.reduce((a, s) => a + s.accuracy, 0) / totalScouts)
      : 0;
  const avgConsistency =
    totalScouts > 0
      ? Math.round(stats.reduce((a, s) => a + s.consistency, 0) / totalScouts)
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Scout Leaderboard</h1>
        <p className="text-muted-foreground">Track scout performance and XP levels</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{totalScouts}</p>
            <p className="text-xs text-muted-foreground">Total Scouts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{avgAccuracy}%</p>
            <p className="text-xs text-muted-foreground">Avg Accuracy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <BarChart3 className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{avgConsistency}%</p>
            <p className="text-xs text-muted-foreground">Avg Consistency</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>Rankings</CardTitle>
          <div className="flex gap-2">
            {sortOptions.map((opt) => (
              <Button
                key={opt.key}
                variant={sortKey === opt.key ? "default" : "outline"}
                size="sm"
                onClick={() => setSortKey(opt.key)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sorted.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No scouts found
            </p>
          )}
          {sorted.map((scout, idx) => (
            <div
              key={scout.accountId}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <Badge className={getRankBadgeColor(idx)}>
                  #{idx + 1}
                </Badge>
                <div>
                  <p className="text-sm font-medium">{scout.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {scout.teamsScouted} teams scouted
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getXpLevelBadgeColor(scout.formsCompleted)}>
                  {getXpLevel(scout.formsCompleted)}
                </Badge>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{scout.formsCompleted} forms</p>
                  <p>{scout.accuracy}% acc</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
