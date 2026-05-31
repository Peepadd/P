import { Scale } from 'lucide-react'

import PriceCompareGrid from '../components/price-compare/PriceCompareGrid'

export default function PriceCompare() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">เปรียบเทียบราคา</h1>
        <p className="text-gray-500 text-lg mt-1">Price Comparison</p>
      </header>
      <PriceCompareGrid />
    </div>
  )
}
