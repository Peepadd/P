import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { useLeveling } from '../../hooks/useLeveling'
import LevelUpOverlay from '../leveling/LevelUpOverlay'

const DEFAULT_FORM = {
  date: new Date().toISOString().split('T')[0],
  type: 'Expense',
  category: '',
  amount: '',
  transaction_time: '',
  note: '',
}

export default function TransactionForm({
  initialData,
  onSubmit,
  onCancel,
  categories,
}) {
  const isEditing = !!initialData
  const { gainExp } = useLeveling()
  const [expResult, setExpResult] = useState(null)
  const [form, setForm] = useState(
    initialData
      ? {
          date: initialData.date,
          type: initialData.type,
          category: initialData.category,
          amount: String(initialData.amount),
          transaction_time: initialData.transaction_time || '',
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
    if (!form.date || !form.category || !form.amount) return

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

      // ตรวจว่าเป็นรายได้หมวดไรเดอร์หรือเป็นรายรับทั่วไป
      const riderKeywords = ['ไรเดอร์', 'rider', 'grab', 'foodpanda', 'ขี่', 'ส่ง', 'รับส่ง']
      const isRiderIncome = form.type === 'Income' &&
        riderKeywords.some(kw => form.category.toLowerCase().includes(kw))

      if (isRiderIncome) {
        const result = await gainExp('rider_income', null)
        if (result) setExpResult(result)
      } else if (form.type === 'Income' || form.type === 'Expense') {
        const result = await gainExp('accounting', null)
        if (result) setExpResult(result)
      }

      if (!isEditing) {
        setForm({ ...DEFAULT_FORM })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
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
            <h3 className="font-semibold text-gray-900">เพิ่มรายการใหม่</h3>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* วันที่ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
          />
        </div>

        {/* ประเภท */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
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
            list="category-suggestions"
            required
            placeholder="เช่น อาหาร, ค่าเช่า..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
          />
          <datalist id="category-suggestions">
            {/* หมวดหมู่รายรับพิเศษ (ได้ EXP โบนัส) */}
            <option value="ไรเดอร์" />
            <option value="ไรเดอร์ Grab" />
            <option value="ไรเดอร์ Foodpanda" />
            {/* หมวดหมู่ทั่วไป */}
            {categories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
          {/* Hint สำหรับหมวดไรเดอร์ */}
          {(form.category.toLowerCase().includes('ไรเดอร์') || form.category.toLowerCase().includes('rider')) &&
            form.type === 'Income' && (
            <p className="mt-1 text-xs text-indigo-500 font-medium">
              🛵 หมวดไรเดอร์! คุณจะได้รับ +150 EXP พิเศษ
            </p>
          )}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
          />
        </div>

        {/* หมายเหตุ */}
        <div>
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

    {/* EXP Overlay — แสดงเมื่อบันทึกรายการสำเร็จ */}
    {expResult && (
      <LevelUpOverlay
        result={expResult}
        onClose={() => setExpResult(null)}
      />
    )}
  </>
  )
}
