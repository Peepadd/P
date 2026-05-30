// =============================================
// LINE Notifier — Scheduled Edge Function
// =============================================
//
// Deploy as scheduled function:
//   supabase functions deploy line-notifier --no-verify-jwt
//   supabase functions schedule create --schedule "*/30 * * * *" line-notifier
//
// This function checks for approaching deadlines every 30 minutes
// and sends LINE push notifications to connected users.
// =============================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const LEAD_TIMES = [
  { label: '3 ชั่วโมง', ms: 3 * 60 * 60 * 1000 },
  { label: '1 ชั่วโมง', ms: 1 * 60 * 60 * 1000 },
  { label: '30 นาที', ms: 30 * 60 * 1000 },
]

// ── Send push message ──
async function pushMessage(userId: string, messages: any[]) {
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to: userId, messages }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`LINE push error for ${userId}:`, res.status, text)
  }
}

// ── Helper: check if notification was already sent ──
async function wasNotified(notifKey: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('line_notification_log')
    .select('id')
    .eq('notif_key', notifKey)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Check notification log error:', error.message)
  }
  return !!data
}

// ── Helper: mark notification as sent ──
async function markNotified(notifKey: string, userId: string, type: string, itemId: string) {
  const { error } = await supabase
    .from('line_notification_log')
    .insert({
      notif_key: notifKey,
      user_id: userId,
      type,
      item_id: itemId,
    })

  if (error) console.error('Mark notified error:', error.message)
}

serve(async () => {
  const now = Date.now()
  const todayStr = new Date().toISOString().split('T')[0]

  // ── Get all users with LINE connected ──
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, line_user_id')
    .not('line_user_id', 'is', null)

  if (profileError) {
    console.error('Fetch profiles error:', profileError.message)
    return new Response('Error', { status: 500 })
  }

  if (!profiles || profiles.length === 0) {
    console.log('No LINE connected users found')
    return new Response('No users', { status: 200 })
  }

  // Build a map of user_id -> line_user_id
  const userLineMap = new Map(profiles.map((p: any) => [p.id, p.line_user_id]))

  // ── Fetch due checklist items (not checked, has due_date, not past) ──
  const { data: checklistItems, error: checkErr } = await supabase
    .from('checklist_items')
    .select('id, text, due_date, type')
    .eq('checked', false)
    .not('due_date', 'is', null)

  if (checkErr) console.error('Fetch checklist error:', checkErr.message)

  // ── Fetch due academic items (not completed, has deadline) ──
  const { data: academicItems, error: acadErr } = await supabase
    .from('academic_items')
    .select('id, subject, topic, type, deadline, priority')
    .in('status', ['กำลังทำ', 'รอตรวจ'])
    .not('deadline', 'is', null)

  if (acadErr) console.error('Fetch academic error:', acadErr.message)

  let notifiedCount = 0

  // ── Check checklist items ──
  for (const item of (checklistItems || [])) {
    const dueTime = new Date(item.due_date).getTime()
    if (isNaN(dueTime)) continue

    const timeUntil = dueTime - now
    if (timeUntil <= 0) continue // Skip past-due (handled elsewhere)

    for (const lead of LEAD_TIMES) {
      if (timeUntil <= lead.ms) {
        const notifKey = `checklist-${lead.label}-${item.id}`
        if (await wasNotified(notifKey)) continue

        // Send to all LINE-connected users
        for (const [userId, lineUserId] of userLineMap) {
          await pushMessage(lineUserId, [
            {
              type: 'text',
              text: `✅ เตือน To-do!\n\n"${item.text}"\nอีก ${lead.label}\n\nไปที่ Planner → Checklist เพื่อดำเนินการ`,
            },
          ])
        }

        await markNotified(notifKey, 'system', 'checklist', item.id)
        notifiedCount++
      }
    }
  }

  // ── Check academic items ──
  for (const item of (academicItems || [])) {
    const dueTime = new Date(item.deadline).getTime()
    if (isNaN(dueTime)) continue

    const timeUntil = dueTime - now
    if (timeUntil <= 0) continue

    for (const lead of LEAD_TIMES) {
      if (timeUntil <= lead.ms) {
        const notifKey = `academic-${lead.label}-${item.id}`
        if (await wasNotified(notifKey)) continue

        const prefix = item.type === 'สอบ' ? '📝' : '📚'
        const priorityEmoji = item.priority === 'สูง' ? ' 🔴' : ''

        for (const [, lineUserId] of userLineMap) {
          await pushMessage(lineUserId, [
            {
              type: 'text',
              text: `${prefix} เตือน${item.type}!${priorityEmoji}\n\n${item.subject}: ${item.topic}\nอีก ${lead.label}\n\nไปที่ Planner → งาน/สอบ เพื่อดำเนินการ`,
            },
          ])
        }

        await markNotified(notifKey, 'system', 'academic', item.id)
        notifiedCount++
      }
    }
  }

  console.log(`LINE notifier: ${notifiedCount} notifications sent to ${userLineMap.size} users`)
  return new Response(`Sent ${notifiedCount} notifications`, { status: 200 })
})
