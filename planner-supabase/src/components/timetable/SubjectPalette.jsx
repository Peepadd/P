import { useState } from 'react'
import { Plus, Trash2, X, Palette } from 'lucide-react'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#64748b', '#78716c', '#1e293b',
]

export default function SubjectPalette({ subjects, onChange, onClose }) {
  const [editingIndex, setEditingIndex] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('#6366f1')

  const handleAdd = () => {
    // Smart color: pick first unused color from preset palette
    const usedColors = new Set(subjects.map((s) => s.color))
    let assignedColor = PRESET_COLORS.find((c) => !usedColors.has(c))
    if (!assignedColor) {
      // All preset colors used — generate a random harmonious color
      const hue = Math.floor(Math.random() * 360)
      assignedColor = `hsl(${hue}, 60%, 55%)`
    }

    // Sequential naming: วิชา 1, วิชา 2, ...
    const existingNums = subjects
      .map((s) => s.name.match(/^วิชา (\d+)$/))
      .filter(Boolean)
      .map((m) => Number(m[1]))
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : subjects.length + 1
    const defaultName = `วิชา ${nextNum}`

    const newSubject = { name: defaultName, color: assignedColor }
    onChange([...subjects, newSubject])
    // Start editing the new subject immediately
    setEditingIndex(subjects.length)
    setEditName(defaultName)
    setEditColor(assignedColor)
  }

  const handleSaveEdit = (index) => {
    if (!editName.trim()) return
    const updated = [...subjects]
    updated[index] = { ...updated[index], name: editName.trim(), color: editColor }
    onChange(updated)
    setEditingIndex(null)
  }

  const handleDelete = (index) => {
    const updated = subjects.filter((_, i) => i !== index)
    onChange(updated)
    if (editingIndex === index) setEditingIndex(null)
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') handleSaveEdit(index)
    if (e.key === 'Escape') setEditingIndex(null)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Palette size={18} className="text-indigo-600" />
          <h3 className="font-semibold text-gray-900">รายวิชาและสี</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Plus size={14} />
            เพิ่มวิชา
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-6 text-sm text-gray-400">
          ยังไม่มีรายวิชา — คลิก "เพิ่มวิชา" เพื่อเริ่มต้น
        </div>
      ) : (
        <div className="space-y-2">
          {subjects.map((subject, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              {editingIndex === index ? (
                <>
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border border-gray-200 p-0.5"
                  />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    autoFocus
                    className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="ชื่อวิชา"
                  />
                  <button
                    onClick={() => handleSaveEdit(index)}
                    className="px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                  >
                    บันทึก
                  </button>
                </>
              ) : (
                <>
                  <div
                    className="w-7 h-7 rounded-lg border border-gray-200 shrink-0"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="flex-1 text-sm font-medium text-gray-700">{subject.name}</span>
                  <button
                    onClick={() => {
                      setEditingIndex(index)
                      setEditName(subject.name)
                      setEditColor(subject.color)
                    }}
                    className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Color preset palette */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-2">สีที่ใช้บ่อย:</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => {
                if (editingIndex !== null) setEditColor(color)
              }}
              className="w-6 h-6 rounded-lg border border-gray-200 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
