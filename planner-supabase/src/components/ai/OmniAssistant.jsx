import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabase/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Sparkles, X, Send, Loader2, Bot, User, BrainCircuit, TrendingUp, GraduationCap } from 'lucide-react'
import { processAgentChat } from '../../utils/agentRouter'

export default function OmniAssistant() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', agentName: 'Manager', content: 'สวัสดีฮันเตอร์! ผมคือ Manager คุณต้องการให้ผมช่วยเรียก Javis (จัดการชีวิต) หรือ Buff (จัดการพอร์ตหุ้น) ดีครับ?' }
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
    if (isOpen && !contextData && user) {
      fetchContext()
    }
  }, [isOpen, user])

  const fetchContext = async () => {
    try {
      // Javis Context
      const { data: quests } = await supabase.from('academic_items').select('*').neq('status', 'เสร็จแล้ว')
      const { data: habits } = await supabase.from('habits').select('*')
      const { data: timetables } = await supabase.from('timetables').select('*').order('updated_at', { ascending: false }).limit(1)

      // Buff Context (Stocks)
      const { data: trades } = await supabase.from('trades').select('*').order('date', { ascending: false }).limit(5)

      setContextData({
        quests: quests || [],
        habits: habits || [],
        timetable: timetables?.[0] || null,
        trades: trades || []
      })
    } catch (err) {
      console.error('Failed to fetch context:', err)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !user) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const chatHistory = messages.slice(-5).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))

      // Delegate to Agent Router
      const response = await processAgentChat(userMessage, chatHistory, contextData, user)

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          agentName: response.agentName,
          content: response.reply,
          actionsExecuted: response.actionsExecuted
        }
      ])

      // Refresh context after potential DB changes
      if (response.actionsExecuted && response.actionsExecuted.length > 0) {
        fetchContext()
      }

    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'assistant', agentName: 'Manager', content: 'เกิดข้อผิดพลาดในการประมวลผลครับ 😔 (โปรดลองใหม่อีกครั้ง)', isError: true }])
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

  const getAgentIcon = (agentName) => {
    if (agentName === 'Javis') return <GraduationCap size={16} />;
    if (agentName === 'Buff') return <TrendingUp size={16} />;
    return <BrainCircuit size={16} />;
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 md:bottom-10 md:right-8 z-50 flex items-center justify-center p-4 bg-accent text-white rounded-full shadow-raised hover:shadow-raised transition-all group"
        >
          <Sparkles size={24} className="group-hover:animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:bottom-10 md:right-8 z-50 w-[380px] h-[550px] max-h-[80vh] max-w-[calc(100vw-32px)] bg-surface rounded-lg shadow-raised border border-border flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-accent text-white shadow-raised">
            <div className="flex items-center gap-2">
              <div className="bg-surface/20 p-1.5 rounded-lg">
                <BrainCircuit size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Agent Router</h3>
                <p className="text-[10px] text-accent/30 leading-tight">Javis (Life) | Buff (Wealth)</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-surface/20 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-warm/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-card mt-1 ${
                    msg.agentName === 'Javis' ? 'bg-accent' :
                    msg.agentName === 'Buff' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                    'bg-muted'
                  }`}>
                    {getAgentIcon(msg.agentName)}
                  </div>
                )}

                <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.role === 'assistant' && msg.agentName && (
                     <span className="text-[10px] text-muted font-medium ml-1">{msg.agentName}</span>
                  )}
                  <div className={`px-4 py-2.5 rounded-lg text-sm leading-relaxed shadow-card ${
                    msg.role === 'user'
                      ? 'bg-accent text-white rounded-tr-sm'
                      : msg.isError
                        ? 'bg-red-50 text-red-600 border border-red-100 rounded-tl-sm'
                        : 'bg-surface border border-border text-fg-2 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>

                  {/* Action Results */}
                  {msg.actionsExecuted && msg.actionsExecuted.length > 0 && (
                    <div className="flex flex-col gap-1 mt-1">
                      {msg.actionsExecuted.map((res, i) => (
                        <span key={i} className={`text-[10px] font-medium px-2 py-1 rounded-md ${
                          res.includes('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700 border border-green-100 shadow-card'
                        }`}>
                          {res}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-muted shrink-0 mt-1">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-white shrink-0 shadow-card mt-1">
                  <BrainCircuit size={16} />
                </div>
                <div className="px-4 py-3 rounded-lg rounded-tl-sm bg-surface border border-border shadow-card flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-muted" />
                  <span className="text-xs text-muted animate-pulse">Routing to Agent...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-surface border-t border-border">
            <div className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="สั่งงานให้ Javis หรือ Buff..."
                className="w-full pl-4 pr-12 py-3 text-sm bg-bg border border-border rounded-md focus:ring-2 focus:ring-accent focus:bg-surface outline-none resize-none max-h-32 min-h-[48px] overflow-hidden"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 text-white bg-accent hover:bg-accent-hover disabled:bg-muted disabled:text-meta rounded-lg transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
