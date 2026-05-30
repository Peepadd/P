import { useState, useEffect, useCallback } from 'react'
import { startOfMonth, endOfMonth, format, parseISO, eachDayOfInterval, subMonths, addMonths } from 'date-fns'
import { supabase } from '../supabase/supabaseClient'

function calculateStreaks(logs, currentDate) {
  if (!logs || logs.length === 0) return { current: 0, best: 0 }

  // Sort logs by date descending
  const sorted = [...logs]
    .filter((l) => l.done)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  if (sorted.length === 0) return { current: 0, best: 0 }

  const today = format(currentDate || new Date(), 'yyyy-MM-dd')

  // Current streak: count consecutive days backwards from today/yesterday
  let currentStreak = 0
  let checkDate = new Date(today)

  for (let i = 0; i < sorted.length; i++) {
    const logDate = format(new Date(sorted[i].date), 'yyyy-MM-dd')
    const expectedDate = format(checkDate, 'yyyy-MM-dd')

    if (logDate === expectedDate) {
      currentStreak++
      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (logDate < expectedDate) {
      // Gap found — check if today is just missed (allow yesterday to count)
      if (currentStreak === 0) {
        // Try from yesterday
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd')
        if (logDate === yesterdayStr) {
          currentStreak = 1
          checkDate = yesterday
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      } else {
        break
      }
    }
  }

  // Best streak: scan through all logs
  let bestStreak = 0
  let tempStreak = 0
  let prevDate = null

  const chrono = [...logs]
    .filter((l) => l.done)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  chrono.forEach((log) => {
    const d = new Date(log.date)
    if (prevDate) {
      const diffDays = Math.round((d - prevDate) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        tempStreak++
      } else if (diffDays === 0) {
        // Same day, skip
        return
      } else {
        tempStreak = 1
      }
    } else {
      tempStreak = 1
    }
    prevDate = d
    bestStreak = Math.max(bestStreak, tempStreak)
  })

  return { current: currentStreak, best: bestStreak }
}

export default function useHabitData() {
  const [habits, setHabits] = useState([])
  const [habitLogs, setHabitLogs] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all habits
      const { data: habitsData, error: habitsErr } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: true })

      if (habitsErr) throw habitsErr
      setHabits(habitsData || [])

      // Fetch logs for current month view (extend a bit for streak calculation)
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)
      // Get 2 months before for streak calculation
      const extendedStart = subMonths(monthStart, 2)

      const { data: logsData, error: logsErr } = await supabase
        .from('habit_logs')
        .select('*')
        .gte('date', format(extendedStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'))

      if (logsErr) throw logsErr
      setHabitLogs(logsData || [])
    } catch (err) {
      console.error('Habit data error:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Create a new habit
  const createHabit = useCallback(async (name, frequency, color) => {
    try {
      const newHabit = {
        id: crypto.randomUUID(),
        name,
        frequency: frequency || 'Daily',
        color: color || '#6366f1',
      }

      const { error: insertErr } = await supabase
        .from('habits')
        .insert(newHabit)

      if (insertErr) throw insertErr
      setHabits((prev) => [...prev, newHabit])
      return newHabit
    } catch (err) {
      console.error('Create habit error:', err.message)
      alert(`เกิดข้อผิดพลาด: ${err.message}`)
      return null
    }
  }, [])

  // Update a habit
  const updateHabit = useCallback(async (id, updates) => {
    try {
      const { error: updateErr } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id)

      if (updateErr) throw updateErr
      setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)))
    } catch (err) {
      console.error('Update habit error:', err.message)
    }
  }, [])

  // Delete a habit
  const deleteHabit = useCallback(async (id) => {
    try {
      const { error: deleteErr } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)

      if (deleteErr) throw deleteErr
      setHabits((prev) => prev.filter((h) => h.id !== id))
      setHabitLogs((prev) => prev.filter((l) => l.habit_id !== id))
    } catch (err) {
      console.error('Delete habit error:', err.message)
    }
  }, [])

  // Toggle habit log for a specific date
  const toggleLog = useCallback(async (habitId, date, done, note) => {
    try {
      const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd')

      // Check if log exists
      const existing = habitLogs.find(
        (l) => l.habit_id === habitId && l.date === dateStr
      )

      if (existing) {
        // Update existing
        const { error: updateErr } = await supabase
          .from('habit_logs')
          .update({
            done: done !== undefined ? done : !existing.done,
            note: note !== undefined ? note : existing.note,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (updateErr) throw updateErr

        setHabitLogs((prev) =>
          prev.map((l) =>
            l.id === existing.id
              ? {
                  ...l,
                  done: done !== undefined ? done : !existing.done,
                  note: note !== undefined ? note : existing.note,
                }
              : l
          )
        )
      } else {
        // Create new
        const newLog = {
          id: crypto.randomUUID(),
          habit_id: habitId,
          date: dateStr,
          done: done !== undefined ? done : true,
          note: note || null,
        }

        const { error: insertErr } = await supabase
          .from('habit_logs')
          .insert(newLog)

        if (insertErr) throw insertErr
        setHabitLogs((prev) => [...prev, newLog])
      }
    } catch (err) {
      console.error('Toggle log error:', err.message)
    }
  }, [habitLogs])

  // Get logs for a specific habit
  const getLogsForHabit = useCallback((habitId) => {
    return habitLogs.filter((l) => l.habit_id === habitId)
  }, [habitLogs])

  // Get streaks for a specific habit
  const getStreaks = useCallback((habitId) => {
    const logs = habitLogs.filter((l) => l.habit_id === habitId)
    return calculateStreaks(logs, currentMonth)
  }, [habitLogs, currentMonth])

  // Get days in current month for the board
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const goToPrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1))
  const goToNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1))
  const goToToday = () => setCurrentMonth(new Date())

  return {
    habits,
    habitLogs,
    currentMonth,
    monthDays,
    loading,
    error,
    refetch: fetchData,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleLog,
    getLogsForHabit,
    getStreaks,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
  }
}
