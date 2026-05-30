// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

declare const Deno: any;

const LINE_API_URL = 'https://api.line.me/v2/bot/message/reply'
const LINE_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// ใช้ Service Role Key เพื่อให้อ่านข้อมูล user_profiles ได้โดยไม่ต้องพึ่งพิง Auth ธรรมดา
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function replyMessages(replyToken: string, messages: any[]) {
  const response = await fetch(LINE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  })
  if (!response.ok) {
    console.error('Failed to reply message:', await response.text())
  }
}

async function replyText(replyToken: string, text: string) {
  await replyMessages(replyToken, [{ type: 'text', text }])
}

// สร้าง Flex บันทึกรายจ่าย/รายรับ
function buildAccountingFlex(type: string, item: string, amount: number, category: string, dateStr: string, refId: string, balance: number) {
  const isExpense = (type === 'Expense');
  const themeColor = isExpense ? "#FF4D4F" : "#16A34A";
  const headerText = isExpense ? "บันทึกรายจ่ายสำเร็จ!" : "บันทึกรายรับสำเร็จ!";
  const signStr = isExpense ? "-฿" : "+฿";

  return {
    "type": "flex",
    "altText": headerText + " " + item + " " + amount + " บาท",
    "contents": {
      "type": "bubble",
      "size": "kilo",
      "header": {
        "type": "box", "layout": "vertical", "backgroundColor": themeColor,
        "contents": [{ "type": "text", "text": headerText, "weight": "bold", "color": "#FFFFFF", "size": "md", "align": "center" }]
      },
      "body": {
        "type": "box", "layout": "vertical", "spacing": "md",
        "contents": [
          { "type": "box", "layout": "horizontal", "contents": [
              { "type": "text", "text": "รายการ", "size": "sm", "color": "#888888" },
              { "type": "text", "text": item, "size": "sm", "color": "#111111", "align": "end", "weight": "bold" }
          ]},
          { "type": "box", "layout": "horizontal", "contents": [
              { "type": "text", "text": "จำนวนเงิน", "size": "sm", "color": "#888888" },
              { "type": "text", "text": signStr + amount.toLocaleString(), "size": "lg", "color": themeColor, "align": "end", "weight": "bold" }
          ]},
          { "type": "separator", "margin": "md" },
          { "type": "box", "layout": "horizontal", "margin": "md", "contents": [
              { "type": "text", "text": "หมวดหมู่", "size": "xs", "color": "#888888" },
              { "type": "text", "text": category, "size": "xs", "color": "#111111", "align": "end" }
          ]},
          { "type": "box", "layout": "horizontal", "contents": [
              { "type": "text", "text": "วันที่", "size": "xs", "color": "#888888" },
              { "type": "text", "text": dateStr, "size": "xs", "color": "#111111", "align": "end" }
          ]},
          { "type": "box", "layout": "horizontal", "contents": [
              { "type": "text", "text": "ยอดคงเหลือ", "size": "xs", "color": "#888888" },
              { "type": "text", "text": "฿" + balance.toLocaleString(), "size": "xs", "color": "#111111", "align": "end" }
          ]}
        ]
      },
      "footer": {
        "type": "box", "layout": "vertical", "spacing": "sm",
        "contents": [
          {
            "type": "button", "style": "secondary", "height": "sm",
            "action": {
              "type": "postback", "label": "✏️ แก้ไขรายการ", 
              "data": "action=editTransaction&id=" + refId + "&item=" + encodeURIComponent(item),
              "displayText": "ต้องการแก้ไขรายการ: " + item
            }
          },
          {
            "type": "button", "style": "secondary", "color": "#FF4D4F", "height": "sm",
            "action": {
              "type": "postback", "label": "🗑️ ลบรายการ", 
              "data": "action=deleteTransaction&id=" + refId,
              "displayText": "ต้องการลบรายการ: " + item
            }
          }
        ]
      },
      "styles": { "footer": { "separator": true } }
    }
  };
}

// สร้าง Flex Message สำหรับสรุปรายรับ-รายจ่าย
function buildSummaryFlex(income: number, expense: number, monthLabel: string) {
  const remain = income - expense;
  let barColor = "#10B981"; // สีเขียว (ปกติ)
  
  let spentPercent = income > 0 ? Math.round((expense / income) * 100) : 0;
  if (income <= 0 && expense > 0) spentPercent = 100;

  // ป้องกันแถบทะลุ 100%
  const widthPercent = spentPercent > 100 ? 100 : spentPercent; 
  
  if (spentPercent >= 80) barColor = "#EF4444"; // สีแดง (ใกล้หมด)
  else if (spentPercent >= 50) barColor = "#F59E0B"; // สีส้ม (ระวัง)

  return {
    "type": "flex",
    "altText": "สรุปยอดเดือนนี้",
    "contents": {
      "type": "bubble",
      "size": "kilo",
      "body": {
        "type": "box", "layout": "vertical", "spacing": "md", "paddingAll": "xl",
        "contents": [
          { "type": "text", "text": "📊 สรุปยอดเดือน " + monthLabel, "weight": "bold", "size": "md", "color": "#111111" },
          {
            "type": "box", "layout": "vertical", "margin": "lg", "spacing": "sm",
            "contents": [
              {
                "type": "box", "layout": "horizontal", "contents": [
                  { "type": "text", "text": "รายรับ", "size": "sm", "color": "#888888" },
                  { "type": "text", "text": "฿" + income.toLocaleString(), "size": "sm", "color": "#111111", "align": "end", "weight": "bold" }
                ]
              },
              {
                "type": "box", "layout": "horizontal", "contents": [
                  { "type": "text", "text": "รายจ่าย", "size": "sm", "color": "#888888" },
                  { "type": "text", "text": "฿" + expense.toLocaleString(), "size": "sm", "color": barColor, "align": "end", "weight": "bold" }
                ]
              },
              {
                "type": "box", "layout": "horizontal", "contents": [
                  { "type": "text", "text": "คงเหลือ", "size": "sm", "color": "#888888" },
                  { "type": "text", "text": "฿" + remain.toLocaleString(), "size": "sm", "color": "#111111", "align": "end", "weight": "bold" }
                ]
              }
            ]
          },
          // ส่วนของแถบ Progress Bar
          {
            "type": "box", "layout": "vertical", "margin": "xl",
            "contents": [
              {
                "type": "box", "layout": "vertical", "height": "10px", "cornerRadius": "xl", "backgroundColor": "#E5E7EB", 
                "contents": [
                  {
                    "type": "box", "layout": "vertical", "width": widthPercent + "%", "height": "10px", "backgroundColor": barColor, "cornerRadius": "xl",
                    "contents": []
                  }
                ]
              },
              { "type": "text", "text": "ใช้ไปแล้ว " + spentPercent + "%", "size": "xs", "color": "#888888", "margin": "sm", "align": "end" }
            ]
          }
        ]
      }
    }
  };
}

serve(async (req: Request) => {
  // ตอบ 200 ทันที หากไม่ได้ส่งมาเป็น POST หรือการ Verify Webhook จาก LINE
  if (req.method !== 'POST') {
    return new Response('OK', { status: 200 })
  }

  try {
    const body = await req.json()
    const events = body.events

    if (!events || events.length === 0) {
      return new Response('OK', { status: 200 })
    }

    const event = events[0]
    const replyToken = event.replyToken

    // ทำงานเฉพาะเมื่อเป็นข้อความตัวอักษร
    if (event.type !== 'message' || event.message.type !== 'text') {
      return new Response('OK', { status: 200 })
    }

    const lineUserId = event.source.userId
    const userMessage = event.message.text.trim()

    // 1. ตรวจสอบว่า userId นี้ผูกบัญชีไว้หรือไม่
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id') // ดึง id (UUID) มาใช้เป็น user_id 
      .eq('line_user_id', lineUserId)
      .single()

    if (profileError || !userProfile) {
      await replyText(
        replyToken,
        '⚠️ ตรวจพบว่าคุณยังไม่ได้ผูกบัญชี กรุณาเข้าสู่ระบบผ่านเว็บไซต์และทำการผูกบัญชี LINE ในหน้าตั้งค่าก่อนใช้งานนะครับ'
      )
      return new Response('OK', { status: 200 })
    }

    const parts = userMessage.split(/\s+/)
    const command = parts[0]

    // Helper function สำหรับดึงยอดเดือนนี้
    const getMonthlyBalance = async () => {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const startOfMonth = `${year}-${month}-01`
      const endOfMonth = new Date(year, date.getMonth() + 1, 0).toISOString().split('T')[0]

      const { data: transactions } = await supabase
        .from('transactions')
        .select('type, amount')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)

      let totalIncome = 0
      let totalExpense = 0
      transactions?.forEach((tx: any) => {
        if (tx.type === 'Income') totalIncome += tx.amount
        else if (tx.type === 'Expense') totalExpense += tx.amount
      })
      
      return { totalIncome, totalExpense, balance: totalIncome - totalExpense, monthStr: `${month}/${year}` }
    }

    // 2. ถ้าผู้ใช้พิมพ์ "สรุป"
    if (command === 'สรุป') {
      const { totalIncome, totalExpense, monthStr } = await getMonthlyBalance()
      const flexMsg = buildSummaryFlex(totalIncome, totalExpense, monthStr)
      await replyMessages(replyToken, [flexMsg])
      return new Response('OK', { status: 200 })
    }

    // 3. ถ้าผู้ใช้พิมพ์ "ยกเลิก" หรือ "ลบ" เพื่อลบรายการล่าสุด
    if (command === 'ยกเลิก' || command === 'ลบ') {
      const { data: latestTx, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        // ไม่ได้ filter ด้วย user_id เนื่องจากตาราง transactions ตาม Schema ไม่มีคอลัมน์ user_id
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError || !latestTx) {
        await replyText(replyToken, '❌ ไม่พบรายการล่าสุดที่สามารถยกเลิกได้')
        return new Response('OK', { status: 200 })
      }

      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', latestTx.id)

      if (deleteError) {
        await replyText(replyToken, '❌ ไม่สามารถลบรายการได้ในขณะนี้')
        return new Response('OK', { status: 200 })
      }

      await replyText(replyToken, `🗑️ ยกเลิกรายการเรียบร้อยแล้ว!\nรายการที่ลบ: ${latestTx.category} (${latestTx.amount} บาท)`)
      return new Response('OK', { status: 200 })
    }

    // 4. Parser อย่างง่าย: "[คำสั่ง] [จำนวนเงิน] [ชื่อรายการ]"
    if (parts.length < 3) {
      await replyText(
        replyToken,
        '❌ รูปแบบคำสั่งไม่ถูกต้อง\n\n📌 วิธีพิมพ์:\nจ่าย [จำนวนเงิน] [ชื่อรายการ]\nรับ [จำนวนเงิน] [ชื่อรายการ]\nพิมพ์ "สรุป" เพื่อดูยอดเดือนนี้\n\n👉 ตัวอย่าง: จ่าย 50 ข้าวแกง'
      )
      return new Response('OK', { status: 200 })
    }
    
    const amountStr = parts[1]
    const category = parts.slice(2).join(' ') // ชื่อรายการ
    const amount = parseFloat(amountStr)

    // ตรวจสอบคำสั่ง (จ่าย / รับ)
    let type = ''
    if (command === 'จ่าย') type = 'Expense'
    else if (command === 'รับ') type = 'Income'
    else {
      await replyText(replyToken, '❌ คำสั่งไม่ถูกต้อง กรุณาพิมพ์ขึ้นต้นด้วยคำว่า "จ่าย" หรือ "รับ" เท่านั้นครับ')
      return new Response('OK', { status: 200 })
    }

    // ตรวจสอบตัวเลข
    if (isNaN(amount) || amount <= 0) {
      await replyText(replyToken, '❌ จำนวนเงินไม่ถูกต้อง กรุณาระบุเป็นตัวเลขที่มากกว่า 0 ครับ')
      return new Response('OK', { status: 200 })
    }

    // 5. บันทึกลงตาราง transactions
    const transactionId = crypto.randomUUID()
    const today = new Date().toISOString().split('T')[0] // ได้ค่าเป็น YYYY-MM-DD

    const { error: insertError } = await supabase
      .from('transactions')
      .insert({
        id: transactionId,
        type: type,
        category: category,
        amount: amount,
        date: today
      })

    if (insertError) {
      console.error('Insert transaction error:', insertError)
      await replyText(replyToken, '❌ ระบบเกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง')
      return new Response('OK', { status: 200 })
    }

    // 6. ส่ง Flex Message กลับไปยืนยัน
    const { balance } = await getMonthlyBalance()
    const flexMsg = buildAccountingFlex(type, category, amount, 'ทั่วไป', today, transactionId, balance)
    
    await replyMessages(replyToken, [flexMsg])

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook Unexpected Error:', error)
    // ถึงจะ Error ก็ต้องส่ง 200 กลับไปให้ LINE ไม่ให้ระบบ retry รัวๆ
    return new Response('OK', { status: 200 })
  }
})
