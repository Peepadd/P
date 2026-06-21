import { useState, useEffect } from 'react'
import { ClipboardList, Plus, Trash2, Check, Calendar } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase/supabaseClient'

export default function Checklist() {
  const [searchParams] = useSearchParams()
  const dateParam = searchParams.get('date')

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Inline Form State
  const [isAdding, setIsAdding] = useState(!!dateParam)
  const [formData, setFormData] = useState({
    text: '',
    due_date: dateParam || new Date().toISOString().split('T')[0]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchItems = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .order('due_date', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (err) {
      console.error('Error fetching checklist items:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.text.trim()) return

    try {
      setIsSubmitting(true)
      const newItem = {
        id: crypto.randomUUID(),
        type: 'todo', // Match DB constraint
        text: formData.text.trim(),
        due_date: formData.due_date || null,
        checked: false
      }

      const { error } = await supabase.from('checklist_items').insert([newItem])
      if (error) throw error

      setItems((prev) => [...prev, newItem].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)))
      setFormData({ text: '', due_date: new Date().toISOString().split('T')[0] })
      setIsAdding(false)
    } catch (err) {
      console.error('Error adding checklist item:', err)
      alert(`Failed to add item: ${err.message || JSON.stringify(err)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleChecked = async (id, currentChecked) => {
    const newChecked = !currentChecked

    // Optimistic UI
    setItems(items.map(item => item.id === id ? { ...item, checked: newChecked } : item))

    try {
      const { error } = await supabase
        .from('checklist_items')
        .update({ checked: newChecked })
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      console.error('Error toggling checked status:', err)
      // Revert on error
      setItems(items.map(item => item.id === id ? { ...item, checked: currentChecked } : item))
    }
  }

  const handleDelete = async (id) => {
    // Optimistic UI for delete
    const previousItems = [...items]
    setItems(items.filter(item => item.id !== id))

    try {
      const { error } = await supabase.from('checklist_items').delete().eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error('Error deleting item:', err)
      setItems(previousItems) // Revert
    }
  }

  // Calculate stats
  const completedCount = items.filter(i => i.checked).length
  const totalCount = items.length

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">

      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-fg tracking-tight">Checklist</h1>
          <p className="text-muted text-lg mt-1">
            {totalCount > 0 ? `ทำเสร็จแล้ว ${completedCount} จาก ${totalCount} รายการ` : 'รายการที่ต้องทำ'}
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isAdding
              ? 'bg-gray-100 text-fg-2 hover:bg-gray-200'
              : 'bg-accent text-white hover:bg-accent-hover'
          }`}
        >
          <Plus size={18} className={`transform transition-transform ${isAdding ? 'rotate-45' : ''}`} />
          <span className="hidden sm:inline">{isAdding ? 'ยกเลิก' : 'เพิ่มรายการ'}</span>
        </button>
      </header>

      {/* Inline Add Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-md border border-border p-4 space-y-4 animate-[fadeIn_0.15s_ease-out]">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-fg-2 mb-1">สิ่งที่ต้องทำ</label>
              <input
                required
                autoFocus
                value={formData.text}
                onChange={(e) => setFormData({...formData, text: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                placeholder="พิมพ์สิ่งที่ต้องทำ..."
              />
            </div>
            <div className="sm:w-48">
              <label className="block text-sm font-medium text-fg-2 mb-1">วันครบกำหนด</label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !formData.text.trim()}
              className="px-6 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <section>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-md animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-md border border-border">
            <div className="w-16 h-16 bg-accent-soft text-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={32} />
            </div>
            <h3 className="text-xl font-medium text-fg mb-1">ยังไม่มีรายการ Checklist</h3>
            <p className="text-muted">คลิกปุ่มด้านบนเพื่อเพิ่มสิ่งที่ต้องทำ</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const isPastDue = !item.checked && item.due_date && new Date(item.due_date) < new Date(new Date().setHours(0,0,0,0))

              return (
                <div
                  key={item.id}
                  className={`group flex items-start gap-3 p-4 bg-surface rounded-md border transition-all
                    ${item.checked ? 'border-border opacity-60 bg-surface-warm' : 'border-border hover:border-accent shadow-card'}
                  `}
                >
                  <button
                    onClick={() => toggleChecked(item.id, item.checked)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors
                      ${item.checked ? 'bg-accent border-accent' : 'border-border bg-surface hover:border-accent'}
                    `}
                  >
                    {item.checked && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className={`font-semibold transition-colors ${item.checked ? 'text-meta line-through' : 'text-fg'}`}>
                      {item.text}
                    </p>

                    {item.due_date && (
                      <div className={`flex items-center gap-1.5 text-xs font-medium mt-1
                        ${item.checked ? 'text-meta' : isPastDue ? 'text-red-500' : 'text-muted'}
                      `}>
                        <Calendar size={12} />
                        {new Date(item.due_date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
                        {isPastDue && !item.checked && ' (เลยกำหนด)'}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

    </div>
  )
}
