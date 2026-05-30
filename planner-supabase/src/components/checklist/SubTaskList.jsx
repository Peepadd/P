import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'

export default function SubTaskList({
  parentItem,
  subTasks,
  onAddSubTask,
  onToggleSubTask,
  onDeleteSubTask,
  loading,
}) {
  const [expanded, setExpanded] = useState(false)
  const [newText, setNewText] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!newText.trim()) return
    setAdding(true)
    try {
      await onAddSubTask(parentItem.id, parentItem.type, newText.trim())
      setNewText('')
    } finally {
      setAdding(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="mt-2">
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        งานย่อย {subTasks.length > 0 && `(${subTasks.filter((s) => s.checked).length}/${subTasks.length})`}
      </button>

      {expanded && (
        <div className="mt-2 pl-4 border-l-2 border-gray-100 space-y-1.5">
          {/* Sub-task list */}
          {subTasks.map((st) => (
            <div
              key={st.id}
              className="flex items-center gap-2 group"
            >
              <button
                onClick={() => onToggleSubTask(st)}
                disabled={loading}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  st.checked
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300 hover:border-indigo-400'
                }`}
              >
                {st.checked && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span
                className={`text-sm flex-1 ${
                  st.checked ? 'line-through text-gray-300' : 'text-gray-600'
                }`}
              >
                {st.text}
              </span>
              <button
                onClick={() => onDeleteSubTask(st.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-red-500 transition-all"
                title="ลบงานย่อย"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {/* Add sub-task input */}
          <div className="flex items-center gap-2">
            <Plus size={14} className="text-gray-300 flex-shrink-0" />
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="เพิ่มงานย่อย..."
              disabled={adding}
              className="flex-1 text-sm border-b border-gray-200 py-0.5 outline-none focus:border-indigo-400 transition-colors placeholder:text-gray-300"
            />
            {newText.trim() && (
              <button
                onClick={handleAdd}
                disabled={adding}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
              >
                {adding ? '...' : 'เพิ่ม'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
