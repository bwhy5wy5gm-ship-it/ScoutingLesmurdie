"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  getTeam,
  updateTeam,
  calculateTeamStats,
  getSettings,
  recommendRole,
  calculateStability,
  hasReliabilityDrop,
  suggestPhotoLabel,
} from "@/lib/store";
import {
  Photo,
  PhotoType,
  PHOTO_TYPE_LABELS,
  TrialPhoto,
} from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import {
  ArrowLeft,
  Save,
  Upload,
  Trash2,
  Image as ImageIcon,
  BarChart3,
  FileText,
  Camera,
  X,
  Calendar,
  User,
  AlertTriangle,
} from "lucide-react";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function TeamProfilePage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;
  const [refreshKey, setRefreshKey] = useState(0);
  const [team, setTeam] = useState<import("@/lib/types").Team | null>(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [notes, setNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoType, setPhotoType] = useState<PhotoType>("robot");
  const [filterType, setFilterType] = useState<PhotoType | "all">("all");
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    async function load() {
      const t = await getTeam(teamId);
      setTeam(t ?? null);
      if (t) setNotes(t.notes ?? "");
      const s = await getSettings();
      setSettings(s);
    }
    load();
  }, [teamId, refreshKey]);

  if (!team) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Team not found</p>
        <Button variant="link" onClick={() => router.push("/teams")}>
          Back to Teams
        </Button>
      </div>
    );
  }

  const stats = calculateTeamStats(team);

  const driveSystem =
    team.preComp?.driveSystem ??
    (team.matches ?? []).slice(-1)[0]?.driveSystem ??
    "other";

  const driveSystemLabel =
    driveSystem === "swerve"
      ? "Swerve"
      : driveSystem === "tank"
        ? "Tank"
        : "Other";

  const role = recommendRole(stats);
  const stability = calculateStability(team);
  const reliabilityAlert = hasReliabilityDrop(team);

  const stabilityColor =
    stability === "Stable"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : stability === "Semi-Stable"
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";

  const allTrialPhotos: (TrialPhoto & { source: "trial" })[] =
    (team.matches ?? []).flatMap((m) =>
      (m.trialPhotos ?? []).map((p) => ({ ...p, source: "trial" as const }))
    );
  const allPhotos: {
    id: string;
    url: string;
    photoType: string;
    uploadedBy: string;
    uploadedAt: string;
    source: "team" | "trial";
    label?: string;
  }[] = [
    ...((team.photos ?? []).map((p) => ({ ...p, source: "team" as const }))),
    ...allTrialPhotos,
  ];

  const filteredPhotos =
    filterType === "all"
      ? allPhotos
      : allPhotos.filter((p) => p.photoType === filterType);

  const photoCounts = {
    all: allPhotos.length,
    robot: allPhotos.filter((p) => p.photoType === "robot").length,
    intake: allPhotos.filter((p) => p.photoType === "intake").length,
    shooter: allPhotos.filter((p) => p.photoType === "shooter").length,
    "auto-path": allPhotos.filter((p) => p.photoType === "auto-path").length,
  };

  const suggestedPhotoType = suggestPhotoLabel(allTrialPhotos);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentTeam = await getTeam(params.teamId as string);
    if (!currentTeam) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const photo: Photo = {
          id: generateId(),
          url: ev.target?.result as string,
          label: file.name.replace(/\.[^/.]+$/, ""),
          photoType,
          teamNumber: currentTeam.number,
          uploadedBy: settings.scoutName,
          uploadedAt: new Date().toISOString(),
        };
        const updated = {
          ...currentTeam,
          photos: [...(currentTeam.photos ?? []), photo],
        };
        updateTeam(updated);
        setRefreshKey((k) => k + 1);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeletePhoto = async (photoId: string) => {
    const currentTeam = await getTeam(params.teamId as string);
    if (!currentTeam) return;
    const updated = {
      ...currentTeam,
      photos: (currentTeam.photos ?? []).filter((p) => p.id !== photoId),
    };
    await updateTeam(updated);
    setRefreshKey((k) => k + 1);
    if (previewPhoto?.id === photoId) setPreviewPhoto(null);
  };

  const handleSaveNotes = async () => {
    const updated = { ...team, notes };
    await updateTeam(updated);
    setRefreshKey((k) => k + 1);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">
              {team.number} - {team.name}
            </h1>
            <Badge variant="secondary" className="capitalize">
              {driveSystemLabel}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {(team.matches ?? []).length} matches scouted &middot; {allPhotos.length}{" "}
            photos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats.avgAuto}</div>
            <div className="text-sm text-muted-foreground">Avg Auto</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats.avgTeleop}</div>
            <div className="text-sm text-muted-foreground">Avg Teleop</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats.avgEndgame}</div>
            <div className="text-sm text-muted-foreground">Avg Endgame</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats.avgReliability}</div>
            <div className="text-sm text-muted-foreground">Avg Reliability</div>
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold warp-score glass-accent">
              {stats.avgWarpScore}
            </div>
            <div className="text-sm text-muted-foreground">Avg WARP Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats.overallRating}</div>
            <div className="text-sm text-muted-foreground">Overall Rating</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="text-sm">
          Recommended Role: {role}
        </Badge>
        <Badge className={`text-sm ${stabilityColor}`}>
          Stability: {stability}
        </Badge>
      </div>

      {reliabilityAlert.alert && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300">
          <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
          <p>{reliabilityAlert.message}</p>
        </div>
      )}

      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Stats
          </TabsTrigger>
          <TabsTrigger value="photos" className="gap-2">
            <ImageIcon className="h-4 w-4" /> Photos
          </TabsTrigger>
          <TabsTrigger value="matches" className="gap-2">
            <FileText className="h-4 w-4" /> Matches
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <FileText className="h-4 w-4" /> Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Avg Auto
                  </div>
                  <div className="text-lg font-medium">
                    {stats.avgAuto}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Avg Teleop
                  </div>
                  <div className="text-lg font-medium">
                    {stats.avgTeleop}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Avg Endgame
                  </div>
                  <div className="text-lg font-medium">
                    {stats.avgEndgame}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Avg Cycle Efficiency
                  </div>
                  <div className="text-lg font-medium">
                    {stats.avgCycleEfficiency}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Avg Reliability
                  </div>
                  <div className="text-lg font-medium">
                    {stats.avgReliability}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Avg WARP Score
                  </div>
                  <div className="text-lg font-medium warp-score glass-accent">
                    {stats.avgWarpScore}
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Pre-Comp Predictions</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Auto:</span>{" "}
                    {team.preComp.predictedAuto}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Teleop:</span>{" "}
                    {team.preComp.predictedTeleop}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Endgame:</span>{" "}
                    {team.preComp.predictedEndgame}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Photo Gallery
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select
                    value={photoType}
                    onValueChange={(v) => setPhotoType(v as PhotoType)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="robot">Robot</SelectItem>
                      <SelectItem value="intake">Intake</SelectItem>
                      <SelectItem value="shooter">Shooter</SelectItem>
                      <SelectItem value="auto-path">Auto Path</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Suggested: {suggestedPhotoType}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(
                  ["all", "robot", "intake", "shooter", "auto-path"] as const
                ).map((type) => (
                  <Button
                    key={type}
                    variant={filterType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType(type)}
                    className="text-xs"
                  >
                    {type === "all" ? "All" : PHOTO_TYPE_LABELS[type]}
                    <Badge
                      variant="secondary"
                      className="ml-1.5 px-1.5 py-0 text-[10px]"
                    >
                      {photoCounts[type]}
                    </Badge>
                  </Button>
                ))}
              </div>

              {filteredPhotos.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {filterType === "all"
                      ? "No photos uploaded yet"
                      : `No ${filterType.replace("-", " ")} photos`}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload from team profile or during trial scouting
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPhotos.map((photo) => {
                    const typeLabel =
                      "photoType" in photo
                        ? photo.photoType === "robot"
                          ? "Robot"
                          : photo.photoType === "intake"
                          ? "Intake"
                          : photo.photoType === "shooter"
                          ? "Shooter"
                          : "Auto Path"
                        : "Photo";
                    return (
                    <div
                      key={photo.id}
                      className="relative group rounded-lg border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => setPreviewPhoto(photo as unknown as Photo)}
                    >
                      <Image
                        src={photo.url}
                        alt={"label" in photo ? (photo.label ?? "Trial photo") : "Trial photo"}
                        width={300}
                        height={192}
                        unoptimized
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute top-2 left-2 flex gap-1">
                        <Badge className="text-[10px] capitalize">
                          {typeLabel}
                        </Badge>
                        {"source" in photo && photo.source === "trial" && (
                          <Badge variant="secondary" className="text-[10px]">
                            Trial
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(photo.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-white text-sm font-medium truncate">
                          {"label" in photo ? photo.label : "Trial Photo"}
                        </div>
                        <div className="flex items-center gap-2 text-white/70 text-xs mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {formatDate(photo.uploadedAt)}
                          <span className="text-white/50">&middot;</span>
                          <User className="h-3 w-3" />
                          {photo.uploadedBy}
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

        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Match History</CardTitle>
            </CardHeader>
            <CardContent>
              {(team.matches ?? []).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No matches recorded yet
                </p>
              ) : (
                <div className="space-y-2">
                  {(team.matches ?? [])
                    .sort((a, b) => b.matchNumber - a.matchNumber)
                    .map((match) => (
                      <div
                        key={match.id}
                        className="p-4 rounded-lg border space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={
                                match.alliance === "red"
                                  ? "destructive"
                                  : "default"
                              }
                            >
                              {match.alliance.toUpperCase()}
                            </Badge>
                            <div>
                              <div className="font-medium">
                                Match {match.matchNumber}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                by {match.scoutName}
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div>
                              Auto: {match.autoScore} | Tele:{" "}
                              {match.teleopScore} | End: {match.endgameScore}
                            </div>
                            <div className="text-muted-foreground">
                              Efficiency: {match.cycleEfficiency} | Reliability:{" "}
                              {match.reliabilityRating}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">
                            Opinion: {match.performanceOpinion}
                          </Badge>
                          <Badge variant="outline">
                            Alliance: {match.allianceConsideration}
                          </Badge>
                          <Badge variant="outline">
                            Reliability: {match.reliabilityRating}
                          </Badge>
                          <Badge variant="outline" className="warp-score glass-accent">
                            WARP: {match.warpScore}
                          </Badge>
                          {match.conditionalMalfunctioned && (
                            <Badge variant="destructive">
                              Malfunctioned
                            </Badge>
                          )}
                          {match.conditionalAutoFailed && (
                            <Badge variant="destructive">
                              Auto Failed
                            </Badge>
                          )}
                          {match.conditionalEndgameAttempted && (
                            <Badge variant="default">
                              Endgame Attempted
                            </Badge>
                          )}
                          {(match.trialPhotos ?? []).length > 0 && (
                            <Badge variant="secondary">
                              {(match.trialPhotos ?? []).length} photo(s)
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm space-y-1">
                          {match.biggestStrength && (
                            <p>
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                Strength:
                              </span>{" "}
                              {match.biggestStrength}
                            </p>
                          )}
                          {match.unitStruggledWith && (
                            <p>
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                Struggled With:
                              </span>{" "}
                              {match.unitStruggledWith}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this team..."
                rows={8}
              />
              <Button onClick={handleSaveNotes}>
                <Save className="mr-2 h-4 w-4" />
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!previewPhoto}
        onOpenChange={() => setPreviewPhoto(null)}
      >
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
          {previewPhoto && (
            <div className="flex flex-col">
              <div className="relative">
                <Image
                  src={previewPhoto.url}
                  alt={previewPhoto.label ?? "Preview"}
                  width={800}
                  height={600}
                  unoptimized
                  className="w-full max-h-[60vh] object-contain bg-black"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-white hover:text-white/80"
                  onClick={() => setPreviewPhoto(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-lg">{previewPhoto.label}</h3>
                  <Badge className="capitalize">
                    {PHOTO_TYPE_LABELS[previewPhoto.photoType]}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(previewPhoto.uploadedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {previewPhoto.uploadedBy}
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-2"
                  onClick={() => handleDeletePhoto(previewPhoto.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Photo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
