"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getTeams, addTeam, deleteTeam, calculateTeamStats } from "@/lib/store";
import { Team } from "@/lib/types";
import { Plus, Search, Trash2, Users, Loader2 } from "lucide-react";
import Link from "next/link";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({
    number: "",
    name: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeams().then(setTeams).finally(() => setLoading(false));
  }, []);

  const filtered = teams.filter(
    (t) =>
      t.number.toString().includes(search) ||
      t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newTeam.number || !newTeam.name) return;
    setError("");

    const team: Team = {
      id: "",
      number: Number(newTeam.number),
      name: newTeam.name,
      notes: newTeam.notes,
      installNotes: "",
      driveType: "other",
      photos: [],
      preComp: {
        predictedAuto: 0,
        predictedTeleop: 0,
        predictedEndgame: 0,
        predictedReliability: 0,
        performanceOpinion: "Average" as const,
        strongestSystem: "",
        mayStruggleWith: "",
        driveSystem: "swerve" as const,
        notes: "",
        videoLinks: [],
        preCompPhotos: [],
        scoutName: "",
      },
      matches: [],
    };

    const result = await addTeam(team);
    if (result.error) {
      setError(result.error);
      return;
    }
    const updated = await getTeams();
    setTeams(updated);
    setNewTeam({ number: "", name: "", notes: "" });
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteTeam(id);
    const updated = await getTeams();
    setTeams(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">
            Manage teams and view their profiles
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" />
              Add Team
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Team Number</Label>
                <Input
                  type="number"
                  value={newTeam.number}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, number: e.target.value })
                  }
                  placeholder="e.g. 254"
                />
              </div>
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input
                  value={newTeam.name}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, name: e.target.value })
                  }
                  placeholder="e.g. The Cheesy Poofs"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={newTeam.notes}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, notes: e.target.value })
                  }
                  placeholder="Initial notes about this team..."
                  rows={3}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={handleAdd} className="w-full">
                Add Team
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by number or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 sm:py-16 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {teams.length === 0
                ? "No teams yet. Click Add Team to get started."
                : "No teams match your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((team) => {
            const stats = calculateTeamStats(team);
            return (
              <Card key={team.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between min-w-0">
                    <Link href={`/teams/${team.id}`} className="hover:underline min-w-0">
                      <CardTitle className="truncate">
                        {team.number} - {team.name}
                      </CardTitle>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(team.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <div className="text-muted-foreground">Auto</div>
                      <div className="font-medium">{stats.avgAuto}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Teleop</div>
                      <div className="font-medium">{stats.avgTeleop}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Endgame</div>
                      <div className="font-medium">{stats.avgEndgame}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="secondary">
                      {stats.totalMatches} matches
                    </Badge>
                    <Badge variant="outline">
                      Rating: {stats.overallRating}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
