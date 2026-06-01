import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabase/supabaseClient'
import { Sparkles, X, Send, Loader2, Bot, User, CheckCircle2, AlertTriangle, MessageSquare } from 'lucide-react'

export default function OmniAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'สวัสดีฮันเตอร์! มีอะไรให้ผมช่วยจัดการไหมครับ? (เช่น สรุปงานวันนี้ให้ฟังหน่อย, หรือ เพิ่มงาน "ส่งรายงานวิทย์" ให้หน่อย)' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [contextData, setContextData] = useState(null)
  
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch context data when opened
  useEffect(() => {
    if (isOpen && !contextData) {
      fetchContext()
    }
  }, [isOpen])

  const fetchContext = async () => {
    try {
      // Fetch Academic (Quests)
      const { data: quests } = await supabase
        .from('academic_items')
        .select('*')
        .neq('status', 'เสร็จแล้ว')

      // Fetch Habits
      const { data: habits } = await supabase
        .from('habits')
        .select('*')

      // Fetch Timetables
      const { data: timetables } = await supabase
        .from('timetables')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1) // Get active timetable

      setContextData({
        quests: quests || [],
        habits: habits || [],
        timetable: timetables?.[0] || null
      })
    } catch (err) {
      console.error('Failed to fetch context:', err)
    }
  }

  const executeActions = async (actions) => {
    if (!actions || actions.length === 0) return []
    const results = []

    for (const action of actions) {
      try {
        if (action.type === 'add_quest') {
          const { error } = await supabase.from('academic_items').insert({
            title: action.payload.title,
            subject: action.payload.subject || 'อื่นๆ',
            type: 'งาน/การบ้าน',
            status: 'ยังไม่เริ่ม',
            created_at: new Date().toISOString()
          })
          if (error) throw error
          results.push(`✅ เพิ่มเควสต์: ${action.payload.title}`)
        } 
        else if (action.type === 'add_habit') {
          const { error } = await supabase.from('habits').insert({
            name: action.payload.name,
            color: action.payload.color || '#6366f1',
            created_at: new Date().toISOString()
          })
          if (error) throw error
          results.push(`✅ เพิ่มนิสัย: ${action.payload.name}`)
        }
      } catch (err) {
        results.push(`❌ การกระทำล้มเหลว (${action.type}): ${err.message}`)
      }
    }
    
    // Refresh context after actions
    fetchContext()
    return results
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY
      if (!apiKey) throw new Error('VITE_GROQ_API_KEY is missing')

      const systemPrompt = `
You are "Omni", an intelligent and extremely helpful personal assistant for a productivity planner app. 
You speak fluent Thai in an enthusiastic, polite, and gamer-like tone (calling the user "ฮันเตอร์" or "Hunter").
You have access to the user's current app state:
- Quests (Pending Tasks): ${JSON.stringify(contextData?.quests)}
- Habits: ${JSON.stringify(contextData?.habits)}
- Active Timetable: ${JSON.stringify(contextData?.timetable)}

You can answer questions about their schedule or tasks.
You can ALSO perform actions if the user requests it (like adding a new task or habit).

AVAILABLE ACTIONS:
1. "add_quest": { "title": "Task name", "subject": "Subject name" }
2. "add_habit": { "name": "Habit name", "color": "#hex code" }

You MUST ONLY reply in JSON format with exactly this structure:
{
  "reply": "Your conversational response to the user. Use emojis. Keep it concise.",
  "actions": [
    { "type": "add_quest", "payload": { "title": "Homework", "subject": "Math" } }
  ]
}
Note: If no actions are needed, leave the actions array empty []. Do not include any markdown blockquotes, return raw JSON string.
`
      // Prepare conversation history (last 5 messages)
      const chatHistory = messages.slice(-5).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            ...chatHistory,
            { role: "user", content: userMessage }
          ],
          temperature: 0.4,
          max_tokens: 1000
        })
      })

      if (!response.ok) throw new Error('API Error')

      const data = await response.json()
      const aiResponse = JSON.parse(data.choices[0].message.content)

      // Execute actions if any
      let actionResults = []
      if (aiResponse.actions && aiResponse.actions.length > 0) {
        actionResults = await executeActions(aiResponse.actions)
      }

      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: aiResponse.reply,
          actionsExecuted: actionResults 
        }
      ])

    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'assistant', content: 'เกิดข้อผิดพลาดในการประมวลผลครับ 😔 (โปรดลองใหม่อีกครั้ง)', isError: true }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 md:bottom-10 md:right-8 z-50 flex items-center justify-center p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all active:scale-95 group"
        >
          <Sparkles size={24} className="group-hover:animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:bottom-10 md:right-8 z-50 w-[380px] h-[550px] max-h-[80vh] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Omni AI</h3>
                <p className="text-[10px] text-indigo-100 opacity-90 leading-tight">ผู้ช่วยส่วนตัวครอบจักรวาล</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-sm mt-1">
                    <Bot size={16} />
                  </div>
                )}
                
                <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-sm' 
                      : msg.isError 
                        ? 'bg-red-50 text-red-600 border border-red-100 rounded-tl-sm'
                        : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  
                  {/* Action Results */}
                  {msg.actionsExecuted && msg.actionsExecuted.length > 0 && (
                    <div className="flex flex-col gap-1 mt-1">
                      {msg.actionsExecuted.map((res, i) => (
                        <span key={i} className={`text-[10px] font-medium px-2 py-1 rounded-md ${
                          res.includes('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700 border border-green-100 shadow-sm'
                        }`}>
                          {res}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 shrink-0 mt-1">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-sm mt-1">
                  <Bot size={16} />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-gray-100 shadow-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-indigo-500" />
                  <span className="text-xs text-gray-500 animate-pulse">กำลังประมวลผล...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="คุยหรือสั่งงาน AI ได้เลย..."
                className="w-full pl-4 pr-12 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none resize-none max-h-32 min-h-[48px] overflow-hidden"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 rounded-lg transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
              <Sparkles size={10} /> ขับเคลื่อนด้วย Groq AI & Llama 3
            </p>
          </div>
        </div>
      )}
    </>
  )
}
