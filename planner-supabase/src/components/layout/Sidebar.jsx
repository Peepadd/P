import { NavLink } from 'react-router-dom'
import { navItems } from '../../config/navigation'

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full flex flex-col hidden md:flex shrink-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Planner App</h1>
        <p className="text-sm text-gray-400 mt-1">Shared workspace</p>
      </div>
      
      <nav className="flex-1 px-4 pb-6 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <div key={item.to}>
            {item.divider && <div className="my-4 border-t border-gray-100" />}
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon size={18} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          </div>
        ))}
      </nav>
    </aside>
  )
}
