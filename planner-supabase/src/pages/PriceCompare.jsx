import PriceCompareGrid from '../components/price-compare/PriceCompareGrid'
import { Scale, Info } from 'lucide-react'

export default function PriceCompare() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">📊 เปรียบเทียบราคา</h2>
        <p className="text-gray-500 mt-1">คำนวณราคาต่อหน่วยเพื่อหาความคุ้มค่า</p>
      </div>

      {/* Tips */}
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full">💡 กรอกราคาและปริมาณ</span>
        <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-600 rounded-full">✅ สินค้าคุ้มค่าที่สุดจะถูกไฮไลต์</span>
        <span className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full">➕ เพิ่มแถวเปรียบเทียบได้มากถึง 10 รายการ</span>
      </div>

      {/* Grid */}
      <PriceCompareGrid />

      {/* Info */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-4">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-indigo-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-indigo-800">วิธีใช้งาน</p>
            <p className="text-xs text-indigo-600 mt-1 leading-relaxed">
              เพิ่มรายการสินค้าที่ต้องการเปรียบเทียบ กรอกราคาและปริมาณ/น้ำหนัก 
              ระบบจะคำนวณ <strong>ราคาต่อหน่วย</strong> ให้อัตโนมัติ และไฮไลต์ 
              <strong className="text-emerald-600">สินค้าที่คุ้มค่าที่สุด</strong> เป็นสีเขียว
            </p>
            <p className="text-xs text-indigo-400 mt-1">
              เช่น สินค้า A ราคา 100 บาท 500 กรัม → 0.20 บาท/กรัม
              สินค้า B ราคา 80 บาท 300 กรัม → 0.27 บาท/กรัม
              — สินค้า A คุ้มค่ากว่า! 🎉
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
