import { Scale } from 'lucide-react'

export default function PriceCompare() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">เปรียบเทียบราคา</h1>
        <p className="text-gray-500 text-lg mt-1">Price Comparison</p>
      </header>
      <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
        <Scale size={32} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">เครื่องมือเปรียบเทียบความคุ้มค่า</p>
      </div>
    </div>
  )
}
