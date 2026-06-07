import { useState, useEffect, useRef, useCallback } from 'react'
import { Timer, Play, Pause, RotateCcw, Coffee, Brain, Volume2 } from 'lucide-react'
import { useLeveling } from '../../hooks/useLeveling'
import LevelUpOverlay from '../leveling/LevelUpOverlay'

const WORK_MINUTES = 25
const BREAK_MINUTES = 5

function playTimerSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'
    // Play a pleasant chime sequence
    const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15)
    })

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.8)

    oscillator.onended = () => ctx.close()
  } catch {
    // Audio not supported
  }
}

function sendBrowserNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  try {
    const notif = new Notification(title, {
      body,
      icon: '/favicon.ico',
      requireInteraction: true,
      silent: true,
    })
    notif.onclick = () => window.focus()
    setTimeout(() => notif.close(), 10000)
  } catch {
    // Notification failed
  }
}

export default function PomodoroTimer() {
  const { gainExp } = useLeveling()
  const [mode, setMode] = useState('work') // 'work' | 'break'
  const [secondsLeft, setSecondsLeft] = useState(WORK_MINUTES * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [showComplete, setShowComplete] = useState(false)
  const [expResult, setExpResult] = useState(null) // สำหรับ LevelUpOverlay
  const intervalRef = useRef(null)

  const workDuration = WORK_MINUTES * 60
  const breakDuration = BREAK_MINUTES * 60
  const totalSeconds = mode === 'work' ? workDuration : breakDuration
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  // Cleanup interval
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsRunning(true)

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          setIsRunning(false)

          // Timer finished
          if (mode === 'work') {
            setSessions((s) => s + 1)
            setShowComplete(true)
            playTimerSound()
            sendBrowserNotification(
              '🎉 Pomodoro เสร็จแล้ว!',
              `ทำงานครบ ${WORK_MINUTES} นาทีแล้ว — ถึงเวลาพัก ${BREAK_MINUTES} นาที`
            )
            
            gainExp('pomodoro', null, WORK_MINUTES).then(result => {
              if (result) {
                setExpResult({ ...result, description: `ฝึกสมาธิ Pomodoro ${WORK_MINUTES} นาที ⏱️` })
              }
            })
          } else {
            playTimerSound()
            sendBrowserNotification(
              '☕ พักเสร็จแล้ว!',
              'พักผ่อนเพียงพอแล้ว — กลับไปทำงานต่อได้!'
            )
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [mode])

  const pauseTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsRunning(false)
  }, [])

  const resetTimer = useCallback(() => {
    pauseTimer()
    setSecondsLeft(mode === 'work' ? workDuration : breakDuration)
    setShowComplete(false)
  }, [mode, workDuration, breakDuration, pauseTimer])

  const switchMode = useCallback((newMode) => {
    pauseTimer()
    setMode(newMode)
    setSecondsLeft(newMode === 'work' ? workDuration : breakDuration)
    setShowComplete(false)
  }, [workDuration, breakDuration, pauseTimer])

  const handleStartBreak = () => {
    setShowComplete(false)
    switchMode('break')
    // Auto-start break
    setTimeout(() => startTimer(), 500)
  }

  const handleSkipBreak = () => {
    setShowComplete(false)
    switchMode('work')
  }

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Progress bar color
  const progressColor = mode === 'work'
    ? secondsLeft > workDuration * 0.5
      ? 'bg-indigo-500'
      : secondsLeft > workDuration * 0.2
      ? 'bg-amber-500'
      : 'bg-red-500'
    : 'bg-green-500'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Mode tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => switchMode('work')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            mode === 'work'
              ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Brain size={16} />
          โฟกัส
        </button>
        <button
          onClick={() => switchMode('break')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            mode === 'break'
              ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Coffee size={16} />
          พัก
        </button>
      </div>

      <div className="p-8 flex flex-col items-center">
        {/* Session count */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <Timer size={14} />
          <span>Session วันนี้: <strong className="text-indigo-600">{sessions}</strong></span>
        </div>

        {/* Timer display */}
        <div className="relative mb-6">
          {/* Progress ring */}
          <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="6"
            />
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke={mode === 'work' ? '#6366f1' : '#22c55e'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${283 * (progress / 100)} 283`}
              className="transition-all duration-500 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-bold font-mono tracking-wider ${
              mode === 'work' ? 'text-indigo-700' : 'text-green-700'
            }`}>
              {timeDisplay}
            </span>
            <span className={`text-xs mt-1 font-medium ${
              mode === 'work' ? 'text-indigo-400' : 'text-green-400'
            }`}>
              {mode === 'work' ? 'กำลังทำงาน' : 'กำลังพัก'}
            </span>
          </div>
        </div>

        {/* Controls */}
        {showComplete ? (
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Volume2 size={18} className="text-green-500" />
              {mode === 'work' ? '🎉 หมดเวลาโฟกัส!' : '☕ หมดเวลาพัก!'}
            </div>
            <div className="flex gap-3">
              {mode === 'work' ? (
                <>
                  <button
                    onClick={handleStartBreak}
                    className="flex-1 px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
                  >
                    เริ่มพัก {BREAK_MINUTES} นาที
                  </button>
                  <button
                    onClick={handleSkipBreak}
                    className="flex-1 px-6 py-2.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-xl hover:bg-indigo-200 transition-colors"
                  >
                    ข้ามพัก
                  </button>
                </>
              ) : (
                <button
                  onClick={() => switchMode('work')}
                  className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  กลับไปทำงาน
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={isRunning ? pauseTimer : startTimer}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md ${
                isRunning
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
              {isRunning ? 'หยุด' : 'เริ่ม'}
            </button>
            <button
              onClick={resetTimer}
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="รีเซ็ต"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        )}

        {/* Info */}
        <div className="flex items-center gap-4 mt-5 text-xs text-gray-400">
          <span>⏱ {WORK_MINUTES} นาที โฟกัส</span>
          <span>☕ {BREAK_MINUTES} นาที พัก</span>
        </div>
      </div>

      {/* Level Up Overlay */}
      {expResult && (
        <LevelUpOverlay
          result={expResult}
          onClose={() => setExpResult(null)}
        />
      )}
    </div>
  )
}
