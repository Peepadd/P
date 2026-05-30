import { useRef } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import { BarChart3, PieChart } from 'lucide-react'

function formatCurrency(amount) {
  return Number(amount).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ---- Bar Chart ----
function BarChartSection({ monthlyData, loading }) {
  const chartRef = useRef(null)

  const labels = monthlyData.map((m) => m.label)
  const incomeData = monthlyData.map((m) => m.income)
  const expenseData = monthlyData.map((m) => m.expense)

  const data = {
    labels,
    datasets: [
      {
        label: 'รายรับ',
        data: incomeData,
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.35,
      },
      {
        label: 'รายจ่าย',
        data: expenseData,
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.35,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          padding: 16,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.06)' },
        ticks: {
          font: { size: 11 },
          callback: (value) =>
            value >= 10000
              ? `${(value / 1000).toFixed(0)}K`
              : value >= 1000
                ? `${(value / 1000).toFixed(1)}K`
                : value,
        },
      },
    },
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={18} className="text-indigo-600" />
        <h3 className="font-semibold text-gray-900">รายรับ-รายจ่าย 6 เดือน</h3>
      </div>
      <div className="h-72">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : monthlyData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            ยังไม่มีข้อมูล
          </div>
        ) : (
          <Bar ref={chartRef} data={data} options={options} />
        )}
      </div>
    </div>
  )
}

// ---- Doughnut Chart ----
const CATEGORY_COLORS = [
  '#6366f1', '#f59e0b', '#ef4444', '#22c55e', '#3b82f6',
  '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4',
  '#84cc16', '#d946ef', '#0ea5e9', '#eab308',
]

function DoughnutChartSection({ categoryData, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <PieChart size={18} className="text-indigo-600" />
          <h3 className="font-semibold text-gray-900">สัดส่วนค่าใช้จ่ายตามหมวดหมู่</h3>
        </div>
        <div className="h-72 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const totalExpense = categoryData.reduce((sum, c) => sum + c.amount, 0)

  const data = {
    labels: categoryData.map((c) => c.category),
    datasets: [
      {
        data: categoryData.map((c) => c.amount),
        backgroundColor: CATEGORY_COLORS.slice(0, categoryData.length),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 12,
          font: { size: 11 },
          generateLabels: (chart) => {
            const data = chart.data
            return data.labels.map((label, i) => ({
              text: `${label}  (${((data.datasets[0].data[i] / totalExpense) * 100).toFixed(1)}%)`,
              fillStyle: data.datasets[0].backgroundColor[i],
              strokeStyle: data.datasets[0].backgroundColor[i],
              pointStyle: 'circle',
              index: i,
            }))
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw
            const pct = ((val / totalExpense) * 100).toFixed(1)
            return `${ctx.label}: ${formatCurrency(val)} (${pct}%)`
          },
        },
      },
    },
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <PieChart size={18} className="text-indigo-600" />
        <h3 className="font-semibold text-gray-900">สัดส่วนค่าใช้จ่ายตามหมวดหมู่</h3>
      </div>
      <div className="h-72">
        {categoryData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            ยังไม่มีรายจ่ายในเดือนนี้
          </div>
        ) : (
          <Doughnut data={data} options={options} />
        )}
      </div>
    </div>
  )
}

// ---- Main Export ----
export default function AnalyticsCharts({ monthlyData, categoryData, loading }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BarChartSection monthlyData={monthlyData} loading={loading} />
      <DoughnutChartSection categoryData={categoryData} loading={loading} />
    </div>
  )
}
