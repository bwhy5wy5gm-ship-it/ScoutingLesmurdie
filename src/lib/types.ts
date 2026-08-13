export interface Team {
  id: string;
  number: number;
  name: string;
  notes: string;
  installNotes: string;
  driveType: string;
  photos: Photo[];
  preComp: PreCompData;
  matches: MatchData[];
}

export type PhotoType = "robot" | "intake" | "shooter" | "auto-path";

export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  robot: "Robot",
  intake: "Intake",
  shooter: "Shooter",
  "auto-path": "Auto Path",
};

export interface Photo {
  id: string;
  url: string;
  label: string;
  photoType: PhotoType;
  teamNumber: number;
  uploadedBy: string;
  uploadedAt: string;
}

export type TrialPhotoType =
  | "trial-action"
  | "breakdown"
  | "auto-path"
  | "general";

export const TRIAL_PHOTO_TYPE_LABELS: Record<TrialPhotoType, string> = {
  "trial-action": "Trial Action",
  breakdown: "Breakdown / Failure",
  "auto-path": "Auto Path",
  general: "General Unit",
};

export interface TrialPhoto {
  id: string;
  url: string;
  photoType: TrialPhotoType;
  uploadedBy: string;
  uploadedAt: string;
  trialId: string;
  teamNumber: number;
}

export interface PreCompData {
  predictedAuto: number;
  predictedTeleop: number;
  predictedEndgame: number;
  predictedReliability: number;
  performanceOpinion: PerformanceOpinion;
  strongestSystem: string;
  mayStruggleWith: string;
  driveSystem: DriveSystem;
  notes: string;
  videoLinks: string[];
  preCompPhotos: PreCompPhoto[];
}

export type PreCompPhotoType =
  | "unit-photo"
  | "system-closeup"
  | "sensor-layout"
  | "auto-path";

export const PRECOMP_PHOTO_TYPE_LABELS: Record<PreCompPhotoType, string> = {
  "unit-photo": "Unit Photo",
  "system-closeup": "System Close-Up",
  "sensor-layout": "Sensor Layout",
  "auto-path": "Auto Path",
};

export interface PreCompPhoto {
  id: string;
  url: string;
  photoType: PreCompPhotoType;
  teamNumber: number;
  uploadedBy: string;
  uploadedAt: string;
}

export type PerformanceOpinion =
  | "Excellent"
  | "Good"
  | "Average"
  | "Poor"
  | "Very Poor";

export const PERFORMANCE_OPINION_OPTIONS: PerformanceOpinion[] = [
  "Excellent",
  "Good",
  "Average",
  "Poor",
  "Very Poor",
];

export const STRENGTH_OPTIONS = [
  "Shooting accuracy",
  "Speed across the field",
  "Climbing / endgame",
  "Intake consistency",
  "Defense",
  "Auto reliability",
  "Cycle efficiency",
  "Subsystem redundancy",
  "Driver skill",
  "Overall consistency",
];

export const STRUGGLE_OPTIONS = [
  "Inconsistent shooting",
  "Slow cycle times",
  "Poor auto performance",
  "Endgame failures",
  "Intake jams",
  "Driver hesitation",
  "Lack of defense",
  "Reliability issues",
  "Subsystem breakdowns",
  "Communication errors",
];

export const STRONGEST_SYSTEM_OPTIONS = [
  "Shooter",
  "Intake",
  "Drive train",
  "Climber / endgame",
  "Auto routines",
  "Sensor suite",
  "Control system",
  "Frame / chassis",
  "Power system",
  "Software / vision",
];

export const MAY_STRUGGLE_WITH_OPTIONS = [
  "Shooting under pressure",
  "Navigating congestion",
  "Endgame consistency",
  "Auto alignment",
  "Intake speed",
  "Defense avoidance",
  "Power management",
  "Software reliability",
  "Mechanical durability",
  "Driver speed",
];

export type AllianceConsideration = "Yes" | "No" | "Maybe";

export type DriveSystem = "swerve" | "tank" | "other";

export const DRIVE_SYSTEM_OPTIONS: { value: DriveSystem; label: string }[] = [
  { value: "swerve", label: "Swerve" },
  { value: "tank", label: "Tank" },
  { value: "other", label: "Other" },
];

export interface MatchData {
  id: string;
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

  warpScore: number;

  conditionalMalfunctioned: boolean;
  conditionalAutoFailed: boolean;
  conditionalEndgameAttempted: boolean;

  driveSystem: DriveSystem;

  trialPhotos: TrialPhoto[];

  scoutName: string;
  timestamp: string;
}

export interface TeamStats {
  avgAuto: number;
  avgTeleop: number;
  avgEndgame: number;
  avgCycleEfficiency: number;
  avgReliability: number;
  avgWarpScore: number;
  totalMatches: number;
  overallRating: number;
}

export type UnitRole = "Offense" | "Defense" | "Cycle Runner" | "Endgame Specialist";

export type StabilityIndex = "Stable" | "Semi-Stable" | "Unstable";

export type SynergyLevel = "High" | "Medium" | "Low";

export interface AllianceSynergy {
  teamNumbers: number[];
  score: number;
  level: SynergyLevel;
  autoSynergy: number;
  teleopSynergy: number;
  endgameSynergy: number;
  driveCompatibility: boolean;
}

export interface MatchPrediction {
  alliance1: { teamNumbers: number[]; warpScore: number };
  alliance2: { teamNumbers: number[]; warpScore: number };
  alliance1WinPct: number;
  alliance2WinPct: number;
  predictedScoreRange: { min: number; max: number };
  strengths: string[];
  weaknesses: string[];
}

export type AccentColor = "blue" | "red" | "purple" | "neon" | "gold" | "aqua";

export interface Settings {
  theme: "light" | "dark" | "system";
  accentColor: AccentColor;
  glassMode: boolean;
  trueBlack: boolean;
  currentEvent: string;
  offlineMode: boolean;
  scoutName: string;
  events: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  accentColor: "blue",
  glassMode: false,
  trueBlack: false,
  currentEvent: "Local Event",
  offlineMode: false,
  scoutName: "Scout",
  events: ["Local Event"],
};

export const ACCENT_COLORS: Record<AccentColor, { label: string; light: string; dark: string; neon?: string }> = {
  blue:   { label: "Blue",   light: "217 91% 60%",  dark: "217 91% 60%" },
  red:    { label: "Red",    light: "0 84% 60%",    dark: "0 84% 60%" },
  purple: { label: "Purple", light: "270 76% 58%",  dark: "270 76% 58%" },
  neon:   { label: "Neon",   light: "142 71% 45%",  dark: "142 71% 55%", neon: "142 100% 65%" },
  gold:   { label: "Gold",   light: "43 96% 56%",   dark: "43 96% 56%" },
  aqua:   { label: "Aqua",   light: "183 100% 48%", dark: "183 100% 55%" },
};

export interface TeamMatch {
  id: string;
  teamNumber: number;
  teamName: string;
  matchNumber: number;
  day: "friday" | "saturday" | "sunday";
  time: string;
  alliance: "red" | "blue";
  startPosition: 1 | 2 | 3;
  createdBy: string;
  createdAt: string;
}

export const SCOUT_TEAMS = [
  { number: 9979, name: "Billistic Beanz" },
  { number: 9980, name: "Insert Name Here" },
  { number: 9983, name: "Goopy Goopers" },
  { number: 9996, name: "Grimpoteuthii" },
] as const;
