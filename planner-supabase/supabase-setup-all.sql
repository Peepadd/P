-- ================================================================
-- 🚀 Life OS — Master SQL Setup Script
-- รัน SQL นี้ใน Supabase SQL Editor ได้กี่ครั้งก็ได้ ไม่มี Error
-- ทุก CREATE TABLE ใช้ IF NOT EXISTS
-- ทุก CREATE POLICY ใช้ DO block + EXCEPTION WHEN duplicate_object
-- ================================================================

-- ================================================================
-- PART 1: Core Tables (จาก supabase-schema-complete.sql)
-- ================================================================

-- คลายล็อก constraints เก่า (ทำก่อน CREATE TABLE เสมอ)
ALTER TABLE transactions   DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE checklist_items DROP CONSTRAINT IF EXISTS checklist_items_type_check;
ALTER TABLE academic_items DROP CONSTRAINT IF EXISTS academic_items_status_check;
ALTER TABLE academic_items DROP CONSTRAINT IF EXISTS academic_items_priority_check;
ALTER TABLE habits          DROP CONSTRAINT IF EXISTS habits_frequency_check;

-- 1. transactions
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('Income', 'Expense')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  note TEXT,
  description TEXT,
  date DATE NOT NULL,
  transaction_time TEXT,
  recurring_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_date      ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type      ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category  ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_date_type ON transactions(date, type);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Shared access for transactions" ON transactions FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- 2. checklist_items
CREATE TABLE IF NOT EXISTS checklist_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('shopping', 'todo')),
  text TEXT NOT NULL,
  category TEXT,
  note TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  checked BOOLEAN DEFAULT FALSE,
  checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_checklist_items_type     ON checklist_items(type);
CREATE INDEX IF NOT EXISTS idx_checklist_items_checked  ON checklist_items(checked);
CREATE INDEX IF NOT EXISTS idx_checklist_items_due_date ON checklist_items(due_date);
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Shared access for checklist_items" ON checklist_items FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- 3. sub_tasks
CREATE TABLE IF NOT EXISTS sub_tasks (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  parent_type TEXT NOT NULL,
  text TEXT NOT NULL,
  checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sub_tasks_parent ON sub_tasks(parent_id);
ALTER TABLE sub_tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Shared access for sub_tasks" ON sub_tasks FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- 4. academic_items
CREATE TABLE IF NOT EXISTS academic_items (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('สอบ', 'การบ้าน', 'โปรเจกต์', 'งานกลุ่ม', 'นำเสนอ', 'อื่นๆ')),
  deadline TIMESTAMP WITH TIME ZONE,
  end_time TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('สูง', 'กลาง', 'ต่ำ')),
  status TEXT NOT NULL,
  note TEXT,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE academic_items ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_academic_items_deadline ON academic_items(deadline);
CREATE INDEX IF NOT EXISTS idx_academic_items_subject  ON academic_items(subject);
CREATE INDEX IF NOT EXISTS idx_academic_items_archived ON academic_items(archived);
ALTER TABLE academic_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Shared access for academic_items" ON academic_items FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- 5. recurring_transactions
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('Income', 'Expense')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  note TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_date DATE NOT NULL,
  transaction_time TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recurring_next_date ON recurring_transactions(next_date);
CREATE INDEX IF NOT EXISTS idx_recurring_active    ON recurring_transactions(active);
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'transactions' AND constraint_name = 'transactions_recurring_id_fkey'
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_recurring_id_fkey
      FOREIGN KEY (recurring_id) REFERENCES recurring_transactions(id) ON DELETE SET NULL;
  END IF;
END $$;
DO $$ BEGIN
  CREATE POLICY "Shared access for recurring_transactions" ON recurring_transactions FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- 6. timetables
CREATE TABLE IF NOT EXISTS timetables (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{"periods": 6, "tStart": "08:00", "pMin": 50, "bMin": 10}',
  cells JSONB NOT NULL DEFAULT '{}',
  subjects JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Shared access for timetables" ON timetables FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- 7. habits
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('Daily', 'Weekly', 'Weekdays', 'Weekends')),
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Shared access for habits" ON habits FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- 8. habit_logs
CREATE TABLE IF NOT EXISTS habit_logs (
  id TEXT PRIMARY KEY,
  habit_id TEXT REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  note TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id   ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date       ON habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, date);
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Shared access for habit_logs" ON habit_logs FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- 9. system_settings
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Shared access for system_settings" ON system_settings FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- 10. user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  line_user_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN
  CREATE POLICY "Service can manage all profiles" ON user_profiles FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- 11. line_notification_log
CREATE TABLE IF NOT EXISTS line_notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notif_key TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at ON line_notification_log(sent_at);
ALTER TABLE line_notification_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Service can manage notification log" ON line_notification_log FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- ================================================================
-- PART 2: Attendance Logs (จาก supabase-attendance.sql)
-- ================================================================
DROP TABLE IF EXISTS attendance_logs CASCADE;
CREATE TABLE attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    timetable_id TEXT REFERENCES timetables(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    day_idx SMALLINT NOT NULL,
    period_idx SMALLINT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view their own attendance" ON attendance_logs FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert their own attendance" ON attendance_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN
  CREATE POLICY "Users can update their own attendance" ON attendance_logs FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete their own attendance" ON attendance_logs FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_date ON attendance_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_timetable ON attendance_logs(timetable_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_attendance ON attendance_logs(user_id, timetable_id, date, period_idx);

-- ================================================================
-- PART 3: Leveling System (จาก supabase-leveling.sql) ✅ IF NOT EXISTS
-- ================================================================
CREATE TABLE IF NOT EXISTS hunter_stats (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  level INT DEFAULT 1,
  current_exp INT DEFAULT 0,
  total_exp INT DEFAULT 0,
  rank VARCHAR(20) DEFAULT 'E-Rank',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE TABLE IF NOT EXISTS exp_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  source_id UUID,
  exp_gained INT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE hunter_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE exp_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view their own hunter stats" ON hunter_stats FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert their own hunter stats" ON hunter_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN
  CREATE POLICY "Users can update their own hunter stats" ON hunter_stats FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN
  CREATE POLICY "Users can view their own exp logs" ON exp_logs FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert their own exp logs" ON exp_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- ================================================================
-- PART 4: Media Tracker (จาก supabase-media.sql) ✅ IF NOT EXISTS
-- ================================================================
CREATE TABLE IF NOT EXISTS media_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  media_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'In Progress',
  progress INT DEFAULT 0,
  total_length INT,
  cover_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE media_tracker ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view their own media" ON media_tracker FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert their own media" ON media_tracker FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN
  CREATE POLICY "Users can update their own media" ON media_tracker FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete their own media" ON media_tracker FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- ================================================================
-- PART 5: Morning Briefing RPC (จาก supabase-morning-briefing.sql)
-- ================================================================
CREATE OR REPLACE FUNCTION get_morning_briefing()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_timetable RECORD;
  v_config JSONB;
  v_cells JSONB;
  v_t_start TEXT;
  v_p_min INT;
  v_b_min INT;
  v_periods INT;
  v_today_classes JSONB := '[]'::JSONB;
  v_class_entry JSONB;
  v_subject_name TEXT;
  v_period_idx INT;
  v_start_h INT;
  v_start_m INT;
  v_total_min INT;
  v_hour INT;
  v_min INT;
  v_start_time TEXT;
  v_end_time TEXT;
  v_checklist JSONB;
  v_habits JSONB;
  v_today DATE := CURRENT_DATE;
  v_day_of_week TEXT;
BEGIN
  v_day_of_week := TO_CHAR(v_today, 'Dy');
  SELECT * INTO v_timetable FROM timetables ORDER BY updated_at DESC LIMIT 1;
  IF v_timetable IS NOT NULL THEN
    v_config  := v_timetable.config;
    v_cells   := v_timetable.cells;
    v_t_start := COALESCE(v_config->>'tStart', '08:00');
    v_p_min   := COALESCE((v_config->>'pMin')::INT, 50);
    v_b_min   := COALESCE((v_config->>'bMin')::INT, 10);
    v_periods := COALESCE((v_config->>'periods')::INT, 6);
    v_start_h := SPLIT_PART(v_t_start, ':', 1)::INT;
    v_start_m := SPLIT_PART(v_t_start, ':', 2)::INT;
    FOR v_period_idx IN 0..(v_periods - 1) LOOP
      v_subject_name := v_cells->>(v_day_of_week || '_' || v_period_idx::TEXT);
      IF v_subject_name IS NOT NULL AND v_subject_name != '' THEN
        v_total_min := v_start_h * 60 + v_start_m + v_period_idx * (v_p_min + v_b_min);
        v_hour := v_total_min / 60; v_min := v_total_min % 60;
        v_start_time := LPAD(v_hour::TEXT, 2, '0') || ':' || LPAD(v_min::TEXT, 2, '0');
        v_total_min := v_total_min + v_p_min;
        v_hour := v_total_min / 60; v_min := v_total_min % 60;
        v_end_time := LPAD(v_hour::TEXT, 2, '0') || ':' || LPAD(v_min::TEXT, 2, '0');
        v_class_entry := jsonb_build_object('period', v_period_idx + 1, 'subject', v_subject_name, 'start_time', v_start_time, 'end_time', v_end_time);
        v_today_classes := v_today_classes || jsonb_build_array(v_class_entry);
      END IF;
    END LOOP;
  END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('text', text, 'category', category, 'due_date', to_char(due_date AT TIME ZONE 'Asia/Bangkok', 'DD Mon HH24:MI'), 'is_overdue', (due_date < NOW())) ORDER BY due_date ASC NULLS LAST), '[]'::JSONB)
  INTO v_checklist FROM checklist_items WHERE checked = FALSE AND (due_date IS NULL OR due_date::DATE <= v_today + INTERVAL '1 day') LIMIT 10;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', h.name, 'color', h.color, 'done', COALESCE(hl.done, FALSE)) ORDER BY h.name), '[]'::JSONB)
  INTO v_habits FROM habits h LEFT JOIN habit_logs hl ON hl.habit_id = h.id AND hl.date = v_today
  WHERE h.frequency = 'Daily' OR (h.frequency = 'Weekdays' AND EXTRACT(DOW FROM v_today) BETWEEN 1 AND 5) OR (h.frequency = 'Weekends' AND EXTRACT(DOW FROM v_today) IN (0, 6)) OR h.frequency = 'Weekly';
  RETURN jsonb_build_object('date', to_char(v_today, 'Day DD Month YYYY'), 'day', v_day_of_week, 'timetable', v_today_classes, 'checklist', v_checklist, 'habits', v_habits);
END;
$$;

GRANT EXECUTE ON FUNCTION get_morning_briefing() TO service_role;

-- ================================================================
-- PART 6: Cron Jobs (pg_cron + pg_net)
-- ================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- line-notifier ทุก 30 นาที
SELECT cron.unschedule('line-notifier-every-30min')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'line-notifier-every-30min');

SELECT cron.schedule(
  'line-notifier-every-30min',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url     => 'https://upzbtxuqrfzwrsboyqjv.supabase.co/functions/v1/line-notifier',
      headers => jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwemJ0eHVxcmZ6d3JzYm95cWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMTU2NDgsImV4cCI6MjA5NTY5MTY0OH0.Yma8NOxRBqBA9uvctHUPkU8CEpSHKhTsAlQpLxH_vTw'),
      body    => '{}'::jsonb
    ) AS request_id;
  $$
);

-- morning-briefing ทุกวัน 07:00 ICT (= 00:00 UTC)
SELECT cron.unschedule('morning-briefing-7am')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'morning-briefing-7am');

SELECT cron.schedule(
  'morning-briefing-7am',
  '0 0 * * *',
  $$
    SELECT net.http_post(
      url     => 'https://upzbtxuqrfzwrsboyqjv.supabase.co/functions/v1/morning-briefing',
      headers => jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwemJ0eHVxcmZ6d3JzYm95cWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMTU2NDgsImV4cCI6MjA5NTY5MTY0OH0.Yma8NOxRBqBA9uvctHUPkU8CEpSHKhTsAlQpLxH_vTw'),
      body    => '{}'::jsonb
    ) AS request_id;
  $$
);

-- ================================================================
-- ✅ เสร็จสมบูรณ์ — รันซ้ำได้ไม่มี Error
-- ตรวจสอบ Cron Jobs: SELECT jobname, schedule, active FROM cron.job;
-- ทดสอบ RPC: SELECT get_morning_briefing();
-- ================================================================
