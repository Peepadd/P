import { useState, useEffect } from 'react'
import { Check, Calendar as CalendarIcon, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

// Realistic Mock Data for "Today"
const MOCK_SCHEDULE = [
  { id: 1, time: '09:00', title: 'ประชุมทีมพัฒนาโปรเจกต์', type: 'work' },
  { id: 2, time: '11:30', title: 'ทานข้าวเที่ยงกับลูกค้า', type: 'social' },
  { id: 3, time: '14:00', title: 'สรุปรายรับรายจ่ายประจำสัปดาห์', type: 'finance' },
  { id: 4, time: '18:00', title: 'ออกกำลังกาย (วิ่ง 5km)', type: 'health' },
]

const MOCK_TASKS = [
  { id: 101, title: 'จ่ายค่าไฟเดือนตุลาคม', urgent: true, completed: false },
  { id: 102, title: 'ซื้อของเข้าบ้าน (นม, ไข่, ขนมปัง)', urgent: false, completed: false },
  { id: 103, title: 'โทรหาคุณแม่', urgent: false, completed: true },
]

const MOCK_HABITS = [
  { id: 201, title: 'ดื่มน้ำ 8 แก้ว', completed: false },
  { id: 202, title: 'อ่านหนังสือ 30 นาที', completed: false },
  { id: 203, title: 'นั่งสมาธิ 10 นาที', completed: true },
]

export default function Dashboard() {
  const [schedule] = useState(MOCK_SCHEDULE)
  const [tasks, setTasks] = useState(MOCK_TASKS)
  const [habits, setHabits] = useState(MOCK_HABITS)
  const [greeting, setGreeting] = useState('สวัสดี')
  const [currentDate, setCurrentDate] = useState('')

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
  }, [])

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const toggleHabit = (id) => {
    setHabits(habits.map(h => h.id === id ? { ...h, completed: !h.completed } : h))
  }

  // Calculate completion
  const allTasksCompleted = tasks.length > 0 && tasks.every(t => t.completed)
  const allHabitsCompleted = habits.length > 0 && habits.every(h => h.completed)
  const isAllClear = schedule.length === 0 && tasks.length === 0 && habits.length === 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
      
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{greeting}</h1>
        <p className="text-gray-500 text-lg flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-500" />
          {currentDate}
        </p>
      </header>

      {isAllClear ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-1">วันนี้ว่างเปล่า</h3>
          <p className="text-gray-500">คุณไม่มีตารางงานหรือสิ่งที่ต้องทำในวันนี้ พักผ่อนให้เต็มที่!</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Schedule Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                ตารางเวลา
              </h2>
            </div>
            
            {schedule.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-100">
                  {schedule.map((item, index) => (
                    <div key={item.id} className="flex p-4 hover:bg-gray-50 transition-colors">
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-gray-400" />
                สิ่งที่ต้องทำ
              </h2>
              {allTasksCompleted && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">เสร็จสิ้นแล้ว</span>
              )}
            </div>

            <div className="space-y-2">
              {tasks.map((task) => (
                <label 
                  key={task.id} 
                  className={`flex items-start gap-3 p-4 bg-white rounded-xl border transition-all cursor-pointer select-none
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
              ))}
            </div>
          </section>

          {/* Daily Habits Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-gray-400" />
                นิสัยประจำวัน
              </h2>
              {allHabitsCompleted && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">ทำครบแล้ว</span>
              )}
            </div>

            <div className="space-y-2">
              {habits.map((habit) => (
                <label 
                  key={habit.id} 
                  className={`flex items-center gap-3 p-4 bg-white rounded-xl border transition-all cursor-pointer select-none
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
              ))}
            </div>
          </section>

        </div>
      )}
    </div>
  )
}
