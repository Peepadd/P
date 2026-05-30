import { useState, useEffect } from 'react'
import { Wallet, Bell, BellRing, BellOff, Save, RefreshCw } from 'lucide-react'
import { supabase } from '../../supabase/supabaseClient'

function formatCurrency(amount) {
  return Number(amount).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default function NotifyPanel() {
  const [budget, setBudget] = useState(0)
  const [budgetInput, setBudgetInput] = useState('')
  const [notificationEnabled, setNotificationEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [currentMonthExpense, setCurrentMonthExpense] = useState(0)

  // Load current budget from Supabase
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'monthly_budget')
          .single()

        if (error && error.code !== 'PGRST116') throw error

        const amount = data?.value?.amount || 0
        setBudget(amount)
        setBudgetInput(amount > 0 ? String(amount) : '')

        // Load current month expense for the progress bar
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

        const { data: expenseData } = await supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'Expense')
          .gte('date', startOfMonth)
          .lte('date', endOfMonth)

        const total = (expenseData || []).reduce((sum, t) => sum + Number(t.amount), 0)
        setCurrentMonthExpense(total)

        // Check notification permission
        setNotificationEnabled(
          'Notification' in window && Notification.permission === 'granted'
        )
      } catch (err) {
        console.error('Load settings error:', err.message)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSaveBudget = async () => {
    const amount = parseFloat(budgetInput)
    if (isNaN(amount) || amount < 0) {
      setMessage({ type: 'error', text: 'กรุณากรอกตัวเลขที่ถูกต้อง' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const { error: upsertError } = await supabase
        .from('system_settings')
        .upsert(
          {
            key: 'monthly_budget',
            value: { amount },
          },
          { onConflict: 'key' }
        )

      if (upsertError) throw upsertError

      setBudget(amount)
      setMessage({ type: 'success', text: `บันทึกงบประมาณ ${formatCurrency(amount)} บาท เรียบร้อย` })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error('Save budget error:', err.message)
      setMessage({ type: 'error', text: `เกิดข้อผิดพลาด: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  const handleRequestNotification = async () => {
    if (!('Notification' in window)) {
      setMessage({ type: 'error', text: 'บราวเซอร์นี้ไม่รองรับการแจ้งเตือน' })
      return
    }

    if (Notification.permission === 'denied') {
      setMessage({ type: 'error', text: 'กรุณาเปิดการแจ้งเตือนในการตั้งค่าบราวเซอร์' })
      return
    }

    try {
      const result = await Notification.requestPermission()
      setNotificationEnabled(result === 'granted')
      if (result === 'granted') {
        setMessage({ type: 'success', text: 'เปิดการแจ้งเตือนเรียบร้อย' })
      }
    } catch {
      setMessage({ type: 'error', text: 'ไม่สามารถขอสิทธิ์การแจ้งเตือนได้' })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const budgetPercent = budget > 0 ? Math.min((currentMonthExpense / budget) * 100, 100) : 0
  const isOverBudget = budget > 0 && currentMonthExpense > budget

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400 mt-3">กำลังโหลด...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? '✅ ' : '❌ '}
          {message.text}
        </div>
      )}

      {/* Budget Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-900">งบประมาณรายเดือน</h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            ตั้งวงเงินใช้จ่ายประจำเดือนเพื่อควบคุมรายจ่าย
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Current budget display */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">งบประมาณปัจจุบัน</span>
            <span className="text-lg font-bold text-indigo-700">
              {budget > 0 ? `${formatCurrency(budget)} บาท` : 'ยังไม่ได้ตั้ง'}
            </span>
          </div>

          {/* Current expense */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-gray-500">ใช้จ่ายเดือนนี้</span>
              <span className={`font-semibold font-mono ${isOverBudget ? 'text-red-600' : 'text-gray-700'}`}>
                {formatCurrency(currentMonthExpense)} บาท
              </span>
            </div>
            {/* Progress bar */}
            {budget > 0 && (
              <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isOverBudget
                      ? 'bg-red-500'
                      : budgetPercent > 80
                      ? 'bg-orange-500'
                      : budgetPercent > 60
                      ? 'bg-amber-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${budgetPercent}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white mix-blend-difference">
                  {Math.round(budgetPercent)}%
                </span>
              </div>
            )}
            {isOverBudget && (
              <p className="text-xs text-red-500 mt-1">
                ⚠️ ใช้จ่ายเกินงบประมาณแล้ว {formatCurrency(currentMonthExpense - budget)} บาท
              </p>
            )}
          </div>

          {/* Budget input */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                ตั้งวงเงินงบประมาณ
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  placeholder="เช่น 15000"
                  className="w-full px-3 py-2.5 pr-12 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget()}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">บาท</span>
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSaveBudget}
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                บันทึก
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center gap-2">
            {notificationEnabled ? (
              <BellRing size={18} className="text-purple-600" />
            ) : (
              <BellOff size={18} className="text-gray-400" />
            )}
            <h3 className="font-semibold text-gray-900">การแจ้งเตือน</h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            จัดการการแจ้งเตือนจากบราวเซอร์
          </p>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                notificationEnabled ? 'bg-green-50' : 'bg-gray-100'
              }`}>
                {notificationEnabled ? (
                  <Bell size={20} className="text-green-600" />
                ) : (
                  <BellOff size={20} className="text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {notificationEnabled ? 'เปิดการแจ้งเตือนแล้ว' : 'ปิดการแจ้งเตือน'}
                </p>
                <p className="text-xs text-gray-400">
                  {notificationEnabled
                    ? 'แจ้งเตือนเมื่อใกล้ถึงกำหนดส่งงาน ซื้อของ และสอบ'
                    : 'คลิกเพื่อเปิดการแจ้งเตือนจากบราวเซอร์'}
                </p>
              </div>
            </div>
            <button
              onClick={handleRequestNotification}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                notificationEnabled
                  ? 'bg-green-50 text-green-700'
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              {notificationEnabled ? 'เปิดอยู่' : 'เปิดการแจ้งเตือน'}
            </button>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs text-amber-700 leading-relaxed">
          ℹ️ งบประมาณที่ตั้งไว้จะถูกนำไปแสดงบน <strong>แดชบอร์ด</strong> 
          เพื่อให้คุณเห็นภาพรวมการใช้จ่ายประจำเดือน
        </p>
      </div>
    </div>
  )
}
