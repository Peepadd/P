import { CheckSquare } from 'lucide-react'

export default function Habits() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">สร้างนิสัย</h1>
        <p className="text-gray-500 text-lg mt-1">Habit Builder</p>
      </header>
      <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
        <CheckSquare size={32} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">เริ่มสร้างนิสัยใหม่ของคุณได้ที่นี่</p>
      </div>
    </div>
  )
}
