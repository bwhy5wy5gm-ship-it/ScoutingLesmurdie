-- Team Matches table for tracking match schedule per team per day
CREATE TABLE IF NOT EXISTS team_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_number INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  match_number INTEGER NOT NULL,
  day TEXT NOT NULL CHECK (day IN ('friday', 'saturday', 'sunday')),
  time TEXT NOT NULL DEFAULT '',
  alliance TEXT NOT NULL CHECK (alliance IN ('red', 'blue')),
  start_position INTEGER NOT NULL CHECK (start_position IN (1, 2, 3)),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE team_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tm-r" ON team_matches FOR SELECT USING (true);
CREATE POLICY "tm-i" ON team_matches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tm-u" ON team_matches FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "tm-d" ON team_matches FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_team_matches_team_number ON team_matches(team_number);
CREATE INDEX IF NOT EXISTS idx_team_matches_day ON team_matches(day);
