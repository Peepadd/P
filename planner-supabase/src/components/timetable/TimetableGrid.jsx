import { useState, useMemo, useRef, useEffect } from 'react'
import { X, Trash2, Save, StickyNote, AlertTriangle, Link } from 'lucide-react'

const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์']

export default function TimetableGrid({ config, cells, subjects, onCellChange, onCellDelete, onConflictWarning, academicItems = [] }) {
  const [editCell, setEditCell] = useState(null)
  const [form, setForm] = useState({ subject: '', teacher: '', room: '', note: '', url: '' })
  const gridRef = useRef(null)

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
        label: `${String(i + 1)}`,
        start: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
        end: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
      })

      currentMin = endMin + config.bMin
    }
    return slots
  }, [config])

  // Today highlight: compute current day index (0=Mon..4=Fri, -1 for weekends)
  const todayDayIdx = useMemo(() => {
    const jsDay = new Date().getDay() // 0=Sun, 1=Mon, ..., 6=Sat
    if (jsDay === 0 || jsDay === 6) return -1
    return jsDay - 1 // 0=Mon, 1=Tue, ..., 4=Fri
  }, [])

  // Current period index (which period is happening right now)
  const currentPeriodIdx = useMemo(() => {
    if (todayDayIdx < 0 || timeSlots.length === 0) return -1
    const now = new Date()
    const nowMin = now.getHours() * 60 + now.getMinutes()
    for (const slot of timeSlots) {
      const [sh, sm] = slot.start.split(':').map(Number)
      const [eh, em] = slot.end.split(':').map(Number)
      const startMin = sh * 60 + sm
      const endMin = eh * 60 + em
      if (nowMin >= startMin && nowMin < endMin) return slot.period
    }
    return -1
  }, [todayDayIdx, timeSlots])

  const getCell = (dayIdx, periodIdx) => {
    return cells[`${dayIdx}_${periodIdx}`] || null
  }

  const getSubjectColor = (subjectName) => {
    const subj = subjects.find((s) => s.name === subjectName)
    return subj ? subj.color : '#e5e7eb'
  }

  const handleOpenEdit = (dayIdx, periodIdx) => {
    const existing = cells[`${dayIdx}_${periodIdx}`]
    setEditCell({ dayIdx, periodIdx })
    setForm({
      subject: existing?.subject || '',
      teacher: existing?.teacher || '',
      room: existing?.room || '',
      note: existing?.note || '',
      url: existing?.url || '',
    })
  }

  const handleSaveCell = () => {
    if (!editCell) return
    if (form.subject) {
      // Conflict detection: check if the same cell already has a different subject
      const cellKey = `${editCell.dayIdx}_${editCell.periodIdx}`
      const existing = cells[cellKey]
      if (existing && existing.subject && existing.subject !== form.subject) {
        if (!confirm(`⚠️ คาบนี้มีวิชา "${existing.subject}" อยู่แล้ว\nต้องการเปลี่ยนเป็น "${form.subject}" หรือไม่?`)) {
          return
        }
      }

      // Check for duplicate subject in same day (warning only)
      const sameSubjectCount = Object.entries(cells).filter(([key, cell]) => {
        const [d] = key.split('_').map(Number)
        return d === editCell.dayIdx && cell.subject === form.subject && key !== cellKey
      }).length
      if (sameSubjectCount >= 2 && onConflictWarning) {
        onConflictWarning(`วิชา "${form.subject}" ซ้ำ ${sameSubjectCount + 1} คาบในวัน${DAYS[editCell.dayIdx]}`)
      }

      onCellChange(editCell.dayIdx, editCell.periodIdx, form)
    }
    setEditCell(null)
  }

  const handleDeleteCell = () => {
    if (!editCell) return
    onCellDelete(editCell.dayIdx, editCell.periodIdx)
    setEditCell(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveCell()
    }
    if (e.key === 'Escape') {
      setEditCell(null)
    }
  }

  // Compute span matrix for Dynamic Slot Merging
  const spanMatrix = useMemo(() => {
    const matrix = {}
    if (!config || !timeSlots.length) return matrix

    for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
      for (let periodIdx = 0; periodIdx < timeSlots.length; periodIdx++) {
        const key = `${dayIdx}_${periodIdx}`
        if (matrix[key] && matrix[key].skip) continue // Already part of a merged block

        const currentCell = cells[key]
        if (!currentCell || !currentCell.subject) {
          matrix[key] = { span: 1, skip: false }
          continue
        }

        let span = 1
        for (let nextP = periodIdx + 1; nextP < timeSlots.length; nextP++) {
          const nextKey = `${dayIdx}_${nextP}`
          const nextCell = cells[nextKey]
          if (
            nextCell &&
            nextCell.subject === currentCell.subject &&
            nextCell.teacher === currentCell.teacher &&
            nextCell.room === currentCell.room
          ) {
            span++
            matrix[nextKey] = { skip: true }
          } else {
            break
          }
        }
        matrix[key] = { span, skip: false }
      }
    }
    return matrix
  }, [config, timeSlots, cells])

  if (!config) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
          </svg>
        </div>
        <p className="text-gray-400 font-medium">ยังไม่ได้ตั้งค่าตารางเรียน</p>
        <p className="text-gray-300 text-sm mt-1">กดปุ่มตั้งค่าด้านบนเพื่อกำหนดจำนวนคาบ</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" ref={gridRef}>
      <style>{`
        @keyframes nowPulse {
          0%, 100% { box-shadow: inset 0 0 0 2px #6366f1; }
          50% { box-shadow: inset 0 0 0 2px #a5b4fc; }
        }
        .tt-now-cell { animation: nowPulse 2s ease-in-out infinite; border-radius: 6px; }
      `}</style>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          {/* Header: Days */}
          <thead>
            <tr>
              <th className="w-16 px-2 py-3 text-xs font-medium text-gray-400 text-center bg-gray-50 border-b border-r border-gray-200">
                #
              </th>
              <th className="w-12 px-2 py-3 text-xs font-medium text-gray-400 text-center bg-gray-50 border-b border-r border-gray-200">
                เวลา
              </th>
              {DAYS.map((day, i) => {
                const isToday = i === todayDayIdx
                return (
                  <th
                    key={day}
                    className={`px-2 py-3 text-xs font-semibold text-center border-b border-r border-gray-200 ${
                      isToday
                        ? 'text-indigo-700 bg-indigo-50'
                        : i === 4
                        ? 'text-red-500 bg-red-50/50'
                        : 'text-gray-700 bg-gray-50'
                    }`}
                  >
                    {day}
                    {isToday && (
                      <span className="ml-1 inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full align-middle" />
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot.period}>
                {/* Period number */}
                <td className="px-2 py-1 text-xs font-medium text-gray-400 text-center border-b border-r border-gray-100 bg-gray-50/50 align-top pt-3">
                  {slot.label}
                </td>
                {/* Time */}
                <td className="px-2 py-1 text-[10px] text-gray-400 text-center border-b border-r border-gray-100 bg-gray-50/50 align-top pt-3 whitespace-nowrap">
                  {slot.start}
                </td>
                {/* Day cells */}
                {DAYS.map((_, dayIdx) => {
                  const cellKey = `${dayIdx}_${slot.period}`
                  const spanInfo = spanMatrix[cellKey]
                  if (spanInfo?.skip) return null

                  const cell = getCell(dayIdx, slot.period)
                  const isEditing = editCell?.dayIdx === dayIdx && editCell?.periodIdx === slot.period
                  const isToday = dayIdx === todayDayIdx
                  const isNow = isToday && slot.period === currentPeriodIdx
                  const span = spanInfo?.span || 1

                  return (
                    <td
                      key={dayIdx}
                      rowSpan={span}
                      className={`relative border-b border-r border-gray-100 min-h-[60px] align-top transition-colors ${
                        isEditing
                          ? 'bg-indigo-50'
                          : isNow
                          ? 'bg-indigo-50/60'
                          : isToday
                          ? 'bg-indigo-50/20'
                          : cell
                          ? 'hover:bg-gray-50'
                          : 'hover:bg-indigo-50/30'
                      } ${isNow ? 'tt-now-cell' : ''}`}
                      style={{ height: `${60 * span}px` }}
                    >
                      {isNow && (
                        <span className="absolute top-0.5 right-0.5 text-[8px] font-bold text-indigo-500 bg-indigo-100 px-1 rounded z-10 leading-tight">
                          ▶ NOW
                        </span>
                      )}
                      {isEditing ? (
                        /* Inline edit form */
                        <div className="p-1.5 space-y-1" onKeyDown={handleKeyDown}>
                          <select
                            value={form.subject}
                            onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                            autoFocus
                            className="w-full px-1.5 py-1 text-[11px] border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                          >
                            <option value="">เลือกวิชา</option>
                            {subjects.map((s) => (
                              <option key={s.name} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={form.teacher}
                              onChange={(e) => setForm((p) => ({ ...p, teacher: e.target.value }))}
                              placeholder="ผู้สอน"
                              className="w-1/2 px-1.5 py-1 text-[10px] border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                            <input
                              type="text"
                              value={form.room}
                              onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))}
                              placeholder="ห้อง"
                              className="w-1/2 px-1.5 py-1 text-[10px] border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <input
                            type="text"
                            value={form.note}
                            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                            placeholder="หมายเหตุ"
                            className="w-full px-1.5 py-1 text-[10px] border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                          <input
                            type="url"
                            value={form.url}
                            onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                            placeholder="ลิงก์เรียนออนไลน์ (Zoom/Meet)"
                            className="w-full px-1.5 py-1 text-[10px] border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              onClick={handleSaveCell}
                              className="p-0.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="บันทึก"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={() => setEditCell(null)}
                              className="p-0.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                              title="ยกเลิก"
                            >
                              <X size={14} />
                            </button>
                            {cell && (
                              <button
                                onClick={handleDeleteCell}
                                className="p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-auto"
                                title="ลบ"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ) : cell ? (
                        /* Cell with content */
                        <button
                          onClick={() => handleOpenEdit(dayIdx, slot.period)}
                          className="w-full h-full p-1.5 text-left group hover:ring-1 hover:ring-indigo-300 rounded transition-all"
                        >
                          {/* Subject color bar */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
                            style={{ backgroundColor: getSubjectColor(cell.subject) }}
                          />
                          <div className="pl-2">
                            <p
                              className="text-xs font-semibold leading-tight truncate"
                              style={{ color: getSubjectColor(cell.subject) }}
                            >
                              {cell.subject}
                            </p>
                            {cell.teacher && (
                              <p className="text-[10px] text-gray-500 leading-tight truncate">
                                👨‍🏫 {cell.teacher}
                              </p>
                            )}
                            {cell.room && (
                              <p className="text-[10px] text-gray-400 leading-tight truncate">
                                🚪 {cell.room}
                              </p>
                            )}
                            {cell.note && (
                              <p className="text-[10px] text-amber-500 leading-tight truncate flex items-center gap-0.5">
                                <StickyNote size={8} className="shrink-0" />
                                {cell.note}
                              </p>
                            )}
                            {academicItems && academicItems.filter(item => item.subject === cell.subject && item.status !== 'เสร็จแล้ว').length > 0 && (
                              <p className="mt-0.5 text-[9px] font-medium text-white bg-indigo-500 px-1 py-0.5 rounded inline-block truncate max-w-full">
                                📝 {academicItems.filter(item => item.subject === cell.subject && item.status !== 'เสร็จแล้ว').length} งาน
                              </p>
                            )}
                            {cell.url && (
                              <a
                                href={cell.url.startsWith('http') ? cell.url : `https://${cell.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="mt-1 flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors truncate max-w-full"
                                title={cell.url}
                              >
                                <Link size={10} className="shrink-0" /> เข้าเรียน
                              </a>
                            )}
                          </div>
                        </button>
                      ) : (
                        /* Empty cell - click to add */
                        <button
                          onClick={() => handleOpenEdit(dayIdx, slot.period)}
                          className="w-full h-full p-1 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <span className="text-[10px] text-indigo-400 font-medium">+</span>
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inline edit modal for mobile — use a modal when screen is small */}
      {editCell && (
        <div className="sm:hidden fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditCell(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              {DAYS[editCell.dayIdx]} — คาบ {editCell.periodIdx + 1}
            </h4>
            <div className="space-y-2" onKeyDown={handleKeyDown}>
              <select
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                autoFocus
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">เลือกวิชา</option>
                {subjects.map((s) => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={form.teacher} onChange={(e) => setForm((p) => ({ ...p, teacher: e.target.value }))} placeholder="ผู้สอน" className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                <input type="text" value={form.room} onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))} placeholder="ห้อง" className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <input type="text" value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="หมายเหตุ" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              <div className="flex items-center justify-between pt-2">
                <button onClick={handleDeleteCell} className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={16} /> ลบ
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setEditCell(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">ยกเลิก</button>
                  <button onClick={handleSaveCell} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">บันทึก</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
