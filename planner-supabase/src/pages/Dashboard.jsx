import '../chartSetup'
import { RefreshCw } from 'lucide-react'
import useDashboardData from '../hooks/useDashboardData'
import SummaryCards from '../components/dashboard/SummaryCards'
import BudgetBar from '../components/dashboard/BudgetBar'
import BudgetAlert from '../components/dashboard/BudgetAlert'
import AnalyticsCharts from '../components/dashboard/AnalyticsCharts'

export default function Dashboard() {
  const {
    summary,
    monthlyData,
    categoryData,
    budget,
    loading,
    error,
    refetch,
    updateBudget,
  } = useDashboardData()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h2>
          <p className="text-gray-500 mt-1">ภาพรวมสถานะการเงินประจำเดือน</p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          รีเฟรช
        </button>
      </div>

      {/* Supabase Connection Error */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">ไม่สามารถโหลดข้อมูลได้</p>
              <p className="text-sm text-amber-600 mt-1">กรุณาตรวจสอบการตั้งค่า Supabase และ .env.local</p>
              <p className="text-xs text-amber-500 mt-1">Error: {error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Budget Alert */}
      <BudgetAlert budget={budget} />

      {/* Summary Cards */}
      <SummaryCards summary={summary} />

      {/* Charts */}
      <AnalyticsCharts
        monthlyData={monthlyData}
        categoryData={categoryData}
        loading={loading}
      />

      {/* Budget Bar */}
      <BudgetBar budget={budget} onUpdateBudget={updateBudget} />
    </div>
  )
}
