-- ============================================================
-- Supabase Complete Schema — ทุกตารางสำหรับ Planner Supabase
-- รัน SQL นี้ครั้งเดียวใน Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. ตารางธุรกรรมการเงิน (transactions)
-- ใช้โดย: Accounting, Dashboard, Calendar, RecurringProcessor
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('Income', 'Expense')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  note TEXT,
  description TEXT,
  date DATE NOT NULL,
  transaction_time TEXT,
  recurring_id TEXT REFERENCES recurring_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_date_type ON transactions(date, type);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Shared access for transactions"
  ON transactions FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 2. ตารางรายการ checklist (checklist_items)
-- ใช้โดย: Checklist, Calendar
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_checklist_items_type ON checklist_items(type);
CREATE INDEX IF NOT EXISTS idx_checklist_items_checked ON checklist_items(checked);
CREATE INDEX IF NOT EXISTS idx_checklist_items_due_date ON checklist_items(due_date);

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Shared access for checklist_items"
  ON checklist_items FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 3. ตารางงานย่อย (sub_tasks)
-- ใช้โดย: Checklist
-- ============================================================
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

CREATE POLICY IF NOT EXISTS "Shared access for sub_tasks"
  ON sub_tasks FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 4. ตารางรายการวิชาการ (academic_items)
-- ใช้โดย: Academic, Calendar
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_academic_items_deadline ON academic_items(deadline);
CREATE INDEX IF NOT EXISTS idx_academic_items_subject ON academic_items(subject);
CREATE INDEX IF NOT EXISTS idx_academic_items_archived ON academic_items(archived);

ALTER TABLE academic_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Shared access for academic_items"
  ON academic_items FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 5. ตารางรายการอัตโนมัติ (recurring_transactions)
-- ใช้โดย: Recurring, RecurringProcessor
-- ============================================================
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
CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_transactions(active);

ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Shared access for recurring_transactions"
  ON recurring_transactions FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 6. ตารางตารางเรียน (timetables)
-- ใช้โดย: Timetable
-- ============================================================
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

CREATE POLICY IF NOT EXISTS "Shared access for timetables"
  ON timetables FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 7. ตารางนิสัย (habits)
-- ใช้โดย: Habits
-- ============================================================
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('Daily', 'Weekly', 'Weekdays', 'Weekends')),
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Shared access for habits"
  ON habits FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 8. ตารางบันทึกการทำนิสัยรายวัน (habit_logs)
-- ใช้โดย: Habits
-- ============================================================
CREATE TABLE IF NOT EXISTS habit_logs (
  id TEXT PRIMARY KEY,
  habit_id TEXT REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  note TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, date);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Shared access for habit_logs"
  ON habit_logs FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 9. ตารางตั้งค่าระบบ (system_settings)
-- ใช้โดย: Dashboard (monthly_budget)
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Shared access for system_settings"
  ON system_settings FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 10. ตารางโปรไฟล์ผู้ใช้ (user_profiles)
-- ใช้โดย: LINE Integration (Phase 4)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  line_user_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own profile"
  ON user_profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Service can manage all profiles"
  ON user_profiles FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 11. ตารางบันทึกการแจ้งเตือน LINE (line_notification_log)
-- ใช้โดย: LINE Notifier (Phase 4)
-- ============================================================
CREATE TABLE IF NOT EXISTS line_notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notif_key TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at
  ON line_notification_log(sent_at);

ALTER TABLE line_notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Service can manage notification log"
  ON line_notification_log FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- ✅ เสร็จสมบูรณ์ — ทุกตารางและนโยบายความปลอดภัยพร้อมใช้งาน
-- ============================================================
