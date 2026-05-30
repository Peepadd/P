import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase/supabaseClient'
import { ShoppingCart, ClipboardList, RefreshCw } from 'lucide-react'
import ChecklistTabs from '../components/checklist/ChecklistTabs'
import ChecklistForm from '../components/checklist/ChecklistForm'
import ChecklistItem from '../components/checklist/ChecklistItem'

export default function Checklist() {
  const [activeType, setActiveType] = useState('shopping')
  const [items, setItems] = useState([])
  const [subTasks, setSubTasks] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState(null)

  // ── Data loading ──
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: itemsData, error: itemsErr } = await supabase
        .from('checklist_items')
        .select('*')
        .order('checked', { ascending: true })
        .order('created_at', { ascending: false })

      if (itemsErr) throw itemsErr
      setItems(itemsData || [])

      const { data: subData, error: subErr } = await supabase
        .from('sub_tasks')
        .select('*')
        .order('created_at', { ascending: true })

      if (subErr) throw subErr

      // Group sub-tasks by parent_id
      const grouped = {}
      ;(subData || []).forEach((st) => {
        if (!grouped[st.parent_id]) grouped[st.parent_id] = []
        grouped[st.parent_id].push(st)
      })
      setSubTasks(grouped)
    } catch (err) {
      console.error('Checklist load error:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Auto-cleanup: items checked > 24h ago ──
  const runCleanup = useCallback(async () => {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const { data: expired, error: fetchErr } = await supabase
        .from('checklist_items')
        .select('id')
        .eq('checked', true)
        .lt('checked_at', cutoff)

      if (fetchErr) throw fetchErr
      if (!expired || expired.length === 0) return

      const ids = expired.map((r) => r.id)

      // Delete sub-tasks first (CASCADE should handle this, but explicit is safer)
      const { error: delSubErr } = await supabase
        .from('sub_tasks')
        .delete()
        .in('parent_id', ids)

      if (delSubErr) throw delSubErr

      const { error: delErr } = await supabase
        .from('checklist_items')
        .delete()
        .in('id', ids)

      if (delErr) throw delErr

      if (expired.length > 0) {
        console.log(`Auto-cleanup: removed ${expired.length} completed items`)
      }
    } catch (err) {
      console.error('Cleanup error:', err.message)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await runCleanup()
      await loadData()
    }
    init()
  }, [loadData, runCleanup])

  // ── CRUD: Create ──
  const handleCreate = async (formData) => {
    try {
      const { error: err } = await supabase.from('checklist_items').insert([
        {
          id: crypto.randomUUID(),
          type: formData.type,
          text: formData.text,
          category: formData.category || null,
          note: formData.note || null,
          due_date: formData.due_date || null,
          end_date: formData.end_date || null,
        },
      ])
      if (err) throw err
      await loadData()
    } catch (err) {
      console.error('Create error:', err.message)
      alert(`เกิดข้อผิดพลาด: ${err.message}`)
    }
  }

  // ── CRUD: Update (used by edit form) ──
  const handleUpdate = async (formData) => {
    const editingId = editingItem?.id
    if (!editingId) return
    try {
      const { error: err } = await supabase
        .from('checklist_items')
        .update({
          text: formData.text,
          category: formData.category || null,
          note: formData.note || null,
          due_date: formData.due_date || null,
          end_date: formData.end_date || null,
        })
        .eq('id', editingId)

      if (err) throw err
      setEditingItem(null)
      await loadData()
    } catch (err) {
      console.error('Update error:', err.message)
      alert(`เกิดข้อผิดพลาด: ${err.message}`)
    }
  }

  // ── CRUD: Toggle check ──
  const handleToggleCheck = async (item) => {
    try {
      const now = new Date().toISOString()
      const { error: err } = await supabase
        .from('checklist_items')
        .update({
          checked: !item.checked,
          checked_at: !item.checked ? now : null,
        })
        .eq('id', item.id)

      if (err) throw err
      await loadData()
    } catch (err) {
      console.error('Toggle error:', err.message)
    }
  }

  // ── CRUD: Delete ──
  const handleDelete = async (item) => {
    try {
      // Delete sub-tasks first (safety)
      await supabase.from('sub_tasks').delete().eq('parent_id', item.id)

      const { error: err } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', item.id)

      if (err) throw err
      await loadData()
    } catch (err) {
      console.error('Delete error:', err.message)
    }
  }

  // ── Sub-tasks: Add ──
  const handleAddSubTask = async (parentId, parentType, text) => {
    try {
      const { error: err } = await supabase.from('sub_tasks').insert([
        {
          id: crypto.randomUUID(),
          parent_id: parentId,
          parent_type: parentType,
          text,
        },
      ])
      if (err) throw err
      await loadData()
    } catch (err) {
      console.error('Add sub-task error:', err.message)
    }
  }

  // ── Sub-tasks: Toggle check ──
  const handleToggleSubTask = async (subTask) => {
    try {
      const { error: err } = await supabase
        .from('sub_tasks')
        .update({ checked: !subTask.checked })
        .eq('id', subTask.id)

      if (err) throw err
      await loadData()
    } catch (err) {
      console.error('Toggle sub-task error:', err.message)
    }
  }

  // ── Sub-tasks: Delete ──
  const handleDeleteSubTask = async (subTaskId) => {
    try {
      const { error: err } = await supabase
        .from('sub_tasks')
        .delete()
        .eq('id', subTaskId)

      if (err) throw err
      await loadData()
    } catch (err) {
      console.error('Delete sub-task error:', err.message)
    }
  }

  // ── Derived data ──
  const filteredItems = items
    .filter((i) => i.type === activeType)
    .filter((i) => !categoryFilter || i.category === categoryFilter)
    .sort((a, b) => {
      // Unchecked first, then by created_at desc
      if (a.checked !== b.checked) return a.checked ? 1 : -1
      return new Date(b.created_at) - new Date(a.created_at)
    })

  const categories = [...new Set(items.filter((i) => i.type === activeType && i.category).map((i) => i.category))].sort()
  const uncheckedCount = filteredItems.filter((i) => !i.checked).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Checklist</h2>
        <p className="text-gray-500 mt-1">รายการซื้อของและสิ่งที่ต้องทำ</p>
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
              <p className="text-sm text-amber-600 mt-1">กรุณาตรวจสอบการตั้งค่า Supabase</p>
              <p className="text-xs text-amber-500 mt-1">Error: {error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <ChecklistTabs activeType={activeType} onChange={setActiveType} />

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        {editingItem ? (
          <ChecklistForm
            type={activeType}
            initialData={editingItem}
            onSubmit={handleUpdate}
            onCancel={() => setEditingItem(null)}
          />
        ) : (
          <ChecklistForm
            type={activeType}
            onSubmit={handleCreate}
          />
        )}
      </div>

      {/* Category filter chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !categoryFilter
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            ทั้งหมด
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Item list */}
      <div className="space-y-2">
        {/* List header */}
        {!loading && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {filteredItems.length > 0
                ? `${uncheckedCount} รายการที่เหลือ • ${filteredItems.length - uncheckedCount} รายการที่เสร็จแล้ว`
                : 'ยังไม่มีรายการ'}
            </p>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="รีเฟรช"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center">
            <div className="w-8 h-8 mx-auto border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm mt-3">กำลังโหลดข้อมูล...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-indigo-100 flex items-center justify-center">
              {activeType === 'shopping' ? (
                <ShoppingCart size={24} className="text-indigo-600" />
              ) : (
                <ClipboardList size={24} className="text-indigo-600" />
              )}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {activeType === 'shopping' ? 'ไม่มีรายการซื้อของ' : 'ไม่มีสิ่งที่ต้องทำ'}
            </h3>
            <p className="text-sm text-gray-400">
              {categoryFilter
                ? 'ไม่มีรายการในหมวดหมู่นี้'
                : `เพิ่มรายการ${activeType === 'shopping' ? 'ซื้อของ' : 'ที่ต้องทำ'}ด้านบนเพื่อเริ่มต้น`}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              subTasks={subTasks[item.id] || []}
              onToggleCheck={handleToggleCheck}
              onEdit={(item) => {
                setEditingItem(item)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onDelete={handleDelete}
              onAddSubTask={handleAddSubTask}
              onToggleSubTask={handleToggleSubTask}
              onDeleteSubTask={handleDeleteSubTask}
              loading={loading}
            />
          ))
        )}
      </div>
    </div>
  )
}


