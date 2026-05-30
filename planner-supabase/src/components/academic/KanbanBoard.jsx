import { useState, useRef } from 'react'
import { Pencil, Trash2, Archive, GripVertical } from 'lucide-react'

const TYPE_COLORS = {
  สอบ: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  การบ้าน: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  โปรเจกต์: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  งานกลุ่ม: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  นำเสนอ: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
  อื่นๆ: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
}

const PRIORITY_LABELS = { สูง: '🔴', กลาง: '🟡', ต่ำ: '🟢' }

const COLUMNS = [
  { key: 'กำลังทำ', label: 'กำลังทำ', icon: '📝', color: 'border-t-amber-400', bg: 'bg-amber-50/50' },
  { key: 'ส่งแล้ว', label: 'ส่งแล้ว', icon: '✅', color: 'border-t-green-400', bg: 'bg-green-50/50' },
  { key: 'รอตรวจ', label: 'รอตรวจ', icon: '⏳', color: 'border-t-blue-400', bg: 'bg-blue-50/50' },
]

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

function isOverdue(deadline, status) {
  if (!deadline || status === 'ส่งแล้ว') return false
  const d = new Date(deadline)
  const now = new Date()
  return !isNaN(d.getTime()) && d < now
}

function KanbanCard({ item, onEdit, onDelete, onArchive, onDragStart }) {
  const typeColor = TYPE_COLORS[item.type] || TYPE_COLORS.อื่นๆ
  const overdue = isOverdue(item.deadline, item.status)

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-3 cursor-grab active:cursor-grabbing hover:border-indigo-300"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColor.bg} ${typeColor.text} shrink-0`}>
          {item.type}
        </span>
        <span className="text-xs">{PRIORITY_LABELS[item.priority] || ''}</span>
      </div>

      <h4 className="text-sm font-semibold text-gray-900 mb-0.5">{item.subject}</h4>
      <p className="text-xs text-gray-600 mb-2">{item.topic}</p>

      {item.deadline && (
        <div className={`text-xs flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(item.deadline)}
          {overdue && <span className="ml-0.5">⚠️</span>}
        </div>
      )}

      {item.note && (
        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{item.note}</p>
      )}

      {/* Actions - shown on hover */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item) }}
            className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
            title="แก้ไข"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item) }}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="ลบ"
          >
            <Trash2 size={14} />
          </button>
          {item.status === 'ส่งแล้ว' && (
            <button
              onClick={(e) => { e.stopPropagation(); onArchive(item) }}
              className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
              title="ย้ายไปประวัติ"
            >
              <Archive size={14} />
            </button>
          )}
        </div>
        <div className="text-gray-300">
          <GripVertical size={14} />
        </div>
      </div>
    </div>
  )
}

export default function KanbanBoard({ items, onEdit, onDelete, onStatusChange, onArchive, onMoveItem }) {
  const [deleting, setDeleting] = useState(null)
  const dragItem = useRef(null)

  const handleDragStart = (e, item) => {
    dragItem.current = item
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDropOnColumn = (e, targetStatus) => {
    e.preventDefault()
    if (dragItem.current) {
      onMoveItem(dragItem.current, targetStatus)
      dragItem.current = null
    }
  }

  if (!items || items.length === 0) {
    return (
      <div className="p-10 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </div>
        <p className="text-gray-400">ยังไม่มีงาน/สอบ</p>
        <p className="text-gray-300 text-sm mt-1">เพิ่มงานเพื่อแสดงบนบอร์ด</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((column) => {
          const columnItems = items.filter((item) => item.status === column.key)

          return (
            <div
              key={column.key}
              className={`rounded-xl border border-gray-200 border-t-4 ${column.color} ${column.bg}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnColumn(e, column.key)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{column.icon}</span>
                  <h3 className="font-semibold text-sm text-gray-800">{column.label}</h3>
                </div>
                <span className="text-xs font-medium text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                  {columnItems.length}
                </span>
              </div>

              {/* Cards */}
              <div className="p-3 space-y-3 min-h-[200px]">
                {columnItems.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                    ลากการ์ดมาที่นี่
                  </div>
                ) : (
                  columnItems.map((item) => (
                    <KanbanCard
                      key={item.id}
                      item={item}
                      onEdit={onEdit}
                      onDelete={() => setDeleting(item)}
                      onArchive={onArchive}
                      onDragStart={handleDragStart}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete Confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleting(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ยืนยันการลบ</h3>
            <p className="text-sm text-gray-600 mb-1">
              คุณแน่ใจหรือไม่ที่จะลบ <span className="font-medium text-gray-900">{deleting.topic}</span>?
            </p>
            <p className="text-xs text-gray-400 mb-5">วิชา: {deleting.subject} | ประเภท: {deleting.type}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleting(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">ยกเลิก</button>
              <button onClick={() => { onDelete(deleting); setDeleting(null) }} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">ลบ</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
