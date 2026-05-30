import { Pencil, Trash2, Archive } from 'lucide-react'
import { useState } from 'react'

const TYPE_COLORS = {
  สอบ: { bg: 'bg-red-100', text: 'text-red-700' },
  การบ้าน: { bg: 'bg-blue-100', text: 'text-blue-700' },
  โปรเจกต์: { bg: 'bg-purple-100', text: 'text-purple-700' },
  งานกลุ่ม: { bg: 'bg-amber-100', text: 'text-amber-700' },
  นำเสนอ: { bg: 'bg-pink-100', text: 'text-pink-700' },
  อื่นๆ: { bg: 'bg-gray-100', text: 'text-gray-700' },
}

const PRIORITY_COLORS = {
  สูง: { bg: 'bg-red-50', text: 'text-red-600', icon: '🔴' },
  กลาง: { bg: 'bg-amber-50', text: 'text-amber-600', icon: '🟡' },
  ต่ำ: { bg: 'bg-green-50', text: 'text-green-600', icon: '🟢' },
}

const STATUS_OPTIONS = ['กำลังทำ', 'ส่งแล้ว', 'รอตรวจ']

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function isOverdue(deadline, status) {
  if (!deadline || status === 'ส่งแล้ว') return false
  const d = new Date(deadline)
  const now = new Date()
  return !isNaN(d.getTime()) && d < now
}

export default function AcademicList({ items, onEdit, onDelete, onStatusChange, onArchive }) {
  const [deleting, setDeleting] = useState(null)

  if (!items || items.length === 0) {
    return (
      <div className="p-10 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <p className="text-gray-400">ยังไม่มีงาน/สอบ</p>
        <p className="text-gray-300 text-sm mt-1">เพิ่มงานหรือสอบแรกของคุณ</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">วิชา</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">หัวข้อ</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">กำหนดส่ง</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">สำคัญ</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => {
            const typeColor = TYPE_COLORS[item.type] || TYPE_COLORS.อื่นๆ
            const priorityColor = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.ต่ำ
            const overdue = isOverdue(item.deadline, item.status)

            return (
              <tr
                key={item.id}
                className={`hover:bg-gray-50 transition-colors ${item.status === 'ส่งแล้ว' ? 'opacity-60' : ''}`}
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                  {item.subject}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  {item.topic}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColor.bg} ${typeColor.text}`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-sm ${overdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                    {formatDate(item.deadline)}
                    {formatTime(item.deadline) && (
                      <span className="text-gray-400 ml-1">{formatTime(item.deadline)}</span>
                    )}
                    {overdue && <span className="ml-1 text-xs">⚠️</span>}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor.bg} ${priorityColor.text}`}>
                    {priorityColor.icon} {item.priority}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <select
                    value={item.status}
                    onChange={(e) => onStatusChange(item, e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded-lg border outline-none transition-colors cursor-pointer ${
                      item.status === 'ส่งแล้ว'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : item.status === 'รอตรวจ'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1">
                    {item.status === 'ส่งแล้ว' && (
                      <button
                        onClick={() => onArchive(item)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="ย้ายไปประวัติ"
                      >
                        <Archive size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="แก้ไข"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleting(item)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="ลบ"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Delete Confirmation Modal */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleting(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ยืนยันการลบ</h3>
            <p className="text-sm text-gray-600 mb-1">
              คุณแน่ใจหรือไม่ที่จะลบ <span className="font-medium text-gray-900">{deleting.topic}</span>?
            </p>
            <p className="text-xs text-gray-400 mb-5">
              วิชา: {deleting.subject} | ประเภท: {deleting.type}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleting(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDelete(deleting)
                  setDeleting(null)
                }}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
