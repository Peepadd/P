import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'

const DEFAULT_FORM = {
  subject: '',
  topic: '',
  type: 'การบ้าน',
  deadline_date: '',
  deadline_time: '',
  end_time: '',
  priority: 'กลาง',
  note: '',
}

const TYPE_OPTIONS = ['สอบ', 'การบ้าน', 'โปรเจกต์', 'งานกลุ่ม', 'นำเสนอ', 'อื่นๆ']
const PRIORITY_OPTIONS = ['สูง', 'กลาง', 'ต่ำ']

export default function AcademicForm({ initialData, onSubmit, onCancel }) {
  const isEditing = !!initialData
  const [form, setForm] = useState(
    initialData
      ? {
          subject: initialData.subject,
          topic: initialData.topic,
          type: initialData.type,
          deadline_date: initialData.deadline ? initialData.deadline.split('T')[0] : '',
          deadline_time: initialData.deadline
            ? (() => {
                const d = new Date(initialData.deadline)
                return isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
              })()
            : '',
          end_time: initialData.end_time || '',
          priority: initialData.priority,
          note: initialData.note || '',
        }
      : { ...DEFAULT_FORM }
  )
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.subject.trim() || !form.topic.trim()) return

    setSubmitting(true)
    try {
      const deadline = form.deadline_date
        ? new Date(`${form.deadline_date}T${form.deadline_time || '23:59'}:00`).toISOString()
        : null

      await onSubmit({
        ...form,
        deadline,
      })
      if (!isEditing) {
        setForm({ ...DEFAULT_FORM })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        {isEditing ? (
          <><Pencil size={18} className="text-indigo-600" /><h3 className="font-semibold text-gray-900">แก้ไขงาน/สอบ</h3></>
        ) : (
          <><Plus size={18} className="text-indigo-600" /><h3 className="font-semibold text-gray-900">เพิ่มงาน/สอบ</h3></>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* วิชา */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">วิชา <span className="text-red-500">*</span></label>
          <input type="text" name="subject" value={form.subject} onChange={handleChange} required
            placeholder="เช่น คณิตศาสตร์, ฟิสิกส์..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow" />
        </div>

        {/* หัวข้อ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ <span className="text-red-500">*</span></label>
          <input type="text" name="topic" value={form.topic} onChange={handleChange} required
            placeholder="เช่น บทที่ 5, โครงงาน..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow" />
        </div>

        {/* ประเภท */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
          <select name="type" value={form.type} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow">
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* วันที่กำหนดส่ง */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">วันที่กำหนดส่ง</label>
          <input type="date" name="deadline_date" value={form.deadline_date} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow" />
        </div>

        {/* เวลากำหนดส่ง */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เวลากำหนดส่ง</label>
          <input type="time" name="deadline_time" value={form.deadline_time} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow" />
        </div>

        {/* ระดับความสำคัญ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ความสำคัญ</label>
          <select name="priority" value={form.priority} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow">
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* เวลาสิ้นสุด (end_time) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เวลาสิ้นสุด</label>
          <input type="time" name="end_time" value={form.end_time} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow" />
        </div>

        {/* หมายเหตุ */}
        <div className="lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
          <input type="text" name="note" value={form.note} onChange={handleChange}
            placeholder="รายละเอียดเพิ่มเติม..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow" />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={submitting}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {submitting ? 'กำลังบันทึก...' : isEditing ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่ม'}
        </button>
        {isEditing && (
          <button type="button" onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
            ยกเลิก
          </button>
        )}
      </div>
    </form>
  )
}
