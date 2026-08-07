-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_matches_team_id ON matches(team_id);
CREATE INDEX IF NOT EXISTS idx_photos_team_id ON photos(team_id);
CREATE INDEX IF NOT EXISTS idx_trial_photos_team_id ON trial_photos(team_id);
CREATE INDEX IF NOT EXISTS idx_trial_photos_match_id ON trial_photos(match_id);
CREATE INDEX IF NOT EXISTS idx_precomp_photos_team_id ON precomp_photos(team_id);
