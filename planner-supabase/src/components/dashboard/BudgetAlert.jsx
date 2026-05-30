import { AlertTriangle, AlertOctagon, X, TrendingUp } from 'lucide-react'
import { useState } from 'react'

function formatCurrency(amount) {
  return Number(amount).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default function BudgetAlert({ budget }) {
  const [dismissed, setDismissed] = useState(false)

  if (!budget || budget.amount <= 0 || dismissed) return null

  const percentage = (budget.spent / budget.amount) * 100

  // Only show alert when >= 80%
  if (percentage < 80) return null

  const remaining = budget.amount - budget.spent
  const isCritical = percentage >= 100

  const alertConfig = isCritical
    ? {
        bg: 'bg-red-50 border-red-200',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        textColor: 'text-red-800',
        subTextColor: 'text-red-600',
        accentColor: 'red',
        icon: AlertOctagon,
        title: 'เกินงบประมาณแล้ว!',
        message: `ใช้เงินไปแล้ว ${formatCurrency(budget.spent)} บาท จากงบ ${formatCurrency(budget.amount)} บาท`,
        detail: `เกินมา ${formatCurrency(Math.abs(remaining))} บาท (${percentage.toFixed(1)}%)`,
        action: 'พิจารณาลดค่าใช้จ่ายหรือปรับเพิ่มงบประมาณ',
      }
    : {
        bg: 'bg-amber-50 border-amber-200',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        textColor: 'text-amber-800',
        subTextColor: 'text-amber-600',
        accentColor: 'amber',
        icon: AlertTriangle,
        title: 'ใกล้ถึงวงเงินงบประมาณ',
        message: `ใช้เงินไปแล้ว ${formatCurrency(budget.spent)} บาท จากงบ ${formatCurrency(budget.amount)} บาท`,
        detail: `คงเหลือ ${formatCurrency(remaining)} บาท (${percentage.toFixed(1)}%)`,
        action: 'โปรดระมัดระวังการใช้จ่าย',
      }

  const Icon = alertConfig.icon

  return (
    <div
      className={`rounded-xl border ${alertConfig.bg} p-4 transition-all duration-300 animate-[fadeIn_0.3s_ease-out]`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-full ${alertConfig.iconBg} flex items-center justify-center flex-shrink-0`}
        >
          <Icon size={20} className={alertConfig.iconColor} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-sm font-semibold ${alertConfig.textColor}`}>
                {alertConfig.title}
              </p>
              <p className={`text-sm ${alertConfig.subTextColor} mt-0.5`}>
                {alertConfig.message}
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className={`p-1 rounded-lg transition-colors flex-shrink-0 ${
                isCritical
                  ? 'text-red-400 hover:text-red-600 hover:bg-red-100'
                  : 'text-amber-400 hover:text-amber-600 hover:bg-amber-100'
              }`}
              title="ปิด"
            >
              <X size={16} />
            </button>
          </div>

          {/* Detail row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium ${
                isCritical ? 'text-red-700' : 'text-amber-700'
              }`}
            >
              <TrendingUp size={14} />
              {alertConfig.detail}
            </span>
          </div>

          {/* Action hint */}
          <p className={`text-xs mt-1.5 ${isCritical ? 'text-red-500' : 'text-amber-500'}`}>
            💡 {alertConfig.action}
          </p>

          {/* Mini progress bar */}
          <div className="mt-2 w-full bg-white/60 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isCritical ? 'bg-red-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
