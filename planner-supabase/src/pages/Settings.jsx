import { useAuth } from '../context/AuthContext'
import { Settings as SettingsIcon, LogOut, User, Bell, Shield, Moon } from 'lucide-react'

export default function Settings() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Failed to sign out:', err)
      alert('Failed to sign out. Please try again.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
      
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ตั้งค่า</h1>
          <p className="text-gray-500 text-lg mt-1">Settings & Preferences</p>
        </div>
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
          <SettingsIcon size={24} className="text-gray-400" />
        </div>
      </header>

      <div className="space-y-6">
        
        {/* Account Section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">บัญชีผู้ใช้ (Account)</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                <User size={24} />
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">อีเมล (Email)</p>
                <p className="text-gray-500 text-sm">{user?.email || 'ไม่ได้ระบุ'}</p>
              </div>
            </div>
            <div className="h-px bg-gray-100 mx-4" />
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 p-4 text-left text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">ออกจากระบบ (Sign Out)</span>
            </button>
          </div>
        </section>

        {/* Preferences Section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">การตั้งค่าทั่วไป (Preferences)</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm divide-y divide-gray-100">
            
            <label className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 text-gray-700">
                <Bell size={20} className="text-gray-400" />
                <span className="font-medium">การแจ้งเตือน (Notifications)</span>
              </div>
              <div className="relative inline-block w-11 h-6 select-none">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </div>
            </label>

            <label className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 text-gray-700">
                <Moon size={20} className="text-gray-400" />
                <span className="font-medium">โหมดกลางคืน (Dark Mode)</span>
              </div>
              <div className="relative inline-block w-11 h-6 select-none">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </div>
            </label>

            <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 text-gray-700">
                <Shield size={20} className="text-gray-400" />
                <span className="font-medium">ความเป็นส่วนตัว (Privacy Policy)</span>
              </div>
              <span className="text-gray-400 text-sm">ดูรายละเอียด &rarr;</span>
            </div>

          </div>
        </section>

      </div>
    </div>
  )
}
