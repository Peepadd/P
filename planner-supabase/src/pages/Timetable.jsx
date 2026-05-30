import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabase/supabaseClient'
import { Settings2, Palette, RefreshCw } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import TimetableSelect from '../components/timetable/TimetableSelect'
import TimetableConfig from '../components/timetable/TimetableConfig'
import TimetableGrid from '../components/timetable/TimetableGrid'
import TimetableExport from '../components/timetable/TimetableExport'
import SubjectPalette from '../components/timetable/SubjectPalette'

const DEFAULT_CONFIG = { periods: 6, tStart: '08:00', pMin: 50, bMin: 10 }

export default function Timetable() {
  const [timetables, setTimetables] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showConfig, setShowConfig] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [message, setMessage] = useState(null)
  const gridRef = useRef(null)

  const activeTimetable = timetables.find((t) => t.id === activeId)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('timetables')
        .select('*')
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError
      setTimetables(data || [])
    } catch (err) {
      console.error('Error loading timetables:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // On first load, set active timetable
  useEffect(() => {
    loadData()
  }, [loadData])

  // When timetables change, ensure activeId is still valid
  useEffect(() => {
    if (timetables.length > 0) {
      if (!activeId || !timetables.find((t) => t.id === activeId)) {
        setActiveId(timetables[0].id)
      }
    } else {
      setActiveId(null)
    }
  }, [timetables])

  const showMessage = (type, text, duration = 3000) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), duration)
  }

  const handleCreate = async (name) => {
    try {
      const newTimetable = {
        id: uuidv4(),
        name,
        config: DEFAULT_CONFIG,
        cells: {},
        subjects: [],
        updated_at: new Date().toISOString(),
      }

      const { error: insertError } = await supabase
        .from('timetables')
        .insert(newTimetable)

      if (insertError) throw insertError

      setTimetables((prev) => [...prev, newTimetable])
      setActiveId(newTimetable.id)
      showMessage('success', 'สร้างตารางเรียนใหม่เรียบร้อย')
    } catch (err) {
      console.error('Create error:', err)
      showMessage('error', err.message)
    }
  }

  const handleRename = async (id, name) => {
    try {
      const { error: updateError } = await supabase
        .from('timetables')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) throw updateError

      setTimetables((prev) =>
        prev.map((t) => (t.id === id ? { ...t, name } : t))
      )
      showMessage('success', 'เปลี่ยนชื่อเรียบร้อย')
    } catch (err) {
      console.error('Rename error:', err)
      showMessage('error', err.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('timetables')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      if (activeId === id) {
        const remaining = timetables.filter((t) => t.id !== id)
        setActiveId(remaining.length > 0 ? remaining[0].id : null)
      }
      setTimetables((prev) => prev.filter((t) => t.id !== id))
      showMessage('success', 'ลบตารางเรียนเรียบร้อย')
    } catch (err) {
      console.error('Delete error:', err)
      showMessage('error', err.message)
    }
  }

  const handleConfigChange = async (config) => {
    if (!activeTimetable) return

    try {
      const updated = {
        config,
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('timetables')
        .update(updated)
        .eq('id', activeTimetable.id)

      if (updateError) throw updateError

      setTimetables((prev) =>
        prev.map((t) => (t.id === activeTimetable.id ? { ...t, ...updated } : t))
      )
      setShowConfig(false)
      showMessage('success', 'บันทึกการตั้งค่าเรียบร้อย')
    } catch (err) {
      console.error('Config update error:', err)
      showMessage('error', err.message)
    }
  }

  const handleCellChange = async (dayIdx, periodIdx, data) => {
    if (!activeTimetable) return

    const cellKey = `${dayIdx}_${periodIdx}`
    const newCells = {
      ...activeTimetable.cells,
      [cellKey]: {
        subject: data.subject,
        teacher: data.teacher || '',
        room: data.room || '',
        note: data.note || '',
      },
    }

    try {
      const { error: updateError } = await supabase
        .from('timetables')
        .update({ cells: newCells, updated_at: new Date().toISOString() })
        .eq('id', activeTimetable.id)

      if (updateError) throw updateError

      setTimetables((prev) =>
        prev.map((t) => (t.id === activeTimetable.id ? { ...t, cells: newCells } : t))
      )
    } catch (err) {
      console.error('Cell update error:', err)
      showMessage('error', err.message)
    }
  }

  const handleCellDelete = async (dayIdx, periodIdx) => {
    if (!activeTimetable) return

    const cellKey = `${dayIdx}_${periodIdx}`
    const newCells = { ...activeTimetable.cells }
    delete newCells[cellKey]

    try {
      const { error: updateError } = await supabase
        .from('timetables')
        .update({ cells: newCells, updated_at: new Date().toISOString() })
        .eq('id', activeTimetable.id)

      if (updateError) throw updateError

      setTimetables((prev) =>
        prev.map((t) => (t.id === activeTimetable.id ? { ...t, cells: newCells } : t))
      )
    } catch (err) {
      console.error('Cell delete error:', err)
      showMessage('error', err.message)
    }
  }

  const handleSubjectsChange = async (subjects) => {
    if (!activeTimetable) return

    try {
      const { error: updateError } = await supabase
        .from('timetables')
        .update({ subjects, updated_at: new Date().toISOString() })
        .eq('id', activeTimetable.id)

      if (updateError) throw updateError

      setTimetables((prev) =>
        prev.map((t) => (t.id === activeTimetable.id ? { ...t, subjects } : t))
      )
    } catch (err) {
      console.error('Subjects update error:', err)
      showMessage('error', err.message)
    }
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🗓️ ตารางเรียน</h1>
          <p className="text-sm text-gray-500 mt-1">สร้างและจัดการตารางเรียนหลายชุด</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTimetable && (
            <>
              <button
                onClick={() => setShowConfig(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings2 size={16} />
                <span className="hidden sm:inline">ตั้งค่า</span>
              </button>
              <button
                onClick={() => setShowPalette(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Palette size={16} />
                <span className="hidden sm:inline">วิชาและสี</span>
              </button>
              <TimetableExport gridRef={gridRef} name={activeTimetable.name} />
            </>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}
        >
          {message.type === 'success' && '✅ '}
          {message.type === 'error' && '❌ '}
          {message.type === 'info' && 'ℹ️ '}
          {message.text}
        </div>
      )}

      {/* Select toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <TimetableSelect
          timetables={timetables}
          activeId={activeId}
          onSelect={setActiveId}
          onCreate={handleCreate}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-gray-400 font-medium">เกิดข้อผิดพลาด</p>
          <p className="text-gray-300 text-sm mt-1">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            ลองอีกครั้ง
          </button>
        </div>
      ) : !activeTimetable ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-indigo-50 flex items-center justify-center">
            <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">ยังไม่มีตารางเรียน</p>
          <p className="text-gray-400 text-sm mt-1">คลิก "สร้างใหม่" เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div ref={gridRef}>
          <TimetableGrid
            config={activeTimetable.config}
            cells={activeTimetable.cells || {}}
            subjects={activeTimetable.subjects || []}
            onCellChange={handleCellChange}
            onCellDelete={handleCellDelete}
          />
        </div>
      )}

      {/* Config Modal */}
      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowConfig(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xl mx-4 p-6">
            <TimetableConfig
              config={activeTimetable?.config || DEFAULT_CONFIG}
              onChange={handleConfigChange}
              onClose={() => setShowConfig(false)}
            />
          </div>
        </div>
      )}

      {/* Subject Palette Modal */}
      {showPalette && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowPalette(false)} />
          <div className="relative w-full max-w-md mx-4">
            <SubjectPalette
              subjects={activeTimetable?.subjects || []}
              onChange={handleSubjectsChange}
              onClose={() => setShowPalette(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
