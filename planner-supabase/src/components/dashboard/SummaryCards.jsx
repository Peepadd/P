import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

function formatCurrency(amount) {
  return Number(amount).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default function SummaryCards({ summary }) {
  const cards = [
    {
      label: 'รายรับรวม',
      value: summary.incomeTotal,
      count: summary.incomeCount,
      color: 'green',
      icon: TrendingUp,
      prefix: '+',
    },
    {
      label: 'รายจ่ายรวม',
      value: summary.expenseTotal,
      count: summary.expenseCount,
      color: 'red',
      icon: TrendingDown,
      prefix: '-',
    },
    {
      label: 'คงเหลือ',
      value: summary.balance,
      color: 'indigo',
      icon: Wallet,
      prefix: '',
    },
  ]

  const colorMap = {
    green: {
      text: 'text-green-600',
      bg: 'bg-green-100',
      icon: 'text-green-600',
      valueBg: summary.balance >= 0 ? 'text-green-600' : 'text-red-600',
    },
    red: {
      text: 'text-red-600',
      bg: 'bg-red-100',
      icon: 'text-red-600',
      valueBg: 'text-red-600',
    },
    indigo: {
      text: 'text-indigo-600',
      bg: 'bg-indigo-100',
      icon: 'text-indigo-600',
      valueBg:
        summary.balance >= 0 ? 'text-indigo-600' : 'text-red-600',
    },
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => {
        const c = colorMap[card.color]
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className={`text-2xl font-bold ${c.valueBg}`}>
                  {card.prefix}
                  {formatCurrency(card.value)}
                </p>
                {card.count !== undefined && (
                  <p className="text-xs text-gray-400">
                    {card.count} รายการ
                  </p>
                )}
              </div>
              <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
                <Icon size={20} className={c.icon} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
