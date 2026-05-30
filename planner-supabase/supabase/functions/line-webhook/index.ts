import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const LINE_MESSAGING_API = "https://api.line.me/v2/bot/message/reply";
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const body = await req.json();
    const events = body.events;

    if (!events || events.length === 0) {
      return new Response("OK", { status: 200 });
    }

    const event = events[0];
    const replyToken = event.replyToken;
    const lineUserId = event.source?.userId;
    const text = event.message?.text?.trim();

    // เช็คข้อความและประเภทอีเวนต์
    if (event.type !== "message" || event.message.type !== "text" || !lineUserId || !replyToken) {
      return new Response("OK", { status: 200 });
    }

    // 2. ตรวจสอบในตาราง user_profiles
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("line_user_id", lineUserId)
      .single();

    if (profileError || !userProfile) {
      await replyToLine(replyToken, "คุณยังไม่ได้ผูกบัญชี กรุณาเข้าสู่ระบบผ่านเว็บ");
      return new Response("OK", { status: 200 });
    }

    // 3. วิเคราะห์ข้อความ (Text Parsing)
    // คาดหวังรูปแบบ: "จ่าย 50 ข้าวแกง" หรือ "รับ 1000 ค่าขนม"
    const parts = text.split(/\s+/);
    if (parts.length < 3) {
      await replyToLine(replyToken, "รูปแบบไม่ถูกต้อง กรุณาพิมพ์: [รับ/จ่าย] [จำนวนเงิน] [รายการ]");
      return new Response("OK", { status: 200 });
    }

    const command = parts[0];
    const amountText = parts[1];
    const category = parts.slice(2).join(" ");
    const amount = parseFloat(amountText);

    if (isNaN(amount)) {
      await replyToLine(replyToken, "จำนวนเงินไม่ถูกต้อง กรุณาระบุเป็นตัวเลข");
      return new Response("OK", { status: 200 });
    }

    let type = "";
    let typeName = "";
    if (command === "จ่าย") {
      type = "Expense";
      typeName = "รายจ่าย";
    } else if (command === "รับ") {
      type = "Income";
      typeName = "รายรับ";
    } else {
      await replyToLine(replyToken, "คำสั่งต้องขึ้นต้นด้วย 'รับ' หรือ 'จ่าย'");
      return new Response("OK", { status: 200 });
    }

    // 4. บันทึกข้อมูลลงตาราง transactions
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    
    // ตาราง transactions ใช้ id เป็น TEXT และไม่มีคอลัมน์ user_id (ใช้เป็นระบบ Shared access หรือดึงสิทธิ์จาก RLS)
    const { error: insertError } = await supabase
      .from("transactions")
      .insert({
        id: crypto.randomUUID(),
        type: type,
        category: category,
        amount: amount,
        date: today,
        note: "บันทึกผ่าน LINE",
      });

    if (insertError) {
      console.error(insertError);
      await replyToLine(replyToken, "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
      return new Response("OK", { status: 200 });
    }

    // 5. ส่งข้อความ Reply กลับไปหาผู้ใช้ว่าบันทึกสำเร็จ
    await replyToLine(replyToken, `✅ บันทึก${typeName} ${amount} บาท (${category}) เรียบร้อยแล้ว!`);

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

async function replyToLine(replyToken: string, message: string) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.error("LINE_CHANNEL_ACCESS_TOKEN is not set.");
    return;
  }

  const payload = {
    replyToken: replyToken,
    messages: [
      {
        type: "text",
        text: message,
      },
    ],
  };

  const response = await fetch(LINE_MESSAGING_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error("LINE API Error:", await response.text());
  }
}
