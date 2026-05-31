import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, Settings2, CheckCircle2 } from 'lucide-react'

const MODES = {
  POMODORO: { name: 'Pomodoro', minutes: 25, color: 'indigo' },
  SHORT_BREAK: { name: 'Short Break', minutes: 5, color: 'green' },
  LONG_BREAK: { name: 'Long Break', minutes: 15, color: 'blue' }
}

export default function Pomodoro() {
  const [activeMode, setActiveMode] = useState('POMODORO')
  const [timeLeft, setTimeLeft] = useState(MODES.POMODORO.minutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)

  const switchMode = (modeKey) => {
    setActiveMode(modeKey)
    setTimeLeft(MODES[modeKey].minutes * 60)
    setIsRunning(false)
  }

  const toggleTimer = () => setIsRunning(!isRunning)

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(MODES[activeMode].minutes * 60)
  }

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false)
    
    // Play a sound natively
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
      audio.play().catch(e => console.log('Audio play failed:', e))
    } catch (e) {
      console.log('Audio not supported')
    }

    if (activeMode === 'POMODORO') {
      setSessionsCompleted(prev => prev + 1)
      alert("Pomodoro session complete! Time for a break.")
      switchMode('SHORT_BREAK')
    } else {
      alert("Break is over! Time to focus.")
      switchMode('POMODORO')
    }
  }, [activeMode])

  useEffect(() => {
    let interval = null
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1)
      }, 1000)
    } else if (isRunning && timeLeft === 0) {
      handleTimerComplete()
    }
    
    return () => clearInterval(interval)
  }, [isRunning, timeLeft, handleTimerComplete])

  // Format time
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  
  // Progress calc
  const totalSeconds = MODES[activeMode].minutes * 60
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100

  // Theme color mapping
  const activeColor = MODES[activeMode].color

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-12 space-y-8 flex flex-col items-center">
      
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Pomodoro Timer</h1>
        <p className="text-gray-500 mt-2 flex items-center justify-center gap-2">
          <CheckCircle2 size={16} className="text-indigo-500" />
          {sessionsCompleted} เซสชันที่เสร็จสมบูรณ์
        </p>
      </div>

      {/* Mode Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-1.5 flex gap-1 shadow-sm w-full max-w-sm">
        {Object.entries(MODES).map(([key, mode]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeMode === key 
                ? `bg-gray-100 text-gray-900` 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {mode.name}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center bg-white rounded-full border border-gray-100 shadow-[0_0_50px_-12px_rgba(0,0,0,0.05)]">
        {/* SVG Progress Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="48"
            className="stroke-gray-100"
            strokeWidth="2"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="48"
            className={`transition-all duration-1000 ease-linear ${
              activeColor === 'indigo' ? 'stroke-indigo-500' :
              activeColor === 'green' ? 'stroke-green-500' : 'stroke-blue-500'
            }`}
            strokeWidth="4"
            fill="none"
            strokeDasharray="301.59" // 2 * PI * 48
            strokeDashoffset={301.59 - (progressPercent / 100) * 301.59}
            strokeLinecap="round"
          />
        </svg>

        {/* Time Text */}
        <div className="text-center z-10">
          <h2 className="text-6xl md:text-7xl font-bold text-gray-900 tracking-tighter tabular-nums">
            {timeString}
          </h2>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTimer}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 ${
            activeColor === 'indigo' ? 'bg-indigo-500 hover:bg-indigo-600' :
            activeColor === 'green' ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isRunning ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
        </button>
        
        <button 
          onClick={resetTimer}
          className="w-12 h-12 bg-white border border-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="Reset Timer"
        >
          <RotateCcw size={20} />
        </button>
      </div>

    </div>
  )
}
