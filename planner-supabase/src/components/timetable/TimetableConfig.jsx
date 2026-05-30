import { useState } from 'react'
import { Settings2, X } from 'lucide-react'

export default function TimetableConfig({ config, onChange, onClose }) {
  const [form, setForm] = useState({
    periods: config.periods || 6,
    tStart: config.tStart || '08:00',
    pMin: config.pMin || 50,
    bMin: config.bMin || 10,
  })

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Calculate time slots for preview
  const calculateSlots = () => {
    const slots = []
    const startParts = form.tStart.split(':').map(Number)
    let currentMin = startParts[0] * 60 + startParts[1]

    for (let i = 0; i < form.periods; i++) {
      const startH = Math.floor(currentMin / 60)
      const startM = currentMin % 60
      const endMin = currentMin + form.pMin
      const endH = Math.floor(endMin / 60)
      const endM = endMin % 60

      slots.push({
        period: i + 1,
        start: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
        end: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
      })

      currentMin = endMin + form.bMin
    }
    return slots
  }

  const slots = calculateSlots()

  const handleSave = () => {
    onChange({
      periods: Number(form.periods),
      tStart: form.tStart,
      pMin: Number(form.pMin),
      bMin: Number(form.bMin),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 size={18} className="text-indigo-600" />
          <h3 className="font-semibold text-gray-900">ตั้งค่าตารางเรียน</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">จำนวนคาบ</label>
          <input
            type="number" min={1} max={12}
            value={form.periods}
            onChange={(e) => handleChange('periods', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">เวลาเริ่มคาบแรก</label>
          <input
            type="time"
            value={form.tStart}
            onChange={(e) => handleChange('tStart', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">ความยาวคาบ (นาที)</label>
          <input
            type="number" min={20} max={180}
            value={form.pMin}
            onChange={(e) => handleChange('pMin', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">เวลาพัก (นาที)</label>
          <input
            type="number" min={0} max={60}
            value={form.bMin}
            onChange={(e) => handleChange('bMin', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs font-medium text-gray-500 mb-2">ตัวอย่างเวลา:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
          {slots.map((slot) => (
            <div key={slot.period} className="flex items-center gap-1.5 text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
              <span className="font-medium text-indigo-600">{slot.period}</span>
              <span>{slot.start} - {slot.end}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  )
}
