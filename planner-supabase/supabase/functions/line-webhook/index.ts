import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const LINE_ACCESS_TOKEN = Deno.env.get("LINE_ACCESS_TOKEN");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

// ตั้งค่า Supabase Admin Client สำหรับ Edge Function
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ฟังก์ชันส่งข้อความกลับไปที่ LINE
async function replyLineMessage(replyToken: string, text: string) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken: replyToken,
      messages: [{ type: "text", text: text }],
    }),
  });
}

// ฟังก์ชันประมวลผลข้อความด้วย AI (Gemini)
async function extractExpenseWithAI(text: string) {
  const prompt = `
  คุณคือบอทบันทึกรายจ่าย จงวิเคราะห์ข้อความต่อไปนี้: "${text}"
  - ถ้านี่คือการบันทึกรายจ่าย ให้ตอบกลับเป็น JSON format เท่านั้น โดยมี key คือ: amount (ตัวเลข), category (เดาหมวดหมู่), payee (ชื่อร้าน/ผู้รับ, ถ้ามี), note (หมายเหตุ)
  - ถ้าไม่ใช่การบันทึกรายจ่าย หรือไม่แน่ใจ ให้ตอบกลับแค่คำว่า "NULL"
  ห้ามมีคำอธิบายอื่นใดนอกจาก JSON หรือ NULL
  `;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await response.json();
  let resultStr = data.candidates[0].content.parts[0].text.trim();
  resultStr = resultStr.replace(/```json/g, '').replace(/```/g, '').trim();
  
  if (resultStr === "NULL") return null;
  
  try {
    return JSON.parse(resultStr);
  } catch {
    return null;
  }
}

serve(async (req) => {
  try {
    const { events } = await req.json();

    if (!events || events.length === 0) {
      return new Response("OK", { status: 200 });
    }

    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const text = event.message.text.trim();
        const replyToken = event.replyToken;
        const lineUserId = event.source.userId; // ใช้สำหรับ Map กับ User ในระบบ

        // ==========================================
        // 1. สาย Regex (Fast Lane) - เช็คคำสั่งเฉพาะ
        // ==========================================
        if (text === "ตารางเรียนพรุ่งนี้" || text === "ตารางเรียน") {
          // ดึงข้อมูลจากตาราง Timetable (ตัวอย่างการดึงข้อมูลเบื้องต้น)
          // *หมายเหตุ: ในใช้งานจริงต้อง map lineUserId ให้ตรงกับ user_id ของ Supabase
          let replyText = "📚 ตารางเรียนของคุณ:\n";
          const { data, error } = await supabase.from('timetable').select('*').limit(3);
          
          if (error || !data || data.length === 0) {
            replyText += "ยังไม่มีวิชาเรียนที่บันทึกไว้ครับ";
          } else {
            data.forEach(subject => {
              replyText += `- ${subject.subject_name} (${subject.start_time})\n`;
            });
          }
          
          await replyLineMessage(replyToken, replyText);
          continue; // จบลูป ไม่ต้องไปหา AI
        }

        // ==========================================
        // 2. สาย AI (Smart Lane) - แปลงข้อความเป็นรายจ่าย
        // ==========================================
        const expenseData = await extractExpenseWithAI(text);
        
        if (expenseData && expenseData.amount) {
          // บันทึกลง Supabase Database ทันที
          // *หมายเหตุ: ต้องทำการแมป lineUserId เป็น auth.users.id หรือบันทึกแบบ Shared ก่อน
          const { error } = await supabase.from('transactions').insert([{
            type: 'Expense',
            amount: expenseData.amount,
            category: expenseData.category || 'อื่นๆ',
            note: expenseData.note || expenseData.payee || 'บันทึกผ่าน LINE',
            date: new Date().toISOString().split('T')[0],
            transaction_time: new Date().toTimeString().split(' ')[0]
          }]);

          if (error) {
            await replyLineMessage(replyToken, "❌ บันทึกรายจ่ายไม่สำเร็จ กรุณาลองใหม่ครับ");
          } else {
            await replyLineMessage(replyToken, `✅ บันทึกรายจ่ายสำเร็จ!\nยอด: ฿${expenseData.amount}\nหมวด: ${expenseData.category}`);
          }
        } else {
          // กรณีบอทไม่เข้าใจ หรือไม่ใช่คำสั่งรายจ่าย
          await replyLineMessage(replyToken, "🤖 รับทราบครับ! (หากต้องการบันทึกรายจ่าย พิมพ์เช่น 'ข้าวมันไก่ 50' หรือพิมพ์ 'ตารางเรียน' เพื่อดูตารางเรียนครับ)");
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
