import { Timer, Info } from 'lucide-react'

export default function TimerControls() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      {/* Info */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          <Info size={14} className="inline mr-1" />
          วิธีใช้
        </h3>
        <ol className="space-y-1.5 text-xs text-gray-600">
          <li className="flex gap-2">
            <span className="font-medium text-indigo-600 w-5 shrink-0">1.</span>
            <span>เลือกงานที่ต้องการทำ</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-indigo-600 w-5 shrink-0">2.</span>
            <span>กด Start — โฟกัส 25 นาที</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-indigo-600 w-5 shrink-0">3.</span>
            <span>เมื่อหมดเวลา พัก 5 นาที</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-indigo-600 w-5 shrink-0">4.</span>
            <span>ทำซ้ำ 4 รอบ แล้วพักยาว 15-30 นาที</span>
          </li>
        </ol>
      </div>

      {/* Tip */}
      <div className="px-3 py-2 bg-amber-50 rounded-lg">
        <p className="text-[10px] text-amber-700 leading-relaxed">
          💡 ตั้งสมาธิกับงานทีละอย่าง ปิดการแจ้งเตือนอื่น ๆ ชั่วคราว
        </p>
      </div>

      {/* Notifications info */}
      <div className="px-3 py-2 bg-indigo-50 rounded-lg">
        <div className="flex items-center gap-1.5 text-[10px] text-indigo-700">
          <Timer size={12} />
          <span>🔔 แจ้งเตือนเมื่อหมดเวลาทั้งเสียง + Notification</span>
        </div>
      </div>
    </div>
  )
}
