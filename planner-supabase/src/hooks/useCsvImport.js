import { useState, useCallback } from 'react'
import { supabase } from '../supabase/supabaseClient'

const DEFAULT_MAPPING = {
  date: '',
  type: '',
  category: '',
  amount: '',
  note: '',
  transaction_time: '',
}

// Common header names for auto-detection (ordered by priority)
const HEADER_PATTERNS = {
  date: ['date', 'วันที่', 'วัน', 'วันเดือนปี', 'วันที่ทำรายการ', 'วันที่บันทึก'],
  type: ['type', 'ประเภท', 'ชนิด', 'รายการ', 'ประเภทรายการ'],
  category: ['category', 'หมวดหมู่', 'หมวด', 'ประเภทค่าใช้จ่าย', 'ประเภทรายจ่าย'],
  amount: ['amount', 'จำนวนเงิน', 'จำนวน', 'เงิน', 'ยอด', 'จำนวนเงิน (บาท)', 'ราคา', 'value'],
  note: ['note', 'หมายเหตุ', 'โน๊ต', 'บันทึก', 'รายละเอียด', 'description', 'desc'],
  transaction_time: ['transaction_time', 'time', 'เวลา', 'เวลาทำรายการ', 'transactiontime'],
}

function detectMapping(headers) {
  const mapping = { ...DEFAULT_MAPPING }
  const normalized = headers.map((h) => h.trim().toLowerCase())

  for (const [field, patterns] of Object.entries(HEADER_PATTERNS)) {
    const idx = normalized.findIndex((h) => patterns.includes(h))
    if (idx !== -1) {
      mapping[field] = headers[idx]
    }
  }

  return mapping
}

function normalizeType(val) {
  const lower = (val || '').trim().toLowerCase()
  const incomePatterns = ['income', 'รายรับ', 'รายได้', 'รับ', '+']
  const expensePatterns = ['expense', 'รายจ่าย', 'จ่าย', 'ค่าใช้จ่าย', '支出', '-']

  if (incomePatterns.includes(lower)) return 'Income'
  if (expensePatterns.includes(lower)) return 'Expense'

  // Try numeric detection: positive = Income, negative = Expense
  const num = parseFloat(val)
  if (!isNaN(num)) {
    return num >= 0 ? 'Income' : 'Expense'
  }

  return val // keep original if unrecognized
}

function parseAmount(val) {
  if (val === null || val === undefined || val === '') return null
  // Remove Thai number formatting (commas, spaces)
  const cleaned = String(val).replace(/[, ]/g, '').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : Math.abs(num)
}

function parseDate(val) {
  if (!val) return null

  const cleaned = String(val).trim()

  // ISO format (YYYY-MM-DD)
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (isoMatch) {
    const y = isoMatch[1], m = isoMatch[2].padStart(2, '0'), d = isoMatch[3].padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // DD/MM/YYYY or DD-MM-YYYY (with Buddhist year > 2500)
  const dmyMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (dmyMatch) {
    let d = dmyMatch[1].padStart(2, '0')
    let m = dmyMatch[2].padStart(2, '0')
    let y = parseInt(dmyMatch[3])
    if (y > 2500) y -= 543 // Convert Buddhist year to Gregorian
    if (y < 100) y += 2000
    return `${y}-${m}-${d}`
  }

  // MM/DD/YYYY (US format)
  const mdyMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (mdyMatch) {
    let m = mdyMatch[1].padStart(2, '0')
    let d = mdyMatch[2].padStart(2, '0')
    let y = mdyMatch[3]
    return `${y}-${m}-${d}`
  }

  return null // unrecognized format
}

function parseTime(val) {
  if (!val) return null
  const cleaned = String(val).trim()
  const match = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (match) {
    const h = match[1].padStart(2, '0')
    const m = match[2].padStart(2, '0')
    return `${h}:${m}`
  }
  return null
}

export function buildRow(row, mapping, headers) {
  const getValue = (field) => {
    const col = mapping[field]
    if (!col) return null
    const idx = headers.indexOf(col)
    return idx !== -1 ? row[idx] : null
  }

  const rawType = getValue('type')
  const rawAmount = getValue('amount')

  return {
    date: parseDate(getValue('date')),
    type: normalizeType(rawType),
    category: (getValue('category') || '').trim(),
    amount: parseAmount(rawAmount),
    transaction_time: parseTime(getValue('transaction_time')),
    note: (getValue('note') || '').trim() || null,
  }
}

export default function useCsvImport() {
  const [parsedData, setParsedData] = useState(null) // { headers, rows }
  const [mapping, setMapping] = useState({ ...DEFAULT_MAPPING })
  const [previewRows, setPreviewRows] = useState([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null) // { success, count, errors }
  const [requiredFields] = useState(['date', 'type', 'category', 'amount'])

  const handleParse = useCallback((data) => {
    setParsedData(data)
    const detected = detectMapping(data.headers)
    setMapping(detected)
    setImportResult(null)
    // Build preview
    const preview = data.rows.slice(0, 5).map((row) => buildRow(row, detected, data.headers))
    setPreviewRows(preview)
  }, [])

  const handleMappingChange = useCallback((newMapping) => {
    setMapping(newMapping)
    if (parsedData) {
      const preview = parsedData.rows.slice(0, 5).map((row) => buildRow(row, newMapping, parsedData.headers))
      setPreviewRows(preview)
    }
  }, [parsedData])

  const handleImport = useCallback(async () => {
    if (!parsedData) return

    // Validate required fields
    const missing = requiredFields.filter((f) => !mapping[f])
    if (missing.length > 0) {
      setImportResult({ success: false, count: 0, errors: [`กรุณาจับคู่คอลัมน์ที่จำเป็น: ${missing.join(', ')}`] })
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const { headers } = parsedData
      const transactions = parsedData.rows.map((row) => buildRow(row, mapping, headers))

      // Filter out invalid rows
      const valid = []
      const errors = []

      transactions.forEach((t, i) => {
        const rowNum = i + 2 // +2 for header row and 0-index
        const rowErrors = []

        if (!t.date) rowErrors.push(`แถวที่ ${rowNum}: วันที่ไม่ถูกต้อง`)
        if (!t.type || (t.type !== 'Income' && t.type !== 'Expense')) rowErrors.push(`แถวที่ ${rowNum}: ประเภทไม่ถูกต้อง`)
        if (!t.category) rowErrors.push(`แถวที่ ${rowNum}: หมวดหมู่ไม่ถูกต้อง`)
        if (t.amount === null || isNaN(t.amount)) rowErrors.push(`แถวที่ ${rowNum}: จำนวนเงินไม่ถูกต้อง`)
        if (t.amount !== null && t.amount <= 0) rowErrors.push(`แถวที่ ${rowNum}: จำนวนเงินต้องมากกว่า 0`)

        if (rowErrors.length > 0) {
          errors.push(...rowErrors)
        } else {
          valid.push({
            id: crypto.randomUUID(),
            date: t.date,
            type: t.type,
            category: t.category,
            amount: t.amount,
            note: t.note || null,
            transaction_time: t.transaction_time || null,
          })
        }
      })

      if (valid.length === 0) {
        setImportResult({ success: false, count: 0, errors: errors.length > 0 ? errors : ['ไม่มีข้อมูลที่ถูกต้องสำหรับนำเข้า'] })
        return
      }

      // Batch insert in chunks of 50 to avoid payload size limits
      const CHUNK_SIZE = 50
      let insertedCount = 0

      for (let i = 0; i < valid.length; i += CHUNK_SIZE) {
        const chunk = valid.slice(i, i + CHUNK_SIZE)
        const { error } = await supabase.from('transactions').insert(chunk)
        if (error) throw error
        insertedCount += chunk.length
      }

      setImportResult({
        success: true,
        count: insertedCount,
        errors: errors.length > 0 ? errors : [],
      })
    } catch (err) {
      console.error('Import error:', err.message)
      setImportResult({ success: false, count: 0, errors: [`เกิดข้อผิดพลาดในการนำเข้า: ${err.message}`] })
    } finally {
      setImporting(false)
    }
  }, [parsedData, mapping, requiredFields])

  const handleReset = useCallback(() => {
    setParsedData(null)
    setMapping({ ...DEFAULT_MAPPING })
    setPreviewRows([])
    setImportResult(null)
  }, [])

  return {
    parsedData,
    mapping,
    previewRows,
    importing,
    importResult,
    requiredFields,
    handleParse,
    handleMappingChange,
    handleImport,
    handleReset,
  }
}
