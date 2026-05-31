import { Printer } from 'lucide-react'

export default function PrintReport() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">พิมพ์รายงาน</h1>
        <p className="text-gray-500 text-lg mt-1">Print & Export</p>
      </header>
      <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
        <Printer size={32} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">สร้างรายงานเพื่อการพิมพ์</p>
      </div>
    </div>
  )
}
