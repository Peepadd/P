import { Eye, Pencil, Trash2 } from 'lucide-react'

export default function TransactionList({
  transactions,
  onView,
  onEdit,
  onDelete,
}) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-10 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-gray-400">ยังไม่มีรายการ</p>
        <p className="text-gray-300 text-sm mt-1">เริ่มเพิ่มรายการแรกของคุณ</p>
      </div>
    )
  }

  const formatAmount = (amount, type) => {
    const num = parseFloat(amount)
    const formatted = Math.abs(num).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return type === 'Income'
      ? `+${formatted}`
      : `-${formatted}`
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">หมวดหมู่</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">จำนวนเงิน</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">เวลา</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">หมายเหตุ</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                {formatDate(t.date)}
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
                {formatAmount(t.amount, t.type)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                {t.transaction_time || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                {t.note || '-'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onView(t)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="ดูรายละเอียด"
                  >
                    <Eye size={16} />
                  </button>
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
