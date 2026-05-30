import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import CalendarGrid from '../components/calendar/CalendarGrid'
import CalendarDayPreview from '../components/calendar/CalendarDayPreview'
import useCalendarData from '../hooks/useCalendarData'

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [viewMode, setViewMode] = useState('month')

  const { eventsByDate, loading, error, refetch } = useCalendarData(currentDate)

  const handleSelectDate = useCallback((date) => {
    setSelectedDate(date)
  }, [])

  const handleClosePreview = useCallback(() => {
    setSelectedDate(null)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">📅 ปฏิทิน</h2>
        <p className="text-gray-500 mt-1">ดูกิจกรรมรวมจากทุกโมดูลในปฏิทินเดียว</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">ไม่สามารถโหลดข้อมูลปฏิทินได้</p>
              <p className="text-xs text-amber-600 mt-1">{error}</p>
              <button
                onClick={refetch}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
              >
                <RefreshCw size={14} />
                ลองอีกครั้ง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-gray-500 font-medium">🎨 สีกิจกรรม:</span>
        {[
          { dot: 'bg-green-500', label: 'รายรับ' },
          { dot: 'bg-red-500', label: 'รายจ่าย/สอบ' },
          { dot: 'bg-orange-500', label: 'ซื้อของ' },
          { dot: 'bg-teal-500', label: 'สิ่งที่ต้องทำ' },
          { dot: 'bg-blue-500', label: 'การบ้าน' },
          { dot: 'bg-purple-500', label: 'โปรเจกต์' },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1 text-gray-500">
            <span className={`w-2 h-2 rounded-full ${item.dot}`} />
            {item.label}
          </span>
        ))}
      </div>

      {/* Layout: Grid + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">กำลังโหลดปฏิทิน...</p>
              </div>
            </div>
          ) : (
            <CalendarGrid
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              eventsByDate={eventsByDate}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          )}
        </div>

        {/* Day Preview */}
        <div className="lg:col-span-1">
          <CalendarDayPreview
            selectedDate={selectedDate}
            eventsByDate={eventsByDate}
            onClose={handleClosePreview}
          />
        </div>
      </div>
    </div>
  )
}
