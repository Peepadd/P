import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Copy } from 'lucide-react'

export default function TimetableSelect({
  timetables,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onDuplicate,
}) {
  const [showNewInput, setShowNewInput] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  const activeTimetable = timetables.find((t) => t.id === activeId)

  const handleCreate = () => {
    if (!newName.trim()) return
    onCreate(newName.trim())
    setNewName('')
    setShowNewInput(false)
  }

  const handleRename = (id) => {
    if (!editName.trim()) return
    onRename(id, editName.trim())
    setEditingId(null)
    setEditName('')
  }

  const handleDelete = (e, id) => {
    e.stopPropagation()
    if (confirm('แน่ใจหรือไม่ที่จะลบตารางเรียนนี้?')) {
      onDelete(id)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Select dropdown */}
      <div className="relative">
        <select
          value={activeId || ''}
          onChange={(e) => onSelect(e.target.value)}
          className="appearance-none px-3 py-2 pr-8 border border-border rounded-lg text-sm font-medium text-fg-2 bg-surface focus:ring-2 focus:ring-accent focus:border-accent outline-none cursor-pointer min-w-[180px]"
        >
          {timetables.length === 0 && (
            <option value="" disabled>ยังไม่มีตารางเรียน</option>
          )}
          {timetables.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-meta pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Rename current */}
      {activeTimetable && editingId !== activeId && (
        <button
          onClick={() => { setEditingId(activeId); setEditName(activeTimetable.name) }}
          className="p-2 text-meta hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
          title="เปลี่ยนชื่อ"
        >
          <Pencil size={16} />
        </button>
      )}

      {/* Duplicate current */}
      {activeTimetable && editingId !== activeId && (
        <button
          onClick={() => onDuplicate(activeId)}
          className="p-2 text-muted hover:text-accent hover:bg-accent-soft rounded-lg transition-colors"
          title="คัดลอกตาราง"
        >
          <Copy size={16} />
        </button>
      )}

      {/* Inline rename */}
      {editingId && (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename(editingId)}
            autoFocus
            className="px-2 py-1.5 text-sm border border-accent rounded-lg focus:ring-2 focus:ring-accent outline-none w-36"
          />
          <button onClick={() => handleRename(editingId)} className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"><Check size={16} /></button>
          <button onClick={() => setEditingId(null)} className="p-1 text-muted hover:text-gray-600 rounded transition-colors"><X size={16} /></button>
        </div>
      )}

      {/* Delete current */}
      {activeTimetable && editingId !== activeId && timetables.length > 1 && (
        <button
          onClick={(e) => handleDelete(e, activeId)}
          className="p-2 text-meta hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="ลบตาราง"
        >
          <Trash2 size={16} />
        </button>
      )}

      {/* Add new */}
      {!showNewInput ? (
        <button
          onClick={() => setShowNewInput(true)}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-accent hover:bg-accent-soft rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">สร้างใหม่</span>
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="ชื่อตาราง (เช่น ปี1 เทอม1)"
            autoFocus
            className="px-2 py-1.5 text-sm border border-accent rounded-lg focus:ring-2 focus:ring-accent outline-none w-44"
          />
          <button onClick={handleCreate} className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"><Check size={16} /></button>
          <button onClick={() => setShowNewInput(false)} className="p-1 text-muted hover:text-gray-600 rounded transition-colors"><X size={16} /></button>
        </div>
      )}
    </div>
  )
}
