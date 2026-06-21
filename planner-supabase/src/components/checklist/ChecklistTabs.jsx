import { ShoppingCart, ClipboardList } from 'lucide-react'

export default function ChecklistTabs({ activeType, onChange }) {
  const tabs = [
    { type: 'shopping', label: 'Shopping', icon: ShoppingCart, emoji: '🛒' },
    { type: 'todo', label: 'To-do', icon: ClipboardList, emoji: '✅' },
  ]

  return (
    <div className="flex gap-1.5 bg-surface-warm p-1 rounded-md">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeType === tab.type
        return (
          <button
            key={tab.type}
            onClick={() => onChange(tab.type)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-surface text-accent shadow-card'
                : 'text-muted hover:text-fg-2 hover:bg-gray-200/50'
            }`}
          >
            {isActive ? <Icon size={16} /> : <span className="text-base">{tab.emoji}</span>}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
