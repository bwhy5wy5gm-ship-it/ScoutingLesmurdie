"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTeams, updateTeam, calculatePreCompWarpScore, uploadImage } from "@/lib/store";
import { useAuth } from "@/components/auth-provider";
import {
  Team,
  PreCompPhoto,
  PreCompPhotoType,
  PRECOMP_PHOTO_TYPE_LABELS,
  PERFORMANCE_OPINION_OPTIONS,
  STRONGEST_SYSTEM_OPTIONS,
  MAY_STRUGGLE_WITH_OPTIONS,
  PerformanceOpinion,
} from "@/lib/types";
import { Loader2, Save, Search, Trash2, Upload } from "lucide-react";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function FormSlider({
  value,
  onChange,
  min = 0,
  max = 10,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <Badge variant="secondary" className="tabular-nums text-xs font-mono">
        {value}
      </Badge>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-animated w-full h-2 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:w-5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-primary
          [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:duration-150
          [&::-webkit-slider-thumb]:hover:scale-110
          [&::-moz-range-thumb]:h-5
          [&::-moz-range-thumb]:w-5
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-primary
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:shadow-md"
        style={{ "--slider-pct": `${pct}%` } as React.CSSProperties}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
        <span>{min}</span>
        <span>{Math.round((min + max) / 2)}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function Question({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 p-4 rounded-lg border bg-card/50">
      <div className="flex items-start gap-3">
        <Badge className="mt-0.5 shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs">
          {number}
        </Badge>
        <div className="space-y-1 min-w-0">
          <Label className="text-sm font-medium leading-none">{title}</Label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="pl-6 sm:pl-9">{children}</div>
    </div>
  );
}

export default function PreCompPage() {
  const { account, settings } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [photoType, setPhotoType] = useState<PreCompPhotoType>("unit-photo");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTeams().then((data) => {
      setTeams(data);
      setLoading(false);
    });
  }, []);

  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === selectedTeamId) ?? null,
    [teams, selectedTeamId]
  );

  const filtered = teams.filter(
    (t) =>
      t.number.toString().includes(search) ||
      t.name.toLowerCase().includes(search.toLowerCase())
  );

  const progress = useMemo(() => {
    if (!selectedTeam) return 0;
    let count = 0;
    if (selectedTeam.preComp.predictedAuto > 0) count++;
    if (selectedTeam.preComp.predictedTeleop > 0) count++;
    if (selectedTeam.preComp.predictedEndgame > 0) count++;
    if (selectedTeam.preComp.predictedReliability > 0) count++;
    if (selectedTeam.preComp.performanceOpinion) count++;
    if (selectedTeam.preComp.strongestSystem) count++;
    if (selectedTeam.preComp.mayStruggleWith) count++;
    if ((selectedTeam.preComp.preCompPhotos ?? []).length > 0) count++;
    return count;
  }, [selectedTeam]);

  const warpScore = useMemo(() => {
    if (!selectedTeam) return 0;
    return calculatePreCompWarpScore({
      predictedAuto: selectedTeam.preComp.predictedAuto,
      predictedTeleop: selectedTeam.preComp.predictedTeleop,
      predictedEndgame: selectedTeam.preComp.predictedEndgame,
      predictedReliability: selectedTeam.preComp.predictedReliability,
      performanceOpinion: selectedTeam.preComp.performanceOpinion,
    });
  }, [selectedTeam]);

  const updatePreComp = async (field: string, value: number | string | PreCompPhoto[] | string[]) => {
    if (!selectedTeam) return;
    const updatedPreComp = { ...selectedTeam.preComp, [field]: value, scoutName: account?.username ?? settings.scoutName };
    const updated = { ...selectedTeam, preComp: updatedPreComp };
    setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    await updateTeam(updated);
  };

  const handleSave = async () => {
    if (!selectedTeam) return;
    const updated = {
      ...selectedTeam,
      preComp: { ...selectedTeam.preComp, scoutName: account?.username ?? settings.scoutName },
    };
    setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    await updateTeam(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedTeam) return;

    const currentPhotos = selectedTeam.preComp.preCompPhotos ?? [];
    if (currentPhotos.length >= 3) return;

    const remaining = 3 - currentPhotos.length;
    const filesToProcess = Array.from(files).slice(0, remaining);

    for (const file of filesToProcess) {
      const url = await uploadImage(file);
      if (!url) continue;

      const photo: PreCompPhoto = {
        id: generateId(),
        url,
        photoType,
        teamNumber: selectedTeam.number,
        uploadedBy: account?.username ?? settings.scoutName,
        uploadedAt: new Date().toISOString(),
      };
      updatePreComp("preCompPhotos", [
        ...currentPhotos,
        photo,
      ]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (photoId: string) => {
    if (!selectedTeam) return;
    updatePreComp(
      "preCompPhotos",
      (selectedTeam.preComp.preCompPhotos ?? []).filter((p) => p.id !== photoId)
    );
  };

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
        <h1 className="text-2xl sm:text-3xl font-bold">Pre-Competition Scouting</h1>
        <p className="text-muted-foreground">
          Friday Scouting
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="space-y-2 max-h-48 sm:max-h-96 overflow-y-auto">
                {filtered.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedTeamId === team.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="font-medium">
                      {team.number} - {team.name}
                    </div>
                    <div className="text-sm opacity-70">
                      {(team.matches ?? []).length} matches
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No teams found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedTeam ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Team {selectedTeam.number} - {selectedTeam.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Pre-Comp</Badge>
                    <Badge variant="outline" className="text-xs">
                      {progress}/8 Complete
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{Math.round((progress / 8) * 100)}%</span>
                  </div>
                  <Progress value={(progress / 8) * 100} className="h-2" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Question
                  number={1}
                  title="Predicted Auto Score"
                  description="How well will this unit perform in auto?"
                >
                  <FormSlider
                    value={selectedTeam.preComp.predictedAuto}
                    onChange={(v) => updatePreComp("predictedAuto", v)}
                  />
                </Question>

                <Question
                  number={2}
                  title="Predicted Teleop Score"
                  description="How well will this unit perform in teleop?"
                >
                  <FormSlider
                    value={selectedTeam.preComp.predictedTeleop}
                    onChange={(v) => updatePreComp("predictedTeleop", v)}
                  />
                </Question>

                <Question
                  number={3}
                  title="Predicted Endgame Score"
                  description="How well will this unit perform in endgame?"
                >
                  <FormSlider
                    value={selectedTeam.preComp.predictedEndgame}
                    onChange={(v) => updatePreComp("predictedEndgame", v)}
                  />
                </Question>

                <Question
                  number={4}
                  title="Predicted Reliability"
                  description="How reliable do you predict this unit will be?"
                >
                  <FormSlider
                    value={selectedTeam.preComp.predictedReliability}
                    onChange={(v) => updatePreComp("predictedReliability", v)}
                  />
                </Question>

                <Question
                  number={5}
                  title="I feel this unit will perform…"
                  description="Overall opinion of this unit's expected performance."
                >
                  <Select
                    value={selectedTeam.preComp.performanceOpinion}
                    onValueChange={(v) =>
                      updatePreComp("performanceOpinion", v as PerformanceOpinion)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select performance opinion" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERFORMANCE_OPINION_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Question>

                <Question
                  number={6}
                  title="I think this unit's strongest system is…"
                  description="Identify the primary system advantage."
                >
                  <Textarea
                    value={selectedTeam.preComp.strongestSystem}
                    onChange={(e) => updatePreComp("strongestSystem", e.target.value)}
                    placeholder="e.g. Shooter, Intake, Drive train..."
                    rows={2}
                  />
                </Question>

                <Question
                  number={7}
                  title="I feel this unit may struggle with…"
                  description="Identify potential weaknesses or challenges."
                >
                  <Textarea
                    value={selectedTeam.preComp.mayStruggleWith}
                    onChange={(e) => updatePreComp("mayStruggleWith", e.target.value)}
                    placeholder="e.g. Shooting under pressure, Endgame consistency..."
                    rows={2}
                  />
                </Question>

                <Question
                  number={8}
                  title="Pre-Comp Photo Upload"
                  description="Upload 2-3 photos of this unit before the event."
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={photoType}
                        onValueChange={(v) =>
                          setPhotoType(v as PreCompPhotoType)
                        }
                      >
                        <SelectTrigger className="w-[170px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unit-photo">Unit Photo</SelectItem>
                          <SelectItem value="system-closeup">System Close-Up</SelectItem>
                          <SelectItem value="sensor-layout">Sensor Layout</SelectItem>
                          <SelectItem value="auto-path">Auto Path</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={(selectedTeam.preComp.preCompPhotos ?? []).length >= 3}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ position: "absolute", left: "-9999px", opacity: 0 }}
                        onChange={handlePhotoUpload}
                      />
                    </div>

                    {(selectedTeam.preComp.preCompPhotos ?? []).length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(selectedTeam.preComp.preCompPhotos ?? []).map((photo) => (
                          <div
                            key={photo.id}
                            className="relative group rounded-lg border overflow-hidden"
                          >
                            <Image
                              src={photo.url}
                              alt="Pre-comp photo"
                              width={200}
                              height={112}
                              unoptimized
                              className="w-full h-28 object-cover"
                            />
                            <div className="absolute top-1 left-1">
                              <Badge className="text-[9px] capitalize">
                                {PRECOMP_PHOTO_TYPE_LABELS[photo.photoType]}
                              </Badge>
                            </div>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                              onClick={() => removePhoto(photo.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-2 py-1 text-[10px] text-muted-foreground">
                              {photo.uploadedBy}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {(selectedTeam.preComp.preCompPhotos ?? []).length === 0 && (
                      <p className="text-muted-foreground text-center py-2 text-xs">
                        No pre-comp photos uploaded yet (2-3 recommended)
                      </p>
                    )}
                  </div>
                </Question>

                <div className="space-y-2 pt-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={selectedTeam.preComp.notes}
                    onChange={(e) => updatePreComp("notes", e.target.value)}
                    placeholder="Add scouting notes about this team..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Video Links</Label>
                  <div className="space-y-2">
                    {(selectedTeam.preComp.videoLinks ?? []).map((link, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={link}
                          onChange={(e) => {
                            const links = [...(selectedTeam.preComp.videoLinks ?? [])];
                            links[i] = e.target.value;
                            updatePreComp("videoLinks", links);
                          }}
                          placeholder="https://youtube.com/..."
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const links = (selectedTeam.preComp.videoLinks ?? []).filter(
                              (_, j) => j !== i
                            );
                            updatePreComp("videoLinks", links);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const links = [...(selectedTeam.preComp.videoLinks ?? []), ""];
                        updatePreComp("videoLinks", links);
                      }}
                    >
                      Add Video Link
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">WARP Score</Label>
                    <Badge variant="secondary" className="text-lg font-mono tabular-nums">
                      {warpScore}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Calculated from slider averages and performance opinion
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    {saved ? "Saved!" : "Save Pre-Comp Data"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                Select a team from the list to edit pre-competition data
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
