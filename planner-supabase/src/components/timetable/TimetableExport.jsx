import { useState, useRef, useEffect } from 'react'
import { Download, Image, FileText, ChevronDown, CalendarPlus } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { downloadICS } from './TimetableCalendarExport'

export default function TimetableExport({ gridRef, name, config, cells, subjects }) {
  const [exporting, setExporting] = useState(false)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const captureCanvas = async () => {
    if (!gridRef?.current) return null
    return html2canvas(gridRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })
  }

  const handleExportPNG = async () => {
    setExporting(true)
    setOpen(false)
    try {
      const canvas = await captureCanvas()
      if (!canvas) return

      const link = document.createElement('a')
      link.download = `ตารางเรียน-${name || 'default'}-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('PNG export error:', err)
      alert('ไม่สามารถส่งออกรูปภาพได้: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const handleExportPDF = async () => {
    setExporting(true)
    setOpen(false)
    try {
      const canvas = await captureCanvas()
      if (!canvas) return

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      // Determine orientation based on aspect ratio
      const isLandscape = imgWidth > imgHeight
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10

      const availableWidth = pageWidth - margin * 2
      const availableHeight = pageHeight - margin * 2

      const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight)
      const pdfImgWidth = imgWidth * ratio
      const pdfImgHeight = imgHeight * ratio

      // Center the image
      const x = (pageWidth - pdfImgWidth) / 2
      const y = (pageHeight - pdfImgHeight) / 2

      pdf.addImage(imgData, 'PNG', x, y, pdfImgWidth, pdfImgHeight)
      pdf.save(`ตารางเรียน-${name || 'default'}-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error('PDF export error:', err)
      alert('ไม่สามารถส่งออก PDF ได้: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="ส่งออกตารางเรียน"
      >
        {exporting ? (
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Download size={16} />
        )}
        <span className="hidden sm:inline">ส่งออก</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-20 min-w-[160px] animate-[fadeIn_0.1s_ease-out]">
          <button
            onClick={handleExportPNG}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Image size={15} className="text-green-500" />
            ส่งออก PNG
          </button>
          <button
            onClick={handleExportPDF}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileText size={15} className="text-red-500" />
            ส่งออก PDF
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => {
              setOpen(false)
              const ok = downloadICS({ config, cells, subjects, timetableName: name })
              if (!ok) alert('ไม่มีข้อมูลตารางเรียนสำหรับ export')
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <CalendarPlus size={15} className="text-blue-500" />
            Add to Calendar (.ics)
          </button>
        </div>
      )}
    </div>
  )
}
