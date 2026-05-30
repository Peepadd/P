import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase/supabaseClient'
import { RefreshCw, Sparkles } from 'lucide-react'
import RecurringForm from '../components/recurring/RecurringForm'
import RecurringList from '../components/recurring/RecurringList'
import DeleteConfirmModal from '../components/accounting/DeleteConfirmModal'
import useRecurringProcessor from '../hooks/useRecurringProcessor'

export default function Recurring() {
  const [recurringList, setRecurringList] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { processDueTransactions, processing, processResult, lastProcessed } =
    useRecurringProcessor()

  // Load recurring transactions
  const loadRecurring = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase
        .from('recurring_transactions')
        .select('*')
        .order('next_date', { ascending: true })

      if (err) throw err
      setRecurringList(data || [])
    } catch (err) {
      console.error('Error loading recurring:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load categories from transactions
  const loadCategories = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('transactions')
        .select('category')
        .limit(500)

      if (err) throw err
      const unique = [...new Set((data || []).map((t) => t.category).filter(Boolean))].sort()
      setCategories(unique)
    } catch (err) {
      // Silent fail for categories
    }
  }, [])

  // On mount: load data AND auto-process due recurrings
  useEffect(() => {
    const init = async () => {
      await Promise.all([loadRecurring(), loadCategories()])
      await processDueTransactions()
      await loadRecurring() // reload after processing
    }
    init()
  }, [loadRecurring, loadCategories, processDueTransactions])

  // Refresh both
  const refreshAll = useCallback(async () => {
    await loadRecurring()
    await loadCategories()
  }, [loadRecurring, loadCategories])

  // Create recurring transaction
  const handleCreate = async (formData) => {
    try {
      const { error: err } = await supabase.from('recurring_transactions').insert([
        {
          id: crypto.randomUUID(),
          type: formData.type,
          category: formData.category,
          amount: formData.amount,
          note: formData.note || null,
          frequency: formData.frequency,
          next_date: formData.next_date,
          transaction_time: formData.transaction_time || null,
        },
      ])
      if (err) throw err
      await refreshAll()
    } catch (err) {
      console.error('Error creating recurring:', err.message)
      alert(`เกิดข้อผิดพลาด: ${err.message}`)
    }
  }

  // Update recurring transaction
  const handleUpdate = async (formData) => {
    const editingId = editingItem?.id
    if (!editingId) return
    try {
      const { error: err } = await supabase
        .from('recurring_transactions')
        .update({
          type: formData.type,
          category: formData.category,
          amount: formData.amount,
          note: formData.note || null,
          frequency: formData.frequency,
          next_date: formData.next_date,
          transaction_time: formData.transaction_time || null,
        })
        .eq('id', editingId)

      if (err) throw err
      setEditingItem(null)
      await refreshAll()
    } catch (err) {
      console.error('Error updating recurring:', err.message)
      alert(`เกิดข้อผิดพลาด: ${err.message}`)
    }
  }

  // Toggle active/inactive
  const handleToggleActive = async (item) => {
    try {
      const { error: err } = await supabase
        .from('recurring_transactions')
        .update({ active: !item.active })
        .eq('id', item.id)

      if (err) throw err
      await loadRecurring()
    } catch (err) {
      console.error('Error toggling active:', err.message)
    }
  }

  // Delete recurring transaction
  const handleDelete = async (item) => {
    try {
      setDeleting(true)
      const { error: err } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', item.id)

      if (err) throw err
      setDeleteItem(null)
      await loadRecurring()
    } catch (err) {
      console.error('Error deleting recurring:', err.message)
      alert(`เกิดข้อผิดพลาด: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  // Manual process
  const handleProcessNow = async () => {
    await processDueTransactions()
    await loadRecurring()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">รายการอัตโนมัติ</h2>
          <p className="text-gray-500 mt-1">ตั้งค่ารายการที่เกิดซ้ำโดยอัตโนมัติ</p>
        </div>
        <div className="flex items-center gap-2">
          {lastProcessed && processResult && (
            <span className="text-xs text-gray-400">
              สร้างล่าสุด: {processResult.created} รายการ
            </span>
          )}
          <button
            onClick={handleProcessNow}
            disabled={processing}
            className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Sparkles size={16} className={processing ? 'animate-pulse' : ''} />
            {processing ? 'กำลังประมวลผล...' : 'ประมวลผลตอนนี้'}
          </button>
          <button
            onClick={loadRecurring}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Auto-process notification */}
      {processResult && processResult.created > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-sm text-green-700">
          <Sparkles size={16} />
          สร้างรายการใหม่ {processResult.created} รายการจากรายการอัตโนมัติ
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">ไม่สามารถโหลดข้อมูลได้</p>
              <p className="text-sm text-amber-600 mt-1">กรุณาตรวจสอบการตั้งค่า Supabase และ .env.local</p>
              <p className="text-xs text-amber-500 mt-1">Error: {error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        {editingItem ? (
          <RecurringForm
            initialData={editingItem}
            onSubmit={handleUpdate}
            onCancel={() => setEditingItem(null)}
            categories={categories}
          />
        ) : (
          <RecurringForm onSubmit={handleCreate} categories={categories} />
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            รายการที่ตั้งไว้
            {!loading && recurringList.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({recurringList.length} รายการ)
              </span>
            )}
          </h3>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <div className="w-8 h-8 mx-auto border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm mt-3">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <RecurringList
            recurringTransactions={recurringList}
            onToggleActive={handleToggleActive}
            onEdit={(item) => {
              setEditingItem(item)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            onDelete={(item) => setDeleteItem({ ...item, date: item.next_date })}
          />
        )}
      </div>

      {/* Delete Modal */}
      <DeleteConfirmModal
        transaction={deleteItem}
        onConfirm={handleDelete}
        onClose={() => setDeleteItem(null)}
        loading={deleting}
      />
    </div>
  )
}
