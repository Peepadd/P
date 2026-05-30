import NotifyPanel from '../components/settings/NotifyPanel'
import { Settings as SettingsIcon, Info } from 'lucide-react'

export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">⚙️ ตั้งค่า</h2>
        <p className="text-gray-500 mt-1">จัดการงบประมาณและการแจ้งเตือน</p>
      </div>

      {/* Notify Panel */}
      <NotifyPanel />

      {/* System info */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-700">เกี่ยวกับระบบ</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Planner Supabase — เว็บแอปพลิเคชันสำหรับวางแผนการเงิน การศึกษา และพัฒนาตนเอง
              ใช้ React + Vite + Tailwind CSS + Supabase
            </p>
            <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-300">
              <span>เวอร์ชัน 3.0</span>
              <span>•</span>
              <span>ฐานข้อมูล Supabase</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
