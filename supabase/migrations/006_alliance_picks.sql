-- Alliance Selection picks
CREATE TABLE IF NOT EXISTS alliance_picks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_key TEXT NOT NULL,
  team_number INTEGER NOT NULL,
  team_name TEXT NOT NULL DEFAULT '',
  warp_score NUMERIC DEFAULT 0,
  pick_order INTEGER NOT NULL,
  picked_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE alliance_picks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ap-r" ON alliance_picks FOR SELECT USING (true);
CREATE POLICY "ap-i" ON alliance_picks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ap-u" ON alliance_picks FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "ap-d" ON alliance_picks FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_alliance_picks_event ON alliance_picks(event_key);
