import { useState, useEffect } from 'react'
import { Sparkles, X, Loader2, Brain } from 'lucide-react'

export default function HabitAnalyzer({ isOpen, onClose, habits, habitLogs }) {
  const [analysis, setAnalysis] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && habits.length > 0 && !analysis) {
      analyzeHabits()
    }
  }, [isOpen, habits])

  const analyzeHabits = async () => {
    setIsLoading(true)
    setError('')
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY
      if (!apiKey) throw new Error("API Key ไม่ได้ถูกตั้งค่า กรุณาตั้งค่า VITE_GROQ_API_KEY ในไฟล์ .env.local")

      // เตรียมข้อมูลให้ AI
      const promptData = habits.map(h => {
        const logsForHabit = habitLogs.filter(l => l.habit_id === h.id)
        const totalDays = logsForHabit.length
        const doneDays = logsForHabit.filter(l => l.done).length
        return {
          นิสัย: h.name,
          ทำสำเร็จ: doneDays,
          จำนวนวันที่บันทึก: totalDays,
          อัตราความสำเร็จ: totalDays > 0 ? Math.round((doneDays / totalDays) * 100) + '%' : '0%'
        }
      })

      const promptText = `
คุณคือ "Habit Coach" นักจิตวิทยาและโค้ชส่วนตัวผู้เชี่ยวชาญด้านการสร้างนิสัย
นี่คือข้อมูลการทำ Habit (นิสัย) ประจำเดือนของผู้ใช้งาน:
${JSON.stringify(promptData, null, 2)}

โปรดวิเคราะห์ข้อมูลนี้และเขียนสรุปโดยมีโครงสร้างดังนี้:
1. ชมเชยนิสัยที่ทำได้ดี (อัตราความสำเร็จสูง)
2. แนะนำวิธีปรับปรุงนิสัยที่ยังทำได้ไม่ดี หรือแนะนำทริคเชิงจิตวิทยาเล็กๆ น้อยๆ เพื่อให้ทำได้สม่ำเสมอขึ้น
3. คำคมหรือข้อความให้กำลังใจปิดท้าย

ขอให้ใช้ภาษาที่เป็นกันเอง สุภาพ ให้กำลังใจ สั้นกระชับ (ไม่เกิน 15 บรรทัด) และมีการใช้ Emoji ประกอบเพื่อให้อ่านง่าย
`

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: promptText }],
          temperature: 0.7,
          max_tokens: 1000
        })
      })

      if (!response.ok) {
        throw new Error("เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI")
      }

      const data = await response.json()
      setAnalysis(data.choices[0].message.content)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-accent-soft">
          <div className="flex items-center gap-2">
            <div className="bg-accent p-1.5 rounded-lg text-white">
              <Brain size={20} />
            </div>
            <h2 className="text-lg font-bold text-fg">AI Habit Analyzer</h2>
          </div>
          <button
            onClick={onClose}
            className="text-meta hover:text-muted hover:bg-gray-200/50 p-1.5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-accent">
              <Loader2 size={40} className="animate-spin mb-4" />
              <p className="text-sm font-medium animate-pulse text-accent">กำลังวิเคราะห์พฤติกรรมของคุณ...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm text-center">
              {error}
            </div>
          ) : (
            <div className="prose prose-sm sm:prose-base prose-indigo max-w-none text-fg-2 whitespace-pre-wrap leading-relaxed">
              {analysis}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-surface-warm flex justify-end">
          <button
            onClick={analyzeHabits}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover active:scale-95 text-white text-sm font-medium rounded-lg transition-all shadow-card disabled:opacity-70 disabled:active:scale-100"
          >
            <Sparkles size={16} />
            วิเคราะห์ใหม่
          </button>
        </div>
      </div>
    </div>
  )
}
