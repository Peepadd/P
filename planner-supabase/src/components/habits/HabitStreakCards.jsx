import { Flame, Trophy, TrendingUp } from 'lucide-react'

function getStreakEmoji(current) {
  if (current >= 30) return '🔥🔥🔥'
  if (current >= 14) return '🔥🔥'
  if (current >= 7) return '🔥'
  if (current >= 3) return '💪'
  return '🌱'
}

function getStreakColor(current, best) {
  if (current >= 30) return 'from-orange-500 to-red-600'
  if (current >= 14) return 'from-orange-400 to-orange-600'
  if (current >= 7) return 'from-amber-400 to-orange-500'
  if (current >= 3) return 'from-yellow-400 to-amber-500'
  return 'from-gray-300 to-gray-400'
}

export default function HabitStreakCards({ habits, getStreaks }) {
  if (!habits || habits.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <Flame size={32} className="mx-auto mb-2 text-gray-300" />
        <p className="text-sm text-gray-400">เพิ่มนิสัยเพื่อดู Streak</p>
      </div>
    )
  }

  // Sort by current streak descending
  const sorted = [...habits]
    .map((h) => ({ ...h, ...getStreaks(h.id) }))
    .sort((a, b) => b.current - a.current)

  const maxStreak = Math.max(...sorted.map((h) => h.current), 1)

  return (
    <div className="space-y-2.5">
      {sorted.map((habit) => {
        const { current, best } = habit
        const barWidth = Math.min((current / maxStreak) * 100, 100)
        const emoji = getStreakEmoji(current)

        return (
          <div
            key={habit.id}
            className="bg-white rounded-xl border border-gray-200 p-3.5 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
                <span className="text-sm font-semibold text-gray-900 truncate">{habit.name}</span>
                <span className="text-lg">{emoji}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {best > 0 && (
                  <span className="flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                    <Trophy size={12} />
                    สูงสุด {best}
                  </span>
                )}
              </div>
            </div>

            {/* Current streak bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getStreakColor(current, best)} transition-all duration-500 ease-out`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="text-sm font-bold font-mono text-gray-700 min-w-[40px] text-right">
                {current}
                <span className="text-xs text-gray-400 font-normal ml-0.5">วัน</span>
              </span>
            </div>

            {/* Streak milestones */}
            {current > 0 && (
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                <TrendingUp size={10} />
                <span>
                  {current >= 30
                    ? '🚀 เหนือชั้น!'
                    : current >= 14
                    ? '👏 รักษาไว้ได้ดีมาก!'
                    : current >= 7
                    ? '💪 กำลังไปได้สวย!'
                    : current >= 3
                    ? '👍 เริ่มติดแล้ว!'
                    : '🌟 เริ่มต้นได้ดี!'}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
