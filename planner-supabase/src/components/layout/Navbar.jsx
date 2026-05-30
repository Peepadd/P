import { LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import NotificationListener from '../ui/NotificationListener'

export default function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">P</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Planner Supabase</h1>
      </div>

      {user && (
        <div className="flex items-center gap-4">
          {/* Notification Listener */}
          <div className="relative">
            <NotificationListener />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User size={16} />
            <span className="hidden sm:inline">{user.email}</span>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            ออกจากระบบ
          </button>
        </div>
      )}
    </header>
  )
}
