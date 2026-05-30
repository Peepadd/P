import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowRightLeft,
  Repeat,
  Upload,
  Printer,
  ClipboardList,
  BookOpen,
  CalendarDays,
  Table2,
  CheckSquare,
  Timer,
  Scale,
  Settings,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { to: '/accounting', label: 'บันทึกรายการ', icon: ArrowRightLeft },
  { to: '/checklist', label: 'Checklist', icon: ClipboardList },
  { to: '/academic', label: 'งาน/สอบ', icon: BookOpen },
  { to: '/calendar', label: 'ปฏิทิน', icon: CalendarDays },
  { to: '/timetable', label: 'ตารางเรียน', icon: Table2 },
  { to: '/habits', label: 'สร้างนิสัย', icon: CheckSquare },
  { to: '/pomodoro', label: 'Pomodoro', icon: Timer },
  { to: '/price-compare', label: 'เปรียบเทียบราคา', icon: Scale },
  { to: '/recurring', label: 'รายการอัตโนมัติ', icon: Repeat },
  { to: '/csv-import', label: 'นำเข้า CSV', icon: Upload },
  { to: '/print-report', label: 'พิมพ์รายงาน', icon: Printer },
  { to: '/settings', label: 'ตั้งค่า', icon: Settings, divider: true },
]

export default function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r border-gray-200 h-full flex flex-col">
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <div key={item.to}>
            {item.divider && <div className="my-2 border-t border-gray-100" />}
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          </div>
        ))}
      </nav>
    </aside>
  )
}
