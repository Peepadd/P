import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase/supabaseClient'
import TransactionForm from '../components/accounting/TransactionForm'
import TransactionList from '../components/accounting/TransactionList'
import ViewTransactionModal from '../components/accounting/ViewTransactionModal'
import DeleteConfirmModal from '../components/accounting/DeleteConfirmModal'

export default function Accounting() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // View modal state
  const [viewTransaction, setViewTransaction] = useState(null)

  // Edit state
  const [editingTransaction, setEditingTransaction] = useState(null)

  // Delete state
  const [deleteTransaction, setDeleteTransaction] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Load transactions
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('record_time', { ascending: false })

      if (err) throw err
      setTransactions(data || [])
    } catch (err) {
      console.error('Error loading transactions:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Derive unique categories from loaded transactions
  useEffect(() => {
    if (transactions.length > 0) {
      const unique = [...new Set(transactions.map((t) => t.category).filter(Boolean))].sort()
      setCategories(unique)
    }
  }, [transactions])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  // Refresh both transactions and derived categories
  const refreshAll = useCallback(async () => {
    await loadTransactions()
  }, [loadTransactions])

  // Create transaction
  const handleCreate = async (formData) => {
    try {
      const { error: err } = await supabase.from('transactions').insert([
        {
          id: crypto.randomUUID(),
          date: formData.date,
          type: formData.type,
          category: formData.category,
          amount: formData.amount,
          note: formData.note || null,
          transaction_time: formData.transaction_time || null,
        },
      ])
      if (err) throw err
      await refreshAll()
    } catch (err) {
      console.error('Error creating transaction:', err.message)
      alert(`เกิดข้อผิดพลาด: ${err.message}`)
    }
  }

  // Update transaction
  const handleUpdate = async (formData) => {
    const editingId = editingTransaction?.id
    if (!editingId) return
    try {
      const { error: err } = await supabase
        .from('transactions')
        .update({
          date: formData.date,
          type: formData.type,
          category: formData.category,
          amount: formData.amount,
          note: formData.note || null,
          transaction_time: formData.transaction_time || null,
        })
        .eq('id', editingId)

      if (err) throw err
      setEditingTransaction(null)
      await refreshAll()
    } catch (err) {
      console.error('Error updating transaction:', err.message)
      alert(`เกิดข้อผิดพลาด: ${err.message}`)
    }
  }

  // Delete transaction
  const handleDelete = async (transaction) => {
    try {
      setDeleting(true)
      const { error: err } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id)

      if (err) throw err
      setDeleteTransaction(null)
      await refreshAll()
    } catch (err) {
      console.error('Error deleting transaction:', err.message)
      alert(`เกิดข้อผิดพลาด: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">บันทึกรายการ</h2>
        <p className="text-gray-500 mt-1">บันทึกและจัดการรายรับ-รายจ่าย</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">ไม่สามารถโหลดข้อมูลได้</p>
              <p className="text-sm text-amber-600 mt-1">
                กรุณาตรวจสอบการตั้งค่า Supabase และ .env.local
              </p>
              <p className="text-xs text-amber-500 mt-1">Error: {error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        {editingTransaction ? (
          <TransactionForm
            initialData={editingTransaction}
            onSubmit={handleUpdate}
            onCancel={() => setEditingTransaction(null)}
            categories={categories}
          />
        ) : (
          <TransactionForm
            onSubmit={handleCreate}
            categories={categories}
          />
        )}
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            รายการทั้งหมด
            {!loading && transactions.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({transactions.length} รายการ)
              </span>
            )}
          </h3>
          {!loading && transactions.length > 0 && (
            <button
              onClick={loadTransactions}
              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="รีเฟรช"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <div className="w-8 h-8 mx-auto border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm mt-3">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            onView={setViewTransaction}
            onEdit={(t) => {
              setEditingTransaction(t)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            onDelete={setDeleteTransaction}
          />
        )}
      </div>

      {/* View Modal */}
      <ViewTransactionModal
        transaction={viewTransaction}
        onClose={() => setViewTransaction(null)}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        transaction={deleteTransaction}
        onConfirm={handleDelete}
        onClose={() => setDeleteTransaction(null)}
        loading={deleting}
      />
    </div>
  )
}
