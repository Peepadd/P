import { useState, useRef } from 'react'
import { Download, Image } from 'lucide-react'
import html2canvas from 'html2canvas'

export default function TimetableExport({ gridRef, name }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!gridRef?.current) return

    setExporting(true)
    try {
      const canvas = await html2canvas(gridRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const link = document.createElement('a')
      link.download = `ตารางเรียน-${name || 'default'}-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Export error:', err)
      alert('ไม่สามารถส่งออกรูปภาพได้: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="ส่งออกเป็นภาพ PNG"
    >
      {exporting ? (
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <Image size={16} />
      )}
      <span className="hidden sm:inline">ส่งออก PNG</span>
    </button>
  )
}
