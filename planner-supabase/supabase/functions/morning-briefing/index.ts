import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const LINE_ACCESS_TOKEN = Deno.env.get("LINE_ACCESS_TOKEN");
const LINE_USER_ID = Deno.env.get("LINE_USER_ID"); // User ID ปลายทาง
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// ใช้ Service Key เพื่อสิทธิ์ในการเรียก RPC โดยตรง
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async (req) => {
  try {
    // 1. เรียกใช้ RPC จากฐานข้อมูลที่คุณรันไว้
    const { data, error } = await supabase.rpc('get_morning_briefing');
    if (error) throw error;

    // 2. ประกอบร่างข้อความ (จัด UI ให้สวยงามแบบนักผจญภัย)
    let messageText = "🌅 อรุณสวัสดิ์ฮันเตอร์! นี่คือภารกิจประจำวันของคุณ:\n\n";

    // จัดการ Timetable
    messageText += "📚 **ตารางเรียน:**\n";
    if (data.timetable && data.timetable.length > 0) {
      data.timetable.forEach((t: any) => {
        messageText += `- ${t.subject_name} (${t.start_time} - ${t.end_time})\n`;
      });
    } else {
      messageText += "- ไม่มีคลาสเรียน\n";
    }
    messageText += "\n";

    // จัดการ Checklist
    messageText += "✅ **เควสต์ที่ต้องเคลียร์:**\n";
    if (data.checklist && data.checklist.length > 0) {
      data.checklist.forEach((c: any) => {
        messageText += `- ${c.title}\n`;
      });
    } else {
      messageText += "- เคลียร์ครบหมดแล้ว!\n";
    }
    messageText += "\n";

    // จัดการ Habits
    messageText += "🔥 **รักษาวินัย (Habits):**\n";
    if (data.habits && data.habits.length > 0) {
      data.habits.forEach((h: any) => {
        messageText += `- ${h.title}\n`;
      });
    } else {
      messageText += "- ไม่มี Habit กำหนดไว้\n";
    }

    messageText += "\nขอให้วันนี้เป็นวันที่ดีในการอัปเวลและฝึกภาษานะครับ! ⚔️";

    // 3. ส่งข้อความแบบ Push ผ่าน LINE
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LINE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: LINE_USER_ID,
        messages: [{ type: "text", text: messageText }],
      }),
    });

    if (!response.ok) {
      const errRes = await response.text();
      throw new Error(`LINE API failed: ${errRes}`);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error("Error triggering briefing:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
