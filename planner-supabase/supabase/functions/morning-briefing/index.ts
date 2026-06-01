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

    // 2. ส่งข้อมูลให้ Gemini AI วิเคราะห์และเรียบเรียงข้อความ
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const promptText = `
คุณคือ "ฮันเตอร์ไกด์" ผู้ช่วยส่วนตัวในธีมกิลด์นักผจญภัย (Guild Master/Guide) หน้าที่ของคุณคือการบรีฟงานตอนเช้าให้กับ "ฮันเตอร์" (ผู้ใช้งาน) เพื่อปลุกไฟในการทำงานประจำวัน
โปรดสรุปข้อมูลต่อไปนี้ให้น่าอ่าน ให้กำลังใจ สดใส และใช้ภาษาที่เป็นกันเอง สั้นกระชับ (ไม่เกิน 15-20 บรรทัด) จัดหน้าด้วย Emoji ให้สวยงาม

ข้อมูลของวันนี้:
- ตารางเรียน/ตารางงาน: ${JSON.stringify(data.timetable || [])}
- สิ่งที่ต้องทำ (เควสต์รายวัน): ${JSON.stringify(data.checklist || [])}
- นิสัยที่ต้องรักษาวินัย (Habits): ${JSON.stringify(data.habits || [])}

รูปแบบการตอบ:
- ทักทายตอนเช้าแบบฮันเตอร์
- สรุปตารางเวลาที่สำคัญ
- ไฮไลท์เควสต์ที่ต้องทำ
- ปิดท้ายด้วยคำให้กำลังใจในการอัปเวลชีวิต
    `;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
      }),
    });

    if (!aiResponse.ok) {
      const errRes = await aiResponse.text();
      throw new Error(`Gemini API failed: ${errRes}`);
    }

    const aiData = await aiResponse.json();
    let messageText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!messageText) {
      messageText = "🌅 อรุณสวัสดิ์ฮันเตอร์! ระบบไกด์ AI ขัดข้องชั่วคราว แต่วันนี้คุณมีภารกิจรออยู่นะ ลุยเลย!";
    }

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
