"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  getAlliancePicks,
  addAlliancePick,
  deleteAlliancePick,
  clearAlliancePicks,
  AlliancePick,
  calculateTeamStats,
} from "@/lib/store";
import { Team } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { Loader2, Trash2, Plus, Handshake } from "lucide-react";

interface TeamWithWarp {
  team: Team;
  avgWarp: number;
}

export default function AllianceSelectionPage() {
  const { account } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [alliancePicks, setAlliancePicks] = useState<AlliancePick[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const t = await getTeams();
      setTeams(t);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!account?.id) return;
    getAlliancePicks("current", account.id).then(setAlliancePicks);
  }, [account?.id]);

  const teamsWithWarp: TeamWithWarp[] = useMemo(() => {
    return teams.map((team) => {
      const stats = calculateTeamStats(team);
      return { team, avgWarp: stats.avgWarpScore };
    });
  }, [teams]);

  const sortedPicks = useMemo(() => {
    return [...alliancePicks].sort((a, b) => b.warpScore - a.warpScore);
  }, [alliancePicks]);

  const pickedTeamIds = new Set(alliancePicks.map((p) => p.teamNumber));

  const availableTeams = teamsWithWarp.filter(
    (tw) => !pickedTeamIds.has(tw.team.number)
  );

  const handleAddTeam = async () => {
    if (!selectedTeamId || !account?.id) return;
    const tw = teamsWithWarp.find((t) => t.team.id === selectedTeamId);
    if (!tw) return;

    const result = await addAlliancePick({
      eventKey: "current",
      teamNumber: tw.team.number,
      teamName: tw.team.name,
      warpScore: tw.avgWarp,
      pickOrder: alliancePicks.length + 1,
      pickedBy: account.username ?? "",
      createdBy: account.id,
    });

    if (!result.error) {
      const updated = await getAlliancePicks("current", account.id);
      setAlliancePicks(updated);
      setSelectedTeamId("");
    }
  };

  const handleRemoveTeam = async (id: string) => {
    await deleteAlliancePick(id);
    if (account?.id) {
      const updated = await getAlliancePicks("current", account.id);
      setAlliancePicks(updated);
    }
  };

  const handleClearAll = async () => {
    if (!account?.id) return;
    await clearAlliancePicks("current", account.id);
    setAlliancePicks([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Handshake className="h-7 w-7" /> Alliance Selection
          </h1>
          <p className="text-muted-foreground">
            Pick teams for your alliance, sorted by WARP score
          </p>
        </div>
        {alliancePicks.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleClearAll}>
            <Trash2 className="h-4 w-4 mr-1" /> Clear All
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={selectedTeamId} onValueChange={(v) => setSelectedTeamId(v ?? "")}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a team..." />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No teams available
                  </SelectItem>
                ) : (
                  availableTeams
                    .sort((a, b) => b.avgWarp - a.avgWarp)
                    .map((tw) => (
                      <SelectItem key={tw.team.id} value={tw.team.id}>
                        {tw.team.number} - {tw.team.name} (WARP: {tw.avgWarp.toFixed(1)})
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
            <Button onClick={handleAddTeam} disabled={!selectedTeamId}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Alliance Picked Teams</span>
            <Badge variant="secondary">{alliancePicks.length} teams</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedPicks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No teams picked yet. Use the dropdown above to add teams.
            </p>
          ) : (
            <div className="space-y-2">
              {sortedPicks.map((pick, i) => (
                <div
                  key={pick.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-8 text-center">
                      {i + 1}
                    </span>
                    <div>
                      <div className="font-semibold">
                        {pick.teamNumber} - {pick.teamName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        WARP Score: {pick.warpScore.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTeam(pick.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
