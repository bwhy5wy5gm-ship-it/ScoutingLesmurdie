"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamMatch, SCOUT_TEAMS } from "@/lib/types";
import {
  getTeamMatches,
  addTeamMatch,
  deleteTeamMatch,
} from "@/lib/store";
import { useAuth } from "@/components/auth-provider";
import {
  Loader2,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Users,
  Hash,
} from "lucide-react";

type DayKey = "friday" | "saturday" | "sunday";

const DAY_LABELS: Record<DayKey, string> = {
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const DAY_COLORS: Record<DayKey, string> = {
  friday: "bg-blue-500",
  saturday: "bg-orange-500",
  sunday: "bg-green-500",
};

export default function TeamMatchesPage() {
  const { account } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [matches, setMatches] = useState<TeamMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeDay, setActiveDay] = useState<DayKey>("friday");

  const [newMatch, setNewMatch] = useState({
    matchNumber: "",
    time: "",
    alliance: "red" as "red" | "blue",
    startPosition: "1" as "1" | "2" | "3",
  });

  useEffect(() => {
    if (!selectedTeam) {
      setMatches([]);
      return;
    }
    setLoading(true);
    getTeamMatches(selectedTeam).then((m) => {
      setMatches(m);
      setLoading(false);
    });
  }, [selectedTeam]);

  const handleAddMatch = async () => {
    if (!selectedTeam || !newMatch.matchNumber) return;

    const team = SCOUT_TEAMS.find((t) => t.number === selectedTeam);
    if (!team) return;

    const result = await addTeamMatch({
      teamNumber: selectedTeam,
      teamName: team.name,
      matchNumber: parseInt(newMatch.matchNumber),
      day: activeDay,
      time: newMatch.time,
      alliance: newMatch.alliance,
      startPosition: parseInt(newMatch.startPosition) as 1 | 2 | 3,
      createdBy: account?.id ?? "",
    });

    if (!result.error) {
      const updated = await getTeamMatches(selectedTeam);
      setMatches(updated);
      setNewMatch({ matchNumber: "", time: "", alliance: "red", startPosition: "1" });
      setDialogOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTeamMatch(id);
    if (selectedTeam) {
      const updated = await getTeamMatches(selectedTeam);
      setMatches(updated);
    }
  };

  const getMatchesForDay = (day: DayKey) =>
    matches.filter((m) => m.day === day).sort((a, b) => a.matchNumber - b.matchNumber);

  const team = SCOUT_TEAMS.find((t) => t.number === selectedTeam);

  return (
    <div className="space-y-6 px-4 sm:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Team Matches</h1>
        <p className="text-muted-foreground">
          Track match schedules for your teams across the event
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SCOUT_TEAMS.map((t) => (
          <button
            key={t.number}
            onClick={() => setSelectedTeam(t.number)}
            className={`p-4 rounded-lg border text-left transition-colors ${
              selectedTeam === t.number
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            <div className="font-bold text-lg">{t.number}</div>
            <div className="text-sm truncate">{t.name}</div>
          </button>
        ))}
      </div>

      {selectedTeam && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{team?.name}</h2>
              <Badge variant="secondary">{selectedTeam}</Badge>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger render={<Button />}>
                <Plus className="mr-2 h-4 w-4" />
                Add Match
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Match - {DAY_LABELS[activeDay]}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Match Number</Label>
                    <Input
                      type="number"
                      value={newMatch.matchNumber}
                      onChange={(e) =>
                        setNewMatch({ ...newMatch, matchNumber: e.target.value })
                      }
                      placeholder="e.g. 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      value={newMatch.time}
                      onChange={(e) =>
                        setNewMatch({ ...newMatch, time: e.target.value })
                      }
                      placeholder="e.g. 2:30 PM"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Alliance</Label>
                      <Select
                        value={newMatch.alliance}
                        onValueChange={(v) =>
                          setNewMatch({ ...newMatch, alliance: v as "red" | "blue" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="red">Red</SelectItem>
                          <SelectItem value="blue">Blue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Start Position</Label>
                      <Select
                        value={newMatch.startPosition}
                        onValueChange={(v) =>
                          setNewMatch({ ...newMatch, startPosition: v as "1" | "2" | "3" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleAddMatch} className="w-full">
                    Add Match
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs value={activeDay} onValueChange={(v) => setActiveDay(v as DayKey)}>
              <TabsList className="overflow-x-auto">
                <TabsTrigger value="friday" className="gap-2">
                  <span className={`h-2 w-2 rounded-full ${DAY_COLORS.friday}`} />
                  Friday
                </TabsTrigger>
                <TabsTrigger value="saturday" className="gap-2">
                  <span className={`h-2 w-2 rounded-full ${DAY_COLORS.saturday}`} />
                  Saturday
                </TabsTrigger>
                <TabsTrigger value="sunday" className="gap-2">
                  <span className={`h-2 w-2 rounded-full ${DAY_COLORS.sunday}`} />
                  Sunday
                </TabsTrigger>
              </TabsList>

              {(["friday", "saturday", "sunday"] as DayKey[]).map((day) => (
                <TabsContent key={day} value={day} className="space-y-3">
                  {getMatchesForDay(day).length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">
                          No matches for {DAY_LABELS[day]}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Click &ldquo;Add Match&rdquo; to add one
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    getMatchesForDay(day).map((m) => (
                      <Card key={m.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Badge
                                variant={m.alliance === "red" ? "destructive" : "default"}
                                className="w-10 justify-center flex-shrink-0"
                              >
                                {m.alliance === "red" ? "RED" : "BLU"}
                              </Badge>
                              <div className="min-w-0">
                                <div className="font-medium flex items-center gap-2">
                                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                                  Match {m.matchNumber}
                                  <Badge variant="outline" className="text-xs">
                                    Pos {m.startPosition}
                                  </Badge>
                                </div>
                                {m.time && (
                                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {m.time}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                              onClick={() => handleDelete(m.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </>
      )}

      {!selectedTeam && (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Select a team to view and manage matches
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
