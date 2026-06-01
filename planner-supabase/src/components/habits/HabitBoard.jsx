import { useMemo, useState } from 'react'
import { format, getDay, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { th } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react'
import { useLeveling } from '../../hooks/useLeveling'
import HabitAnalyzer from './HabitAnalyzer'

const DAY_HEADERS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']

export default function HabitBoard({
  habits,
  habitLogs,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  onToggleLog,
}) {
  const { gainExp } = useLeveling()
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false)
  const monthTitle = format(currentMonth, 'MMMM yyyy', { locale: th })

  // Get all days in current month
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Get day of week for header alignment (0=Sunday, 1=Monday)
  const startDayOfWeek = getDay(startOfMonth(currentMonth))

  const getLogForDay = (habitId, day) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    return habitLogs.find((l) => l.habit_id === habitId && l.date === dateStr)
  }

  const getCompletionRate = (habitId) => {
    const total = daysInMonth.length
    const done = daysInMonth.filter((day) => {
      const log = getLogForDay(habitId, day)
      return log?.done
    }).length
    return total > 0 ? Math.round((done / total) * 100) : 0
  }

  const today = new Date()

  // Get note for a specific day/habit
  const getNote = (habitId, day) => {
    const log = getLogForDay(habitId, day)
    return log?.note || ''
  }

  if (habits.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-indigo-50 flex items-center justify-center">
          <Calendar size={28} className="text-indigo-400" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">ยังไม่มีนิสัย</h3>
        <p className="text-sm text-gray-400">เพิ่มนิสัยแรกของคุณเพื่อเริ่มต้น</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button onClick={onPrevMonth} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={onToday} className="px-3 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            วันนี้
          </button>
          <button onClick={onNextMonth} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight size={20} />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 ml-2">{monthTitle}</h3>
        </div>
        <button
          onClick={() => setIsAnalyzerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-lg shadow-sm transition-all active:scale-95"
        >
          <Sparkles size={16} />
          วิเคราะห์ด้วย AI
        </button>
      </div>

      {/* Scrollable board */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Day headers */}
          <div className="grid grid-cols-[160px_repeat(31,36px)] gap-0 border-b border-gray-100">
            <div className="px-3 py-2 text-xs font-medium text-gray-400">นิสัย</div>
            {daysInMonth.map((day) => (
              <div
                key={day.toISOString()}
                className={`flex items-center justify-center py-1 text-[11px] font-medium ${
                  isToday(day) ? 'text-indigo-600' : getDay(day) === 0 ? 'text-red-400' : 'text-gray-400'
                }`}
              >
                {format(day, 'd')}
              </div>
            ))}
            {/* Completion */}
            <div className="px-2 py-1 text-[10px] text-gray-400 font-medium text-center">สำเร็จ</div>
          </div>

          {/* Habit rows */}
          {habits.map((habit) => {
            const rate = getCompletionRate(habit.id)
            return (
              <div key={habit.id} className="border-b border-gray-50 last:border-b-0">
                <div className="grid grid-cols-[160px_repeat(31,36px)] gap-0">
                  {/* Habit name */}
                  <div className="flex items-center gap-2 px-3 py-2 overflow-hidden">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
                    <span className="text-xs font-medium text-gray-700 truncate">{habit.name}</span>
                  </div>

                  {/* Day cells */}
                  {daysInMonth.map((day) => {
                    const log = getLogForDay(habit.id, day)
                    const done = log?.done || false
                    const isFuture = day > today
                    const isWeekend = getDay(day) === 0 || getDay(day) === 6

                    return (
                      <button
                        key={`${habit.id}-${format(day, 'yyyy-MM-dd')}`}
                        onClick={async () => {
                          if (!isFuture) {
                            onToggleLog(habit.id, day, !done)
                            if (!done) {
                              const result = await gainExp('habit', habit.id)
                              if (result?.leveledUp) {
                                alert(`🎉 LEVEL UP! วินัยก้าวหน้า คุณเลื่อนเป็น Level ${result.newLevel} [${result.newRank}]`)
                              }
                            }
                          }
                        }}
                        disabled={isFuture}
                        className={`
                          flex items-center justify-center h-9 transition-all relative
                          ${isFuture ? 'cursor-default' : 'hover:bg-gray-50 cursor-pointer'}
                          ${isToday(day) ? 'ring-1 ring-indigo-300 ring-inset z-10' : ''}
                          ${isWeekend && !isToday(day) ? 'bg-gray-50/50' : ''}
                        `}
                        title={`${habit.name} - ${format(day, 'd MMM', { locale: th })}${log?.note ? `: ${log.note}` : ''}`}
                      >
                        {done ? (
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold shadow-sm transition-transform hover:scale-110"
                            style={{ backgroundColor: habit.color }}
                          >
                            ✓
                          </div>
                        ) : isFuture ? (
                          <span className="text-gray-200 text-xs">·</span>
                        ) : (
                          <span className="text-gray-200 hover:text-gray-400 text-xs">○</span>
                        )}
                      </button>
                    )
                  })}

                  {/* Completion rate */}
                  <div className="flex items-center justify-center px-2">
                    <span className="text-[11px] font-mono font-medium text-gray-500">{rate}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <HabitAnalyzer 
        isOpen={isAnalyzerOpen} 
        onClose={() => setIsAnalyzerOpen(false)} 
        habits={habits}
        habitLogs={habitLogs}
      />
    </div>
  )
}
