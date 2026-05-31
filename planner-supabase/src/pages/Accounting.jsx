import { useState } from 'react'
import { Plus, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react'

export default function Accounting() {
  const [transactions] = useState([]) // Placeholder for Supabase data

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
      
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">กระเป๋าเงินร่วม</h1>
          <p className="text-gray-500 text-lg mt-1">Shared Financial View</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-600 transition-colors">
          <Plus size={18} />
          <span className="hidden sm:inline">บันทึกรายการ</span>
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Wallet size={16} />
            <span className="text-sm font-medium">ยอดคงเหลือ</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-900">฿0.00</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <ArrowDownRight size={16} />
            <span className="text-sm font-medium">รายรับ</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-900">฿0.00</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <ArrowUpRight size={16} />
            <span className="text-sm font-medium">รายจ่าย</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-900">฿0.00</p>
        </div>
      </div>

      {/* Transactions List */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">รายการล่าสุด</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <ArrowRightLeft size={24} />
            </div>
            <p className="text-gray-500">ยังไม่มีรายการบันทึกบัญชี</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {/* List items will go here */}
          </div>
        )}
      </section>
    </div>
  )
}
