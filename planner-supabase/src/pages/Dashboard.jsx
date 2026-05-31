import { useState, useEffect } from 'react'
import { Check, Calendar as CalendarIcon, CheckCircle2, Clock, AlertCircle, Wallet, ArrowDownRight, ArrowUpRight, BookOpen } from 'lucide-react'
import { supabase } from '../supabase/supabaseClient'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'

const PIE_COLORS = ['#818CF8', '#A78BFA', '#F472B6', '#38BDF8', '#4ADE80', '#FBBF24']

export default function Dashboard() {
  const [schedule, setSchedule] = useState([])
  const [tasks, setTasks] = useState([])
  const [habits, setHabits] = useState([])
  const [finance, setFinance] = useState({ balance: 0, income: 0, expense: 0 })
  const [expenseByCategory, setExpenseByCategory] = useState([])
  const [incomeVsExpense, setIncomeVsExpense] = useState([])
  const [todayClasses, setTodayClasses] = useState([])
  const [upcomingAcademic, setUpcomingAcademic] = useState([])
  
  const [greeting, setGreeting] = useState('สวัสดี')
  const [currentDate, setCurrentDate] = useState('')
  const [loading, setLoading] = useState(true)

  const todayDateStr = new Date().toISOString().split('T')[0]

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 1. Fetch all items and filter in JS to avoid Postgres LIKE operator errors on timestamps
      const { data: allScheduleData, error: err1 } = await supabase.from('academic_items').select('*').neq('status', 'เสร็จแล้ว')
      if (err1) console.error('Schedule fetch error:', err1)
      const scheduleData = (allScheduleData || []).filter(item => item.deadline && item.deadline.startsWith(todayDateStr))
      
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
      const nextWeekStr = sevenDaysFromNow.toISOString().split('T')[0]
      const upcomingData = (allScheduleData || []).filter(item => item.deadline && item.deadline > todayDateStr && item.deadline <= nextWeekStr)
      setUpcomingAcademic(upcomingData.sort((a,b) => a.deadline.localeCompare(b.deadline)))

      // 2. Fetch all checklist items and filter
      const { data: allTasksData, error: err2 } = await supabase.from('checklist_items').select('*')
      if (err2) console.error('Tasks fetch error:', err2)
      const tasksData = (allTasksData || []).filter(item => item.due_date && item.due_date.startsWith(todayDateStr))

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

      const expensesByCategoryMap = {}
      const monthlyData = {}

      ;(transactionsData || []).forEach(t => {
        if (t.type === 'Income') balance += t.amount
        else balance -= t.amount

        if (t.date && t.date.startsWith(currentMonth)) {
          if (t.type === 'Income') income += t.amount
          else {
            expense += t.amount
            expensesByCategoryMap[t.category] = (expensesByCategoryMap[t.category] || 0) + t.amount
          }
        }

        if (t.date) {
          const month = t.date.substring(0, 7)
          if (!monthlyData[month]) monthlyData[month] = { name: month, Income: 0, Expense: 0 }
          if (t.type === 'Income') monthlyData[month].Income += t.amount
          else monthlyData[month].Expense += t.amount
        }
      })
      
      setFinance({ balance, income, expense })
      setExpenseByCategory(Object.keys(expensesByCategoryMap).map(key => ({
        name: key,
        value: expensesByCategoryMap[key]
      })))
      setIncomeVsExpense(Object.values(monthlyData).sort((a, b) => a.name.localeCompare(b.name)).slice(-6))

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

      // 5. Fetch timetable for today's classes
      try {
        const { data: ttData } = await supabase
          .from('timetables')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)

        if (ttData && ttData.length > 0) {
          const tt = ttData[0]
          const jsDay = new Date().getDay() // 0=Sun, 1=Mon, ..., 6=Sat
          const dayIdx = (jsDay === 0 || jsDay === 6) ? -1 : jsDay - 1

          if (dayIdx >= 0 && tt.config && tt.cells) {
            const cfg = tt.config
            const startParts = cfg.tStart.split(':').map(Number)
            let currentMin = startParts[0] * 60 + startParts[1]
            const nowDate = new Date()
            const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes()
            const classes = []

            for (let i = 0; i < cfg.periods; i++) {
              const startH = Math.floor(currentMin / 60)
              const startM = currentMin % 60
              const endTotalMin = currentMin + cfg.pMin
              const endH = Math.floor(endTotalMin / 60)
              const endM = endTotalMin % 60

              const cellKey = `${dayIdx}_${i}`
              const cell = tt.cells[cellKey]
              const timeStart = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`
              const timeEnd = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
              const isNow = nowMin >= currentMin && nowMin < endTotalMin

              if (cell && cell.subject) {
                const subj = (tt.subjects || []).find(s => s.name === cell.subject)
                classes.push({
                  period: i + 1,
                  time: `${timeStart} - ${timeEnd}`,
                  subject: cell.subject,
                  teacher: cell.teacher || '',
                  room: cell.room || '',
                  note: cell.note || '',
                  color: subj?.color || '#6366f1',
                  isNow,
                })
              }
              currentMin = endTotalMin + cfg.bMin
            }
            setTodayClasses(classes)
          } else {
            setTodayClasses([])
          }
        }
      } catch (ttErr) {
        console.error('Timetable fetch error:', ttErr)
      }
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
  const isAllClear = schedule.length === 0 && tasks.length === 0 && habits.length === 0 && todayClasses.length === 0

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

          {/* Analytics Charts Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">รายจ่ายตามหมวดหมู่ (เดือนนี้)</h2>
              <div className="h-64">
                {expenseByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {expenseByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#374151', fontSize: '14px' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500">ไม่มีข้อมูลรายจ่าย</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">รายรับ - รายจ่าย (6 เดือนล่าสุด)</h2>
              <div className="h-64">
                {incomeVsExpense.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeVsExpense} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                      <RechartsTooltip
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="Income" name="รายรับ" fill="#818CF8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="Expense" name="รายจ่าย" fill="#FCA5A5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500">ไม่มีข้อมูล</div>
                )}
              </div>
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
              
              {/* Today's Classes Section */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                    ตารางเรียนวันนี้
                  </h2>
                  {todayClasses.length > 0 && (
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      {todayClasses.length} คาบ
                    </span>
                  )}
                </div>

                {new Date().getDay() === 0 || new Date().getDay() === 6 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                    <p className="text-gray-400 text-sm">🎉 วันหยุด — ไม่มีคาบเรียน</p>
                  </div>
                ) : todayClasses.length > 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="divide-y divide-gray-100">
                      {todayClasses.map((cls) => (
                        <div
                          key={cls.period}
                          className={`flex items-start p-3 sm:p-4 transition-colors ${
                            cls.isNow
                              ? 'bg-indigo-50/70 border-l-4 border-l-indigo-500'
                              : 'hover:bg-gray-50 border-l-4'
                          }`}
                          style={!cls.isNow ? { borderLeftColor: cls.color } : undefined}
                        >
                          <div className="w-20 shrink-0 text-sm font-medium text-gray-500 pt-0.5">
                            {cls.time.split(' - ')[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 truncate">{cls.subject}</p>
                              {cls.isNow && (
                                <span className="shrink-0 text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded animate-pulse">
                                  ▶ NOW
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                              {cls.teacher && <span>👨‍🏫 {cls.teacher}</span>}
                              {cls.room && <span>🚪 {cls.room}</span>}
                            </div>
                            {cls.note && (
                              <p className="text-xs text-amber-500 mt-0.5 truncate">📝 {cls.note}</p>
                            )}
                          </div>
                          <div className="shrink-0 ml-3">
                            <div
                              className="w-2.5 h-2.5 rounded-full mt-1.5"
                              style={{ backgroundColor: cls.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">ยังไม่มีตารางเรียน</p>
                )}
              </section>
              
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

          {/* Upcoming Academic Items */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                งาน/สอบที่กำลังจะมาถึง (7 วัน)
              </h2>
              {upcomingAcademic.length > 0 && (
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                  {upcomingAcademic.length} รายการ
                </span>
              )}
            </div>
            
            {upcomingAcademic.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-100">
                  {upcomingAcademic.map((item) => {
                    const dateObj = new Date(item.deadline)
                    const dateStr = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
                    return (
                      <div key={item.id} className="flex p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                        <div className="w-16 shrink-0 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg flex items-center justify-center p-2 mr-3">
                          {dateStr}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-medium text-sm truncate">{item.subject} - {item.topic}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {item.type}
                            </span>
                            {item.priority === 'สูง' && (
                              <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                ด่วน
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
                <p className="text-gray-400 text-sm">ไม่มีงานหรือสอบใน 7 วันข้างหน้า</p>
              </div>
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
