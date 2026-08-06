-- WARP Scout - Initial Schema Migration
-- Run this against your Supabase project using the direct connection string:
-- postgresql://postgres:Nlalg8ZmGJfc8xx9@db.vjpggseijezydjpxqqpq.supabase.co:5432/postgres

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- PROFILES TABLE (extends Supabase auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  profile_picture TEXT DEFAULT '',
  drive_team_role TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  security_question TEXT NOT NULL,
  security_answer TEXT NOT NULL,
  settings JSONB DEFAULT '{
    "theme": "system",
    "accentColor": "blue",
    "glassMode": false,
    "trueBlack": false,
    "currentEvent": "Local Event",
    "offlineMode": false,
    "scoutName": "Scout",
    "events": ["Local Event"]
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TEAMS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT '',
  install_notes TEXT DEFAULT '',
  drive_type TEXT DEFAULT 'other',
  pre_comp JSONB DEFAULT '{
    "predictedAuto": 5,
    "predictedTeleop": 5,
    "predictedEndgame": 5,
    "predictedReliability": 5,
    "performanceOpinion": "Average",
    "strongestSystem": "",
    "mayStruggleWith": "",
    "driveSystem": "swerve",
    "notes": "",
    "videoLinks": [],
    "preCompPhotos": []
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- MATCHES TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  match_number INTEGER NOT NULL,
  alliance TEXT NOT NULL CHECK (alliance IN ('red', 'blue')),

  auto_score NUMERIC DEFAULT 5,
  teleop_score NUMERIC DEFAULT 5,
  endgame_score NUMERIC DEFAULT 5,
  cycle_efficiency NUMERIC DEFAULT 5,
  reliability_rating NUMERIC DEFAULT 5,

  performance_opinion TEXT DEFAULT 'Average',
  biggest_strength TEXT DEFAULT '',
  unit_struggled_with TEXT DEFAULT '',
  alliance_consideration TEXT DEFAULT 'Maybe',

  warp_score NUMERIC DEFAULT 5,

  conditional_malfunctioned BOOLEAN DEFAULT false,
  conditional_auto_failed BOOLEAN DEFAULT false,
  conditional_endgame_attempted BOOLEAN DEFAULT true,

  drive_system TEXT DEFAULT 'swerve',

  scout_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(team_id, match_number, scout_name)
);

-- ─────────────────────────────────────────────
-- PHOTOS TABLE (team photos)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  label TEXT DEFAULT '',
  photo_type TEXT DEFAULT 'robot',
  team_number INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TRIAL PHOTOS TABLE (in-comp match photos)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trial_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'general',
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  trial_id TEXT DEFAULT ''
);

-- ─────────────────────────────────────────────
-- PRE-COMP PHOTOS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS precomp_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'unit-photo',
  team_number INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE precomp_photos ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, update only their own
CREATE POLICY "Profiles: Anyone can read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: Users can update own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles: Users can insert own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Teams: anyone authenticated can read/write (shared scouting data)
CREATE POLICY "Teams: Authenticated can read" ON teams FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Teams: Authenticated can insert" ON teams FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Teams: Authenticated can update" ON teams FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Teams: Authenticated can delete" ON teams FOR DELETE USING (auth.role() = 'authenticated');

-- Matches: anyone authenticated can read/write
CREATE POLICY "Matches: Authenticated can read" ON matches FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Matches: Authenticated can insert" ON matches FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Matches: Authenticated can update" ON matches FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Matches: Authenticated can delete" ON matches FOR DELETE USING (auth.role() = 'authenticated');

-- Photos: anyone authenticated can read/write
CREATE POLICY "Photos: Authenticated can read" ON photos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Photos: Authenticated can insert" ON photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Photos: Authenticated can update" ON photos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Photos: Authenticated can delete" ON photos FOR DELETE USING (auth.role() = 'authenticated');

-- Trial Photos: anyone authenticated can read/write
CREATE POLICY "Trial Photos: Authenticated can read" ON trial_photos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Trial Photos: Authenticated can insert" ON trial_photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Trial Photos: Authenticated can update" ON trial_photos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Trial Photos: Authenticated can delete" ON trial_photos FOR DELETE USING (auth.role() = 'authenticated');

-- Pre-Comp Photos: anyone authenticated can read/write
CREATE POLICY "PreComp Photos: Authenticated can read" ON precomp_photos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "PreComp Photos: Authenticated can insert" ON precomp_photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "PreComp Photos: Authenticated can update" ON precomp_photos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "PreComp Photos: Authenticated can delete" ON precomp_photos FOR DELETE USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_matches_team_id ON matches(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_scout_name ON matches(scout_name);
CREATE INDEX IF NOT EXISTS idx_photos_team_id ON photos(team_id);
CREATE INDEX IF NOT EXISTS idx_trial_photos_match_id ON trial_photos(match_id);
CREATE INDEX IF NOT EXISTS idx_trial_photos_team_id ON trial_photos(team_id);
CREATE INDEX IF NOT EXISTS idx_precomp_photos_team_id ON precomp_photos(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_number ON teams(number);

-- ─────────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
