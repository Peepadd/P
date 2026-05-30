import { useState, useMemo } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, addMonths, subMonths,
  addWeeks, subWeeks, isSameMonth, isSameDay, isToday,
  getDay,
} from 'date-fns'
import { th } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange } from 'lucide-react'

const DAY_NAMES_TH = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']

function getEventsForDay(eventsByDate, date) {
  const key = format(date, 'yyyy-MM-dd')
  return eventsByDate[key] || []
}

export default function CalendarGrid({
  currentDate,
  onDateChange,
  eventsByDate,
  selectedDate,
  onSelectDate,
  viewMode,
  onViewModeChange,
}) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  // Generate all days for month view (including padding days from prev/next month)
  const monthDays = useMemo(() => {
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [monthStart, monthEnd])

  // Generate days for week view
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = useMemo(() => {
    return eachDayOfInterval({ start: weekStart, end: weekEnd })
  }, [weekStart, weekEnd])

  const titleDate = format(currentDate, 'MMMM yyyy', { locale: th })

  const handlePrev = () => {
    onDateChange(viewMode === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1))
  }

  const handleNext = () => {
    onDateChange(viewMode === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1))
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const days = viewMode === 'month' ? monthDays : weekDays
  const isMonthView = viewMode === 'month'

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            วันนี้
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 ml-2">{titleDate}</h2>
        </div>
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => onViewModeChange('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              isMonthView ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CalendarDays size={16} />
            <span className="hidden sm:inline">เดือน</span>
          </button>
          <button
            onClick={() => onViewModeChange('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              !isMonthView ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CalendarRange size={16} />
            <span className="hidden sm:inline">สัปดาห์</span>
          </button>
        </div>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_NAMES_TH.map((name, i) => (
          <div
            key={name}
            className={`px-2 py-2 text-xs font-medium text-center ${
              i === 6 ? 'text-red-400' : 'text-gray-400'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className={`grid grid-cols-7 ${isMonthView ? '' : 'border-t border-gray-50'}`}>
        {days.map((day) => {
          const dayEvents = getEventsForDay(eventsByDate, day)
          const isCurrentMonth = isSameMonth(day, currentDate) || !isMonthView
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const today = isToday(day)
          const dayOfWeek = getDay(day)

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`
                relative min-h-[80px] sm:min-h-[100px] p-1.5 border-b border-r border-gray-50
                text-left transition-colors
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'}
                ${isSelected ? 'ring-2 ring-indigo-400 ring-inset z-10' : ''}
                ${today ? 'bg-indigo-50/50' : ''}
                hover:bg-gray-50
              `}
            >
              {/* Day number */}
              <span
                className={`
                  inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full mb-0.5
                  ${today ? 'bg-indigo-600 text-white' : ''}
                  ${!isCurrentMonth ? 'text-gray-300' : dayOfWeek === 0 ? 'text-red-500' : 'text-gray-700'}
                  ${isSelected && !today ? 'bg-indigo-100 text-indigo-700' : ''}
                `}
              >
                {format(day, 'd')}
              </span>

              {/* Event chips */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center gap-1 px-1 py-0.5 rounded text-[10px] font-medium truncate ${event.color.bg} ${event.color.text}`}
                    title={`${event.title}${event.subtitle ? ` — ${event.subtitle}` : ''}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${event.color.dot}`} />
                    <span className="truncate">{event.title}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-gray-400 pl-1">
                    +{dayEvents.length - 3} รายการ
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
