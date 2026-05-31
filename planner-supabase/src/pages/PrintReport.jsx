import { useState } from 'react'
import { Printer, FileText, Calendar, Filter } from 'lucide-react'

export default function PrintReport() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [reportType, setReportType] = useState('finance')

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
      
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">พิมพ์รายงาน</h1>
          <p className="text-gray-500 text-lg mt-1">Print & Export</p>
        </div>
        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
          <Printer size={24} className="text-indigo-500" />
        </div>
      </header>

      {/* Configuration Card */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          ตัวเลือกรายงาน
        </h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทรายงาน</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText size={18} className="text-gray-400" />
                </div>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="pl-10 block w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-colors"
                >
                  <option value="finance">สรุปรายรับ-รายจ่าย (Finance)</option>
                  <option value="academic">สรุปงานและการเรียน (Academic)</option>
                  <option value="habits">สรุปการสร้างนิสัย (Habits)</option>
                </select>
              </div>
            </div>

            {/* Date Range / Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ประจำเดือน</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={18} className="text-gray-400" />
                </div>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="pl-10 block w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>
            </div>
            
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition-colors shadow-sm"
            >
              <Printer size={18} />
              สร้างรายงานและพิมพ์
            </button>
          </div>
        </div>
      </section>

      {/* Preview Skeleton */}
      <section className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center hidden md:block">
        <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <FileText size={32} className="text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">ตัวอย่างรายงาน</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          ระบบจะทำการรวบรวมข้อมูลตามที่คุณเลือก และสร้างเป็นรูปแบบที่พร้อมสำหรับพิมพ์ (A4)
        </p>
      </section>

    </div>
  )
}
