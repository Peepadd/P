import { useState, useMemo } from 'react'
import { CalendarDays } from 'lucide-react'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import useCalendarData, { EVENT_COLORS } from '../hooks/useCalendarData'
import CalendarGrid from '../components/calendar/CalendarGrid'
import CalendarDayPreview from '../components/calendar/CalendarDayPreview'

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [viewMode, setViewMode] = useState('month')
  const { providerToken, signInWithGoogle } = useAuth()
  const [filters, setFilters] = useState({
    transaction: true,
    academic: true,
    checklist: true,
    google: true,
  })

  const { eventsByDate, loading } = useCalendarData(currentDate)

  // Filter events locally based on toggle state
  const filteredEventsByDate = useMemo(() => {
    const result = {}
    Object.keys(eventsByDate).forEach((dateKey) => {
      const filtered = eventsByDate[dateKey].filter((event) => filters[event.source])
      if (filtered.length > 0) {
        result[dateKey] = filtered
      }
    })
    return result
  }, [eventsByDate, filters])

  const toggleFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ปฏิทิน</h1>
          <p className="text-gray-500 text-lg mt-1">Calendar & Schedule</p>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded-xl border border-gray-200 shadow-sm w-fit">
        <button
          onClick={() => toggleFilter('transaction')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filters.transaction ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <span>💰</span> บัญชี
        </button>
        <button
          onClick={() => toggleFilter('academic')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filters.academic ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <span>📚</span> งาน/สอบ
        </button>
        <button
          onClick={() => toggleFilter('checklist')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filters.checklist ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <span>✅</span> Checklist
        </button>
        <button
          onClick={() => toggleFilter('google')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filters.google ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <span>📅</span> Google
        </button>
      </div>

      {loading ? (
        <div className="h-[500px] w-full bg-gray-50 rounded-xl border border-gray-100 animate-pulse flex items-center justify-center">
           <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Calendar Grid & Legend */}
          <div className="lg:col-span-2 space-y-4">
            <CalendarGrid
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              eventsByDate={filteredEventsByDate}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {/* Legend */}
            <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center lg:justify-start">
                {Object.values(EVENT_COLORS).map((color, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                    <span className="text-[10px] sm:text-xs font-medium text-gray-600">{color.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Day Preview */}
          <div className="lg:col-span-1">
            <CalendarDayPreview
              selectedDate={selectedDate}
              eventsByDate={filteredEventsByDate}
              onClose={() => setSelectedDate(null)}
            />
          </div>

        </div>
      )}

    </div>
  )
}
