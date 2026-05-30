import { Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

const FREQUENCY_LABELS = {
  daily: 'รายวัน',
  weekly: 'รายสัปดาห์',
  monthly: 'รายเดือน',
  yearly: 'รายปี',
}

function formatCurrency(amount) {
  return Number(amount).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function RecurringList({
  recurringTransactions,
  onToggleActive,
  onEdit,
  onDelete,
}) {
  if (!recurringTransactions || recurringTransactions.length === 0) {
    return (
      <div className="p-10 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
          <RepeatIcon />
        </div>
        <p className="text-gray-400">ยังไม่มีรายการอัตโนมัติ</p>
        <p className="text-gray-300 text-sm mt-1">ตั้งค่ารายการแรกของคุณ</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">วันที่ถัดไป</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">ประเภท</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">หมวดหมู่</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">จำนวนเงิน</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">ความถี่</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">สถานะ</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {recurringTransactions.map((t) => (
            <tr
              key={t.id}
              className={`hover:bg-gray-50 transition-colors ${
                !t.active ? 'opacity-50' : ''
              }`}
            >
              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                {formatDate(t.next_date)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    t.type === 'Income'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {t.type === 'Income' ? 'รายรับ' : 'รายจ่าย'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                {t.category}
              </td>
              <td
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap text-right ${
                  t.type === 'Income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {t.type === 'Income' ? '+' : '-'}
                {formatCurrency(t.amount)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                {FREQUENCY_LABELS[t.frequency] || t.frequency}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <button
                  onClick={() => onToggleActive(t)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    t.active
                      ? 'text-green-700 bg-green-50 hover:bg-green-100'
                      : 'text-gray-500 bg-gray-50 hover:bg-gray-100'
                  }`}
                  title={t.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                >
                  {t.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  {t.active ? 'เปิด' : 'ปิด'}
                </button>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(t)}
                    className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="แก้ไข"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(t)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="ลบ"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RepeatIcon() {
  return (
    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}
