import { useState, useEffect } from 'react'
import { Repeat, Plus, X } from 'lucide-react'
import { supabase } from '../supabase/supabaseClient'
import RecurringList from '../components/recurring/RecurringList'
import RecurringForm from '../components/recurring/RecurringForm'

export default function Recurring() {
  const [recurringTransactions, setRecurringTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  
  // Get unique categories for suggestions
  const [categories, setCategories] = useState([])

  const fetchRecurring = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .order('next_date', { ascending: true })

      if (error) throw error
      setRecurringTransactions(data || [])
      
      // Extract unique categories
      const uniqueCats = [...new Set((data || []).map(t => t.category).filter(Boolean))]
      setCategories(uniqueCats)
    } catch (err) {
      console.error('Error fetching recurring transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecurring()
  }, [])

  const handleSubmit = async (formData) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('recurring_transactions')
          .update({
            type: formData.type,
            category: formData.category,
            amount: formData.amount,
            note: formData.note,
            frequency: formData.frequency,
            next_date: formData.next_date,
            transaction_time: formData.transaction_time || null,
          })
          .eq('id', editingItem.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('recurring_transactions')
          .insert([
            {
              id: crypto.randomUUID(),
              user_id: (await supabase.auth.getUser()).data.user?.id,
              type: formData.type,
              category: formData.category,
              amount: formData.amount,
              note: formData.note,
              frequency: formData.frequency,
              next_date: formData.next_date,
              transaction_time: formData.transaction_time || null,
              active: true,
            }
          ])

        if (error) throw error
      }
      
      setShowForm(false)
      setEditingItem(null)
      fetchRecurring()
    } catch (err) {
      console.error('Error saving recurring transaction:', err)
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    }
  }

  const handleToggleActive = async (item) => {
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .update({ active: !item.active })
        .eq('id', item.id)

      if (error) throw error
      fetchRecurring()
    } catch (err) {
      console.error('Error toggling active status:', err)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) return

    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', item.id)

      if (error) throw error
      fetchRecurring()
    } catch (err) {
      console.error('Error deleting recurring transaction:', err)
    }
  }

  const openAddForm = () => {
    setEditingItem(null)
    setShowForm(true)
  }

  const openEditForm = (item) => {
    setEditingItem(item)
    setShowForm(true)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">รายการอัตโนมัติ</h1>
          <p className="text-gray-500 text-lg mt-1">Recurring Items</p>
        </div>
        <button 
          onClick={openAddForm}
          className="flex items-center justify-center gap-2 bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-600 transition-colors shrink-0"
        >
          <Plus size={18} />
          <span>เพิ่มรายการใหม่</span>
        </button>
      </header>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400 animate-pulse">กำลังโหลดข้อมูล...</div>
        ) : (
          <RecurringList 
            recurringTransactions={recurringTransactions}
            onToggleActive={handleToggleActive}
            onEdit={openEditForm}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pb-20 md:pb-0 pt-4 overflow-y-auto">
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-gray-200 shadow-xl relative animate-[fadeIn_0.2s_ease-out] my-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingItem ? 'แก้ไขรายการอัตโนมัติ' : 'เพิ่มรายการอัตโนมัติ'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 md:p-6">
              <RecurringForm 
                initialData={editingItem}
                categories={categories}
                onSubmit={handleSubmit}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
