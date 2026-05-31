import { useMemo } from 'react'
import { Clock, BarChart3 } from 'lucide-react'

const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์']

export default function TimetableStats({ config, cells, subjects }) {
  const stats = useMemo(() => {
    if (!config || !cells) return null

    const subjectMap = {} // { subjectName: { count, color } }
    const dayCount = [0, 0, 0, 0, 0] // periods per day

    Object.entries(cells).forEach(([key, cell]) => {
      if (!cell?.subject) return
      const [dayIdx] = key.split('_').map(Number)

      if (!subjectMap[cell.subject]) {
        const subj = (subjects || []).find((s) => s.name === cell.subject)
        subjectMap[cell.subject] = { count: 0, color: subj?.color || '#6366f1' }
      }
      subjectMap[cell.subject].count++
      if (dayIdx >= 0 && dayIdx < 5) dayCount[dayIdx]++
    })

    const totalPeriods = Object.values(subjectMap).reduce((sum, s) => sum + s.count, 0)
    const totalMinutes = totalPeriods * (config.pMin || 50)
    const totalHours = Math.floor(totalMinutes / 60)
    const remainingMinutes = totalMinutes % 60

    const subjectList = Object.entries(subjectMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        color: data.color,
        minutes: data.count * (config.pMin || 50),
        percent: totalPeriods > 0 ? ((data.count / totalPeriods) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    return { totalPeriods, totalHours, remainingMinutes, totalMinutes, subjectList, dayCount }
  }, [config, cells, subjects])

  if (!stats || stats.totalPeriods === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 size={18} className="text-indigo-600" />
        <h3 className="font-semibold text-gray-900 text-sm">สรุปชั่วโมงเรียน</h3>
      </div>

      {/* Total summary */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900 tracking-tight">
          {stats.totalHours}
          <span className="text-base font-medium text-gray-400"> ชม.</span>
          {stats.remainingMinutes > 0 && (
            <>
              {' '}{stats.remainingMinutes}
              <span className="text-base font-medium text-gray-400"> น.</span>
            </>
          )}
        </span>
        <span className="text-sm text-gray-400">/ สัปดาห์</span>
        <span className="text-xs text-gray-300 ml-auto">{stats.totalPeriods} คาบ</span>
      </div>

      {/* Stacked progress bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-gray-100">
        {stats.subjectList.map((subj) => (
          <div
            key={subj.name}
            className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${subj.percent}%`,
              backgroundColor: subj.color,
              minWidth: '4px',
            }}
            title={`${subj.name}: ${subj.percent}%`}
          />
        ))}
      </div>

      {/* Subject breakdown */}
      <div className="space-y-1.5">
        {stats.subjectList.map((subj) => (
          <div key={subj.name} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: subj.color }}
            />
            <span className="flex-1 text-gray-700 truncate">{subj.name}</span>
            <span className="text-gray-400 text-xs tabular-nums">{subj.count} คาบ</span>
            <span className="text-gray-300 text-xs tabular-nums w-12 text-right">
              {Math.floor(subj.minutes / 60) > 0 && `${Math.floor(subj.minutes / 60)}ชม.`}
              {subj.minutes % 60 > 0 && `${subj.minutes % 60}น.`}
            </span>
            <span className="text-gray-300 text-xs tabular-nums w-10 text-right">{subj.percent}%</span>
          </div>
        ))}
      </div>

      {/* Per-day summary */}
      <div className="pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
          <Clock size={12} />
          คาบต่อวัน
        </p>
        <div className="flex gap-1.5">
          {DAYS.map((day, i) => (
            <div key={day} className="flex-1 text-center">
              <div
                className="mx-auto rounded-md transition-all"
                style={{
                  height: `${Math.max(8, stats.dayCount[i] * 8)}px`,
                  backgroundColor: stats.dayCount[i] > 0 ? '#818cf8' : '#e5e7eb',
                }}
              />
              <p className="text-[10px] text-gray-500 mt-1">{day.slice(0, 2)}</p>
              <p className="text-[10px] font-medium text-gray-700">{stats.dayCount[i]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
