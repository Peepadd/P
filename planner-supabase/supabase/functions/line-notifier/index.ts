import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const LINE_PUSH_API_URL = 'https://api.line.me/v2/bot/message/push'
const LINE_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function pushMessageToLine(lineUserId: string, text: string) {
  const response = await fetch(LINE_PUSH_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text }],
    }),
  })
  if (!response.ok) console.error(`Failed to push to ${lineUserId}:`, await response.text())
}

serve(async () => {
  try {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    const nowStr = now.toISOString()
    const tomorrowStr = tomorrow.toISOString()

    // 1. ดึงข้อมูลงานที่ใกล้หมดเวลา (อีก 24 ชั่วโมง)
    const [checklistResult, academicResult] = await Promise.all([
      supabase.from('checklist_items')
        .select('id, title, due_date, user_id')
        .eq('checked', false)
        .gte('due_date', nowStr)
        .lte('due_date', tomorrowStr),
        
      supabase.from('academic_items')
        .select('id, title, deadline, user_id')
        .neq('status', 'ส่งแล้ว')
        .gte('deadline', nowStr)
        .lte('deadline', tomorrowStr)
    ])

    const notifications: any[] = [] // เตรียมงานที่จะแจ้งเตือน

    if (checklistResult.data) {
      checklistResult.data.forEach((item: any) => {
        notifications.push({
          type: 'checklist',
          item_id: item.id,
          user_id: item.user_id,
          title: item.title,
          notif_key: `checklist_${item.id}_24h`, // Unique Key กันแจ้งซ้ำ
        })
      })
    }

    if (academicResult.data) {
      academicResult.data.forEach((item: any) => {
        notifications.push({
          type: 'academic',
          item_id: item.id,
          user_id: item.user_id,
          title: item.title,
          notif_key: `academic_${item.id}_24h`,
        })
      })
    }

    let sentCount = 0;

    // 2. ลูปยิงแจ้งเตือนทีละงาน
    for (const notif of notifications) {
      // ตรวจสอบว่าเคยแจ้งเตือน Key นี้ไปหรือยัง
      const { data: existingLog } = await supabase
        .from('line_notification_log')
        .select('id')
        .eq('notif_key', notif.notif_key)
        .maybeSingle()

      if (existingLog) continue; // เคยส่งไปแล้ว ข้ามไป

      // ค้นหา line_user_id ของเจ้าของงานนี้
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('line_user_id')
        .eq('id', notif.user_id)
        .single()

      if (userProfile && userProfile.line_user_id) {
        // ยิง Push Notification เข้า LINE
        await pushMessageToLine(
          userProfile.line_user_id,
          `⏰ แจ้งเตือน: คุณมีงาน "${notif.title}" ที่ต้องทำภายในวันพรุ่งนี้!`
        )

        // บันทึก Log การส่งลงฐานข้อมูลเพื่อป้องกันการส่งซ้ำ
        await supabase.from('line_notification_log').insert({
          notif_key: notif.notif_key,
          user_id: notif.user_id,
          type: notif.type,
          item_id: notif.item_id,
          sent_at: new Date().toISOString()
        })
        
        sentCount++;
      }
    }

    return new Response(JSON.stringify({ success: true, sent: sentCount }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Cron Notifier Error:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
