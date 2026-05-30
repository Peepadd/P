-- =============================================
-- Phase 3: Self-Improvement & Tools Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. ตารางสำหรับสร้างหัวข้อนิสัย (Habits)
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL, -- Daily, Weekly, Weekdays, Weekends
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ตารางสำหรับบันทึกการทำนิสัยรายวัน (Habit Logs)
CREATE TABLE IF NOT EXISTS habit_logs (
  id TEXT PRIMARY KEY,
  habit_id TEXT REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,      -- รูปแบบ YYYY-MM-DD
  done BOOLEAN DEFAULT FALSE,
  note TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ตาราง system_settings (ถ้ายังไม่มีจาก Phase 1) — ใช้สำหรับเก็บ monthly_budget
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster habit log queries
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, date);

-- เปิดระบบ RLS (Row Level Security)
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- มอบสิทธิ์ให้ผู้ใช้ที่ล็อกอิน (Authenticated) สามารถจัดการข้อมูลร่วมกันได้
CREATE POLICY IF NOT EXISTS "Shared access for habits"
  ON habits FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Shared access for habit_logs"
  ON habit_logs FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Shared access for system_settings"
  ON system_settings FOR ALL USING (auth.role() = 'authenticated');
