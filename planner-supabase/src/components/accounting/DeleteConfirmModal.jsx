import Modal from '../ui/Modal'
import { AlertTriangle } from 'lucide-react'

export default function DeleteConfirmModal({ transaction, onConfirm, onClose, loading }) {
  if (!transaction) return null

  const formatAmount = (amount, type) => {
    const num = parseFloat(amount)
    const formatted = Math.abs(num).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return `${type === 'Income' ? '+' : '-'}${formatted}`
  }

  return (
    <Modal isOpen={!!transaction} onClose={onClose} title="ยืนยันการลบ">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-700">
              คุณแน่ใจหรือไม่ที่จะลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    transaction.type === 'Income'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {transaction.type === 'Income' ? 'รายรับ' : 'รายจ่าย'}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatAmount(transaction.amount, transaction.type)}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {transaction.category} — {transaction.date}
              </p>
              {transaction.note && (
                <p className="text-sm text-gray-400 mt-1">{transaction.note}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => onConfirm(transaction)}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'กำลังลบ...' : 'ยืนยันการลบ'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
