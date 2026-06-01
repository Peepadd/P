import { useState, useEffect } from 'react'
import { Plus, ArrowUpRight, ArrowDownRight, Wallet, ArrowRightLeft, X, QrCode, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../supabase/supabaseClient'
import BatchSlipUploader from '../components/accounting/BatchSlipUploader'

export default function Accounting() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBatchUploader, setShowBatchUploader] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  // Form State
  const [formData, setFormData] = useState({
    type: 'Expense',
    amount: '',
    category: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('transaction_time', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (err) {
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.amount || !formData.category) return

    try {
      setIsSubmitting(true)
      
      if (editingId) {
        const { error } = await supabase.from('transactions').update({
          type: formData.type,
          amount: parseFloat(formData.amount),
          category: formData.category,
          note: formData.note,
          date: formData.date
        }).eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase.from('transactions').insert([
          {
            id: crypto.randomUUID(),
            type: formData.type,
            amount: parseFloat(formData.amount),
            category: formData.category,
            note: formData.note,
            date: formData.date,
            transaction_time: new Date().toTimeString().split(' ')[0]
          }
        ])

        if (error) throw error
      }
      
      // Reset and hide form
      setFormData({ type: 'Expense', amount: '', category: '', note: '', date: new Date().toISOString().split('T')[0] })
      setEditingId(null)
      setShowAddForm(false)
      fetchTransactions()
    } catch (err) {
      console.error('Error saving transaction:', err)
      alert('Failed to save transaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) return
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
      fetchTransactions()
    } catch (err) {
      console.error('Error deleting:', err)
      alert('Failed to delete transaction')
    }
  }

  const handleEditClick = (t) => {
    setFormData({
      type: t.type,
      amount: t.amount,
      category: t.category,
      note: t.note || '',
      date: t.date
    })
    setEditingId(t.id)
    setShowAddForm(true)
  }

  const handleAddNewClick = () => {
    setFormData({ type: 'Expense', amount: '', category: '', note: '', date: new Date().toISOString().split('T')[0] })
    setEditingId(null)
    setShowAddForm(true)
  }

  const handleReviewSlip = (extractedData) => {
    // ปิด Modal อัปโหลดสลิป
    setShowBatchUploader(false)
    
    // พรีฟิลข้อมูลที่ AI ส่งมาให้
    setFormData({
      type: 'Expense', // อนุมานว่าเป็นรายจ่ายเสมอจากการโอนออก
      amount: extractedData.amount || '',
      category: extractedData.category || '',
      note: extractedData.payee ? `โอนให้: ${extractedData.payee}` : '',
      date: extractedData.date || new Date().toISOString().split('T')[0]
    })
    
    // เปิด Modal ฟอร์มปกติ เพื่อให้ User ตรวจสอบ/แก้ไขก่อนกดเซฟ
    setEditingId(null)
    setShowAddForm(true)
  }

  // Calculate summaries
  const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
      
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">กระเป๋าเงินร่วม</h1>
          <p className="text-gray-500 text-lg mt-1">Shared Financial View</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowBatchUploader(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <QrCode size={18} />
            <span className="hidden sm:inline">สแกนสลิป</span>
          </button>
          <button 
            onClick={handleAddNewClick}
            className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-600 transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">บันทึกรายการ</span>
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Wallet size={16} />
            <span className="text-sm font-medium">ยอดคงเหลือ</span>
          </div>
          <p className={`text-xl md:text-2xl font-bold ${balance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
            ฿{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <ArrowDownRight size={16} />
            <span className="text-sm font-medium">รายรับ</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-900">
            ฿{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <ArrowUpRight size={16} />
            <span className="text-sm font-medium">รายจ่าย</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-900">
            ฿{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Transactions List */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">รายการล่าสุด</h2>
        
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <ArrowRightLeft size={24} />
            </div>
            <p className="text-gray-500">ยังไม่มีรายการบันทึกบัญชี</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    t.type === 'Income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                  }`}>
                    {t.type === 'Income' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t.category}</p>
                    <p className="text-sm text-gray-500">{t.note || t.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`font-semibold ${t.type === 'Income' ? 'text-green-600' : 'text-gray-900'}`}>
                    {t.type === 'Income' ? '+' : '-'}฿{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditClick(t)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Transaction Modal Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pb-20 md:pb-0">
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-200 shadow-xl relative animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'แก้ไขรายการ' : 'บันทึกรายการใหม่'}</h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'Expense'})}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    formData.type === 'Expense' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  รายจ่าย
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'Income'})}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    formData.type === 'Income' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  รายรับ
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="เช่น อาหาร, เดินทาง, เงินเดือน"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดเพิ่มเติม (ไม่บังคับ)</label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="บันทึกย่อ..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-500 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Uploader Modal Overlay */}
      {showBatchUploader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pb-20 md:pb-0">
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={() => setShowBatchUploader(false)} />
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-gray-200 shadow-xl relative animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">นำเข้าสลิปโอนเงิน (Batch Upload)</h2>
              <button onClick={() => setShowBatchUploader(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <BatchSlipUploader onReview={handleReviewSlip} />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
