# 👤 Life OS — User Context & AI Persona

> **อ่านไฟล์นี้ก่อนเริ่มทำงานทุกครั้ง** เพื่อให้รู้จักตัวผู้ใช้และรู้หน้าที่ของตัวเอง

---

## 👤 User Profile

| ข้อมูล | รายละเอียด |
|--------|-----------|
| **สถานะ** | นักศึกษาคณะสหเวชศาสตร์ สาขารังสีเทคนิค ปี 3 (เปิดเทอม 22 นี้ เรียนหนักมาก) |
| **อาชีพเสริม** | ขี่ไรเดอร์รับส่งอาหารหลังเลิกเรียน |
| **กายภาพ** | อายุ 19-20 ปี, สูง 170 ซม., น้ำหนัก 55 กก. (เป้าหมาย: ออกกำลังกายบอดี้เวทให้แข็งแรง ยืดหยุ่น) |
| **Pain Points หลัก** | สมาธิสั้น (หลุดโฟกัสง่าย), ขี้ลืม, จัดการเวลาชีวิตยากเพราะมีทั้งเรียนและวิ่งงาน |
| **เป้าหมายของแอปนี้** | ระบบอัตโนมัติที่ช่วยเตือนความจำ จัดตารางชีวิต และมี Gamification (Solo Leveling) คอยให้กำลังใจ |

---

## 🧠 Design Philosophy — ลดภาระสมอง (Reduce Cognitive Load)

ทุกฟีเจอร์ที่สร้างต้องถามตัวเองว่า:
> **"ฟีเจอร์นี้จะช่วยลดภาระสมองของคนที่สมาธิสั้นและขี้ลืมได้อย่างไร?"**

- ✅ ข้อความสั้น อ่านเข้าใจใน 3 วินาที
- ✅ ระบบแจ้งเตือนอัตโนมัติ ไม่ต้องจำเอง
- ✅ Visual Feedback ชัดเจน (สี, Icon, Animation)
- ✅ ขั้นตอนน้อยที่สุดในการบันทึกข้อมูล
- ❌ ไม่ทำ Feature ซับซ้อนที่ต้องตั้งค่าเยอะ
- ❌ ไม่ใช้ Text-heavy UI

---

## 🤖 AI Role — Sub-agent Developer

คุณคือสุดยอดผู้ช่วยนักพัฒนาและสถาปนิกระบบ (AI Developer & Automator)
หน้าที่ของคุณคือช่วยเขียนโค้ด **React/Vite + Supabase** ให้สมบูรณ์แบบ

### Tech Stack ของโปรเจกต์
- **Frontend:** React + Vite, Vanilla CSS + Tailwind-like class utilities
- **Backend:** Supabase (PostgreSQL + Edge Functions [Deno/TypeScript] + pg_cron)
- **Notifications:** LINE Messaging API (Push Message)
- **AI:** Groq API (llama-3.3-70b-versatile)
- **Auth:** Supabase Auth
- **Deploy:** Vercel

### โครงสร้างโปรเจกต์สำคัญ

```
planner-supabase/
├── src/
│   ├── components/
│   │   ├── pomodoro/PomodoroTimer.jsx     # Pomodoro Timer + EXP
│   │   ├── leveling/HunterStatus.jsx      # Solo Leveling UI
│   │   ├── checklist/ChecklistItem.jsx    # Checklist + EXP
│   │   ├── accounting/TransactionForm.jsx # Finance + EXP (ไรเดอร์)
│   │   └── ...
│   ├── hooks/
│   │   ├── useLeveling.js                 # EXP System หลัก
│   │   └── ...
│   └── ...
├── supabase/
│   └── functions/
│       ├── morning-briefing/index.ts     # LINE แจ้งเตือนตี 7
│       ├── line-notifier/index.ts        # LINE แจ้งเตือน deadline
│       └── ...
├── supabase-morning-briefing.sql         # RPC + Cron Job ตี 7
├── supabase-leveling.sql                 # hunter_stats + exp_logs tables
└── LIFE_OS_CONTEXT.md                    # ← ไฟล์นี้
```

---

## 📊 EXP System — กติกาได้แต้ม

| การกระทำ | EXP | Source Type |
|-----------|-----|-------------|
| ติ๊กถูก Checklist ทั่วไป | +50 | `checklist` |
| ติ๊กถูก Checklist หมวด "เรียน/ทบทวน" | +80 | `checklist_study` |
| ทำ Pomodoro ครบ 25 นาที | +50 | `pomodoro` (2/min) |
| รักษา Habit วันนี้ | +30 | `habit` |
| รักษา Habit ต่อเนื่อง 7 วัน | +100 | `habit_bonus` |
| บันทึกรายรับ-รายจ่าย | +100 | `accounting` |
| บันทึกรายได้จากไรเดอร์ | +150 | `rider_income` |

---

## 🔑 ENV Variables ที่ต้องตั้งใน Supabase Secrets

```
LINE_CHANNEL_ACCESS_TOKEN  ← มาตรฐานเดียวทั้งโปรเจกต์ (ทั้ง morning-briefing และ line-notifier)
LINE_USER_ID               ← User ID ปลายทางของ LINE
GROQ_API_KEY               ← สำหรับ AI ใน morning-briefing
SUPABASE_URL               ← Auto-set โดย Supabase
SUPABASE_SERVICE_ROLE_KEY  ← Auto-set โดย Supabase
```

---

## 🗃️ Database Tables สำคัญ

| Table | ข้อมูลที่เก็บ |
|-------|-------------|
| `timetables` | ตารางเรียน (JSONB: cells, subjects, config) |
| `checklist_items` | รายการ todo/shopping |
| `habits` + `habit_logs` | นิสัยรายวัน |
| `academic_items` | งาน/สอบวิชาการ |
| `transactions` | รายรับ-รายจ่าย |
| `hunter_stats` | Level/EXP ของนักล่า |
| `exp_logs` | ประวัติการได้ EXP |
| `user_profiles` | LINE User ID |
| `line_notification_log` | ป้องกัน spam notification |
