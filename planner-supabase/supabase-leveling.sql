-- 1. สร้างตารางเก็บสถิติฮันเตอร์ (ผู้ใช้)
CREATE TABLE hunter_stats (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  level INT DEFAULT 1,
  current_exp INT DEFAULT 0,
  total_exp INT DEFAULT 0,
  rank VARCHAR(20) DEFAULT 'E-Rank',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. สร้างตารางประวัติการได้รับ EXP (เอาไว้ทำ History Log และแสดง Pop-up ตอนได้ EXP)
CREATE TABLE exp_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- เช่น 'habit', 'checklist', 'pomodoro'
  source_id UUID, -- เก็บ ID ของสิ่งที่ทำสำเร็จ (เผื่ออ้างอิง)
  exp_gained INT NOT NULL,
  description TEXT, -- เช่น 'พิชิต Pomodoro 25 นาที', 'วิดพื้น 50 ครั้ง'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. เปิดใช้งาน Row Level Security (RLS) เพื่อความปลอดภัย
ALTER TABLE hunter_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE exp_logs ENABLE ROW LEVEL SECURITY;

-- 4. สร้าง Policy ให้ผู้ใช้แต่ละคนดูและแก้ไขได้เฉพาะข้อมูลของตัวเอง
CREATE POLICY "Users can view their own hunter stats" ON hunter_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hunter stats" ON hunter_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hunter stats" ON hunter_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own exp logs" ON exp_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exp logs" ON exp_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
