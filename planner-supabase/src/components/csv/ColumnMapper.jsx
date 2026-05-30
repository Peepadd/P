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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 mb-1">จับคู่คอลัมน์</h3>
      <p className="text-sm text-gray-500 mb-4">
        เลือกคอลัมน์จากไฟล์ CSV ที่ตรงกับแต่ละฟิลด์
      </p>

      <div className="space-y-3">
        {FIELDS.map((field) => {
          const selected = mapping[field.key] || ''

          return (
            <div
              key={field.key}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                field.required && !selected ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
              }`}
            >
              {/* Field label */}
              <div className="w-36 flex-shrink-0">
                <span className="text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </span>
              </div>

              {/* Arrow icon */}
              <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />

              {/* Column select */}
              <div className="flex-1">
                <select
                  value={selected}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-shadow focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    field.required && !selected
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-gray-300'
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
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">คอลัมน์ที่ตรวจพบในไฟล์</p>
          <div className="flex flex-wrap gap-2">
            {headers.map((h) => {
              const mappedTo = Object.entries(mapping).find(([, v]) => v === h)?.[0]
              return (
                <span
                  key={h}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                    mappedTo
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {h}
                  {mappedTo && (
                    <span className="text-indigo-400">→ {FIELDS.find((f) => f.key === mappedTo)?.label}</span>
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
