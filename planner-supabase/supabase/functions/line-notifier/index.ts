// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

declare const Deno: any;

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
    const future24 = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const future72 = new Date(now.getTime() + 72 * 60 * 60 * 1000)

    // ดึงงานที่ยังไม่เสร็จ และมีกำหนดเวลา
    const [checklistResult, academicResult, usersResult] = await Promise.all([
      supabase.from('checklist_items')
        .select('id, text, due_date')
        .eq('checked', false)
        .not('due_date', 'is', null),
        
      supabase.from('academic_items')
        .select('id, subject, topic, deadline')
        .neq('status', 'ส่งแล้ว')
        .neq('status', 'เสร็จ')
        .neq('status', 'Done')
        .not('deadline', 'is', null),

      // ดึงผู้ใช้ทั้งหมดที่มีบัญชี LINE เนื่องจากแอปเป็นแบบแชร์
      supabase.from('user_profiles')
        .select('id, line_user_id')
        .not('line_user_id', 'is', null)
    ])

    const notifications: any[] = [] 
    const profiles = usersResult.data || []

    function getLevel(dateStr: string) {
      const d = new Date(dateStr)
      if (d < now) return { suffix: 'overdue', prefix: '🚨 [เลยกำหนด]' }
      if (d <= future24) return { suffix: '1day', prefix: '⏰ [พรุ่งนี้]' }
      if (d <= future72) return { suffix: '3days', prefix: '⚠️ [อีก 3 วัน]' }
      return null
    }

    if (checklistResult.data) {
      checklistResult.data.forEach((item: any) => {
        const level = getLevel(item.due_date)
        if (level) {
          notifications.push({
            type: 'checklist',
            item_id: item.id,
            title: `Checklist: ${item.text}`,
            notif_key: `checklist_${item.id}_${level.suffix}`,
            prefix: level.prefix
          })
        }
      })
    }

    if (academicResult.data) {
      academicResult.data.forEach((item: any) => {
        const level = getLevel(item.deadline)
        if (level) {
          notifications.push({
            type: 'academic',
            item_id: item.id,
            title: `วิชา ${item.subject} (${item.topic})`,
            notif_key: `academic_${item.id}_${level.suffix}`,
            prefix: level.prefix
          })
        }
      })
    }

    let sentCount = 0

    // ลูปยิงแจ้งเตือนทีละงานไปยังผู้ใช้ทุกคนที่มี LINE
    for (const notif of notifications) {
      for (const profile of profiles) {
        const notifLogKey = `${notif.notif_key}_${profile.id}`
        
        // ตรวจสอบว่าเคยแจ้งเตือน Key นี้ให้ User คนนี้ไปหรือยัง
        const { data: existingLog } = await supabase
          .from('line_notification_log')
          .select('id')
          .eq('notif_key', notifLogKey)
          .maybeSingle()

        if (existingLog) continue; // เคยส่งไประดับเวลานี้ให้คนนี้แล้ว ข้ามไป

        if (profile.line_user_id) {
          // ยิง Push Notification เข้า LINE
          await pushMessageToLine(
            profile.line_user_id,
            `${notif.prefix} คุณมีงานค้าง: "${notif.title}" รีบจัดการด้วยนะครับ! 💪`
          )

          // บันทึก Log การส่งลงฐานข้อมูล
          await supabase.from('line_notification_log').insert({
            notif_key: notifLogKey, // ใช้คีย์ที่รวม user_id ด้วย
            user_id: profile.id,    // เพื่อให้ตารางบันทึก user_id ได้ถูกต้อง
            type: notif.type,
            item_id: notif.item_id,
            sent_at: new Date().toISOString()
          })
          
          sentCount++;
        }
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
