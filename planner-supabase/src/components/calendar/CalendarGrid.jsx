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
    <div className="bg-surface rounded-md border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 text-muted hover:text-muted hover:bg-surface-warm rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1 text-sm font-medium text-accent hover:bg-accent-soft rounded-lg transition-colors"
          >
            วันนี้
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 text-muted hover:text-muted hover:bg-surface-warm rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          <h2 className="text-lg font-semibold text-fg ml-2">{titleDate}</h2>
        </div>
        <div className="flex items-center bg-surface-warm rounded-lg p-0.5">
          <button
            onClick={() => onViewModeChange('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              isMonthView ? 'bg-surface text-accent shadow-card' : 'text-muted hover:text-fg-2'
            }`}
          >
            <CalendarDays size={16} />
            <span className="hidden sm:inline">เดือน</span>
          </button>
          <button
            onClick={() => onViewModeChange('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              !isMonthView ? 'bg-surface text-accent shadow-card' : 'text-muted hover:text-fg-2'
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
              i === 6 ? 'text-red-400' : 'text-muted'
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
                ${isCurrentMonth ? 'bg-surface' : 'bg-surface-warm/50'}
                ${isSelected ? 'ring-2 ring-accent ring-inset z-10' : ''}
                ${today ? 'bg-accent-soft/50' : ''}
                hover:bg-surface-warm
              `}
            >
              {/* Day number */}
              <span
                className={`
                  inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full mb-0.5
                  ${today ? 'bg-accent text-white' : ''}
                  ${!isCurrentMonth ? 'text-meta' : dayOfWeek === 0 ? 'text-red-500' : 'text-fg-2'}
                  ${isSelected && !today ? 'bg-accent-soft text-accent' : ''}
                `}
              >
                {format(day, 'd')}
              </span>

              {/* Event chips */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 4).map((event) => {
                  const isBlock = event.isAllDay || event.isMultiDay;
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center gap-1 px-1 py-0.5 rounded text-[10px] font-medium truncate ${
                        isBlock ? `${event.color.dot} text-white` : `${event.color.bg} ${event.color.text}`
                      }`}
                      title={`${event.title}${event.subtitle ? ` — ${event.subtitle}` : ''}`}
                    >
                      {!isBlock && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${event.color.dot}`} />}
                      <span className="truncate">{event.title}</span>
                    </div>
                  )
                })}
                {dayEvents.length > 4 && (
                  <span className="text-[10px] text-muted pl-1">
                    +{dayEvents.length - 4} รายการ
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
