import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, Clock, AlertCircle, CheckCircle2, CalendarDays } from 'lucide-react'
import { supabase } from '../supabase/supabaseClient'
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays 
} from 'date-fns'
import { th } from 'date-fns/locale'

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  
  const [academicItems, setAcademicItems] = useState([])
  const [checklistItems, setChecklistItems] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      // Fetch all non-archived academic items and checklist items
      
      const { data: academicData, error: err1 } = await supabase
        .from('academic_items')
        .select('*')
        
      if (err1) throw err1
      
      const { data: checklistData, error: err2 } = await supabase
        .from('checklist_items')
        .select('*')
        
      if (err2) throw err2
      
      setAcademicItems(academicData || [])
      setChecklistItems(checklistData || [])
      
    } catch (err) {
      console.error('Error fetching calendar events:', err)
    } finally {
      setLoading(false)
    }
  }

  // Navigation
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  // Generate calendar grid
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStarts: 0 }) // 0 = Sunday
  const endDate = endOfWeek(monthEnd, { weekStarts: 0 })
  
  // Aggregate events per date string "YYYY-MM-DD"
  const eventsMap = useMemo(() => {
    const map = {}
    
    // Academic (Red bars/dots)
    academicItems.forEach(item => {
      if (!item.deadline) return
      const dateStr = item.deadline.substring(0, 10)
      if (!map[dateStr]) map[dateStr] = { academic: [], checklist: [] }
      map[dateStr].academic.push(item)
    })
    
    // Checklist (Gray/Green bars/dots)
    checklistItems.forEach(item => {
      if (!item.due_date) return
      const dateStr = item.due_date.substring(0, 10)
      if (!map[dateStr]) map[dateStr] = { academic: [], checklist: [] }
      map[dateStr].checklist.push(item)
    })
    
    return map
  }, [academicItems, checklistItems])

  const handleDateClick = (day) => {
    setSelectedDate(day)
    setShowModal(true)
  }

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: th })}
          </h2>
          <button 
            onClick={goToToday}
            className="text-xs md:text-sm font-medium text-indigo-600 bg-indigo-50 px-2 md:px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors"
          >
            วันนี้
          </button>
        </div>
        <div className="flex gap-1 md:gap-2">
          <button onClick={prevMonth} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    )
  }

  const renderDays = () => {
    const days = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, i) => (
          <div key={i} className="text-center font-medium text-xs md:text-sm text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>
    )
  }

  const renderCells = () => {
    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ''
    
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd')
        const cloneDay = day
        const isCurrentMonth = isSameMonth(day, monthStart)
        const isToday = isSameDay(day, new Date())
        
        const dateStr = format(day, 'yyyy-MM-dd')
        const dayEvents = eventsMap[dateStr] || { academic: [], checklist: [] }
        const totalEvents = dayEvents.academic.length + dayEvents.checklist.length
        
        days.push(
          <div 
            key={day} 
            onClick={() => handleDateClick(cloneDay)}
            className={`
              min-h-[80px] md:min-h-[100px] p-1 md:p-2 border-t border-gray-100 relative cursor-pointer
              transition-all hover:bg-gray-50 flex flex-col items-center sm:items-start
              ${!isCurrentMonth ? 'opacity-40 bg-gray-50/50' : 'bg-white'}
              ${isToday ? 'bg-indigo-50/30' : ''}
            `}
          >
            <div className="flex w-full justify-center sm:justify-start">
              <span className={`
                flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full
                ${isToday ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-700'}
              `}>
                {formattedDate}
              </span>
            </div>
            
            {/* Event Dots for Mobile, Tiny Bars for Desktop */}
            <div className="flex flex-wrap gap-1 justify-center sm:justify-start w-full mt-2 sm:mt-1">
              {dayEvents.academic.slice(0, 3).map((item, idx) => (
                <div key={`aca-${idx}`} className="w-1.5 h-1.5 sm:w-full sm:h-auto rounded-full sm:rounded sm:px-1.5 sm:py-0.5 bg-red-100 sm:truncate">
                   <span className="hidden sm:inline text-[10px] text-red-600 font-medium truncate">{item.subject}</span>
                </div>
              ))}
              {dayEvents.checklist.slice(0, 3 - Math.min(3, dayEvents.academic.length)).map((item, idx) => (
                <div key={`chk-${idx}`} className="w-1.5 h-1.5 sm:w-full sm:h-auto rounded-full sm:rounded sm:px-1.5 sm:py-0.5 bg-gray-100 sm:truncate">
                   <span className="hidden sm:inline text-[10px] text-gray-600 font-medium truncate">{item.text}</span>
                </div>
              ))}
              {totalEvents > 3 && (
                <div className="w-1.5 h-1.5 sm:w-auto rounded-full sm:px-1 sm:py-0.5 bg-gray-100 flex items-center justify-center">
                  <span className="hidden sm:inline text-[10px] text-gray-500 font-medium">+{totalEvents - 3}</span>
                </div>
              )}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      )
      days = []
    }
    return <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">{rows}</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6">
      
      <header>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ปฏิทิน</h1>
        <p className="text-gray-500 text-lg mt-1">Calendar & Schedule</p>
      </header>

      {loading ? (
        <div className="h-[500px] w-full bg-gray-50 rounded-xl border border-gray-100 animate-pulse flex items-center justify-center">
           <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </div>
      )}

      {/* Selected Date Modal */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pb-20 md:pb-0">
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-200 shadow-xl relative animate-[fadeIn_0.2s_ease-out] max-h-[80vh] flex flex-col">
            
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {format(selectedDate, 'd MMMM yyyy', { locale: th })}
                </h2>
                <p className="text-sm text-gray-500">ตารางประจำวัน</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 md:p-5 overflow-y-auto space-y-6">
              
              {(() => {
                const dateStr = format(selectedDate, 'yyyy-MM-dd')
                const dayEvents = eventsMap[dateStr] || { academic: [], checklist: [] }
                const isEmpty = dayEvents.academic.length === 0 && dayEvents.checklist.length === 0
                
                if (isEmpty) {
                  return (
                    <div className="text-center py-10">
                      <div className="w-12 h-12 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CalendarDays size={24} />
                      </div>
                      <p className="text-gray-500 font-medium">ไม่มีรายการในวันนี้</p>
                    </div>
                  )
                }

                return (
                  <>
                    {dayEvents.academic.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <Clock size={16} className="text-gray-400" /> งานและการสอบ
                        </h3>
                        <div className="space-y-2">
                          {dayEvents.academic.map(item => (
                            <div key={item.id} className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0">
                                <AlertCircle size={16} />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{item.subject}</p>
                                <p className="text-sm text-gray-600">{item.topic} ({item.type})</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {dayEvents.checklist.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-gray-400" /> สิ่งที่ต้องทำ
                        </h3>
                        <div className="space-y-2">
                          {dayEvents.checklist.map(item => (
                            <div key={item.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex gap-3 opacity-90">
                              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={16} />
                              </div>
                              <div className="flex-1 flex items-center">
                                <p className={`font-medium text-gray-700 ${item.checked ? 'line-through opacity-60' : ''}`}>{item.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
              
            </div>
            
          </div>
        </div>
      )}

    </div>
  )
}
