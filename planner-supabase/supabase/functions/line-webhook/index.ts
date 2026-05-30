// =============================================
// LINE Webhook — Supabase Edge Function (Deno)
// =============================================
//
// Deploy: supabase functions deploy line-webhook --no-verify-jwt
// Set secrets:
//   supabase secrets set LINE_CHANNEL_ACCESS_TOKEN=your_token
//   supabase secrets set LINE_CHANNEL_SECRET=your_secret
//
// LINE Console Webhook URL:
//   https://<PROJECT_REF>.supabase.co/functions/v1/line-webhook
// =============================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN') || ''
const LINE_CHANNEL_SECRET = Deno.env.get('LINE_CHANNEL_SECRET') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface LineEvent {
  type: string
  replyToken?: string
  source?: {
    userId?: string
    type: string
  }
  message?: {
    type: string
    text?: string
  }
}

interface LineWebhookBody {
  events: LineEvent[]
  destination: string
}

// ── Send reply message to LINE ──
async function replyMessage(replyToken: string, messages: any[]) {
  const res = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error('LINE reply error:', res.status, text)
  }
}

// ── Send push message to LINE ──
export async function pushLineMessage(userId: string, messages: any[]) {
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
    console.error('LINE push error:', res.status, text)
    throw new Error(`LINE push failed: ${text}`)
  }
}

// ── Build Flex Message for summary ──
function buildSummaryFlex(incomeTotal: number, expenseTotal: number, transactions: any[]) {
  const balance = incomeTotal - expenseTotal
  const recentItems = transactions.slice(0, 5).map((t: any) => ({
    type: 'box',
    layout: 'horizontal',
    contents: [
      {
        type: 'text',
        text: t.description || t.category || '-',
        size: 'sm',
        color: '#555555',
        flex: 3,
        wrap: true,
      },
      {
        type: 'text',
        text: `${t.type === 'Income' ? '+' : '-'}${Number(t.amount).toLocaleString()}`,
        size: 'sm',
        color: t.type === 'Income' ? '#dc2626' : '#16a34a',
        flex: 1,
        align: 'end',
      },
    ],
  }))

  return {
    type: 'flex',
    altText: `💰 สรุปรายรับ-รายจ่าย: รายรับ ${incomeTotal.toLocaleString()} | รายจ่าย ${expenseTotal.toLocaleString()}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📊 สรุปรายรับ-รายจ่าย',
            weight: 'bold',
            size: 'xl',
            color: '#1a1a2e',
          },
          {
            type: 'text',
            text: `คงเหลือ ${balance.toLocaleString()} บาท`,
            size: 'sm',
            color: balance >= 0 ? '#16a34a' : '#dc2626',
            margin: 'md',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: `💰 รายรับ`,
                size: 'sm',
                color: '#dc2626',
                flex: 1,
              },
              {
                type: 'text',
                text: `${incomeTotal.toLocaleString()} บาท`,
                size: 'sm',
                color: '#dc2626',
                align: 'end',
              },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: `💸 รายจ่าย`,
                size: 'sm',
                color: '#16a34a',
                flex: 1,
              },
              {
                type: 'text',
                text: `${expenseTotal.toLocaleString()} บาท`,
                size: 'sm',
                color: '#16a34a',
                align: 'end',
              },
            ],
            margin: 'md',
          },
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'text',
            text: 'รายการล่าสุด',
            weight: 'bold',
            size: 'sm',
            margin: 'lg',
            color: '#1a1a2e',
          },
          ...recentItems,
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'text',
            text: 'พิมพ์ "รายเดือน" เพื่อดูรายละเอียดเพิ่มเติม',
            size: 'xxs',
            color: '#aaaaaa',
            margin: 'md',
            align: 'end',
          },
        ],
      },
    },
  }
}

// ── Parse transaction from text ──
// Pattern: "จ่าย 50 ข้าวแกง" or "รับ 5000 เงินเดือน"
function parseTransaction(text: string): { type: string; amount: number; description: string } | null {
  const payMatch = text.match(/^(จ่าย|ใช้|ซื้อ)\s+(\d+[\d,]*)\s*(.+)?$/)
  const incomeMatch = text.match(/^(รับ|ได้)\s+(\d+[\d,]*)\s*(.+)?$/)

  if (payMatch) {
    return {
      type: 'Expense',
      amount: parseInt(payMatch[2].replace(/,/g, '')),
      description: payMatch[3]?.trim() || 'ค่าใช้จ่าย',
    }
  }

  if (incomeMatch) {
    return {
      type: 'Income',
      amount: parseInt(incomeMatch[2].replace(/,/g, '')),
      description: incomeMatch[3]?.trim() || 'รายรับ',
    }
  }

  return null
}

// ── Main handler ──
serve(async (req) => {
  // Verify signature (optional but recommended)
  // const signature = req.headers.get('x-line-signature')
  // if (!verifySignature(await req.clone().text(), signature)) {
  //   return new Response('Invalid signature', { status: 401 })
  // }

  const body: LineWebhookBody = await req.json()

  for (const event of body.events) {
    // Only handle text messages
    if (event.type !== 'message' || event.message?.type !== 'text') {
      continue
    }

    const lineUserId = event.source?.userId
    const text = event.message.text.trim()
    const replyToken = event.replyToken

    if (!lineUserId || !replyToken) continue

    // Find user by line_user_id
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('line_user_id', lineUserId)
      .limit(1)

    if (profileError || !profiles || profiles.length === 0) {
      await replyMessage(replyToken, [
        { type: 'text', text: '⚠️ ไม่พบผู้ใช้ที่เชื่อมต่อ กรุณาเข้าสู่ระบบและเชื่อมต่อ LINE จากหน้า Settings ก่อนใช้งาน' },
      ])
      continue
    }

    const userId = profiles[0].id

    // ── Command: Summary ──
    if (text === 'สรุป' || text === 'summary' || text === 'รายเดือน') {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('amount, type, description, category')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: false })

      if (txError) {
        await replyMessage(replyToken, [{ type: 'text', text: `❌ เกิดข้อผิดพลาด: ${txError.message}` }])
        continue
      }

      const incomeTotal = (transactions || [])
        .filter((t: any) => t.type === 'Income')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

      const expenseTotal = (transactions || [])
        .filter((t: any) => t.type === 'Expense')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

      const flexMessage = buildSummaryFlex(incomeTotal, expenseTotal, transactions || [])
      await replyMessage(replyToken, [flexMessage])
      continue
    }

    // ── Command: Record transaction ──
    const parsed = parseTransaction(text)
    if (parsed) {
      const today = new Date().toISOString().split('T')[0]
      const id = crypto.randomUUID()

      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          id,
          type: parsed.type,
          amount: parsed.amount,
          description: parsed.description,
          date: today,
          category: parsed.type === 'Income' ? 'รายรับอื่นๆ' : 'อื่นๆ',
        })

      if (insertError) {
        await replyMessage(replyToken, [
          { type: 'text', text: `❌ บันทึกล้มเหลว: ${insertError.message}` },
        ])
        continue
      }

      const emoji = parsed.type === 'Income' ? '💰' : '💸'
      await replyMessage(replyToken, [
        {
          type: 'text',
          text: `${emoji} บันทึกเรียบร้อย!\n${parsed.type === 'Income' ? 'รายรับ' : 'รายจ่าย'}: ${parsed.amount.toLocaleString()} บาท\nรายละเอียด: ${parsed.description}`,
        },
      ])
      continue
    }

    // ── Unknown command ──
    await replyMessage(replyToken, [
      {
        type: 'text',
        text: `👋 สวัสดี! คำสั่งที่ใช้งานได้:\n\n💰 บันทึกรายการ:\n  "จ่าย 50 ข้าวแกง"\n  "รับ 5000 เงินเดือน"\n\n📊 สรุป:\n  "สรุป" หรือ "รายเดือน"\n\n🔗 ไปที่ Planner → Settings เพื่อเชื่อมต่อบัญชี`,
      },
    ])
  }

  return new Response('OK', { status: 200 })
})
