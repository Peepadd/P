import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase/supabaseClient'
import { LayoutList, Columns3, History, Sparkles, RefreshCw } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import AcademicForm from '../components/academic/AcademicForm'
import AcademicList from '../components/academic/AcademicList'
import KanbanBoard from '../components/academic/KanbanBoard'
import AcademicHistory from '../components/academic/AcademicHistory'

export default function Academic() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [viewMode, setViewMode] = useState('list')
  const [showHistory, setShowHistory] = useState(false)
  const [message, setMessage] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('academic_items')
        .select('*')
        .order('deadline', { ascending: true, nullsLast: true })
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setItems(data || [])
    } catch (err) {
      console.error('Error loading academic items:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-archive: items with status 'ส่งแล้ว' and status_updated_at > 3 days ago
  const runArchive = useCallback(async () => {
    try {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

      const { data: toArchive, error: queryError } = await supabase
        .from('academic_items')
        .select('*')
        .eq('status', 'ส่งแล้ว')
        .lt('status_updated_at', threeDaysAgo)

      if (queryError) throw queryError
      if (!toArchive || toArchive.length === 0) return { count: 0 }

      // Insert into academic_history
      const historyRecords = toArchive.map((item) => ({
        id: item.id,
        subject: item.subject,
        topic: item.topic,
        type: item.type,
        deadline: item.deadline,
        end_time: item.end_time,
        priority: item.priority,
        status: item.status,
        note: item.note,
        created_at: item.created_at,
        moved_at: new Date().toISOString(),
      }))

      const { error: insertError } = await supabase
        .from('academic_history')
        .insert(historyRecords)

      if (insertError) throw insertError

      // Delete from academic_items
      const ids = toArchive.map((item) => item.id)
      const { error: deleteError } = await supabase
        .from('academic_items')
        .delete()
        .in('id', ids)

      if (deleteError) throw deleteError

      return { count: toArchive.length }
    } catch (err) {
      console.error('Archive error:', err)
      return { count: 0, error: err.message }
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const result = await runArchive()
      if (result.count > 0) {
        setMessage({ type: 'info', text: `เก็บถาวร ${result.count} รายการที่ส่งแล้วเกิน 3 วัน` })
        setTimeout(() => setMessage(null), 4000)
      }
      await loadData()
    }
    init()
  }, [loadData, runArchive])

  const handleSubmit = async (formData) => {
    try {
      if (editingItem) {
        // Update
        const { error: updateError } = await supabase
          .from('academic_items')
          .update({
            subject: formData.subject,
            topic: formData.topic,
            type: formData.type,
            deadline: formData.deadline,
            end_time: formData.end_time || null,
            priority: formData.priority,
            note: formData.note,
          })
          .eq('id', editingItem.id)

        if (updateError) throw updateError
        setEditingItem(null)
        setMessage({ type: 'success', text: 'อัปเดตรายการเรียบร้อย' })
      } else {
        // Create
        const newItem = {
          id: uuidv4(),
          subject: formData.subject,
          topic: formData.topic,
          type: formData.type,
          deadline: formData.deadline,
          end_time: formData.end_time || null,
          priority: formData.priority,
          note: formData.note,
          status: 'กำลังทำ',
          created_at: new Date().toISOString(),
        }

        const { error: insertError } = await supabase
          .from('academic_items')
          .insert(newItem)

        if (insertError) throw insertError
        setMessage({ type: 'success', text: 'เพิ่มรายการเรียบร้อย' })
      }

      setTimeout(() => setMessage(null), 3000)
      await loadData()
    } catch (err) {
      console.error('Submit error:', err)
      setMessage({ type: 'error', text: err.message })
    }
  }

  const handleStatusChange = async (item, newStatus) => {
    try {
      const updates = {
        status: newStatus,
        status_updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('academic_items')
        .update(updates)
        .eq('id', item.id)

      if (updateError) throw updateError

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, ...updates } : i))
      )
    } catch (err) {
      console.error('Status change error:', err)
    }
  }

  const handleMoveItem = async (item, newStatus) => {
    if (item.status === newStatus) return
    await handleStatusChange(item, newStatus)
  }

  const handleDelete = async (item) => {
    try {
      const { error: deleteError } = await supabase
        .from('academic_items')
        .delete()
        .eq('id', item.id)

      if (deleteError) throw deleteError

      setItems((prev) => prev.filter((i) => i.id !== item.id))
      setMessage({ type: 'success', text: 'ลบรายการเรียบร้อย' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleArchive = async (item) => {
    try {
      // Insert into history
      const historyRecord = {
        id: item.id,
        subject: item.subject,
        topic: item.topic,
        type: item.type,
        deadline: item.deadline,
        end_time: item.end_time,
        priority: item.priority,
        status: item.status,
        note: item.note,
        created_at: item.created_at,
        moved_at: new Date().toISOString(),
      }

      const { error: insertError } = await supabase
        .from('academic_history')
        .insert(historyRecord)

      if (insertError) throw insertError

      // Delete from academic_items
      const { error: deleteError } = await supabase
        .from('academic_items')
        .delete()
        .eq('id', item.id)

      if (deleteError) throw deleteError

      setItems((prev) => prev.filter((i) => i.id !== item.id))
      setMessage({ type: 'success', text: `ย้าย "${item.topic}" ไปยังประวัติแล้ว` })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error('Archive error:', err)
    }
  }

  const handleFetchHistory = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('academic_history')
        .select('*')
        .order('moved_at', { ascending: false })

      if (fetchError) throw fetchError
      return data || []
    } catch (err) {
      console.error('Fetch history error:', err)
      return []
    }
  }

  const handleManualArchive = async () => {
    const result = await runArchive()
    if (result.error) {
      setMessage({ type: 'error', text: `เกิดข้อผิดพลาดในการเก็บถาวร: ${result.error}` })
    } else if (result.count > 0) {
      setMessage({ type: 'info', text: `เก็บถาวร ${result.count} รายการแล้ว` })
    } else {
      setMessage({ type: 'info', text: 'ไม่มีรายการที่ต้องเก็บถาวร' })
    }
    setTimeout(() => setMessage(null), 3000)
    await loadData()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📚 งานและการสอบ</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการงานที่ต้องทำ สอบ และโปรเจกต์</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualArchive}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
            title="เก็บถาวรงานที่ส่งแล้วเกิน 3 วัน"
          >
            <Sparkles size={16} />
            <span className="hidden sm:inline">เก็บถาวร</span>
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <History size={16} />
            <span className="hidden sm:inline">ประวัติ</span>
          </button>
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutList size={16} />
              <span className="hidden sm:inline">ตาราง</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Columns3 size={16} />
              <span className="hidden sm:inline">บอร์ด</span>
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}
        >
          {message.type === 'success' && '✅ '}
          {message.type === 'error' && '❌ '}
          {message.type === 'info' && 'ℹ️ '}
          {message.text}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <AcademicForm
          initialData={editingItem}
          onSubmit={handleSubmit}
          onCancel={() => setEditingItem(null)}
        />
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-gray-400 font-medium">เกิดข้อผิดพลาด</p>
            <p className="text-gray-300 text-sm mt-1">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors mx-auto"
            >
              <RefreshCw size={16} />
              ลองอีกครั้ง
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <AcademicList
            items={items}
            onEdit={(item) => {
              setEditingItem(item)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onArchive={handleArchive}
          />
        ) : (
          <div className="p-4">
            <KanbanBoard
              items={items}
              onEdit={(item) => {
                setEditingItem(item)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onArchive={handleArchive}
              onMoveItem={handleMoveItem}
            />
          </div>
        )}
      </div>

      {/* History Modal */}
      <AcademicHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onFetchHistory={handleFetchHistory}
      />
    </div>
  )
}
