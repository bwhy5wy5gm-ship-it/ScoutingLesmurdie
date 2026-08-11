"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import {
  addMatchToTeam,
  getTeams,
  calculateWarpScore,
  suggestPhotoLabel,
} from "@/lib/store";
import { useAuth } from "@/components/auth-provider";
import {
  Team,
  MatchData,
  TrialPhoto,
  TrialPhotoType,
  TRIAL_PHOTO_TYPE_LABELS,
  PerformanceOpinion,
  PERFORMANCE_OPINION_OPTIONS,
  STRENGTH_OPTIONS,
  STRUGGLE_OPTIONS,
  AllianceConsideration,
  DriveSystem,
  DRIVE_SYSTEM_OPTIONS,
} from "@/lib/types";
import {
  Send,
  Search,
  CheckCircle,
  Trash2,
  Upload,
  Zap,
  Loader2,
} from "lucide-react";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const DRAFT_KEY = "frc-scout-incomp-draft";

interface DraftState {
  teamId: string;
  matchNumber: number;
  alliance: "red" | "blue";
  autoScore: number;
  teleopScore: number;
  endgameScore: number;
  cycleEfficiency: number;
  reliabilityRating: number;
  performanceOpinion: PerformanceOpinion;
  biggestStrength: string;
  unitStruggledWith: string;
  allianceConsideration: AllianceConsideration;
  conditionalMalfunctioned: boolean;
  conditionalAutoFailed: boolean;
  conditionalEndgameAttempted: boolean;
  driveSystem: DriveSystem;
}

const DEFAULT_DRAFT: DraftState = {
  teamId: "",
  matchNumber: 1,
  alliance: "red",
  autoScore: 0,
  teleopScore: 0,
  endgameScore: 0,
  cycleEfficiency: 0,
  reliabilityRating: 0,
  performanceOpinion: "Average",
  biggestStrength: "",
  unitStruggledWith: "",
  allianceConsideration: "Maybe",
  conditionalMalfunctioned: false,
  conditionalAutoFailed: false,
  conditionalEndgameAttempted: false,
  driveSystem: "swerve",
};

function loadDraft(): DraftState {
  if (typeof window === "undefined") return DEFAULT_DRAFT;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? { ...DEFAULT_DRAFT, ...JSON.parse(raw) } : DEFAULT_DRAFT;
  } catch {
    return DEFAULT_DRAFT;
  }
}

function saveDraft(draft: DraftState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function clearDraft() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}

function FormSlider({
  value,
  onChange,
  min = 0,
  max = 10,
  suffix = "",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <Badge variant="secondary" className="tabular-nums text-xs font-mono">
        {value}{suffix}
      </Badge>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-animated w-full h-2 rounded-full appearance-none cursor-pointer
          bg-primary/20
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

export default function InCompPage() {
  const { account, settings } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeams().then((data) => {
      setTeams(data);
      setLoading(false);
    });
  }, []);
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [draft, setDraft] = useState<DraftState>(() => loadDraft());
  const [trialPhotos, setTrialPhotos] = useState<TrialPhoto[]>([]);
  const [photoType, setPhotoType] = useState<TrialPhotoType>("general");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const updateDraft = (patch: Partial<DraftState>) => {
    setTouched(true);
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      saveDraft(next);
      return next;
    });
  };

  const filtered = useMemo(
    () =>
      (teams ?? []).filter(
        (t) =>
          t.number.toString().includes(search) ||
          t.name.toLowerCase().includes(search.toLowerCase())
      ),
    [teams, search]
  );

  const completedCount = useMemo(() => {
    let count = 0;
    if (draft.autoScore > 0) count++;
    if (draft.teleopScore > 0) count++;
    if (draft.endgameScore > 0) count++;
    if (draft.cycleEfficiency > 0) count++;
    if (draft.reliabilityRating > 0) count++;
    if (draft.performanceOpinion !== "Average") count++;
    if (draft.biggestStrength !== "") count++;
    if (draft.unitStruggledWith !== "") count++;
    if (draft.allianceConsideration !== "Maybe") count++;
    if (draft.driveSystem !== "swerve") count++;
    if (trialPhotos.length > 0) count++;
    return count;
  }, [draft, trialPhotos]);

  const warpScore = useMemo(
    () =>
      calculateWarpScore({
        autoScore: draft.autoScore,
        teleopScore: draft.teleopScore,
        endgameScore: draft.endgameScore,
        cycleEfficiency: draft.cycleEfficiency,
        reliabilityRating: draft.reliabilityRating,
        performanceOpinion: draft.performanceOpinion,
      }),
    [
      draft.autoScore,
      draft.teleopScore,
      draft.endgameScore,
      draft.cycleEfficiency,
      draft.reliabilityRating,
      draft.performanceOpinion,
    ]
  );

  const handleSliderChange = (field: string, value: number) => {
    updateDraft({ [field]: value } as Partial<DraftState>);
    if (value >= 8) {
      const suggestions: Record<string, string> = {
        autoScore: "Accuracy likely high — set Accuracy slider next.",
        teleopScore: "Great teleop — consider setting Endgame next.",
        endgameScore: "Strong endgame — set Reliability next.",
        cycleEfficiency: "Fast cycles — set Auto next.",
        reliabilityRating: "Reliable unit — set Teleop next.",
      };
      setActiveSuggestion(suggestions[field] ?? null);
    } else {
      setActiveSuggestion(null);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentTeam = teams.find((t) => t.id === draft.teamId);
    if (!currentTeam) return;

    if (trialPhotos.length + files.length > 5) {
      return;
    }

    const trialId = generateId();

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const photo: TrialPhoto = {
          id: generateId(),
          url: ev.target?.result as string,
          photoType,
          uploadedBy: account?.username ?? settings.scoutName,
          uploadedAt: new Date().toISOString(),
          trialId,
          teamNumber: currentTeam.number,
        };
        setTrialPhotos((prev) => [...prev, photo]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeTrialPhoto = (id: string) => {
    setTrialPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async () => {
    if (!draft.teamId) return;

    const match: MatchData = {
      id: generateId(),
      matchNumber: draft.matchNumber,
      alliance: draft.alliance,
      autoScore: draft.autoScore,
      teleopScore: draft.teleopScore,
      endgameScore: draft.endgameScore,
      cycleEfficiency: draft.cycleEfficiency,
      reliabilityRating: draft.reliabilityRating,
      performanceOpinion: draft.performanceOpinion,
      biggestStrength: draft.biggestStrength,
      unitStruggledWith: draft.unitStruggledWith,
      allianceConsideration: draft.allianceConsideration,
      warpScore,
      conditionalMalfunctioned: draft.conditionalMalfunctioned,
      conditionalAutoFailed: draft.conditionalAutoFailed,
      conditionalEndgameAttempted: draft.conditionalEndgameAttempted,
      driveSystem: draft.driveSystem,
      trialPhotos,
      scoutName: account?.username ?? settings.scoutName,
      timestamp: new Date().toISOString(),
    };

    await addMatchToTeam(draft.teamId, match);
    const updated = await getTeams();
    setTeams(updated);
    clearDraft();

    setDraft({
      ...DEFAULT_DRAFT,
      teamId: draft.teamId,
      matchNumber: draft.matchNumber + 1,
      alliance: draft.alliance,
    });
    setTrialPhotos([]);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  const hasMissingRequired = useMemo(() => {
    if (!touched) return false;
    return (
      draft.autoScore === 0 ||
      draft.teleopScore === 0 ||
      draft.endgameScore === 0 ||
      draft.cycleEfficiency === 0 ||
      draft.reliabilityRating === 0 ||
      draft.performanceOpinion === "Average" ||
      draft.biggestStrength === "" ||
      draft.unitStruggledWith === "" ||
      draft.allianceConsideration === "Maybe"
    );
  }, [draft, touched]);

  const suggestedPhotoType = useMemo(
    () => suggestPhotoLabel(trialPhotos),
    [trialPhotos]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">In-Comp Scouting</h1>
        <p className="text-muted-foreground">
          Saturday and Sunday Scouting
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
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
              <div className="space-y-2 max-h-40 sm:max-h-64 overflow-y-auto">
                {(filtered ?? []).map((team) => (
                  <button
                    key={team.id}
                    onClick={() => updateDraft({ teamId: team.id })}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      draft.teamId === team.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="font-medium">
                      {team.number} - {team.name}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                WARP Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold text-center py-4 tabular-nums">
                {warpScore.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Calculated from slider ratings and performance opinion
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Match Data Entry
                  {submitted && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {completedCount}/11 Questions
                </Badge>
              </div>
              <Progress value={(completedCount / 11) * 100}>
                <ProgressLabel>Progress</ProgressLabel>
                <ProgressValue />
              </Progress>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Match Number
                  </Label>
                  <Input
                    type="number"
                    value={draft.matchNumber}
                    onChange={(e) =>
                      updateDraft({ matchNumber: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Alliance
                  </Label>
                  <Select
                    value={draft.alliance}
                    onValueChange={(v) =>
                      updateDraft({ alliance: (v ?? "red") as "red" | "blue" })
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
              </div>

              <Question
                number={1}
                title="Auto Performance Score"
                description="How well did the unit perform in auto?"
              >
                <FormSlider
                  value={draft.autoScore}
                  onChange={(v) => handleSliderChange("autoScore", v)}
                />
                {activeSuggestion && (
                  <Badge variant="secondary" className="text-xs text-muted-foreground mt-2">
                    {activeSuggestion}
                  </Badge>
                )}
              </Question>

              {draft.autoScore < 4 && (
                <div className="pl-9 p-3 rounded-lg border border-dashed bg-muted/30 space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Did auto fail to start?
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={draft.conditionalAutoFailed ? "default" : "outline"}
                      onClick={() => updateDraft({ conditionalAutoFailed: true })}
                    >
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant={!draft.conditionalAutoFailed ? "default" : "outline"}
                      onClick={() => updateDraft({ conditionalAutoFailed: false })}
                    >
                      No
                    </Button>
                  </div>
                </div>
              )}

              <Question
                number={2}
                title="Teleop Performance Score"
                description="How well did the unit perform in teleop?"
              >
                <FormSlider
                  value={draft.teleopScore}
                  onChange={(v) => handleSliderChange("teleopScore", v)}
                />
                {activeSuggestion && (
                  <Badge variant="secondary" className="text-xs text-muted-foreground mt-2">
                    {activeSuggestion}
                  </Badge>
                )}
              </Question>

              <Question
                number={3}
                title="Endgame Performance Score"
                description="How well did the unit perform in endgame?"
              >
                <FormSlider
                  value={draft.endgameScore}
                  onChange={(v) => handleSliderChange("endgameScore", v)}
                />
                {activeSuggestion && (
                  <Badge variant="secondary" className="text-xs text-muted-foreground mt-2">
                    {activeSuggestion}
                  </Badge>
                )}
              </Question>

              {draft.endgameScore < 3 && (
                <div className="pl-9 p-3 rounded-lg border border-dashed bg-muted/30 space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Did the unit attempt endgame?
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={!draft.conditionalEndgameAttempted ? "default" : "outline"}
                      onClick={() => updateDraft({ conditionalEndgameAttempted: false })}
                    >
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant={draft.conditionalEndgameAttempted ? "default" : "outline"}
                      onClick={() => updateDraft({ conditionalEndgameAttempted: true })}
                    >
                      No
                    </Button>
                  </div>
                </div>
              )}

              <Question
                number={4}
                title="Cycle Efficiency"
                description="How efficient were the unit's cycles?"
              >
                <FormSlider
                  value={draft.cycleEfficiency}
                  onChange={(v) => handleSliderChange("cycleEfficiency", v)}
                />
                {activeSuggestion && (
                  <Badge variant="secondary" className="text-xs text-muted-foreground mt-2">
                    {activeSuggestion}
                  </Badge>
                )}
              </Question>

              <Question
                number={5}
                title="Reliability Rating"
                description="How reliable was the unit overall?"
              >
                <FormSlider
                  value={draft.reliabilityRating}
                  onChange={(v) => handleSliderChange("reliabilityRating", v)}
                />
                {activeSuggestion && (
                  <Badge variant="secondary" className="text-xs text-muted-foreground mt-2">
                    {activeSuggestion}
                  </Badge>
                )}
              </Question>

              {draft.reliabilityRating < 5 && (
                <div className="pl-9 p-3 rounded-lg border border-dashed bg-muted/30 space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Did the unit malfunction?
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={draft.conditionalMalfunctioned ? "default" : "outline"}
                      onClick={() => updateDraft({ conditionalMalfunctioned: true })}
                    >
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant={!draft.conditionalMalfunctioned ? "default" : "outline"}
                      onClick={() => updateDraft({ conditionalMalfunctioned: false })}
                    >
                      No
                    </Button>
                  </div>
                </div>
              )}

              <Question
                number={6}
                title={'"I feel this unit performed…"'}
                description="Your overall impression of the unit's performance."
              >
                <Select
                  value={draft.performanceOpinion}
                  onValueChange={(v) =>
                    updateDraft({
                      performanceOpinion: (v ?? "Average") as PerformanceOpinion,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERFORMANCE_OPINION_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Question>

              <Question
                number={7}
                title={'"I think this unit\'s biggest strength was…"'}
                description="Select the unit's strongest area."
              >
                <Select
                  value={draft.biggestStrength}
                  onValueChange={(v) => updateDraft({ biggestStrength: v ?? "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a strength" />
                  </SelectTrigger>
                  <SelectContent>
                    {(STRENGTH_OPTIONS ?? []).map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Question>

              <Question
                number={8}
                title={'"I feel this unit struggled with…"'}
                description="Select the unit's biggest weakness."
              >
                <Select
                  value={draft.unitStruggledWith}
                  onValueChange={(v) => updateDraft({ unitStruggledWith: v ?? "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a struggle" />
                  </SelectTrigger>
                  <SelectContent>
                    {(STRUGGLE_OPTIONS ?? []).map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Question>

              <Question
                number={9}
                title={'"I think this unit should be considered for alliance."'}
                description="Your recommendation for alliance selection."
              >
                <Select
                  value={draft.allianceConsideration}
                  onValueChange={(v) =>
                    updateDraft({
                      allianceConsideration: (v ?? "Maybe") as AllianceConsideration,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="Maybe">Maybe</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </Question>

              <Question
                number={10}
                title="Drive System"
                description="What type of drive system does the unit use?"
              >
                <Select
                  value={draft.driveSystem}
                  onValueChange={(v) =>
                    updateDraft({ driveSystem: (v ?? "swerve") as DriveSystem })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select drive system" />
                  </SelectTrigger>
                  <SelectContent>
                    {DRIVE_SYSTEM_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Question>

              <Question
                number={11}
                title="Photo Upload"
                description="Upload 3-5 photos (action shots, breakdowns, auto paths, or general)."
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={photoType}
                      onValueChange={(v) => setPhotoType(v as TrialPhotoType)}
                    >
                      <SelectTrigger className="w-[170px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial-action">Trial Action</SelectItem>
                        <SelectItem value="breakdown">Breakdown / Failure</SelectItem>
                        <SelectItem value="auto-path">Auto Path</SelectItem>
                        <SelectItem value="general">General Unit</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!draft.teamId || trialPhotos.length >= 5}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {trialPhotos.length}/5
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

                  <p className="text-xs text-muted-foreground">
                    Suggested: {TRIAL_PHOTO_TYPE_LABELS[suggestedPhotoType as TrialPhotoType]}
                  </p>

                  {trialPhotos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(trialPhotos ?? []).map((photo) => (
                        <div
                          key={photo.id}
                          className="relative group rounded-lg border overflow-hidden"
                        >
                          <Image
                            src={photo.url}
                            alt="Trial photo"
                            width={200}
                            height={112}
                            unoptimized
                            className="w-full h-28 object-cover"
                          />
                          <div className="absolute top-1 left-1">
                            <Badge className="text-[9px] capitalize">
                              {TRIAL_PHOTO_TYPE_LABELS[photo.photoType]}
                            </Badge>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeTrialPhoto(photo.id)}
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

                  {trialPhotos.length === 0 && (
                    <p className="text-muted-foreground text-center py-2 text-xs">
                      No photos uploaded yet (3-5 recommended)
                    </p>
                  )}
                </div>
              </Question>

              {hasMissingRequired && (
                <p className="text-sm text-muted-foreground pl-9">
                  You missed a question.
                </p>
              )}

              <Button
                onClick={handleSubmit}
                className="w-full mt-4"
                disabled={!draft.teamId}
                size="lg"
              >
                <Send className="mr-2 h-4 w-4" />
                Submit Match Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
