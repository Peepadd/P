import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { navItems } from '../../config/navigation'
import { Menu, X } from 'lucide-react'

// Primary items to show in the bottom tab bar (max 4 items + "More" menu)
const primaryRoutes = ['/', '/accounting', '/timetable', '/habits']
const primaryNavItems = navItems.filter(item => primaryRoutes.includes(item.to))
const moreNavItems = navItems.filter(item => !primaryRoutes.includes(item.to))

export default function MobileNav() {
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  return (
    <>
      {/* Spacer so content doesn't hide behind the fixed bottom bar */}
      <div className="h-28 md:hidden shrink-0" />

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border pb-safe z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setIsMoreOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
                  isActive ? 'text-accent' : 'text-meta hover:text-muted'
                }`
              }
            >
              <item.icon size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
            </NavLink>
          ))}

          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
              isMoreOpen ? 'text-accent' : 'text-meta hover:text-muted'
            }`}
          >
            <Menu size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-medium truncate w-full text-center">เมนู</span>
          </button>
        </div>
      </nav>

      {/* "More" Fullscreen Menu overlay */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-surface flex flex-col animate-[fadeIn_0.15s_ease-out]">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-fg">เมนูเพิ่มเติม</h2>
            <button onClick={() => setIsMoreOpen(false)} className="p-2 text-meta hover:text-muted bg-surface-warm rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {moreNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMoreOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-md font-medium transition-colors ${
                    isActive
                      ? 'bg-accent-soft text-accent'
                      : 'text-fg-2 hover:bg-surface-warm'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-accent-soft' : 'bg-surface-warm text-muted'}`}>
                      <item.icon size={20} />
                    </div>
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
          {/* Spacer for bottom tab bar */}
          <div className="h-16" />
        </div>
      )}
    </>
  )
}
