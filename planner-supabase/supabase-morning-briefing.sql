-- ============================================================
-- Morning Briefing SQL — สำหรับ Edge Function morning-briefing
-- รัน SQL นี้ใน Supabase SQL Editor
-- ============================================================
-- ตาราง timetables เก็บข้อมูลใน JSONB:
--   config: { "periods": 6, "tStart": "08:00", "pMin": 50, "bMin": 10 }
--   subjects: [ { "name": "...", "color": "..." }, ... ]
--   cells: { "Mon_0": "วิชา", "Tue_1": "วิชา", ... }  (key = "DayAbbr_periodIndex")
-- ============================================================

-- ============================================================
-- 1. สร้าง SQL Function: get_morning_briefing()
--    ดึงข้อมูลตารางเรียนวันนี้ + Checklist วันนี้ + Habits
-- ============================================================
CREATE OR REPLACE FUNCTION get_morning_briefing()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_day_abbr TEXT;
  v_timetable RECORD;
  v_config JSONB;
  v_cells JSONB;
  v_subjects JSONB;
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
  -- คำนวณวันในสัปดาห์ (ภาษาอังกฤษ สำหรับ match กับ key ใน cells)
  -- DOW: 0=Sunday, 1=Monday, ..., 6=Saturday
  v_day_of_week := TO_CHAR(v_today, 'Dy'); -- Mon, Tue, Wed, Thu, Fri, Sat, Sun

  -- ดึงตารางเรียนอันล่าสุด (ถ้ามีหลายตาราง ใช้อันที่ updated_at ล่าสุด)
  SELECT * INTO v_timetable
  FROM timetables
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_timetable IS NOT NULL THEN
    v_config   := v_timetable.config;
    v_cells    := v_timetable.cells;
    v_subjects := v_timetable.subjects;

    -- อ่านค่า config
    v_t_start := COALESCE(v_config->>'tStart', '08:00');
    v_p_min   := COALESCE((v_config->>'pMin')::INT, 50);
    v_b_min   := COALESCE((v_config->>'bMin')::INT, 10);
    v_periods := COALESCE((v_config->>'periods')::INT, 6);

    -- แปลงเวลาเริ่มต้นเป็น minutes จาก midnight
    v_start_h := SPLIT_PART(v_t_start, ':', 1)::INT;
    v_start_m := SPLIT_PART(v_t_start, ':', 2)::INT;

    -- วนลูปทุก period ของวันนี้
    FOR v_period_idx IN 0..(v_periods - 1) LOOP
      -- สร้าง key เช่น "Mon_0", "Tue_2"
      v_subject_name := v_cells->>(v_day_of_week || '_' || v_period_idx::TEXT);

      -- ถ้า cell ไม่ว่าง
      IF v_subject_name IS NOT NULL AND v_subject_name != '' THEN
        -- คำนวณเวลาเริ่ม-จบ period นี้
        v_total_min := v_start_h * 60 + v_start_m + v_period_idx * (v_p_min + v_b_min);
        v_hour := v_total_min / 60;
        v_min  := v_total_min % 60;
        v_start_time := LPAD(v_hour::TEXT, 2, '0') || ':' || LPAD(v_min::TEXT, 2, '0');

        v_total_min := v_total_min + v_p_min;
        v_hour := v_total_min / 60;
        v_min  := v_total_min % 60;
        v_end_time := LPAD(v_hour::TEXT, 2, '0') || ':' || LPAD(v_min::TEXT, 2, '0');

        v_class_entry := jsonb_build_object(
          'period', v_period_idx + 1,
          'subject', v_subject_name,
          'start_time', v_start_time,
          'end_time', v_end_time
        );

        v_today_classes := v_today_classes || jsonb_build_array(v_class_entry);
      END IF;
    END LOOP;
  END IF;

  -- ดึง Checklist ที่ยังไม่เสร็จและ due วันนี้หรือก่อนหน้า
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'text', text,
        'category', category,
        'due_date', to_char(due_date AT TIME ZONE 'Asia/Bangkok', 'DD Mon HH24:MI'),
        'is_overdue', (due_date < NOW())
      ) ORDER BY due_date ASC NULLS LAST
    ),
    '[]'::JSONB
  ) INTO v_checklist
  FROM checklist_items
  WHERE checked = FALSE
    AND (
      due_date IS NULL
      OR due_date::DATE <= v_today + INTERVAL '1 day'
    )
  LIMIT 10;

  -- ดึง Habits ที่ต้องทำวันนี้
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'name', h.name,
        'color', h.color,
        'done', COALESCE(hl.done, FALSE)
      ) ORDER BY h.name
    ),
    '[]'::JSONB
  ) INTO v_habits
  FROM habits h
  LEFT JOIN habit_logs hl
    ON hl.habit_id = h.id
    AND hl.date = v_today
  WHERE h.frequency = 'Daily'
     OR (h.frequency = 'Weekdays' AND EXTRACT(DOW FROM v_today) BETWEEN 1 AND 5)
     OR (h.frequency = 'Weekends' AND EXTRACT(DOW FROM v_today) IN (0, 6))
     OR h.frequency = 'Weekly';

  -- รวมและคืนค่า
  RETURN jsonb_build_object(
    'date',      to_char(v_today, 'Day DD Month YYYY'),
    'day',       v_day_of_week,
    'timetable', v_today_classes,
    'checklist', v_checklist,
    'habits',    v_habits
  );
END;
$$;

-- ให้ Service Role เรียกใช้ได้
GRANT EXECUTE ON FUNCTION get_morning_briefing() TO service_role;

-- ============================================================
-- 2. ตั้ง Cron Job: morning-briefing ทุกวัน 07:00 น. (ICT)
--    07:00 ICT = 00:00 UTC
-- ============================================================

-- เปิดใช้ extension (ถ้ายังไม่ได้เปิด)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ลบ Cron Job เก่าถ้ามี (เผื่อรัน SQL นี้ซ้ำ)
SELECT cron.unschedule('morning-briefing-7am') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'morning-briefing-7am');

-- สร้าง Cron Job ใหม่ — ทุกวัน 00:00 UTC (= 07:00 ICT)
SELECT cron.schedule(
  'morning-briefing-7am',
  '0 0 * * *',
  $$
    SELECT net.http_post(
      url     => 'https://upzbtxuqrfzwrsboyqjv.supabase.co/functions/v1/morning-briefing',
      headers => jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwemJ0eHVxcmZ6d3JzYm95cWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMTU2NDgsImV4cCI6MjA5NTY5MTY0OH0.Yma8NOxRBqBA9uvctHUPkU8CEpSHKhTsAlQpLxH_vTw'
      ),
      body    => '{}'::jsonb
    ) AS request_id;
  $$
);

-- ============================================================
-- 3. ตรวจสอบผลลัพธ์
-- ============================================================

-- ดู Cron Jobs ทั้งหมด:
-- SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;

-- ทดสอบ RPC โดยตรง (ดูข้อมูลที่จะส่งให้ AI):
-- SELECT get_morning_briefing();

-- ============================================================
-- ✅ เสร็จสมบูรณ์
-- - RPC get_morning_briefing() พร้อมใช้งาน
-- - Cron Job จะยิง morning-briefing ทุกวัน 07:00 น. (ICT)
-- ============================================================
