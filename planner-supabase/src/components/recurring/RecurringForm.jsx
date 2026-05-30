import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'

const DEFAULT_FORM = {
  type: 'Expense',
  category: '',
  amount: '',
  note: '',
  frequency: 'monthly',
  next_date: new Date().toISOString().split('T')[0],
  transaction_time: '',
}

const FREQUENCY_LABELS = {
  daily: 'รายวัน',
  weekly: 'รายสัปดาห์',
  monthly: 'รายเดือน',
  yearly: 'รายปี',
}

export default function RecurringForm({ initialData, onSubmit, onCancel, categories }) {
  const isEditing = !!initialData
  const [form, setForm] = useState(
    initialData
      ? {
          type: initialData.type,
          category: initialData.category,
          amount: String(initialData.amount),
          note: initialData.note || '',
          frequency: initialData.frequency,
          next_date: initialData.next_date,
          transaction_time: initialData.transaction_time || '',
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
    if (!form.category || !form.amount || !form.next_date) return

    const parsedAmount = parseFloat(form.amount)
    if (parsedAmount <= 0) {
      alert('กรุณาระบุจำนวนเงินที่มากกว่า 0')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        ...form,
        amount: parsedAmount,
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
            <h3 className="font-semibold text-gray-900">แก้ไขรายการอัตโนมัติ</h3>
          </>
        ) : (
          <>
            <Plus size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-900">เพิ่มรายการอัตโนมัติ</h3>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ประเภท */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="Income">รายรับ</option>
            <option value="Expense">รายจ่าย</option>
          </select>
        </div>

        {/* หมวดหมู่ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
          <input
            type="text"
            name="category"
            value={form.category}
            onChange={handleChange}
            list="recurring-category-suggestions"
            required
            placeholder="เช่น อาหาร, ค่าเช่า..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <datalist id="recurring-category-suggestions">
            {categories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>

        {/* จำนวนเงิน */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน</label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* ความถี่ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ความถี่</label>
          <select
            name="frequency"
            value={form.frequency}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* วันที่ถัดไป */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ถัดไป</label>
          <input
            type="date"
            name="next_date"
            value={form.next_date}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* เวลาทำรายการ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เวลาทำรายการ</label>
          <input
            type="time"
            name="transaction_time"
            value={form.transaction_time}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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
