import { useState } from 'react'
import { Upload, FileDown, CheckCircle2, AlertCircle } from 'lucide-react'

export default function CsvImport() {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('idle') // idle, uploading, success, error

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (!file) return

    setUploadStatus('uploading')
    // Simulate upload delay
    setTimeout(() => {
      setUploadStatus('success')
    }, 1500)
  }

  const resetForm = () => {
    setFile(null)
    setUploadStatus('idle')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">

      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">นำเข้าข้อมูล CSV</h1>
          <p className="text-gray-500 text-lg mt-1">Import Data</p>
        </div>
        <div className="w-12 h-12 bg-accent-soft rounded-full flex items-center justify-center">
          <FileDown size={24} className="text-accent" />
        </div>
      </header>

      {/* Upload Section */}
      <section>
        {uploadStatus === 'success' ? (
          <div className="bg-surface rounded-xl border border-green-200 p-8 text-center animate-[fadeIn_0.3s_ease-out]">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">นำเข้าข้อมูลสำเร็จ!</h3>
            <p className="text-gray-500 mb-6">ข้อมูลจากไฟล์ <span className="font-medium text-gray-900">{file?.name}</span> ถูกเพิ่มเข้าสู่ระบบเรียบร้อยแล้ว</p>
            <button
              onClick={resetForm}
              className="px-6 py-2.5 bg-surface-warm text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              อัปโหลดไฟล์อื่นเพิ่มเติม
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                isDragging
                  ? 'border-accent bg-accent-soft'
                  : file
                    ? 'border-gray-300 bg-surface-warm'
                    : 'border-border hover:border-accent hover:bg-surface-warm bg-surface'
              }`}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <div className="pointer-events-none flex flex-col items-center justify-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                  file ? 'bg-accent-soft text-accent' : 'bg-surface-warm text-meta'
                }`}>
                  <Upload size={28} />
                </div>

                {file ? (
                  <>
                    <p className="text-lg font-medium text-gray-900 mb-1">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium text-gray-900 mb-1">ลากไฟล์ CSV มาวางที่นี่</p>
                    <p className="text-sm text-gray-500 mb-4">หรือคลิกเพื่อเลือกไฟล์จากเครื่องของคุณ</p>
                    <span className="px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium text-gray-700 shadow-sm">
                      เลือกไฟล์
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <AlertCircle size={16} />
                <span>รองรับเฉพาะไฟล์ .csv ขนาดไม่เกิน 5MB</span>
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || uploadStatus === 'uploading'}
                className="px-6 py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังอัปโหลด...
                  </>
                ) : (
                  'อัปโหลดข้อมูล'
                )}
              </button>
            </div>
          </div>
        )}
      </section>

    </div>
  )
}
