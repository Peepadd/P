import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabase/supabaseClient'

const CHECK_INTERVAL = 30000 // 30 seconds
const NOTIFICATION_LEAD_TIMES = [
  { label: '3 ชั่วโมง', ms: 3 * 60 * 60 * 1000 },
  { label: '1 ชั่วโมง', ms: 1 * 60 * 60 * 1000 },
  { label: '30 นาที', ms: 30 * 60 * 1000 },
]
const SENT_KEY = 'buff_notifications_sent'
const PERMISSION_KEY = 'buff_notification_permission_granted'

function getSentRecords() {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveSentRecords(records) {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify(records))
  } catch {
    // Silently fail if localStorage is full
  }
}

// Calculate true consecutive streak from habit logs
function calculateConsecutiveStreak(logs) {
  if (!logs || logs.length === 0) return 0

  // Get unique dates sorted ascending for proper consecutive check
  const uniqueDates = [...new Set(logs.map((l) => l.date))]
    .sort()
    .reverse() // Most recent first

  if (uniqueDates.length === 0) return 0

  let streak = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    const current = new Date(uniqueDates[i - 1])
    const prev = new Date(uniqueDates[i])
    const diffDays = Math.round((current - prev) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      streak++
    } else {
      break // Gap found, stop counting
    }
  }

  return streak
}

function cleanOldRecords(records) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  const cleaned = {}
  for (const [key, timestamp] of Object.entries(records)) {
    if (timestamp > cutoff) {
      cleaned[key] = timestamp
    }
  }
  return cleaned
}

export default function useNotificationChecker() {
  const [notifications, setNotifications] = useState([])
  const [permission, setPermission] = useState(
    () => localStorage.getItem(PERMISSION_KEY) === 'true' && Notification?.permission === 'granted'
  )
  const intervalRef = useRef(null)
  const notifiedRef = useRef(getSentRecords())

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Web Notification API not supported')
      return false
    }

    if (Notification.permission === 'granted') {
      setPermission(true)
      localStorage.setItem(PERMISSION_KEY, 'true')
      return true
    }

    if (Notification.permission === 'denied') {
      setPermission(false)
      return false
    }

    try {
      const result = await Notification.requestPermission()
      const granted = result === 'granted'
      setPermission(granted)
      if (granted) {
        localStorage.setItem(PERMISSION_KEY, 'true')
      }
      return granted
    } catch (err) {
      console.error('Notification permission error:', err)
      return false
    }
  }, [])

  // Helper: check if a habit should be done on a given day based on frequency
  const shouldDoHabitToday = (frequency) => {
    const dayOfWeek = new Date().getDay() // 0=Sun, 1=Mon, ...
    switch (frequency) {
      case 'Daily': return true
      case 'Weekdays': return dayOfWeek >= 1 && dayOfWeek <= 5
      case 'Weekends': return dayOfWeek === 0 || dayOfWeek === 6
      case 'Weekly': return true // Could be any day
      default: return true
    }
  }

  // Core check function
  const checkDeadlines = useCallback(async () => {
    try {
      const now = Date.now()
      const notified = notifiedRef.current
      const newNotifications = []
      const todayStr = new Date().toISOString().split('T')[0]

      // ── Fetch checklist items ──
      const { data: checklistItems, error: checkErr } = await supabase
        .from('checklist_items')
        .select('id, type, text, category, due_date, end_date, checked')
        .eq('checked', false)
        .not('due_date', 'is', null)

      if (checkErr) throw checkErr

      // ── Fetch academic items ──
      const { data: academicItems, error: acadErr } = await supabase
        .from('academic_items')
        .select('id, subject, topic, type, deadline, priority, status')
        .in('status', ['กำลังทำ', 'รอตรวจ'])
        .not('deadline', 'is', null)

      if (acadErr) throw acadErr

      // ── Fetch habits for today's reminders ──
      const { data: habits, error: habitsErr } = await supabase
        .from('habits')
        .select('id, name, frequency, color')

      if (habitsErr) throw habitsErr

      // ── Check checklist items ──
      ;(checklistItems || []).forEach((item) => {
        const dueDate = new Date(item.due_date).getTime()
        if (isNaN(dueDate)) return

        const timeUntilDue = dueDate - now

        // Past due
        if (timeUntilDue <= 0) {
          const notifKey = `checklist-overdue-${item.id}`
          if (!notified[notifKey]) {
            newNotifications.push({
              id: notifKey,
              type: 'checklist',
              title: item.type === 'shopping' ? '🛒 ถึงกำหนดซื้อของ!' : '✅ ถึงกำหนดต้องทำ!',
              body: `"${item.text}" เลยกำหนดเวลาแล้ว${item.category ? ` (${item.category})` : ''}`,
              urgency: 'overdue',
              link: '/checklist',
            })
            notified[notifKey] = now
          }
        } else {
          // Lead time notifications — send on first detection (notified ref prevents duplicates)
          NOTIFICATION_LEAD_TIMES.forEach((lead) => {
            if (timeUntilDue <= lead.ms) {
              const notifKey = `checklist-${lead.label}-${item.id}`
              if (!notified[notifKey]) {
                newNotifications.push({
                  id: notifKey,
                  type: 'checklist',
                  title: item.type === 'shopping' ? '🛒 เตือนซื้อของ' : '✅ เตือน To-do',
                  body: `"${item.text}" อีก ${lead.label}${item.category ? ` (${item.category})` : ''}`,
                  urgency: lead.label,
                  link: '/checklist',
                })
                notified[notifKey] = now
              }
            }
          })
        }
      })

      // ── Check academic items ──
      ;(academicItems || []).forEach((item) => {
        const deadline = new Date(item.deadline).getTime()
        if (isNaN(deadline)) return

        const timeUntilDue = deadline - now
        const prefix = item.type === 'สอบ' ? '📝' : '📚'

        // Past due
        if (timeUntilDue <= 0) {
          const notifKey = `academic-overdue-${item.id}`
          if (!notified[notifKey]) {
            newNotifications.push({
              id: notifKey,
              type: 'academic',
              title: `${prefix} เลยกำหนด${item.type}!`,
              body: `"${item.subject}: ${item.topic}" — กำหนดส่งเลยมาแล้ว`,
              urgency: 'overdue',
              link: '/academic',
            })
            notified[notifKey] = now
          }
        } else {
          NOTIFICATION_LEAD_TIMES.forEach((lead) => {
            if (timeUntilDue <= lead.ms) {
              const notifKey = `academic-${lead.label}-${item.id}`
              if (!notified[notifKey]) {
                newNotifications.push({
                  id: notifKey,
                  type: 'academic',
                  title: `${prefix} เตือน${item.type}!`,
                  body: `"${item.subject}: ${item.topic}" — อีก ${lead.label}${item.priority === 'สูง' ? ' (🔴 สำคัญมาก)' : ''}`,
                  urgency: lead.label,
                  link: '/academic',
                })
                notified[notifKey] = now
              }
            }
          })
        }
      })

      // ── Check habits reminders ──
      if (habits && habits.length > 0) {
        // Fetch today's habit logs (all at once)
        const { data: todayLogs, error: logsErr } = await supabase
          .from('habit_logs')
          .select('habit_id, done')
          .eq('date', todayStr)
          .eq('done', true)

        if (logsErr) throw logsErr

        const completedHabitIds = new Set((todayLogs || []).map((l) => l.habit_id))
        const currentHour = new Date().getHours()

        // Pre-fetch recent logs for streak checks (single query, all habits)
        // Fetch 60 days to calculate meaningful consecutive streaks
        let streakLogsByHabit = null
        if (currentHour >= 14 && currentHour < 18) {
          const sixtyDaysAgo = new Date()
          sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
          const pastStr = sixtyDaysAgo.toISOString().split('T')[0]

          const { data: allRecentLogs } = await supabase
            .from('habit_logs')
            .select('habit_id, date, done')
            .eq('done', true)
            .gte('date', pastStr)
            .lte('date', todayStr)

          if (allRecentLogs) {
            streakLogsByHabit = {}
            for (const log of allRecentLogs) {
              if (!streakLogsByHabit[log.habit_id]) {
                streakLogsByHabit[log.habit_id] = []
              }
              streakLogsByHabit[log.habit_id].push(log)
            }
          }
        }

        // Check each habit
        for (const habit of habits) {
          if (!shouldDoHabitToday(habit.frequency)) continue
          if (completedHabitIds.has(habit.id)) continue // Already done today

          // ── Reminder 1: Evening reminder (after 6 PM) for incomplete daily/weekday habits ──
          if (currentHour >= 18) {
            const notifKey = `habit-reminder-${habit.id}-${todayStr}`
            if (!notified[notifKey]) {
              newNotifications.push({
                id: notifKey,
                type: 'habit',
                title: `🌱 อย่าลืมทำ "${habit.name}"`,
                body: `ยังไม่ได้ทำ ${habit.name} วันนี้ — ใช้เวลาแค่ไม่กี่นาที มาทำกันเถอะ!`,
                urgency: 'วันนี้',
                link: '/habits',
              })
              notified[notifKey] = now
            }
          }

          // ── Reminder 2: Afternoon nudge (after 2 PM) if habit has a streak going ──
          if (currentHour >= 14 && currentHour < 18 && streakLogsByHabit) {
            const habitLogs = streakLogsByHabit[habit.id]
            if (habitLogs) {
              const streak = calculateConsecutiveStreak(habitLogs)
              if (streak >= 3) {
                // Has a decent streak going — send a streak preservation reminder
                const notifKey = `habit-streak-${habit.id}-${todayStr}`
                if (!notified[notifKey]) {
                  const emoji = streak >= 14 ? '🔥🔥🔥' : streak >= 7 ? '🔥🔥' : '🔥'
                  newNotifications.push({
                    id: notifKey,
                    type: 'habit',
                    title: `${emoji} รักษา Streak "${habit.name}"`,
                    body: `ทำติดต่อกัน ${streak} วันแล้ว! อย่าพลาดวันนี้ — ทำให้ครบ!`,
                    urgency: 'วันนี้',
                    link: '/habits',
                  })
                  notified[notifKey] = now
                }
              }
            }
          }
        }
      }

      // ── Check timetable pre-class reminders ──
      try {
        const jsDay = new Date().getDay()
        if (jsDay >= 1 && jsDay <= 5) {
          const dayIdx = jsDay - 1
          const { data: ttData } = await supabase
            .from('timetables')
            .select('config, cells, subjects')
            .order('updated_at', { ascending: false })
            .limit(1)

          if (ttData && ttData.length > 0) {
            const tt = ttData[0]
            if (tt.config && tt.cells) {
              const cfg = tt.config
              const startParts = cfg.tStart.split(':').map(Number)
              let currentMin = startParts[0] * 60 + startParts[1]
              const nowDate = new Date()
              const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes()

              for (let i = 0; i < cfg.periods; i++) {
                const periodStart = currentMin
                const cellKey = `${dayIdx}_${i}`
                const cell = tt.cells[cellKey]

                if (cell && cell.subject) {
                  const minutesUntilClass = periodStart - nowMinutes
                  // Notify 15 minutes before class
                  if (minutesUntilClass > 0 && minutesUntilClass <= 15) {
                    const notifKey = `timetable-preclass-${cellKey}-${todayStr}`
                    if (!notified[notifKey]) {
                      const roomInfo = cell.room ? ` ห้อง ${cell.room}` : ''
                      newNotifications.push({
                        id: notifKey,
                        type: 'timetable',
                        title: `📚 อีก ${minutesUntilClass} นาทีจะเข้าเรียน`,
                        body: `${cell.subject}${roomInfo}${cell.teacher ? ` (${cell.teacher})` : ''}`,
                        urgency: '15 นาที',
                        link: '/timetable',
                      })
                      notified[notifKey] = now
                    }
                  }
                }
                currentMin += cfg.pMin + cfg.bMin
              }
            }
          }
        }
      } catch (ttErr) {
        console.error('Timetable notification check error:', ttErr)
      }

      // Clean old notification records
      notifiedRef.current = cleanOldRecords(notified)
      saveSentRecords(notifiedRef.current)

      if (newNotifications.length > 0) {
        setNotifications((prev) => [...prev, ...newNotifications])
      }
    } catch (err) {
      // Silently fail — don't disrupt the app for notifications
      console.error('Notification check error:', err.message)
    }
  }, [])

  // Clear a specific notification
  const clearNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Start checking
  useEffect(() => {
    // Initial check after 2 seconds (let app load first)
    const initialTimer = setTimeout(() => {
      checkDeadlines()
    }, 2000)

    // Periodic check
    intervalRef.current = setInterval(checkDeadlines, CHECK_INTERVAL)

    return () => {
      clearTimeout(initialTimer)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkDeadlines])

  return {
    notifications,
    permission,
    requestPermission,
    clearNotification,
    clearAll,
  }
}
