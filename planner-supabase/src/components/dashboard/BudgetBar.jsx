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
    <div className="bg-surface rounded-md p-5 border border-border shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-fg">งบประมาณประจำเดือน</h3>
        <button
          onClick={() => {
            setEditing(true)
            setInputValue(String(budget.amount || ''))
          }}
          className="p-1.5 text-meta hover:text-accent rounded-lg hover:bg-surface-warm transition-colors"
          title="แก้ไขงบประมาณ"
        >
          <Settings2 size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {/* Budget Edit / Display */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            ใช้ไป: <strong className="text-fg-2">{formatCurrency(budget.spent)}</strong>
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
                className="w-28 px-2 py-1 border border-border rounded-md text-sm text-right focus:ring-2 focus:ring-accent focus:border-accent outline-none"
              />
            </div>
          ) : (
            <span className="text-muted">
              งบประมาณ: <strong className="text-fg-2">{formatCurrency(budget.amount)}</strong>
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {budget.amount > 0 && (
          <>
            <div className="w-full bg-border rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full ${barColor} transition-all duration-500 ease-out`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-muted'}>
                {percentage.toFixed(1)}%
                {isOverBudget && ' — เกินงบประมาณ!'}
              </span>
              <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-muted'}>
                คงเหลือ: {isOverBudget ? '-' : ''}{formatCurrency(Math.abs(remaining))}
              </span>
            </div>
          </>
        )}

        {budget.amount === 0 && (
          <p className="text-xs text-meta italic">
            {editing ? 'กรุณาระบุจำนวนงบประมาณ' : 'คลิกไอคอนรูปเฟืองเพื่อตั้งค่างบประมาณ'}
          </p>
        )}
      </div>
    </div>
  )
}
