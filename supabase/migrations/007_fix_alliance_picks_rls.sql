-- Fix alliance picks to be per-account
-- Drop old permissive policies
DROP POLICY IF EXISTS "ap-r" ON alliance_picks;
DROP POLICY IF EXISTS "ap-i" ON alliance_picks;
DROP POLICY IF EXISTS "ap-u" ON alliance_picks;
DROP POLICY IF EXISTS "ap-d" ON alliance_picks;

-- Each user can only see/modify their own picks
CREATE POLICY "ap-r" ON alliance_picks FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "ap-i" ON alliance_picks FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "ap-u" ON alliance_picks FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "ap-d" ON alliance_picks FOR DELETE USING (created_by = auth.uid());
