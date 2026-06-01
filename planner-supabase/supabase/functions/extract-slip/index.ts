import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // จัดการ CORS สำหรับเรียกจาก Frontend
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      throw new Error("Missing imageBase64 in request body");
    }

    // ดึง API Key จาก Secrets ของ Supabase
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    
    // เรียกใช้ Gemini API (REST Endpoint)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `คุณคือผู้ช่วยบันทึกบัญชี กรุณาอ่านข้อมูลจากสลิปโอนเงินนี้ และตอบกลับมาเป็น JSON ตามโครงสร้างนี้เท่านั้น โดยไม่ต้องมีคำอธิบายเพิ่มเติม:
                {
                  "amount": (ตัวเลขจำนวนเงินทศนิยม 2 ตำแหน่ง),
                  "date": (วันที่โอน รูปแบบ YYYY-MM-DD),
                  "payee": (ชื่อผู้รับเงิน หรือชื่อร้านค้า),
                  "category": (เดาหมวดหมู่จากชื่อร้านค้า เช่น Food, Transport, Shopping, Bills)
                }`
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageBase64.replace(/^data:image\/\w+;base64,/, "") // ตัด prefix ออกถ้ามี
                }
              }
            ]
          }]
        })
      }
    );

    const data = await response.json();
    
    // สกัด JSON ออกจาก Text ที่ AI ตอบกลับมา (จัดการกรณีมี Markdown block ```json)
    let jsonStr = data.candidates[0].content.parts[0].text;
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const result = JSON.parse(jsonStr);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
