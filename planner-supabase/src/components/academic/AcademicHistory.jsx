import { useState, useEffect } from 'react'
import { Archive, X, Search } from 'lucide-react'

const TYPE_COLORS = {
  สอบ: 'bg-red-100 text-red-700',
  การบ้าน: 'bg-blue-100 text-blue-700',
  โปรเจกต์: 'bg-purple-100 text-purple-700',
  งานกลุ่ม: 'bg-amber-100 text-amber-700',
  นำเสนอ: 'bg-pink-100 text-pink-700',
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AcademicHistory({ isOpen, onClose, onFetchHistory }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await onFetchHistory()
      setItems(data || [])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const filtered = search.trim()
    ? items.filter(
        (item) =>
          item.subject?.toLowerCase().includes(search.toLowerCase()) ||
          item.topic?.toLowerCase().includes(search.toLowerCase()) ||
          item.type?.includes(search)
      )
    : items

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="relative bg-surface rounded-md shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Archive size={20} className="text-purple-600" />
            <h2 className="text-lg font-semibold text-fg">ประวัติงานที่ส่งแล้ว</h2>
          </div>
          <button onClick={onClose} className="p-1 text-meta hover:text-muted rounded-lg hover:bg-surface-warm transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-meta" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาประวัติ..."
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-muted">กำลังโหลด...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Archive size={40} className="mx-auto mb-3 text-meta" />
              <p className="text-meta font-medium">
                {search ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีประวัติ'}
              </p>
              <p className="text-meta text-sm mt-1">
                งานที่ส่งแล้วจะถูกย้ายมาที่นี่หลังจาก 3 วัน
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => {
                const typeColor = TYPE_COLORS[item.type] || 'bg-surface-warm text-fg-2'
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-border hover:bg-surface-warm transition-colors"
                  >
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-purple-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-fg">{item.subject}</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${typeColor}`}>
                          {item.type}
                        </span>
                        <span className="text-xs text-meta">{item.priority}</span>
                      </div>
                      <p className="text-sm text-fg-2 mt-0.5">{item.topic}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-meta">
                        <span>📅 {formatDate(item.deadline)}</span>
                        {item.note && <span>📝 {item.note}</span>}
                      </div>
                      {item.moved_at && (
                        <p className="text-xs text-meta mt-1">
                          ย้ายเมื่อ: {formatDate(item.moved_at)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
