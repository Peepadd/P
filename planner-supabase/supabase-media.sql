-- ============================================================
-- Media Tracker Schema
-- ใช้ IF NOT EXISTS และ DO blocks ทุกที่ รันซ้ำได้ปลอดภัย
-- ============================================================

-- 1. สร้างตาราง media_tracker
CREATE TABLE IF NOT EXISTS media_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  media_type VARCHAR(50) NOT NULL, -- 'Anime', 'Manga', 'Light Novel', 'Movie'
  status VARCHAR(50) DEFAULT 'In Progress', -- 'In Progress', 'Completed', 'On Hold', 'Plan to Watch'
  progress INT DEFAULT 0,
  total_length INT,
  cover_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. เปิดใช้งาน RLS
ALTER TABLE media_tracker ENABLE ROW LEVEL SECURITY;

-- 3. Policies — ใช้ DO block เพื่อรันซ้ำได้โดยไม่ error
DO $$ BEGIN
  CREATE POLICY "Users can view their own media" ON media_tracker
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own media" ON media_tracker
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own media" ON media_tracker
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own media" ON media_tracker
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;
