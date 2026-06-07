-- ============================================================
-- Leveling System Schema — hunter_stats + exp_logs
-- ใช้ IF NOT EXISTS และ DO blocks ทุกที่ รันซ้ำได้ปลอดภัย
-- ============================================================

-- 1. สร้างตารางเก็บสถิติฮันเตอร์ (ผู้ใช้)
CREATE TABLE IF NOT EXISTS hunter_stats (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  level INT DEFAULT 1,
  current_exp INT DEFAULT 0,
  total_exp INT DEFAULT 0,
  rank VARCHAR(20) DEFAULT 'E-Rank',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. สร้างตารางประวัติการได้รับ EXP
CREATE TABLE IF NOT EXISTS exp_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- เช่น 'habit', 'checklist', 'pomodoro', 'rider_income'
  source_id UUID,
  exp_gained INT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. เปิดใช้งาน RLS
ALTER TABLE hunter_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE exp_logs ENABLE ROW LEVEL SECURITY;

-- 4. Policies — ใช้ DO block เพื่อรันซ้ำได้โดยไม่ error
DO $$ BEGIN
  CREATE POLICY "Users can view their own hunter stats" ON hunter_stats
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own hunter stats" ON hunter_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own hunter stats" ON hunter_stats
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own exp logs" ON exp_logs
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own exp logs" ON exp_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;
