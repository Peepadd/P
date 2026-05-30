import Modal from '../ui/Modal'

export default function ViewTransactionModal({ transaction, onClose }) {
  if (!transaction) return null

  const formatAmount = (amount, type) => {
    const num = parseFloat(amount)
    const formatted = Math.abs(num).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return `${type === 'Income' ? '+' : '-'}${formatted}`
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <Modal isOpen={!!transaction} onClose={onClose} title="รายละเอียดรายการ">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              transaction.type === 'Income'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {transaction.type === 'Income' ? 'รายรับ' : 'รายจ่าย'}
          </span>
          <span className="text-2xl font-bold text-gray-900">
            {formatAmount(transaction.amount, transaction.type)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">วันที่</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(transaction.date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">หมวดหมู่</p>
            <p className="text-sm font-medium text-gray-900">{transaction.category}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">เวลาทำรายการ</p>
            <p className="text-sm font-medium text-gray-900">
              {transaction.transaction_time || '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">เวลาที่บันทึก</p>
            <p className="text-sm font-medium text-gray-900">
              {transaction.record_time
                ? new Date(transaction.record_time).toLocaleString('th-TH')
                : '-'}
            </p>
          </div>
        </div>

        {transaction.note && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">หมายเหตุ</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{transaction.note}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
