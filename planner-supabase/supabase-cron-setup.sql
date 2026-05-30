-- ============================================================
-- ตั้งค่า Cron Job สำหรับ Edge Function: line-notifier
-- รัน SQL นี้ใน Supabase SQL Editor
-- ============================================================

-- 1. เปิดใช้งาน pg_cron extension (ถ้ายังไม่ได้เปิด)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. สร้าง Cron Job — ทำงานทุก 30 นาที
SELECT cron.schedule(
  'line-notifier-every-30min',   -- ชื่อ job
  '*/30 * * * *',                -- ทุก 30 นาที
  $$
    SELECT net.http_post(
      url => 'https://upzbtxuqrfzwrsboyqjv.supabase.co/functions/v1/line-notifier',
      headers => jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwemJ0eHVxcmZ6d3JzYm95cWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMTU2NDgsImV4cCI6MjA5NTY5MTY0OH0.Yma8NOxRBqBA9uvctHUPkU8CEpSHKhTsAlQpLxH_vTw'
      ),
      body => '{}'::jsonb
    ) as request_id;
  $$
);

-- 3. ตรวจสอบ Cron Job ที่สร้าง
-- SELECT * FROM cron.job;

-- 4. ยกเลิก Cron Job (ใช้เมื่อต้องการลบ)
-- SELECT cron.unschedule('line-notifier-every-30min');
