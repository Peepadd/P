import { useState } from 'react'
import { Plus, RefreshCw, Target } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import useHabitData from '../hooks/useHabitData'
import HabitForm from '../components/habits/HabitForm'
import HabitBoard from '../components/habits/HabitBoard'
import HabitStreakCards from '../components/habits/HabitStreakCards'

export default function Habits() {
  const {
    habits,
    habitLogs,
    currentMonth,
    loading,
    error,
    refetch,
    createHabit,
    deleteHabit,
    toggleLog,
    getStreaks,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
  } = useHabitData()

  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState(null)

  const showMsg = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleCreate = async (name, frequency, color) => {
    const result = await createHabit(name, frequency, color)
    if (result) {
      setShowForm(false)
      showMsg('success', `เพิ่มนิสัย "${name}" เรียบร้อย`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🎯 สร้างนิสัย</h2>
          <p className="text-gray-500 mt-1">ติดตามและสร้างนิสัยที่ดีไปด้วยกัน</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            showForm
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          <Plus size={16} />
          {showForm ? 'ยกเลิก' : 'เพิ่มนิสัยใหม่'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">ไม่สามารถโหลดข้อมูลได้</p>
              <p className="text-xs text-amber-600 mt-1">{error}</p>
              <button onClick={refetch} className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 rounded-lg transition-colors">
                <RefreshCw size={14} />ลองอีกครั้ง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <HabitForm onCreate={handleCreate} onClose={() => setShowForm(false)} />
        </div>
      )}

      {/* Two column layout: Board + Streaks */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Habit Board */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">กำลังโหลด...</p>
              </div>
            </div>
          ) : (
            <HabitBoard
              habits={habits}
              habitLogs={habitLogs}
              currentMonth={currentMonth}
              onPrevMonth={goToPrevMonth}
              onNextMonth={goToNextMonth}
              onToday={goToToday}
              onToggleLog={toggleLog}
            />
          )}
        </div>

        {/* Streak Cards */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-orange-500" />
            <h3 className="text-sm font-semibold text-gray-900">Streak 🔥</h3>
            <span className="text-xs text-gray-400 ml-auto">
              {format(currentMonth, 'MMMM', { locale: th })}
            </span>
          </div>
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <HabitStreakCards habits={habits} getStreaks={getStreaks} />
          )}
        </div>
      </div>
    </div>
  )
}
