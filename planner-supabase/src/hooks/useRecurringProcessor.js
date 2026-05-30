import { useState, useCallback } from 'react'
import { addDays, addWeeks, addMonths, addYears, format, startOfDay } from 'date-fns'
import { supabase } from '../supabase/supabaseClient'

export default function useRecurringProcessor() {
  const [processing, setProcessing] = useState(false)
  const [lastProcessed, setLastProcessed] = useState(null)
  const [processResult, setProcessResult] = useState(null)

  const processDueTransactions = useCallback(async () => {
    try {
      setProcessing(true)
      setProcessResult(null)
      const today = format(startOfDay(new Date()), 'yyyy-MM-dd')

      // Fetch all active recurring transactions that are due
      const { data: dueList, error: fetchErr } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('active', true)
        .lte('next_date', today)

      if (fetchErr) throw fetchErr
      if (!dueList || dueList.length === 0) {
        setProcessResult({ created: 0 })
        setLastProcessed(new Date().toISOString())
        return
      }

      let createdCount = 0

      for (const recurring of dueList) {
        // Create the actual transaction
        const { error: insertErr } = await supabase.from('transactions').insert([
          {
            id: crypto.randomUUID(),
            date: recurring.next_date,
            type: recurring.type,
            category: recurring.category,
            amount: recurring.amount,
            note: recurring.note,
            transaction_time: recurring.transaction_time,
            recurring_id: recurring.id,
          },
        ])
        if (insertErr) {
          console.error('Error creating transaction from recurring:', insertErr.message)
          continue
        }
        createdCount++

        // Calculate next date based on frequency
        const currentDate = new Date(recurring.next_date + 'T00:00:00')
        let nextDate
        switch (recurring.frequency) {
          case 'daily':
            nextDate = addDays(currentDate, 1)
            break
          case 'weekly':
            nextDate = addWeeks(currentDate, 1)
            break
          case 'monthly':
            nextDate = addMonths(currentDate, 1)
            break
          case 'yearly':
            nextDate = addYears(currentDate, 1)
            break
          default:
            nextDate = addMonths(currentDate, 1)
        }

        // Update the recurring transaction's next_date
        const { error: updateErr } = await supabase
          .from('recurring_transactions')
          .update({ next_date: format(nextDate, 'yyyy-MM-dd') })
          .eq('id', recurring.id)

        if (updateErr) {
          console.error('Error updating next_date:', updateErr.message)
        }
      }

      setProcessResult({ created: createdCount })
      setLastProcessed(new Date().toISOString())
    } catch (err) {
      console.error('Recurring processing error:', err.message)
      setProcessResult({ created: 0, error: err.message })
    } finally {
      setProcessing(false)
    }
  }, [])

  return {
    processDueTransactions,
    processing,
    lastProcessed,
    processResult,
  }
}
