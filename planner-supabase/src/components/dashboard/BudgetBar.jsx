import { useState } from 'react'
import { Settings2 } from 'lucide-react'

function formatCurrency(amount) {
  return Number(amount).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default function BudgetBar({ budget, onUpdateBudget }) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState(String(budget.amount || ''))

  const percentage = budget.amount > 0
    ? Math.min((budget.spent / budget.amount) * 100, 100)
    : 0

  const barColor =
    percentage >= 100
      ? 'bg-red-500'
      : percentage >= 80
        ? 'bg-orange-500'
        : 'bg-green-500'

  const remaining = budget.amount - budget.spent
  const isOverBudget = remaining < 0

  const handleSave = () => {
    const val = parseFloat(inputValue)
    if (!isNaN(val) && val >= 0) {
      onUpdateBudget(val)
    }
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') {
      setInputValue(String(budget.amount || ''))
      setEditing(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">งบประมาณประจำเดือน</h3>
        <button
          onClick={() => {
            setEditing(true)
            setInputValue(String(budget.amount || ''))
          }}
          className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors"
          title="แก้ไขงบประมาณ"
        >
          <Settings2 size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {/* Budget Edit / Display */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            ใช้ไป: <strong className="text-gray-700">{formatCurrency(budget.spent)}</strong>
          </span>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                step="0.01"
                min="0"
                autoFocus
                className="w-28 px-2 py-1 border border-gray-300 rounded-md text-sm text-right focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          ) : (
            <span className="text-gray-500">
              งบประมาณ: <strong className="text-gray-700">{formatCurrency(budget.amount)}</strong>
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {budget.amount > 0 && (
          <>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full ${barColor} transition-all duration-500 ease-out`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-gray-500'}>
                {percentage.toFixed(1)}%
                {isOverBudget && ' — เกินงบประมาณ!'}
              </span>
              <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-gray-500'}>
                คงเหลือ: {isOverBudget ? '-' : ''}{formatCurrency(Math.abs(remaining))}
              </span>
            </div>
          </>
        )}

        {budget.amount === 0 && (
          <p className="text-xs text-gray-400 italic">
            {editing ? 'กรุณาระบุจำนวนงบประมาณ' : 'คลิกไอคอนรูปเฟืองเพื่อตั้งค่างบประมาณ'}
          </p>
        )}
      </div>
    </div>
  )
}
