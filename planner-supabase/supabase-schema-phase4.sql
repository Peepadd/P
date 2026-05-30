-- =============================================
-- Phase 4: LINE Integration Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. ตารางเก็บโปรไฟล์และ LINE ID ของผู้ใช้
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  line_user_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- เปิด RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- อนุญาตให้ผู้ใช้จัดการโปรไฟล์ของตัวเองเท่านั้น
CREATE POLICY IF NOT EXISTS "Users can view own profile"
  ON user_profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Service role can manage all profiles (for webhook)
CREATE POLICY IF NOT EXISTS "Service can manage all profiles"
  ON user_profiles FOR ALL USING (auth.role() = 'service_role');

-- =============================================

-- 2. ตารางบันทึกการแจ้งเตือนทาง LINE (ป้องกันการแจ้งซ้ำ)
CREATE TABLE IF NOT EXISTS line_notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notif_key TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE line_notification_log ENABLE ROW LEVEL SECURITY;

-- Service role can manage notification log
CREATE POLICY IF NOT EXISTS "Service can manage notification log"
  ON line_notification_log FOR ALL USING (auth.role() = 'service_role');

-- Cleanup old notification logs (keep last 7 days)
CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at
  ON line_notification_log(sent_at);
