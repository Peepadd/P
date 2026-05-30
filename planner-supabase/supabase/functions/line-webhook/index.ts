import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const LINE_API_URL = 'https://api.line.me/v2/bot/message/reply'
const LINE_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// ใช้ Service Role Key เพื่อให้อ่านข้อมูล user_profiles ได้โดยไม่ต้องพึ่งพิง Auth ธรรมดา
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function replyMessage(replyToken: string, text: string) {
  const response = await fetch(LINE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text }],
    }),
  })
  if (!response.ok) {
    console.error('Failed to reply message:', await response.text())
  }
}

serve(async (req) => {
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
      await replyMessage(
        replyToken,
        '⚠️ ตรวจพบว่าคุณยังไม่ได้ผูกบัญชี กรุณาเข้าสู่ระบบผ่านเว็บไซต์และทำการผูกบัญชี LINE ในหน้าตั้งค่าก่อนใช้งานนะครับ'
      )
      return new Response('OK', { status: 200 })
    }

    // 2. Parser อย่างง่าย: "[คำสั่ง] [จำนวนเงิน] [ชื่อรายการ]"
    const parts = userMessage.split(/\s+/)
    if (parts.length < 3) {
      await replyMessage(
        replyToken,
        '❌ รูปแบบคำสั่งไม่ถูกต้อง\n\n📌 วิธีพิมพ์:\nจ่าย [จำนวนเงิน] [ชื่อรายการ]\nรับ [จำนวนเงิน] [ชื่อรายการ]\n\n👉 ตัวอย่าง: จ่าย 50 ข้าวแกง'
      )
      return new Response('OK', { status: 200 })
    }

    const command = parts[0]
    const amountStr = parts[1]
    const category = parts.slice(2).join(' ') // รองรับชื่อรายการยาวๆ ที่อาจมีเว้นวรรค
    const amount = parseFloat(amountStr)

    // ตรวจสอบคำสั่ง (จ่าย / รับ)
    let type = ''
    if (command === 'จ่าย') type = 'Expense'
    else if (command === 'รับ') type = 'Income'
    else {
      await replyMessage(replyToken, '❌ คำสั่งไม่ถูกต้อง กรุณาพิมพ์ขึ้นต้นด้วยคำว่า "จ่าย" หรือ "รับ" เท่านั้นครับ')
      return new Response('OK', { status: 200 })
    }

    // ตรวจสอบตัวเลข
    if (isNaN(amount) || amount <= 0) {
      await replyMessage(replyToken, '❌ จำนวนเงินไม่ถูกต้อง กรุณาระบุเป็นตัวเลขที่มากกว่า 0 ครับ')
      return new Response('OK', { status: 200 })
    }

    // 3. บันทึกลงตาราง transactions
    const transactionId = crypto.randomUUID()
    const today = new Date().toISOString().split('T')[0] // ได้ค่าเป็น YYYY-MM-DD

    const { error: insertError } = await supabase
      .from('transactions')
      .insert({
        id: transactionId,
        user_id: userProfile.id,
        type: type,
        category: category,
        amount: amount,
        date: today
      })

    if (insertError) {
      console.error('Insert transaction error:', insertError)
      await replyMessage(replyToken, '❌ ระบบเกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง')
      return new Response('OK', { status: 200 })
    }

    // 4. ส่งข้อความยืนยันการทำรายการ
    const typeLabel = type === 'Expense' ? 'รายจ่าย' : 'รายรับ'
    const emoji = type === 'Expense' ? '💸' : '💰'
    
    await replyMessage(
      replyToken,
      `✅ บันทึก${typeLabel}เรียบร้อยแล้ว!\n\n${emoji} รายการ: ${category}\n💵 จำนวนเงิน: ${amount} บาท`
    )

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook Unexpected Error:', error)
    // ถึงจะ Error ก็ต้องส่ง 200 กลับไปให้ LINE ไม่ให้ระบบ retry รัวๆ
    return new Response('OK', { status: 200 })
  }
})
