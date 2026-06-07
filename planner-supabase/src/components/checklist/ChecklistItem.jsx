import { useRef, useState } from 'react'
import { Trash2, Pencil, CheckCircle2, Clock, Calendar } from 'lucide-react'
import SubTaskList from './SubTaskList'
import { useLeveling } from '../../hooks/useLeveling'
import LevelUpOverlay from '../leveling/LevelUpOverlay'

function formatDateTime(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  const date = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  return { date, time }
}

export default function ChecklistItem({
  item,
  subTasks,
  onToggleCheck,
  onEdit,
  onDelete,
  onAddSubTask,
  onToggleSubTask,
  onDeleteSubTask,
  loading,
}) {
  const { gainExp } = useLeveling()
  const [swiping, setSwiping] = useState(false)
  const [swipeX, setSwipeX] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [expResult, setExpResult] = useState(null) // สำหรับ LevelUpOverlay
  const touchStartX = useRef(0)
  const touchCurrentX = useRef(0)
  const itemRef = useRef(null)

  const due = formatDateTime(item.due_date)
  const end = formatDateTime(item.end_date)
  const isOverdue = item.due_date && !item.checked && new Date(item.due_date) < new Date()

  // Touch handlers for swipe delete
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    setSwiping(true)
  }

  const handleTouchMove = (e) => {
    touchCurrentX.current = e.touches[0].clientX
    const diff = touchCurrentX.current - touchStartX.current
    // Only allow swipe left (negative diff)
    if (diff < 0) {
      setSwipeX(Math.max(diff, -80))
    }
  }

  const handleTouchEnd = () => {
    setSwiping(false)
    if (swipeX < -60) {
      setShowDeleteConfirm(true)
    }
    setSwipeX(0)
  }

  const confirmDelete = () => {
    onDelete(item)
    setShowDeleteConfirm(false)
  }

  const handleCheck = async () => {
    onToggleCheck(item)
    if (!item.checked) {
      // ตรวจว่าเป็นงานหมวด "เรียน/ทบทวน" หรือไม่
      const studyKeywords = ['เรียน', 'ทบทวน', 'อ่าน', 'สอบ', 'การบ้าน', 'โปรเจกต์', 'วิชา', 'รังสี']
      const isStudyTask = studyKeywords.some(
        (kw) =>
          item.text?.toLowerCase().includes(kw) ||
          item.category?.toLowerCase().includes(kw) ||
          item.note?.toLowerCase().includes(kw)
      )
      const sourceType = isStudyTask ? 'checklist_study' : 'checklist'
      const result = await gainExp(sourceType, item.id)
      if (result) {
        setExpResult(result)
      }
    }
  }

  // Category color mapping for chips
  const categoryColors = {
    'อาหาร': 'bg-orange-100 text-orange-700',
    'ของใช้': 'bg-blue-100 text-blue-700',
    'ของขวัญ': 'bg-pink-100 text-pink-700',
    'เสื้อผ้า': 'bg-purple-100 text-purple-700',
    'อิเล็กทรอนิกส์': 'bg-cyan-100 text-cyan-700',
    'สุขภาพ': 'bg-green-100 text-green-700',
    'สัตว์เลี้ยง': 'bg-amber-100 text-amber-700',
    'บ้าน': 'bg-brown-100 text-brown-700',
    'อื่นๆ': 'bg-gray-100 text-gray-600',
  }

  return (
    <>
      <div
        ref={itemRef}
        className={`group relative bg-white rounded-lg border transition-all ${
          item.checked ? 'border-green-200 bg-green-50/50' : 'border-gray-200 hover:border-indigo-200 hover:shadow-sm'
        } ${isOverdue ? 'border-red-200 bg-red-50/30' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: swiping ? `translateX(${swipeX}px)` : 'translateX(0)',
          transition: swiping ? 'none' : 'transform 0.3s ease',
        }}
      >
        {/* Swipe delete indicator */}
        {swipeX < -30 && (
          <div className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-red-500 rounded-r-lg">
            <Trash2 size={20} className="text-white" />
          </div>
        )}

        <div className="p-3.5">
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <button
              onClick={handleCheck}
              disabled={loading}
              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                item.checked
                  ? 'bg-green-500 border-green-500 scale-110'
                  : 'border-gray-300 hover:border-indigo-400 hover:scale-110'
              }`}
            >
              {item.checked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-medium ${item.checked ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                  {item.text}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {!item.checked && (
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                      title="แก้ไข"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="ลบ"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Meta row: category, due date, end date */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                {/* Category chip */}
                {item.category && (
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    categoryColors[item.category] || 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.category}
                  </span>
                )}

                {/* Due date */}
                {due && (
                  <span className={`inline-flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    {isOverdue ? <Clock size={12} /> : <Calendar size={12} />}
                    {due.date}{due.time ? ` ${due.time}` : ''}
                    {isOverdue && ' (เลยกำหนด)'}
                  </span>
                )}

                {/* End date */}
                {end && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                    <CheckCircle2 size={12} />
                    ~{end.date}{end.time ? ` ${end.time}` : ''}
                  </span>
                )}
              </div>

              {/* Note */}
              {item.note && (
                <p className="text-xs text-gray-400 mt-1 truncate">{item.note}</p>
              )}

              {/* Sub-tasks */}
              <SubTaskList
                parentItem={item}
                subTasks={subTasks}
                onAddSubTask={onAddSubTask}
                onToggleSubTask={onToggleSubTask}
                onDeleteSubTask={onDeleteSubTask}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm mx-0 sm:mx-4 p-5 animate-[fadeIn_0.2s_ease-out]">
            <h4 className="font-semibold text-gray-900 text-sm mb-2">ยืนยันการลบ</h4>
            <p className="text-sm text-gray-500 mb-4">
              คุณแน่ใจที่จะลบ "{item.text}" หรือไม่?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXP Overlay */}
      {expResult && (
        <LevelUpOverlay
          result={expResult}
          onClose={() => setExpResult(null)}
        />
      )}
    </>
  )
}
