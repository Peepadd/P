import PomodoroTimer from '../components/pomodoro/PomodoroTimer'
import TimerControls from '../components/pomodoro/TimerControls'

export default function Pomodoro() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">🍅 Pomodoro Timer</h2>
        <p className="text-gray-500 mt-1">จับเวลาโฟกัสงานด้วยเทคนิค Pomodoro</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer */}
        <div className="lg:col-span-2">
          <PomodoroTimer />
        </div>

        {/* Controls & tips */}
        <div className="space-y-4">
          <TimerControls />
        </div>
      </div>
    </div>
  )
}
