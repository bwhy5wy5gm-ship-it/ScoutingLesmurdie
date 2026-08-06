-- Fix RLS policies: auth.role() is deprecated, use auth.uid() IS NOT NULL

-- Drop old policies
DROP POLICY IF EXISTS "Teams: Authenticated can read" ON teams;
DROP POLICY IF EXISTS "Teams: Authenticated can insert" ON teams;
DROP POLICY IF EXISTS "Teams: Authenticated can update" ON teams;
DROP POLICY IF EXISTS "Teams: Authenticated can delete" ON teams;

DROP POLICY IF EXISTS "Matches: Authenticated can read" ON matches;
DROP POLICY IF EXISTS "Matches: Authenticated can insert" ON matches;
DROP POLICY IF EXISTS "Matches: Authenticated can update" ON matches;
DROP POLICY IF EXISTS "Matches: Authenticated can delete" ON matches;

DROP POLICY IF EXISTS "Photos: Authenticated can read" ON photos;
DROP POLICY IF EXISTS "Photos: Authenticated can insert" ON photos;
DROP POLICY IF EXISTS "Photos: Authenticated can update" ON photos;
DROP POLICY IF EXISTS "Photos: Authenticated can delete" ON photos;

DROP POLICY IF EXISTS "Trial Photos: Authenticated can read" ON trial_photos;
DROP POLICY IF EXISTS "Trial Photos: Authenticated can insert" ON trial_photos;
DROP POLICY IF EXISTS "Trial Photos: Authenticated can update" ON trial_photos;
DROP POLICY IF EXISTS "Trial Photos: Authenticated can delete" ON trial_photos;

DROP POLICY IF EXISTS "PreComp Photos: Authenticated can read" ON precomp_photos;
DROP POLICY IF EXISTS "PreComp Photos: Authenticated can insert" ON precomp_photos;
DROP POLICY IF EXISTS "PreComp Photos: Authenticated can update" ON precomp_photos;
DROP POLICY IF EXISTS "PreComp Photos: Authenticated can delete" ON precomp_photos;

-- Create corrected policies
CREATE POLICY "Teams: Authenticated can read" ON teams FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Teams: Authenticated can insert" ON teams FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Teams: Authenticated can update" ON teams FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Teams: Authenticated can delete" ON teams FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Matches: Authenticated can read" ON matches FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Matches: Authenticated can insert" ON matches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Matches: Authenticated can update" ON matches FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Matches: Authenticated can delete" ON matches FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Photos: Authenticated can read" ON photos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Photos: Authenticated can insert" ON photos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Photos: Authenticated can update" ON photos FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Photos: Authenticated can delete" ON photos FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Trial Photos: Authenticated can read" ON trial_photos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Trial Photos: Authenticated can insert" ON trial_photos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Trial Photos: Authenticated can update" ON trial_photos FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Trial Photos: Authenticated can delete" ON trial_photos FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "PreComp Photos: Authenticated can read" ON precomp_photos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "PreComp Photos: Authenticated can insert" ON precomp_photos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "PreComp Photos: Authenticated can update" ON precomp_photos FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "PreComp Photos: Authenticated can delete" ON precomp_photos FOR DELETE USING (auth.uid() IS NOT NULL);
