import { useState, useMemo, useEffect } from 'react'
import { X, Trash2, Save, StickyNote, Clock, MapPin, User, ExternalLink, Timer, Link, CheckCircle, Circle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase/supabaseClient'

const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์']
const DAYS_SHORT = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.']

export default function TimetableDailyView({
  config,
  cells,
  subjects,
  academicItems = [],
  onCellChange,
  onCellDelete,
}) {
  const navigate = useNavigate()

  // Default to today (Mon=0..Fri=4), fallback to Monday for weekends
  const todayIdx = useMemo(() => {
    const jsDay = new Date().getDay()
    if (jsDay === 0 || jsDay === 6) return 0
    return jsDay - 1
  }, [])

  const [selectedDay, setSelectedDay] = useState(todayIdx)
  const [editPeriod, setEditPeriod] = useState(null)
  const [form, setForm] = useState({ subject: '', teacher: '', room: '', note: '', url: '' })
  const [attendances, setAttendances] = useState({}) // { periodIdx: 'present' }

  // Calculate actual Date for the selected day in current week
  const selectedDate = useMemo(() => {
    const now = new Date()
    const currentJsDay = now.getDay()
    const diff = selectedDay - (currentJsDay === 0 ? 6 : currentJsDay - 1)
    const targetDate = new Date(now)
    targetDate.setDate(now.getDate() + diff)
    return targetDate.toISOString().split('T')[0]
  }, [selectedDay])

  // Fetch attendance for selectedDate
  useEffect(() => {
    let isMounted = true
    const fetchAttendance = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data } = await supabase
        .from('attendance_logs')
        .select('period_idx, status')
        .eq('user_id', userData.user.id)
        .eq('date', selectedDate)

      if (isMounted && data) {
        const attMap = {}
        data.forEach(d => {
          attMap[d.period_idx] = d.status
        })
        setAttendances(attMap)
      }
    }
    fetchAttendance()
    return () => { isMounted = false }
  }, [selectedDate])

  const toggleAttendance = async (e, periodIdx, subject) => {
    e.stopPropagation()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const currentStatus = attendances[periodIdx]
    const newStatus = currentStatus === 'present' ? null : 'present'

    if (newStatus) {
      setAttendances(prev => ({ ...prev, [periodIdx]: newStatus }))
      // Upsert
      await supabase.from('attendance_logs').upsert({
        user_id: userData.user.id,
        date: selectedDate,
        day_idx: selectedDay,
        period_idx: periodIdx,
        subject: subject,
        status: newStatus
      }, { onConflict: 'user_id, date, period_idx' })
    } else {
      setAttendances(prev => {
        const next = { ...prev }
        delete next[periodIdx]
        return next
      })
      // Delete
      await supabase.from('attendance_logs')
        .delete()
        .eq('user_id', userData.user.id)
        .eq('date', selectedDate)
        .eq('period_idx', periodIdx)
    }
  }

  // Calculate time slots
  const timeSlots = useMemo(() => {
    if (!config) return []
    const slots = []
    const startParts = config.tStart.split(':').map(Number)
    let currentMin = startParts[0] * 60 + startParts[1]

    for (let i = 0; i < config.periods; i++) {
      const startH = Math.floor(currentMin / 60)
      const startM = currentMin % 60
      const endMin = currentMin + config.pMin
      const endH = Math.floor(endMin / 60)
      const endM = endMin % 60

      slots.push({
        period: i,
        startMin: currentMin,
        endMin,
        start: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
        end: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
      })
      currentMin = endMin + config.bMin
    }
    return slots
  }, [config])

  // Current period check
  const currentPeriodIdx = useMemo(() => {
    const jsDay = new Date().getDay()
    if (jsDay === 0 || jsDay === 6 || jsDay - 1 !== selectedDay) return -1
    const now = new Date()
    const nowMin = now.getHours() * 60 + now.getMinutes()
    for (const slot of timeSlots) {
      if (nowMin >= slot.startMin && nowMin < slot.endMin) return slot.period
    }
    return -1
  }, [selectedDay, timeSlots])

  const getSubjectColor = (subjectName) => {
    const subj = subjects.find((s) => s.name === subjectName)
    return subj ? subj.color : '#6366f1'
  }

  const getRelatedAcademicItems = (subjectName) => {
    return academicItems.filter(
      (item) => item.subject === subjectName && item.status !== 'เสร็จแล้ว'
    )
  }

  const handleOpenEdit = (periodIdx) => {
    const existing = cells[`${selectedDay}_${periodIdx}`]
    setEditPeriod(periodIdx)
    setForm({
      subject: existing?.subject || '',
      teacher: existing?.teacher || '',
      room: existing?.room || '',
      note: existing?.note || '',
      url: existing?.url || '',
    })
  }

  const handleSaveCell = () => {
    if (editPeriod === null) return
    if (form.subject) {
      onCellChange(selectedDay, editPeriod, form)
    }
    setEditPeriod(null)
  }

  const handleDeleteCell = () => {
    if (editPeriod === null) return
    onCellDelete(selectedDay, editPeriod)
    setEditPeriod(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveCell()
    }
    if (e.key === 'Escape') setEditPeriod(null)
  }

  if (!config) return null

  return (
    <div className="space-y-4">
      {/* Day Selector */}
      <div className="flex gap-1.5 bg-white rounded-xl border border-gray-200 p-1.5">
        {DAYS.map((day, i) => {
          const isToday = (() => {
            const jsDay = new Date().getDay()
            return jsDay >= 1 && jsDay <= 5 && jsDay - 1 === i
          })()
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(i)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all relative ${
                selectedDay === i
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : isToday
                  ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{DAYS_SHORT[i]}</span>
              {isToday && selectedDay !== i && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {timeSlots.map((slot) => {
          const cellKey = `${selectedDay}_${slot.period}`
          const cell = cells[cellKey]
          const isNow = slot.period === currentPeriodIdx
          const isEditing = editPeriod === slot.period
          const relatedItems = cell?.subject ? getRelatedAcademicItems(cell.subject) : []

          return (
            <div key={slot.period} className="flex gap-3">
              {/* Time marker */}
              <div className="w-14 shrink-0 pt-3 text-right">
                <p className={`text-xs font-medium ${isNow ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {slot.start}
                </p>
                <p className="text-[10px] text-gray-300">{slot.end}</p>
              </div>

              {/* Timeline line + dot */}
              <div className="flex flex-col items-center shrink-0 pt-3">
                <div
                  className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                    isNow
                      ? 'bg-indigo-500 border-indigo-500 animate-pulse'
                      : cell
                      ? 'bg-white border-indigo-300'
                      : 'bg-white border-gray-200'
                  }`}
                />
                <div className="w-px flex-1 bg-gray-200 -mt-0.5" />
              </div>

              {/* Card */}
              <div className="flex-1 pb-2 min-w-0">
                {isEditing ? (
                  /* Edit form */
                  <div
                    className="bg-indigo-50 rounded-xl border border-indigo-200 p-3 space-y-2"
                    onKeyDown={handleKeyDown}
                  >
                    <select
                      value={form.subject}
                      onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                      autoFocus
                      className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="">เลือกวิชา</option>
                      {subjects.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={form.teacher}
                        onChange={(e) => setForm((p) => ({ ...p, teacher: e.target.value }))}
                        placeholder="ผู้สอน"
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <input
                        type="text"
                        value={form.room}
                        onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))}
                        placeholder="ห้อง"
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      value={form.note}
                      onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                      placeholder="หมายเหตุ"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input
                      type="url"
                      value={form.url}
                      onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                      placeholder="ลิงก์เรียนออนไลน์ (Zoom/Meet)"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={handleDeleteCell}
                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={14} /> ลบ
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditPeriod(null)}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          ยกเลิก
                        </button>
                        <button
                          onClick={handleSaveCell}
                          className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          บันทึก
                        </button>
                      </div>
                    </div>
                  </div>
                ) : cell ? (
                  /* Filled card */
                  <button
                    onClick={() => handleOpenEdit(slot.period)}
                    className={`w-full text-left rounded-xl border p-3 transition-all group ${
                      isNow
                        ? 'bg-indigo-50 border-indigo-300 shadow-sm ring-2 ring-indigo-200'
                        : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: getSubjectColor(cell.subject) }}
                          />
                          <h4 className="font-semibold text-gray-900 text-sm truncate">
                            {cell.subject}
                          </h4>
                          {isNow && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded animate-pulse shrink-0">
                              กำลังเรียน
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                          {cell.teacher && (
                            <span className="flex items-center gap-1">
                              <User size={11} /> {cell.teacher}
                            </span>
                          )}
                          {cell.room && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} /> {cell.room}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {slot.start}–{slot.end}
                          </span>
                        </div>
                        <button
                          onClick={(e) => toggleAttendance(e, slot.period, cell.subject)}
                          className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition-colors shrink-0 ${
                            attendances[slot.period] === 'present'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {attendances[slot.period] === 'present' ? <CheckCircle size={14} /> : <Circle size={14} />}
                          เช็คชื่อ
                        </button>
                      </div>
                        {cell.note && (
                          <p className="text-xs text-amber-500 mt-1 flex items-center gap-1 truncate">
                            <StickyNote size={10} className="shrink-0" /> {cell.note}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Related academic items */}
                    {relatedItems.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                        {relatedItems.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-1.5 text-[11px] text-gray-500"
                          >
                            <span className="text-xs">
                              {item.type === 'สอบ' ? '📝' : '📚'}
                            </span>
                            <span className="truncate">
                              {item.topic} ({item.type})
                            </span>
                            {item.priority === 'สูง' && (
                              <span className="text-[9px] text-red-500 bg-red-50 px-1 rounded shrink-0">
                                สำคัญ
                              </span>
                            )}
                          </div>
                        ))}
                        {relatedItems.length > 2 && (
                          <p className="text-[10px] text-gray-400">
                            +{relatedItems.length - 2} รายการ
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action buttons (visible on hover) */}
                    <div className="mt-2 pt-2 border-t border-gray-100 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {cell.url && (
                        <a
                          href={cell.url.startsWith('http') ? cell.url : `https://${cell.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                        >
                          <Link size={11} /> เข้าเรียน
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate('/pomodoro')
                        }}
                        className="text-[11px] text-orange-600 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                      >
                        <Timer size={11} /> Pomodoro
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate('/academic')
                        }}
                        className="text-[11px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                      >
                        <ExternalLink size={11} /> เพิ่มงาน
                      </button>
                    </div>
                  </button>
                ) : (
                  /* Empty slot */
                  <button
                    onClick={() => handleOpenEdit(slot.period)}
                    className="w-full text-left rounded-xl border border-dashed border-gray-200 p-3 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
                  >
                    <p className="text-xs text-gray-300 group-hover:text-indigo-400 transition-colors">
                      คาบ {slot.period + 1} — คลิกเพื่อเพิ่มวิชา
                    </p>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
