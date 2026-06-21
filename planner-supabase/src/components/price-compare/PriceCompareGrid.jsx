import { useState, useMemo } from 'react'
import { Plus, Trash2, Scale, DollarSign, RefreshCw } from 'lucide-react'

const UNIT_OPTIONS = [
  { value: 'g', label: 'กรัม (g)' },
  { value: 'kg', label: 'กิโลกรัม (kg)' },
  { value: 'ml', label: 'มิลลิลิตร (ml)' },
  { value: 'l', label: 'ลิตร (l)' },
  { value: 'piece', label: 'ชิ้น' },
  { value: 'pack', label: 'แพ็ค' },
  { value: 'roll', label: 'ม้วน' },
  { value: 'sheet', label: 'แผ่น' },
]

function createEmptyRow() {
  return {
    id: crypto.randomUUID(),
    brand: '',
    price: '',
    quantity: '',
    unit: 'g',
  }
}

function calculateUnitPrice(price, quantity) {
  const p = parseFloat(price)
  const q = parseFloat(quantity)
  if (isNaN(p) || isNaN(q) || q <= 0) return null
  return p / q
}

function formatCurrency(amount) {
  return amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default function PriceCompareGrid() {
  const [rows, setRows] = useState([createEmptyRow(), createEmptyRow()])

  const handleChange = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyRow()])
  }

  const handleDeleteRow = (id) => {
    if (rows.length <= 2) return // Keep at least 2 rows
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  const handleClear = () => {
    setRows([createEmptyRow(), createEmptyRow()])
  }

  // Calculate unit prices and find best value
  const results = useMemo(() => {
    const calculated = rows.map((row) => {
      const unitPrice = calculateUnitPrice(row.price, row.quantity)
      const totalPrice = parseFloat(row.price) || 0
      const totalQty = parseFloat(row.quantity) || 0
      return { ...row, unitPrice, totalPrice, totalQty }
    })

    const validPrices = calculated
      .filter((r) => r.unitPrice !== null && r.brand.trim())
      .sort((a, b) => a.unitPrice - b.unitPrice)

    const bestId = validPrices.length > 0 ? validPrices[0].id : null

    return { calculated, bestId }
  }, [rows])

  return (
    <div className="bg-surface rounded-md border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <Scale size={18} className="text-emerald-600" />
          <h3 className="font-semibold text-fg">เปรียบเทียบราคา</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-muted hover:text-fg-2 hover:bg-surface-warm rounded-lg transition-colors"
          >
            <RefreshCw size={14} />
            ล้าง
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-warm">
              <th className="px-3 py-2.5 text-xs font-medium text-muted text-left w-2/12">แบรนด์/ร้าน</th>
              <th className="px-3 py-2.5 text-xs font-medium text-muted text-right w-2/12">
                <span className="flex items-center justify-end gap-1">
                  <DollarSign size={12} /> ราคา (บาท)
                </span>
              </th>
              <th className="px-3 py-2.5 text-xs font-medium text-muted text-right w-2/12">ปริมาณ</th>
              <th className="px-3 py-2.5 text-xs font-medium text-muted text-center w-1/12">หน่วย</th>
              <th className="px-3 py-2.5 text-xs font-medium text-muted text-right w-2/12">ราคา/หน่วย</th>
              <th className="px-3 py-2.5 w-1/12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {results.calculated.map((row, index) => {
              const isBest = row.id === results.bestId && row.unitPrice !== null && row.brand.trim()

              return (
                <tr
                  key={row.id}
                  className={`transition-colors ${
                    isBest ? 'bg-emerald-50/70 border-emerald-200' : 'hover:bg-surface-warm'
                  }`}
                >
                  {/* Brand */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      {isBest && (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0" title="คุ้มค่าที่สุด!">
                          ✓
                        </span>
                      )}
                      <input
                        type="text"
                        value={row.brand}
                        onChange={(e) => handleChange(row.id, 'brand', e.target.value)}
                        placeholder={index === 0 ? 'เช่น ยี่ห้อ A' : index === 1 ? 'ยี่ห้อ B' : `ยี่ห้อ ${String.fromCharCode(65 + index)}`}
                        className={`w-full px-2 py-1.5 text-sm border rounded-lg outline-none transition-shadow focus:ring-2 ${
                          isBest
                            ? 'border-emerald-300 focus:ring-emerald-400'
                            : 'border-border focus:ring-accent'
                        }`}
                      />
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.price}
                      onChange={(e) => handleChange(row.id, 'price', e.target.value)}
                      placeholder="0.00"
                      className={`w-full px-2 py-1.5 text-sm text-right border rounded-lg outline-none transition-shadow focus:ring-2 ${
                        isBest
                          ? 'border-emerald-300 focus:ring-emerald-400'
                          : 'border-border focus:ring-accent'
                      }`}
                    />
                  </td>

                  {/* Quantity */}
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={row.quantity}
                      onChange={(e) => handleChange(row.id, 'quantity', e.target.value)}
                      placeholder="0"
                      className={`w-full px-2 py-1.5 text-sm text-right border rounded-lg outline-none transition-shadow focus:ring-2 ${
                        isBest
                          ? 'border-emerald-300 focus:ring-emerald-400'
                          : 'border-border focus:ring-accent'
                      }`}
                    />
                  </td>

                  {/* Unit */}
                  <td className="px-3 py-2">
                    <select
                      value={row.unit}
                      onChange={(e) => handleChange(row.id, 'unit', e.target.value)}
                      className="w-full px-1 py-1.5 text-xs border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent bg-surface"
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u.value} value={u.value}>{u.value}</option>
                      ))}
                    </select>
                  </td>

                  {/* Unit price (calculated) */}
                  <td className="px-3 py-2 text-right">
                    {row.unitPrice !== null ? (
                      <span className={`text-sm font-semibold font-mono ${
                        isBest ? 'text-emerald-700' : 'text-fg-2'
                      }`}>
                        {formatCurrency(row.unitPrice)}
                        <span className="text-xs text-meta ml-0.5">/{row.unit}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-meta">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      disabled={rows.length <= 2}
                      className="p-1 text-meta hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="ลบแถว"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add row button */}
      <div className="px-4 py-3 border-t border-border">
        <button
          onClick={handleAddRow}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-accent hover:text-accent hover:bg-accent-soft rounded-lg transition-colors"
        >
          <Plus size={14} />
          เพิ่มแถวเปรียบเทียบ
        </button>
      </div>

      {/* Summary */}
      {results.bestId && (() => {
        const best = results.calculated.find((r) => r.id === results.bestId)
        if (!best) return null
        return (
          <div className="px-4 py-3 border-t border-border bg-surface">
            <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
              <strong className="text-sm">{best.brand}</strong> คุ้มค่าที่สุด!
              <span className="text-emerald-600 font-mono">
                ราคา {formatCurrency(best.unitPrice)}/{best.unit}
              </span>
              {best.totalPrice > 0 && (
                <span className="text-emerald-400">(รวม {formatCurrency(best.totalPrice)} บาท)</span>
              )}
            </p>
          </div>
        )
      })()}
    </div>
  )
}
