import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, RefreshCw, FileSpreadsheet } from 'lucide-react'
import CsvUploader from '../components/csv/CsvUploader'
import ColumnMapper from '../components/csv/ColumnMapper'
import ImportPreview from '../components/csv/ImportPreview'
import useCsvImport, { buildRow } from '../hooks/useCsvImport'

export default function CsvImport() {
  const {
    parsedData,
    mapping,
    previewRows,
    importing,
    importResult,
    handleParse,
    handleMappingChange,
    handleImport,
    handleReset,
  } = useCsvImport()

  const [fullPreviewRows, setFullPreviewRows] = useState([])

  // Derive full preview rows whenever parsedData or mapping changes —
  // using the same buildRow logic as the actual import.
  useEffect(() => {
    if (!parsedData) {
      setFullPreviewRows([])
      return
    }
    const { headers, rows } = parsedData
    setFullPreviewRows(rows.map((row) => buildRow(row, mapping, headers)))
  }, [parsedData, mapping])

  const onParse = (data) => {
    if (!data) {
      handleReset()
      return
    }
    handleParse(data)
  }

  const onMappingChange = (newMapping) => {
    handleMappingChange(newMapping)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">นำเข้า CSV</h2>
          <p className="text-gray-500 mt-1">อัปโหลดไฟล์ CSV และนำเข้าข้อมูลรายการบัญชี</p>
        </div>
        {importResult?.success && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <RefreshCw size={16} />
            นำเข้าไฟล์ใหม่
          </button>
        )}
      </div>

      {/* Import Result Banner */}
      {importResult && (
        <div
          className={`rounded-xl p-4 ${
            importResult.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {importResult.success ? (
              <CheckCircle2 size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              {importResult.success ? (
                <>
                  <p className="text-sm font-medium text-green-800">
                    นำเข้าสำเร็จ! {importResult.count} รายการ
                  </p>
                  <p className="text-sm text-green-600 mt-0.5">
                    ข้อมูลถูกเพิ่มเข้าไปในระบบเรียบร้อยแล้ว
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-red-800">นำเข้าไม่สำเร็จ</p>
                  {importResult.errors?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {importResult.errors.map((err, i) => (
                        <li key={i} className="text-sm text-red-600">
                          {err}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Upload */}
      <div className={parsedData ? 'opacity-60 pointer-events-none' : ''}>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
            1
          </span>
          <h3 className="font-semibold text-gray-900">เลือกไฟล์ CSV</h3>
        </div>
        <CsvUploader onParse={onParse} parsedData={parsedData} />
      </div>

      {/* Step 2: Column Mapping */}
      {parsedData && (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h3 className="font-semibold text-gray-900">จับคู่คอลัมน์</h3>
          </div>
          <ColumnMapper
            headers={parsedData.headers}
            mapping={mapping}
            onChange={onMappingChange}
          />
        </div>
      )}

      {/* Step 3: Preview & Import */}
      {parsedData && (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h3 className="font-semibold text-gray-900">ตรวจสอบและนำเข้า</h3>
          </div>
          <ImportPreview
            previewRows={previewRows}
            fullRows={fullPreviewRows}
            mapping={mapping}
            onImport={handleImport}
            importing={importing}
          />
        </div>
      )}

      {/* Empty state (no upload yet) */}
      {!parsedData && !importResult && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet size={24} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">รูปแบบไฟล์ CSV ที่รองรับ</h3>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• แถวแรกต้องเป็นหัวคอลัมน์</li>
                <li>• ต้องมีคอลัมน์ที่จำเป็น: วันที่, ประเภท (รายรับ/รายจ่าย), หมวดหมู่, จำนวนเงิน</li>
                <li>• วันที่รองรับหลายรูปแบบ: YYYY-MM-DD, DD/MM/YYYY, DD/MM/2567 (พ.ศ.)</li>
                <li>• ระบบจะแปลงค่า "รายรับ/Income/+" → Income และ "รายจ่าย/Expense/-" → Expense โดยอัตโนมัติ</li>
                <li>• จำนวนเงินจะถูกบันทึกเป็นค่าบวกเสมอ (ประเภทจะเป็นตัวกำหนด)</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
