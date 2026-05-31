import { useState, useEffect } from 'react'
import { Check, Calendar as CalendarIcon, CheckCircle2, Clock, AlertCircle, Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { supabase } from '../supabase/supabaseClient'

export default function Dashboard() {
  const [schedule, setSchedule] = useState([])
  const [tasks, setTasks] = useState([])
  const [habits, setHabits] = useState([])
  const [finance, setFinance] = useState({ balance: 0, income: 0, expense: 0 })
  
  const [greeting, setGreeting] = useState('สวัสดี')
  const [currentDate, setCurrentDate] = useState('')
  const [loading, setLoading] = useState(true)

  const todayDateStr = new Date().toISOString().split('T')[0]

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 1. Fetch Schedule (academic_items due today)
      // Note: We use like for the date part if deadline includes timestamp
      const { data: scheduleData } = await supabase
        .from('academic_items')
        .select('*')
        .like('deadline', `${todayDateStr}%`)

      // 2. Fetch Urgent Tasks (checklist_items due today)
      const { data: tasksData } = await supabase
        .from('checklist_items')
        .select('*')
        .like('due_date', `${todayDateStr}%`)

      // 3. Fetch Habits and today's logs
      const { data: habitsData } = await supabase.from('habits').select('*')
      const { data: logsData } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('log_date', todayDateStr)

      // 4. Fetch Transactions for Financial Overview
      const { data: transactionsData } = await supabase.from('transactions').select('*')
      const currentMonth = todayDateStr.substring(0, 7) // YYYY-MM
      
      let balance = 0
      let income = 0
      let expense = 0

      ;(transactionsData || []).forEach(t => {
        if (t.type === 'Income') balance += t.amount
        else balance -= t.amount

        if (t.date && t.date.startsWith(currentMonth)) {
          if (t.type === 'Income') income += t.amount
          else expense += t.amount
        }
      })
      setFinance({ balance, income, expense })

      // Format Schedule
      const formattedSchedule = (scheduleData || []).map(item => {
        let timeStr = 'All Day'
        if (item.deadline && item.deadline.includes('T')) {
          const d = new Date(item.deadline)
          timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        return {
          id: item.id,
          time: timeStr,
          title: `${item.subject || 'วิชา'} - ${item.topic || 'ไม่มีหัวข้อ'}`,
          type: item.type
        }
      })

      // Format Tasks
      const formattedTasks = (tasksData || []).map(item => ({
        id: item.id,
        title: item.text,
        urgent: true,
        completed: item.checked
      }))

      // Format Habits
      const loggedHabitIds = new Set((logsData || []).map(log => log.habit_id))
      const formattedHabits = (habitsData || []).map(habit => ({
        id: habit.id,
        title: habit.title || habit.name, // handle dynamic column naming
        completed: loggedHabitIds.has(habit.id)
      }))

      setSchedule(formattedSchedule)
      setTasks(formattedTasks)
      setHabits(formattedHabits)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Set greeting based on time
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('อรุณสวัสดิ์')
    else if (hour < 18) setGreeting('สวัสดีตอนบ่าย')
    else setGreeting('สวัสดีตอนเย็น')

    // Set formatted Thai date
    const options = { weekday: 'long', day: 'numeric', month: 'long' }
    const formattedDate = new Date().toLocaleDateString('th-TH', options)
    setCurrentDate(formattedDate)

    fetchData()
  }, [])

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    // Optimistic UI update
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
    
    try {
      await supabase
        .from('checklist_items')
        .update({ checked: !task.completed })
        .eq('id', id)
    } catch (err) {
      console.error('Error toggling task:', err)
      // Revert on error
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: task.completed } : t))
    }
  }

  const toggleHabit = async (id) => {
    const habit = habits.find(h => h.id === id)
    if (!habit) return
    
    const isNowCompleted = !habit.completed
    // Optimistic UI update
    setHabits(habits.map(h => h.id === id ? { ...h, completed: isNowCompleted } : h))
    
    try {
      if (isNowCompleted) {
        await supabase.from('habit_logs').insert([{ habit_id: id, log_date: todayDateStr }])
      } else {
        await supabase.from('habit_logs').delete().match({ habit_id: id, log_date: todayDateStr })
      }
    } catch (err) {
      console.error('Error toggling habit:', err)
      // Revert on error
      setHabits(habits.map(h => h.id === id ? { ...h, completed: !isNowCompleted } : h))
    }
  }

  // Calculate completion
  const allTasksCompleted = tasks.length > 0 && tasks.every(t => t.completed)
  const allHabitsCompleted = habits.length > 0 && habits.every(h => h.completed)
  const isAllClear = schedule.length === 0 && tasks.length === 0 && habits.length === 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
      
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{greeting}</h1>
        <p className="text-gray-500 text-lg flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-500" />
          {currentDate}
        </p>
      </header>

      {loading ? (
        // Soft Skeleton Loader
        <div className="space-y-6">
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* Financial Overview Section */}
          <section className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
                <Wallet size={16} />
                <span className="text-xs sm:text-sm font-medium">ยอดคงเหลือ</span>
              </div>
              <p className={`text-lg sm:text-xl md:text-2xl font-bold tracking-tight ${finance.balance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                ฿{finance.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
              <div className="flex items-center gap-1.5 text-green-600 mb-1.5">
                <ArrowDownRight size={16} />
                <span className="text-xs sm:text-sm font-medium">รายรับเดือนนี้</span>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-gray-900">
                ฿{finance.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
              <div className="flex items-center gap-1.5 text-red-500 mb-1.5">
                <ArrowUpRight size={16} />
                <span className="text-xs sm:text-sm font-medium">รายจ่ายเดือนนี้</span>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-gray-900">
                ฿{finance.expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </section>

          {isAllClear ? (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-1">วันนี้ว่างเปล่า</h3>
              <p className="text-gray-500">คุณไม่มีตารางงานหรือสิ่งที่ต้องทำในวันนี้ พักผ่อนให้เต็มที่!</p>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8">
              
              {/* Schedule Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                ตารางเวลา
              </h2>
            </div>
            
            {schedule.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-100">
                  {schedule.map((item) => (
                    <div key={item.id} className="flex p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                      <div className="w-20 shrink-0 text-sm font-medium text-gray-500 pt-0.5">
                        {item.time}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{item.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">ไม่มีตารางในวันนี้</p>
            )}
          </section>

          {/* Urgent Tasks Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-gray-400" />
                สิ่งที่ต้องทำ
              </h2>
              {allTasksCompleted && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">เสร็จสิ้นแล้ว</span>
              )}
            </div>

            <div className="space-y-1.5">
              {tasks.length > 0 ? tasks.map((task) => (
                <label 
                  key={task.id}
                  onClick={(e) => {
                    // Prevent default to handle custom optimistic toggle
                    e.preventDefault()
                    toggleTask(task.id)
                  }}
                  className={`flex items-start gap-3 p-3 sm:p-4 bg-white rounded-xl border transition-all cursor-pointer select-none
                    ${task.completed ? 'border-gray-100 opacity-60 bg-gray-50' : 'border-gray-200 hover:border-indigo-300 shadow-sm'}
                  `}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors
                    ${task.completed ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 bg-white'}
                  `}>
                    {task.completed && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium transition-colors ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {task.title}
                    </p>
                    {task.urgent && !task.completed && (
                      <span className="inline-flex mt-1 text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">ด่วน</span>
                    )}
                  </div>
                </label>
              )) : (
                <p className="text-gray-500 text-sm">ไม่มีสิ่งที่ต้องทำในวันนี้</p>
              )}
            </div>
          </section>

          {/* Daily Habits Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-gray-400" />
                นิสัยประจำวัน
              </h2>
              {allHabitsCompleted && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">ทำครบแล้ว</span>
              )}
            </div>

            <div className="space-y-1.5">
              {habits.length > 0 ? habits.map((habit) => (
                <label 
                  key={habit.id}
                  onClick={(e) => {
                    e.preventDefault()
                    toggleHabit(habit.id)
                  }}
                  className={`flex items-center gap-3 p-3 sm:p-4 bg-white rounded-xl border transition-all cursor-pointer select-none
                    ${habit.completed ? 'border-gray-100 opacity-60 bg-gray-50' : 'border-gray-200 hover:border-indigo-300 shadow-sm'}
                  `}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors
                    ${habit.completed ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 bg-white'}
                  `}>
                    {habit.completed && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <p className={`font-medium transition-colors ${habit.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {habit.title}
                  </p>
                </label>
              )) : (
                <p className="text-gray-500 text-sm">ยังไม่ได้ตั้งค่านิสัยประจำวัน</p>
              )}
            </div>
          </section>

            </div>
          )}
        </>
      )}
    </div>
  )
}
