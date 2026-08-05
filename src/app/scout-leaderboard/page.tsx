"use client";

import { useMemo, useState } from "react";
import { getAllScoutStats } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Target, BarChart3 } from "lucide-react";

type SortKey = "formsCompleted" | "accuracy" | "consistency";

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

  const stats = useMemo(() => getAllScoutStats(), []);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scout Leaderboard</h1>
        <p className="text-muted-foreground">
          Rankings for all scouts based on their scouting activity
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Scouts
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScouts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Accuracy
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAccuracy}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Consistency
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConsistency}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
          </div>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No scouts have submitted any forms yet.
            </p>
          ) : (
            <div className="space-y-2">
              {sorted.map((scout, i) => (
                <div
                  key={scout.accountId}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={`w-8 justify-center ${getRankBadgeColor(i)}`}>
                      {i + 1}
                    </Badge>
                    <div>
                      <div className="font-medium">{scout.username}</div>
                      <div className="text-sm text-muted-foreground">
                        {scout.teamsScouted} teams scouted
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className={getXpLevelBadgeColor(scout.formsCompleted)}>
                      {getXpLevel(scout.formsCompleted)}
                    </Badge>
                    <div className="text-right text-sm">
                      <div>{scout.formsCompleted} forms</div>
                    </div>
                    <div className="text-right text-sm">
                      <div>{scout.accuracy}% acc</div>
                    </div>
                    <div className="text-right text-sm">
                      <div>{scout.consistency}% cons</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
