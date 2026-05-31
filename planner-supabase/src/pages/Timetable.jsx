import { useState } from 'react'
import { Calendar as CalendarIcon, Settings2, Plus } from 'lucide-react'

export default function Timetable() {
  const [classes] = useState([]) // Placeholder for Supabase data

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
      
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ตารางเรียน</h1>
          <p className="text-gray-500 text-lg mt-1">Academic Schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-lg transition-colors">
            <Settings2 size={20} />
          </button>
          <button className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-600 transition-colors">
            <Plus size={18} />
            <span className="hidden sm:inline">เพิ่มวิชา</span>
          </button>
        </div>
      </header>

      {/* Timetable Grid or List */}
      <section>
        {classes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon size={32} />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-1">ยังไม่มีตารางเรียน</h3>
            <p className="text-gray-500">เริ่มเพิ่มวิชาเรียนเพื่อจัดตารางของคุณ</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Grid will go here */}
          </div>
        )}
      </section>
    </div>
  )
}
