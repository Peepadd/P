import { useState } from 'react'
import { Plus, X } from 'lucide-react'

const PRESET_COLORS = [
  '#7c3aed', '#8b5cf6', '#a855f7', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#64748b', '#78716c', '#1e293b',
]

const FREQUENCY_OPTIONS = ['Daily', 'Weekly', 'Weekdays', 'Weekends']

export default function HabitForm({ onCreate, onClose }) {
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState('Daily')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customColor, setCustomColor] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    try {
      await onCreate(name.trim(), frequency, color)
      setName('')
      setFrequency('Daily')
      setColor(PRESET_COLORS[0])
      if (onClose) onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <Plus size={18} className="text-accent" />
        <h3 className="font-semibold text-fg">เพิ่มนิสัยใหม่</h3>
        {onClose && (
          <button type="button" onClick={onClose} className="ml-auto p-1 text-meta hover:text-fg-2 rounded-lg hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-fg-2 mb-1">
            ชื่อนิสัย <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น ออกกำลังกาย, อ่านหนังสือ, นั่งสมาธิ..."
            required
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium text-fg-2 mb-1">ความถี่</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
          >
            {FREQUENCY_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-sm font-medium text-fg-2 mb-2">สีประจำนิสัย</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { setColor(c); setShowColorPicker(false) }}
              className={`w-7 h-7 rounded-lg border-2 transition-all ${
                color === c ? 'border-accent scale-110 ring-2 ring-offset-1 ring-accent/50' : 'border-border hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-7 h-7 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-meta hover:border-accent hover:text-accent transition-colors text-xs font-bold"
            title="เลือกสีเอง"
          >
            +
          </button>
        </div>

        {showColorPicker && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border border-border p-0.5"
            />
            <input
              type="text"
              value={customColor || color}
              onChange={(e) => {
                setCustomColor(e.target.value)
                if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                  setColor(e.target.value)
                }
              }}
              placeholder="#HEX"
              className="w-24 px-2 py-1.5 text-sm border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none font-mono"
            />
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm text-fg-2">
          {name || 'ชื่อนิสัย'} <span className="text-meta text-xs">• {frequency}</span>
        </span>
      </div>

      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="w-full px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'กำลังบันทึก...' : 'เพิ่มนิสัย'}
      </button>
    </form>
  )
}
