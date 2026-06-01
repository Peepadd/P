import { useState } from 'react'
import { Sparkles, X, Loader2, Send, CheckCircle2 } from 'lucide-react'

export default function TimetableAssistant({ isOpen, onClose, config, subjects, onApplySchedule }) {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY
      if (!apiKey) throw new Error("API Key ไม่ได้ถูกตั้งค่า กรุณาตั้งค่า VITE_GROQ_API_KEY ในไฟล์ .env.local")

      const subjectNames = subjects.map(s => s.name).join(', ')

      const systemPrompt = `
You are a Timetable Scheduling AI.
The timetable has 5 days (dayIdx: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday).
There are ${config?.periods || 6} periods per day (periodIdx: 0 to ${(config?.periods || 6) - 1}).
Available subjects: ${subjectNames || 'None, you can invent short names based on request'}.

User request: "${prompt}"

Your task is to generate the schedule based on the user request.
You MUST output ONLY a valid JSON array of objects, without any markdown formatting, no \`\`\`json, no conversational text.
Example format:
[
  { "dayIdx": 0, "periodIdx": 0, "subject": "Math", "teacher": "", "room": "", "note": "" },
  { "dayIdx": 0, "periodIdx": 1, "subject": "Science", "teacher": "Mr.Smith", "room": "Lab 1", "note": "" }
]
`

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: systemPrompt }],
          temperature: 0.3, // low temp for JSON formatting
          max_tokens: 1500
        })
      })

      if (!response.ok) {
        throw new Error("เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI")
      }

      const data = await response.json()
      let rawText = data.choices[0].message.content.trim()
      
      // Clean up if AI still includes markdown
      if (rawText.startsWith('```json')) rawText = rawText.replace(/```json/g, '')
      if (rawText.startsWith('```')) rawText = rawText.replace(/```/g, '')
      rawText = rawText.trim()

      const generatedCells = JSON.parse(rawText)
      
      if (!Array.isArray(generatedCells)) {
        throw new Error("AI ตอบกลับมาผิดรูปแบบ ไม่เป็น Array")
      }

      onApplySchedule(generatedCells)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        setPrompt('')
      }, 2000)

    } catch (err) {
      console.error(err)
      setError("AI จัดตารางไม่สำเร็จ: " + err.message + " (กรุณาลองเปลี่ยนคำสั่งให้ชัดเจนขึ้น)")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-500 p-1.5 rounded-lg text-white">
              <Sparkles size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">AI ช่วยจัดตาราง</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 p-1.5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            บอกความต้องการของคุณให้ AI จัดตารางให้ เช่น <br/>
            <span className="text-indigo-600 font-medium">"มีวิชาคณิต, วิทย์, อังกฤษ จัดวิชาละ 2 คาบในช่วงเช้าของวันจันทร์ พุธ ศุกร์"</span>
          </p>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="พิมพ์โจทย์ของคุณที่นี่..."
            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[120px]"
            disabled={isLoading || success}
          />

          {error && (
            <div className="mt-3 bg-red-50 text-red-600 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mt-3 bg-green-50 text-green-700 p-3 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 size={18} />
              จัดตารางสำเร็จ! ระบบอัปเดตช่องเวลาให้แล้ว
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleGenerate}
            disabled={isLoading || success || !prompt.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-medium rounded-xl transition-all shadow-sm shadow-indigo-200 disabled:opacity-70 disabled:active:scale-100"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                กำลังเสกตาราง...
              </>
            ) : (
              <>
                <Send size={16} />
                สร้างตาราง
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
