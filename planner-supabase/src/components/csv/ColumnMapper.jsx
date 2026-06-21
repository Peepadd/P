import { ArrowRight } from 'lucide-react'

const FIELDS = [
  { key: 'date', label: 'วันที่', required: true },
  { key: 'type', label: 'ประเภท (รายรับ/รายจ่าย)', required: true },
  { key: 'category', label: 'หมวดหมู่', required: true },
  { key: 'amount', label: 'จำนวนเงิน', required: true },
  { key: 'note', label: 'หมายเหตุ', required: false },
  { key: 'transaction_time', label: 'เวลา', required: false },
]

export default function ColumnMapper({ headers, mapping, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...mapping, [field]: value })
  }

  return (
    <div className="bg-surface rounded-md border border-border shadow-card p-5">
      <h3 className="font-semibold text-fg mb-1">จับคู่คอลัมน์</h3>
      <p className="text-sm text-muted mb-4">
        เลือกคอลัมน์จากไฟล์ CSV ที่ตรงกับแต่ละฟิลด์
      </p>

      <div className="space-y-3">
        {FIELDS.map((field) => {
          const selected = mapping[field.key] || ''

          return (
            <div
              key={field.key}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                field.required && !selected ? 'bg-amber-50 border border-amber-200' : 'bg-surface-warm'
              }`}
            >
              {/* Field label */}
              <div className="w-36 flex-shrink-0">
                <span className="text-sm font-medium text-fg-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </span>
              </div>

              {/* Arrow icon */}
              <ArrowRight size={16} className="text-meta flex-shrink-0" />

              {/* Column select */}
              <div className="flex-1">
                <select
                  value={selected}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-shadow focus:ring-2 focus:ring-accent focus:border-accent ${
                    field.required && !selected
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-border'
                  }`}
                >
                  <option value="">-- ไม่ได้ใช้ --</option>
                  {headers.map((h) => (
                    <option
                      key={h}
                      value={h}
                      disabled={Object.values(mapping).filter(Boolean).includes(h) && mapping[field.key] !== h}
                    >
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {field.required && !selected && (
                <span className="text-xs text-amber-600 flex-shrink-0">จำเป็น</span>
              )}
            </div>
          )
        })}
      </div>

      {headers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-meta mb-2">คอลัมน์ที่ตรวจพบในไฟล์</p>
          <div className="flex flex-wrap gap-2">
            {headers.map((h) => {
              const mappedTo = Object.entries(mapping).find(([, v]) => v === h)?.[0]
              return (
                <span
                  key={h}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                    mappedTo
                      ? 'bg-accent-soft text-accent'
                      : 'bg-surface-warm text-muted'
                  }`}
                >
                  {h}
                  {mappedTo && (
                    <span className="text-accent">→ {FIELDS.find((f) => f.key === mappedTo)?.label}</span>
                  )}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
