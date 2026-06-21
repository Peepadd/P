import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { X, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function formatCurrency(amount) {
  return Math.abs(Number(amount)).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatTimeDisplay(time) {
  if (!time) return null
  if (time.includes(':')) {
    const parts = time.split(':')
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`
  }
  return time
}

function getSourceIcon(source) {
  switch (source) {
    case 'transaction': return '💰'
    case 'checklist': return '✅'
    case 'academic': return '📚'
    case 'google': return '📅'
    default: return '📌'
  }
}

function getSourceLabel(source) {
  switch (source) {
    case 'transaction': return 'บัญชี'
    case 'checklist': return 'Checklist'
    case 'academic': return 'งาน/สอบ'
    case 'google': return 'Google Calendar'
    default: return ''
  }
}

export default function CalendarDayPreview({ selectedDate, eventsByDate, onClose }) {
  const navigate = useNavigate()

  if (!selectedDate) {
    return (
      <div className="bg-surface rounded-md border border-border p-6 text-center">
        <Calendar size={40} className="mx-auto mb-3 text-meta" />
        <p className="text-sm text-muted">คลิกที่วันที่เพื่อดูรายละเอียด</p>
      </div>
    )
  }

  const dateKey = format(selectedDate, 'yyyy-MM-dd')
  const dayEvents = eventsByDate[dateKey] || []
  const dateStr = format(selectedDate, 'EEEE d MMMM yyyy', { locale: th })

  // Group events by source
  const grouped = {}
  dayEvents.forEach((event) => {
    if (!grouped[event.source]) grouped[event.source] = []
    grouped[event.source].push(event)
  })

  const sourceOrder = ['transaction', 'academic', 'checklist', 'google']

  return (
    <div className="bg-surface rounded-md border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
        <div>
          <p className="text-xs text-accent font-medium">{dateStr}</p>
          <p className="text-sm text-muted mt-0.5">{dayEvents.length} รายการ</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-muted hover:text-muted hover:bg-surface-warm rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Events */}
      <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
        {dayEvents.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-surface-warm flex items-center justify-center">
              <svg className="w-6 h-6 text-meta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-muted">ไม่มีกิจกรรมในวันนี้</p>
          </div>
        ) : (
          sourceOrder.map((source) => {
            if (!grouped[source] || grouped[source].length === 0) return null
            return (
              <div key={source}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-xs">{getSourceIcon(source)}</span>
                  <span className="text-[11px] font-medium text-muted uppercase tracking-wider">
                    {getSourceLabel(source)}
                  </span>
                  <span className="text-[10px] text-meta">({grouped[source].length})</span>
                </div>
                <div className="space-y-1">
                  {grouped[source].map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-2.5 p-2 rounded-lg border border-gray-100 hover:border-border hover:bg-surface-warm transition-colors"
                    >
                      <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${event.color.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-fg">{event.title}</span>
                          <span className={`text-[10px] px-1 py-0.5 rounded font-medium ${event.color.bg} ${event.color.text}`}>
                            {event.color.label}
                          </span>
                        </div>
                        {event.subtitle && (
                          <p className="text-[11px] text-muted mt-0.5">{event.subtitle}</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted">
                          {event.time && <span>⏰ {formatTimeDisplay(event.time)}</span>}
                          {event.note && <span className="truncate">📝 {event.note}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Quick Add Actions */}
      {selectedDate && (
        <div className="p-3 border-t border-gray-100 bg-surface-warm/50 flex gap-2 justify-end">
          <button
            onClick={() => navigate(`/academic?date=${dateKey}`)}
            className="px-3 py-1.5 text-xs font-medium text-fg-2 bg-surface border border-border rounded-lg hover:bg-surface-warm transition-colors"
          >
            เพิ่มงาน/สอบ
          </button>
          <button
            onClick={() => navigate(`/checklist?date=${dateKey}`)}
            className="px-3 py-1.5 text-xs font-medium text-fg-2 bg-surface border border-border rounded-lg hover:bg-surface-warm transition-colors"
          >
            เพิ่ม Checklist
          </button>
        </div>
      )}
    </div>
  )
}
