import { useState, useEffect, useCallback } from 'react'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { supabase } from '../supabase/supabaseClient'

const MONTHS_TH = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

function getMonthRange(date) {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
    label: MONTHS_TH[date.getMonth()],
  }
}

export default function useDashboardData() {
  const [summary, setSummary] = useState({
    incomeTotal: 0,
    expenseTotal: 0,
    balance: 0,
    incomeCount: 0,
    expenseCount: 0,
  })
  const [monthlyData, setMonthlyData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [budget, setBudget] = useState({ amount: 0, spent: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const now = new Date()

      // ---- 1. Current month summary ----
      const monthRange = getMonthRange(now)
      const { data: monthData, error: monthErr } = await supabase
        .from('transactions')
        .select('type, amount')
        .gte('date', monthRange.start)
        .lte('date', monthRange.end)

      if (monthErr) throw monthErr

      let incomeTotal = 0, expenseTotal = 0
      let incomeCount = 0, expenseCount = 0
      ;(monthData || []).forEach((t) => {
        if (t.type === 'Income') {
          incomeTotal += Number(t.amount)
          incomeCount++
        } else {
          expenseTotal += Number(t.amount)
          expenseCount++
        }
      })

      setSummary({
        incomeTotal,
        expenseTotal,
        balance: incomeTotal - expenseTotal,
        incomeCount,
        expenseCount,
      })

      // ---- 2. Last 6 months bar data ----
      const sixMonthsAgo = subMonths(now, 5)
      const { data: sixMonthData, error: sixErr } = await supabase
        .from('transactions')
        .select('date, type, amount')
        .gte('date', format(startOfMonth(sixMonthsAgo), 'yyyy-MM-dd'))
        .lte('date', format(endOfMonth(now), 'yyyy-MM-dd'))
        .order('date', { ascending: true })

      if (sixErr) throw sixErr

      // Aggregate by month
      const monthlyMap = {}
      for (let i = 0; i < 6; i++) {
        const m = subMonths(now, 5 - i)
        const key = format(m, 'yyyy-MM')
        monthlyMap[key] = {
          label: MONTHS_TH[m.getMonth()],
          income: 0,
          expense: 0,
        }
      }

      ;(sixMonthData || []).forEach((t) => {
        const key = format(new Date(t.date + 'T00:00:00'), 'yyyy-MM')
        if (monthlyMap[key]) {
          if (t.type === 'Income') {
            monthlyMap[key].income += Number(t.amount)
          } else {
            monthlyMap[key].expense += Number(t.amount)
          }
        }
      })

      setMonthlyData(Object.values(monthlyMap))

      // ---- 3. Category breakdown for current month (expenses only) ----
      const { data: catData, error: catErr } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('type', 'Expense')
        .gte('date', monthRange.start)
        .lte('date', monthRange.end)

      if (catErr) throw catErr

      const catMap = {}
      ;(catData || []).forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount)
      })

      const catArray = Object.entries(catMap)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)

      setCategoryData(catArray)

      // ---- 4. Budget ----
      const { data: budgetData, error: budgetErr } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'monthly_budget')
        .single()

      if (budgetErr && budgetErr.code !== 'PGRST116') throw budgetErr

      const budgetAmount = budgetData?.value?.amount || 0
      setBudget({ amount: budgetAmount, spent: expenseTotal })
    } catch (err) {
      console.error('Dashboard data error:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateBudget = useCallback(async (newAmount) => {
    try {
      const { error: upsertErr } = await supabase
        .from('system_settings')
        .upsert(
          { key: 'monthly_budget', value: { amount: newAmount } },
          { onConflict: 'key' }
        )
      if (upsertErr) throw upsertErr
      setBudget((prev) => ({ ...prev, amount: newAmount }))
    } catch (err) {
      console.error('Budget update error:', err.message)
      alert(`เกิดข้อผิดพลาด: ${err.message}`)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    summary,
    monthlyData,
    categoryData,
    budget,
    loading,
    error,
    refetch: fetchData,
    updateBudget,
  }
}
