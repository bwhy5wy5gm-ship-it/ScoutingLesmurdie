"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TBAEvent,
  TBATeam,
  TBAMatch,
  TBARanking,
  getCurrentYear,
  getTBAEvents,
  getTBAEventTeams,
  getTBAEventRankings,
  getTBAEventMatches,
  getTBATeam,
  teamNumberFromKey,
  matchTime,
} from "@/lib/tba";
import {
  Loader2,
  Trophy,
  Search,
  ExternalLink,
  Users,
  Target,
  TrendingUp,
} from "lucide-react";

export default function BlueAlliancePage() {
  const year = getCurrentYear();
  const [events, setEvents] = useState<TBAEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [teams, setTeams] = useState<TBATeam[]>([]);
  const [rankings, setRankings] = useState<TBARanking | null>(null);
  const [matches, setMatches] = useState<TBAMatch[]>([]);
  const [search, setSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");
  const [teamDetail, setTeamDetail] = useState<TBATeam | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);

  useEffect(() => {
    getTBAEvents(year).then((e) => {
      setEvents(e);
      setLoadingEvents(false);
    });
  }, [year]);

  useEffect(() => {
    if (!selectedEvent) return;
    setLoadingData(true);
    Promise.all([
      getTBAEventTeams(selectedEvent),
      getTBAEventRankings(selectedEvent),
      getTBAEventMatches(selectedEvent),
    ]).then(([t, r, m]) => {
      setTeams(t);
      setRankings(r);
      setMatches(m);
      setLoadingData(false);
    });
  }, [selectedEvent]);

  const filteredTeams = teams.filter(
    (t) =>
      t.team_number.toString().includes(search) ||
      (t.nickname ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const rankedTeams = rankings?.rankings
    ?.slice()
    .sort((a, b) => a.rank - b.rank);

  const recentMatches = matches
    .filter((m) => m.comp_level === "qm")
    .sort((a, b) => (b.time || 0) - (a.time || 0))
    .slice(0, 20);

  const handleTeamSearch = async () => {
    if (!teamSearch) return;
    setLoadingTeam(true);
    const key = `frc${teamSearch}`;
    const t = await getTBATeam(key);
    setTeamDetail(t);
    setLoadingTeam(false);
  };

  const upcomingMatches = recentMatches.filter(
    (m) => m.red.score === 0 && m.blue.score === 0
  );
  const completedMatches = recentMatches.filter(
    (m) => m.red.score > 0 || m.blue.score > 0
  );

  const filteredEvents = events
    .filter((e) => e.event_type <= 2)
    .filter(
      (e) =>
        e.name.toLowerCase().includes(eventSearch.toLowerCase()) ||
        e.event_code.toLowerCase().includes(eventSearch.toLowerCase()) ||
        e.city?.toLowerCase().includes(eventSearch.toLowerCase()) ||
        e.state_prov?.toLowerCase().includes(eventSearch.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6 px-4 sm:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">The Blue Alliance</h1>
        <p className="text-muted-foreground">
          Live event data from TBA for {year}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Select Event
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events by name, code, city, or state..."
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {loadingEvents ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1 border rounded-lg p-2">
              {filteredEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No events match your search
                </p>
              ) : (
                filteredEvents.map((e) => (
                  <button
                    key={e.key}
                    onClick={() => {
                      setEventSearch("");
                      setSelectedEvent(e.key);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedEvent === e.key
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="font-medium">{e.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {e.event_code.toUpperCase()} &middot;{" "}
                      {[e.city, e.state_prov].filter(Boolean).join(", ")}{" "}
                      &middot; {e.start_date}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedEvent && (
        <Card>
          <CardContent className="py-16 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Select an event to view live data
            </p>
          </CardContent>
        </Card>
      )}

      {selectedEvent && loadingData && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {selectedEvent && !loadingData && (
        <Tabs defaultValue="rankings">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="rankings" className="gap-2">
              <Trophy className="h-4 w-4" /> Rankings
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <Users className="h-4 w-4" /> Teams
            </TabsTrigger>
            <TabsTrigger value="matches" className="gap-2">
              <Target className="h-4 w-4" /> Matches
            </TabsTrigger>
            <TabsTrigger value="lookup" className="gap-2">
              <Search className="h-4 w-4" /> Team Lookup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rankings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Event Rankings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!rankedTeams || rankedTeams.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No rankings available yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {rankedTeams.map((r) => {
                      const num = teamNumberFromKey(r.team_key);
                      const team = teams.find((t) => t.team_number === num);
                      return (
                        <div
                          key={r.team_key}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <Badge
                            className={`w-8 justify-center ${
                              r.rank <= 3
                                ? "bg-yellow-500 text-white"
                                : r.rank <= 8
                                  ? "bg-blue-500 text-white"
                                  : ""
                            }`}
                          >
                            {r.rank}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {num} - {team?.nickname ?? "Unknown"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {r.record.wins}-{r.record.losses}-{r.record.ties}{" "}
                              &middot; {r.qual_points} pts
                            </div>
                          </div>
                          <div className="text-right text-sm flex-shrink-0">
                            <div className="font-bold">
                              {r.sort_orders?.[0]?.toFixed(1) ?? "—"}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              OPR
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by number or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Teams ({filteredTeams.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredTeams.map((t) => (
                    <div
                      key={t.key}
                      className="p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="font-medium truncate">
                        {t.team_number} - {t.nickname ?? t.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {[t.city, t.state_prov, t.country]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                      {t.motto && (
                        <div className="text-xs text-muted-foreground italic mt-1 truncate">
                          &ldquo;{t.motto}&rdquo;
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches" className="space-y-4">
            {upcomingMatches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-500">
                    <TrendingUp className="h-5 w-5" />
                    Upcoming Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {upcomingMatches.map((m) => (
                      <MatchRow key={m.key} match={m} teams={teams} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Recent Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                {completedMatches.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No matches played yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {completedMatches.map((m) => (
                      <MatchRow key={m.key} match={m} teams={teams} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lookup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Lookup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="number"
                    placeholder="Enter team number..."
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTeamSearch()}
                  />
                  <Button onClick={handleTeamSearch} disabled={loadingTeam}>
                    {loadingTeam ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Look Up
                  </Button>
                </div>
                {teamDetail && (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold">
                          {teamDetail.team_number} -{" "}
                          {teamDetail.nickname ?? teamDetail.name}
                        </h3>
                        <p className="text-muted-foreground">
                          {[teamDetail.city, teamDetail.state_prov, teamDetail.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Rookie year: {teamDetail.rookie_year}
                        </p>
                        {teamDetail.motto && (
                          <p className="text-sm italic text-muted-foreground mt-2">
                            &ldquo;{teamDetail.motto}&rdquo;
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" render={<a
                          href={`https://www.thebluealliance.com/team/${teamDetail.team_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        />}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          TBA
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function MatchRow({ match, teams }: { match: TBAMatch; teams: TBATeam[] }) {
  const redScore = match.red.score;
  const blueScore = match.blue.score;
  const isCompleted = redScore > 0 || blueScore > 0;
  const redWin = isCompleted && match.winning_alliance === "red";
  const blueWin = isCompleted && match.winning_alliance === "blue";

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 p-3 rounded-lg border text-sm">
      <div className="flex-1 flex items-center gap-2">
        <Badge variant={redWin ? "destructive" : "outline"} className="w-10 justify-center">
          RED
        </Badge>
        <div className="font-medium min-w-0 truncate">
          {match.red.team_keys
            .map((k) => teamNumberFromKey(k))
            .join(" / ")}
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 px-3 font-bold text-lg flex-shrink-0">
        {isCompleted ? (
          <>
            <span className={redWin ? "text-green-600" : ""}>{redScore}</span>
            <span className="text-muted-foreground">-</span>
            <span className={blueWin ? "text-green-600" : ""}>{blueScore}</span>
          </>
        ) : (
          <span className="text-muted-foreground text-sm">
            {matchTime(match.time)}
          </span>
        )}
      </div>
      <div className="flex-1 flex items-center gap-2 justify-end">
        <div className="font-medium text-right min-w-0 truncate">
          {match.blue.team_keys
            .map((k) => teamNumberFromKey(k))
            .join(" / ")}
        </div>
        <Badge variant={blueWin ? "default" : "outline"} className="w-10 justify-center">
          BLU
        </Badge>
      </div>
    </div>
  );
}
