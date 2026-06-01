-- 1. สร้างตาราง media_tracker สำหรับจัดเก็บข้อมูล
CREATE TABLE media_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title VARCHAR(255) NOT NULL, 
  media_type VARCHAR(50) NOT NULL, -- ประเภท เช่น 'Anime', 'Manga', 'Light Novel', 'Movie'
  status VARCHAR(50) DEFAULT 'In Progress', -- สถานะ เช่น 'In Progress', 'Completed', 'On Hold', 'Plan to Watch'
  progress INT DEFAULT 0, -- ตอนที่หรือเล่มที่อ่าน/ดูถึงปัจจุบัน
  total_length INT, -- จำนวนตอนทั้งหมด (ปล่อยว่างได้ถ้าระยะยาวยังไม่จบ)
  cover_url TEXT, -- ลิงก์รูปปก (เตรียมไว้เผื่อทำ UI แบบ Card สวยๆ)
  notes TEXT, -- โน้ตย่อส่วนตัว
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. เปิดใช้งาน Row Level Security (RLS) เพื่อปกป้องข้อมูล
ALTER TABLE media_tracker ENABLE ROW LEVEL SECURITY;

-- 3. สร้าง Policies สำหรับจัดการข้อมูลของแต่ละ User อย่างปลอดภัย
CREATE POLICY "Users can view their own media" ON media_tracker
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media" ON media_tracker
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media" ON media_tracker
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media" ON media_tracker
  FOR DELETE USING (auth.uid() = user_id);
