import { CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

function formatPreviewValue(row, field) {
  if (field === 'amount' && row.amount !== null && row.amount !== undefined) {
    return Math.abs(row.amount).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  if (field === 'type' && row.type) {
    return row.type === 'Income' ? 'รายรับ' : row.type === 'Expense' ? 'รายจ่าย' : row.type
  }
  return row[field] || '-'
}

const PREVIEW_FIELDS = [
  { key: 'date', label: 'วันที่' },
  { key: 'type', label: 'ประเภท' },
  { key: 'category', label: 'หมวดหมู่' },
  { key: 'amount', label: 'จำนวนเงิน' },
  { key: 'note', label: 'หมายเหตุ' },
]

export default function ImportPreview({ previewRows, fullRows, mapping, onImport, importing }) {
  const [showAll, setShowAll] = useState(false)
  const hasRequiredMapping = mapping.date && mapping.type && mapping.category && mapping.amount
  const validCount = previewRows.filter((r) => r.date && r.type && r.category && r.amount !== null && r.amount > 0).length

  if (!mapping.date && !mapping.type && !mapping.category && !mapping.amount) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
        <p className="text-sm text-gray-400">กรุณาจับคู่คอลัมน์ก่อนดูตัวอย่างข้อมูล</p>
      </div>
    )
  }

  const displayRows = showAll && fullRows ? fullRows : previewRows
  const totalRows = fullRows?.length || previewRows.length

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">ตัวอย่างข้อมูล</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            แสดง {showAll ? totalRows : Math.min(5, totalRows)} จาก {totalRows} รายการ
            {validCount > 0 && (
              <span className="ml-2 text-green-600 font-medium">
                ({validCount} รายการที่ถูกต้อง)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Preview table */}
      {displayRows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                {PREVIEW_FIELDS.map((f) => (
                  <th key={f.key} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {f.label}
                  </th>
                ))}
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, i) => {
                const isValid = row.date && row.type && row.category && row.amount !== null && row.amount > 0
                return (
                  <tr
                    key={i}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      !isValid ? 'bg-red-50/50' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-xs text-gray-400">{i + 1}</td>
                    {PREVIEW_FIELDS.map((f) => (
                      <td key={f.key} className="px-4 py-2.5">
                        <span
                          className={`${
                            f.key === 'amount' && row.amount !== null
                              ? row.type === 'Income'
                                ? 'text-green-600 font-medium'
                                : 'text-red-600 font-medium'
                              : 'text-gray-700'
                          } ${!row[f.key] && f.key !== 'amount' ? 'text-gray-300' : ''}`}
                        >
                          {formatPreviewValue(row, f.key)}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-2.5">
                      {isValid ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : (
                        <AlertCircle size={16} className="text-red-400" />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center">
          <AlertCircle size={24} className="mx-auto text-amber-400 mb-2" />
          <p className="text-sm text-gray-500">ไม่พบข้อมูลที่ถูกต้องหลังจากจับคู่คอลัมน์</p>
          <p className="text-xs text-gray-400 mt-1">กรุณาตรวจสอบการจับคู่คอลัมน์อีกครั้ง</p>
        </div>
      )}

      {/* Show more toggle */}
      {fullRows && fullRows.length > 5 && (
        <div className="border-t border-gray-100">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2.5 flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
          >
            {showAll ? (
              <>
                <ChevronUp size={16} />
                แสดงเฉพาะตัวอย่าง
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                แสดงทั้งหมด ({fullRows.length} รายการ)
              </>
            )}
          </button>
        </div>
      )}

      {/* Import button */}
      {hasRequiredMapping && validCount > 0 && (
        <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onImport}
            disabled={importing}
            className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังนำเข้า...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                นำเข้า {validCount} รายการ
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
