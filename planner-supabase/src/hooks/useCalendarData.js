import { useState, useEffect, useCallback } from 'react'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns'
import { supabase } from '../supabase/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { syncLocalEventsToGoogle } from '../utils/googleCalendarSync'

const EVENT_COLORS = {
  transaction_income: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'รายรับ' },
  transaction_expense: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'รายจ่าย' },
  checklist_shopping: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', label: 'ซื้อของ' },
  checklist_todo: { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500', label: 'สิ่งที่ต้องทำ' },
  academic_exam: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'สอบ' },
  academic_homework: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'การบ้าน' },
  academic_project: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500', label: 'โปรเจกต์' },
  academic_group: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'งานกลุ่ม' },
  academic_presentation: { bg: 'bg-pink-100', text: 'text-pink-700', dot: 'bg-pink-500', label: 'นำเสนอ' },
  academic_other: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500', label: 'อื่นๆ' },
  google_calendar: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Google Calendar' },
}

function getAcademicColor(type) {
  switch (type) {
    case 'สอบ': return EVENT_COLORS.academic_exam
    case 'การบ้าน': return EVENT_COLORS.academic_homework
    case 'โปรเจกต์': return EVENT_COLORS.academic_project
    case 'งานกลุ่ม': return EVENT_COLORS.academic_group
    case 'นำเสนอ': return EVENT_COLORS.academic_presentation
    default: return EVENT_COLORS.academic_other
  }
}

export { EVENT_COLORS, getAcademicColor }

export default function useCalendarData(currentDate) {
  const { providerToken } = useAuth()
  const [eventsByDate, setEventsByDate] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [googleError, setGoogleError] = useState(null)

  const fetchData = useCallback(async (date) => {
    try {
      setLoading(true)
      setError(null)
      setGoogleError(null)

      // Get month range (extend to full weeks for week view)
      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)
      const rangeStart = startOfWeek(monthStart, { weekStartsOn: 1 })
      const rangeEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

      const startStr = format(rangeStart, 'yyyy-MM-dd')
      const endStr = format(rangeEnd, 'yyyy-MM-dd')

      // Fetch all data in parallel
      const [transResult, checkResult, acadResult, googleResult] = await Promise.all([
        // 1. Transactions
        supabase
          .from('transactions')
          .select('id, date, type, category, amount, note, transaction_time')
          .gte('date', startStr)
          .lte('date', endStr),

        // 2. Checklist items — fetch all with due_date or end_date (typically few items)
        supabase
          .from('checklist_items')
          .select('id, type, text, category, note, due_date, end_date, checked')
          .or('due_date.not.is.NULL,end_date.not.is.NULL'),

        // 3. Academic items (not archived)
        supabase
          .from('academic_items')
          .select('id, subject, topic, type, deadline, end_time, priority, status')
          .not('deadline', 'is', null),

        // 4. Google Calendar events
        providerToken ? fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startStr}T00:00:00Z&timeMax=${endStr}T23:59:59Z&singleEvents=true&orderBy=startTime`,
          { headers: { Authorization: `Bearer ${providerToken}` } }
        ).then(async res => {
          if (!res.ok) {
            const errText = await res.text()
            console.error('Google API Error:', res.status, errText)
            setGoogleError(`HTTP ${res.status}: ${errText}`)
            return { items: [] }
          }
          return res.json()
        }).catch((err) => {
          console.error('Google Fetch Catch:', err)
          setGoogleError(err.message)
          return { items: [] }
        }) : Promise.resolve({ items: [] }),
      ])

      if (transResult.error) throw transResult.error
      if (checkResult.error) throw checkResult.error
      if (acadResult.error) throw acadResult.error

      // Build events map: { '2026-05-30': [ ...events] }
      const eventsMap = {}

      const addEvent = (dateKey, event) => {
        if (!eventsMap[dateKey]) eventsMap[dateKey] = []
        eventsMap[dateKey].push(event)
      }

      // Transactions
      ;(transResult.data || []).forEach((t) => {
        const dateKey = t.date
        addEvent(dateKey, {
          id: `trans-${t.id}`,
          source: 'transaction',
          type: t.type === 'Income' ? 'transaction_income' : 'transaction_expense',
          color: t.type === 'Income' ? EVENT_COLORS.transaction_income : EVENT_COLORS.transaction_expense,
          title: `${t.type === 'Income' ? 'รายรับ' : 'รายจ่าย'}: ${t.category}`,
          subtitle: `${Math.abs(Number(t.amount)).toLocaleString('th-TH')} บาท`,
          time: t.transaction_time,
          note: t.note,
          data: t,
        })
      })

      // Checklist items
      ;(checkResult.data || []).forEach((item) => {
        // Add on due_date
        if (item.due_date) {
          const dateKey = item.due_date.split('T')[0]
          addEvent(dateKey, {
            id: `check-${item.id}-due`,
            source: 'checklist',
            type: item.type === 'shopping' ? 'checklist_shopping' : 'checklist_todo',
            color: item.type === 'shopping' ? EVENT_COLORS.checklist_shopping : EVENT_COLORS.checklist_todo,
            title: item.text,
            subtitle: item.category ? `📂 ${item.category}` : (item.checked ? '✅ เสร็จแล้ว' : '⏳ รอทำ'),
            time: null,
            note: item.note,
            data: item,
          })
        }
        // Also add on end_date if different
        if (item.end_date && (!item.due_date || item.end_date !== item.due_date)) {
          const dateKey = item.end_date.split('T')[0]
          // Only if within range
          if (dateKey >= startStr && dateKey <= endStr) {
            addEvent(dateKey, {
              id: `check-${item.id}-end`,
              source: 'checklist',
              type: item.type === 'shopping' ? 'checklist_shopping' : 'checklist_todo',
              color: item.type === 'shopping' ? EVENT_COLORS.checklist_shopping : EVENT_COLORS.checklist_todo,
              title: `${item.text} (สิ้นสุด)`,
              subtitle: item.checked ? '✅ เสร็จแล้ว' : '⏳ รอทำ',
              time: null,
              note: item.note,
              data: item,
            })
          }
        }
      })

      // Academic items
      ;(acadResult.data || []).forEach((item) => {
        if (item.deadline) {
          const dateKey = item.deadline.split('T')[0]
          const acadColor = getAcademicColor(item.type)
          addEvent(dateKey, {
            id: `acad-${item.id}`,
            source: 'academic',
            type: `academic_${item.type}`,
            color: acadColor,
            title: `${item.subject}: ${item.topic}`,
            subtitle: `${item.type} • ${item.priority === 'สูง' ? '🔴' : item.priority === 'กลาง' ? '🟡' : '🟢'} ${item.status}`,
            time: item.end_time,
            note: item.note,
            data: item,
          })
        }
      })

      // Google Calendar
      const gEvents = googleResult?.items || []
      gEvents.forEach((gEvent) => {
        const startDateObj = gEvent.start?.dateTime || gEvent.start?.date
        if (startDateObj) {
          const dateKey = startDateObj.split('T')[0]
          let time = null
          if (gEvent.start?.dateTime) {
            const dateObj = new Date(gEvent.start.dateTime)
            time = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
          }
          addEvent(dateKey, {
            id: `google-${gEvent.id}`,
            source: 'google',
            type: 'google_calendar',
            color: EVENT_COLORS.google_calendar,
            title: gEvent.summary || '(ไม่มีชื่อ)',
            subtitle: gEvent.location ? `📍 ${gEvent.location}` : 'Google Calendar',
            time: time,
            note: gEvent.description,
            data: gEvent,
          })
        }
      })

      // Sort events within each day by time
      Object.keys(eventsMap).forEach((key) => {
        eventsMap[key].sort((a, b) => {
          if (a.time && b.time) return a.time.localeCompare(b.time)
          if (a.time) return -1
          if (b.time) return 1
          return 0
        })
      })

      setEventsByDate(eventsMap)

      // Background auto-sync to Google Calendar
      if (providerToken) {
        const localEventsToSync = []
        Object.keys(eventsMap).forEach((dateKey) => {
          eventsMap[dateKey].forEach((e) => {
            if (e.source !== 'google') {
              localEventsToSync.push({ ...e, dateKey })
            }
          })
        })
        
        syncLocalEventsToGoogle(providerToken, localEventsToSync, startStr, endStr)
          .then((count) => {
            if (count > 0) {
              console.log(`Auto-synced ${count} events to Google Calendar`)
            }
          })
          .catch((err) => console.error('Auto-sync failed:', err))
      }
    } catch (err) {
      console.error('Calendar data error:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(currentDate)
  }, [currentDate, fetchData, providerToken])

  return { eventsByDate, loading, error, googleError, refetch: () => fetchData(currentDate) }
}
