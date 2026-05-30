import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'

const DEFAULT_FORM = {
  text: '',
  category: '',
  note: '',
  due_date: '',
  due_time: '',
  end_date: '',
  end_time: '',
}

const CATEGORY_OPTIONS = [
  'อาหาร',
  'ของใช้',
  'ของขวัญ',
  'เสื้อผ้า',
  'อิเล็กทรอนิกส์',
  'สุขภาพ',
  'สัตว์เลี้ยง',
  'บ้าน',
  'อื่นๆ',
]

export default function ChecklistForm({
  type,
  initialData,
  onSubmit,
  onCancel,
}) {
  const isEditing = !!initialData
  const [form, setForm] = useState(
    initialData
      ? {
          text: initialData.text,
          category: initialData.category || '',
          note: initialData.note || '',
          due_date: initialData.due_date ? initialData.due_date.split('T')[0] : '',
          due_time: initialData.due_date
            ? (() => {
                const d = new Date(initialData.due_date)
                return isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
              })()
            : '',
          end_date: initialData.end_date ? initialData.end_date.split('T')[0] : '',
          end_time: initialData.end_date
            ? (() => {
                const d = new Date(initialData.end_date)
                return isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
              })()
            : '',
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
    if (!form.text.trim()) return

    setSubmitting(true)
    try {
      const dueDate = form.due_date
        ? new Date(`${form.due_date}T${form.due_time || '00:00'}:00`).toISOString()
        : null
      const endDate = form.end_date
        ? new Date(`${form.end_date}T${form.end_time || '23:59'}:00`).toISOString()
        : null

      await onSubmit({
        ...form,
        type,
        due_date: dueDate,
        end_date: endDate,
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
          <>
            <Pencil size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-900">แก้ไขรายการ</h3>
          </>
        ) : (
          <>
            <Plus size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-900">
              เพิ่มรายการ{type === 'shopping' ? 'ซื้อของ' : 'ที่ต้องทำ'}
            </h3>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ข้อความ */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">รายการ</label>
          <input
            type="text"
            name="text"
            value={form.text}
            onChange={handleChange}
            required
            placeholder={type === 'shopping' ? 'เช่น ซื้อนม, ผัก, ข้าวสาร...' : 'เช่น จ่ายค่าไฟ, ไปธนาคาร...'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
          />
        </div>

        {/* หมวดหมู่ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
          <input
            type="text"
            name="category"
            value={form.category}
            onChange={handleChange}
            list={`checklist-categories-${type}`}
            placeholder="เลือกหรือพิมพ์..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
          />
          <datalist id={`checklist-categories-${type}`}>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>

        {/* วันที่กำหนด */} 
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">วันที่กำหนด</label>
          <input
            type="date"
            name="due_date"
            value={form.due_date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
          />
        </div>

        {/* เวลากำหนด */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เวลากำหนด</label>
          <input
            type="time"
            name="due_time"
            value={form.due_time}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
          />
        </div>

        {/* วันที่สิ้นสุด */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
          />
        </div>

        {/* เวลาสิ้นสุด */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เวลาสิ้นสุด</label>
          <input
            type="time"
            name="end_time"
            value={form.end_time}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
          />
        </div>

        {/* หมายเหตุ */}
        <div className="lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
          <input
            type="text"
            name="note"
            value={form.note}
            onChange={handleChange}
            placeholder="รายละเอียดเพิ่มเติม..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'กำลังบันทึก...' : isEditing ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มรายการ'}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ยกเลิก
          </button>
        )}
      </div>
    </form>
  )
}
