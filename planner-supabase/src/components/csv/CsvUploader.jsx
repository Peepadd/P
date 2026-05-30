import { useRef, useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import Papa from 'papaparse'

export default function CsvUploader({ onParse, parsedData }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState(null)

  const parseFile = (file) => {
    if (!file) return

    setParsing(true)
    setParseError(null)

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.data.length < 2) {
          setParseError('ไฟล์ CSV ต้องมีอย่างน้อย 2 แถว (หัวคอลัมน์ + ข้อมูล)')
          setParsing(false)
          return
        }

        const headers = results.data[0].map((h) => h.trim())
        const rows = results.data.slice(1)

        onParse({ headers, rows })
        setParsing(false)
      },
      error: (err) => {
        setParseError(`ไม่สามารถอ่านไฟล์ CSV ได้: ${err.message}`)
        setParsing(false)
      },
    })
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0]
    if (file) parseFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  // If already parsed, show success state
  if (parsedData) {
    return (
      <div className="bg-white rounded-xl border border-green-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <FileText size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">ไฟล์ CSV อ่านสำเร็จ</p>
              <p className="text-xs text-gray-500">
                พบ {parsedData.headers.length} คอลัมน์, {parsedData.rows.length} รายการ
              </p>
            </div>
          </div>
          <button
            onClick={() => onParse(null)} // Use as reset signal
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            title="เปลี่ยนไฟล์"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={handleFile}
          className="hidden"
        />

        {parsing ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">กำลังอ่านไฟล์ CSV...</p>
          </div>
        ) : (
          <>
            <div
              className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors ${
                dragOver ? 'bg-indigo-200' : 'bg-indigo-100'
              }`}
            >
              <Upload size={28} className={dragOver ? 'text-indigo-700' : 'text-indigo-600'} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {dragOver ? 'วางไฟล์ที่นี่' : 'อัปโหลดไฟล์ CSV'}
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
            </p>
            <p className="text-xs text-gray-400">
              รองรับไฟล์ .csv (UTF-8) ที่มีหัวคอลัมน์ในแถวแรก
            </p>
          </>
        )}
      </div>

      {parseError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{parseError}</p>
        </div>
      )}
    </div>
  )
}
