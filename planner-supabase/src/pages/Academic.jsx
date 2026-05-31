import { useState, useEffect } from 'react'
import { BookOpen, Plus, Check, Trash2 } from 'lucide-react'
import { supabase } from '../supabase/supabaseClient'

export default function Academic() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Inline Form State
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    type: 'การบ้าน',
    deadline: '',
    priority: 'กลาง'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchItems = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('academic_items')
        .select('*')
        .order('deadline', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (err) {
      console.error('Error fetching academic items:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.subject || !formData.topic) return

    try {
      setIsSubmitting(true)
      const newItem = {
        id: crypto.randomUUID(),
        subject: formData.subject,
        topic: formData.topic,
        type: formData.type,
        deadline: formData.deadline || null,
        priority: formData.priority,
        status: 'Pending'
      }

      const { error } = await supabase.from('academic_items').insert([newItem])
      if (error) throw error

      setItems((prev) => [...prev, newItem].sort((a, b) => new Date(a.deadline) - new Date(b.deadline)))
      setFormData({ subject: '', topic: '', type: 'การบ้าน', deadline: '', priority: 'กลาง' })
      setIsAdding(false)
    } catch (err) {
      console.error('Error adding academic item:', err)
      alert(`Failed to add item: ${err.message || JSON.stringify(err)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Pending' ? 'Completed' : 'Pending'
    
    // Optimistic UI
    setItems(items.map(item => item.id === id ? { ...item, status: newStatus } : item))
    
    try {
      const { error } = await supabase
        .from('academic_items')
        .update({ status: newStatus })
        .eq('id', id)
      
      if (error) throw error
    } catch (err) {
      console.error('Error toggling status:', err)
      // Revert on error
      setItems(items.map(item => item.id === id ? { ...item, status: currentStatus } : item))
    }
  }

  const handleDelete = async (id) => {
    // Optimistic UI for delete
    const previousItems = [...items]
    setItems(items.filter(item => item.id !== id))
    
    try {
      const { error } = await supabase.from('academic_items').delete().eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error('Error deleting item:', err)
      setItems(previousItems) // Revert
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
      
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">งาน/สอบ</h1>
          <p className="text-gray-500 text-lg mt-1">Tasks & Exams</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isAdding 
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
              : 'bg-indigo-500 text-white hover:bg-indigo-600'
          }`}
        >
          <Plus size={18} className={`transform transition-transform ${isAdding ? 'rotate-45' : ''}`} />
          <span className="hidden sm:inline">{isAdding ? 'ยกเลิก' : 'เพิ่มรายการ'}</span>
        </button>
      </header>

      {/* Inline Add Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 animate-[fadeIn_0.15s_ease-out]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วิชา (Subject)</label>
              <input
                required
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="e.g., Math 101"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ (Topic)</label>
              <input
                required
                value={formData.topic}
                onChange={(e) => setFormData({...formData, topic: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="e.g., Midterm Exam"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="การบ้าน">งาน / การบ้าน (Task)</option>
                <option value="สอบ">สอบ (Exam)</option>
                <option value="โปรเจกต์">โปรเจกต์ (Project)</option>
                <option value="งานกลุ่ม">งานกลุ่ม</option>
                <option value="นำเสนอ">นำเสนอ (Presentation)</option>
                <option value="อื่นๆ">อื่นๆ (Others)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ความสำคัญ</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ต่ำ">ต่ำ (Low)</option>
                <option value="กลาง">ปานกลาง (Normal)</option>
                <option value="สูง">สูง (High)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">กำหนดส่ง / วันสอบ</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <section>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen size={32} />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-1">ยังไม่มีกำหนดการ</h3>
            <p className="text-gray-500">เพิ่มงานหรือสอบเพื่อเริ่มต้นจัดการเวลา</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const isCompleted = item.status === 'Completed'
              return (
                <div 
                  key={item.id} 
                  className={`group flex items-start gap-3 p-4 bg-white rounded-xl border transition-all
                    ${isCompleted ? 'border-gray-100 opacity-60 bg-gray-50' : 'border-gray-200 hover:border-indigo-300 shadow-sm'}
                  `}
                >
                  <button 
                    onClick={() => toggleStatus(item.id, item.status)}
                    className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors
                      ${isCompleted ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 bg-white hover:border-indigo-400'}
                    `}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase
                        ${item.type === 'สอบ' ? 'bg-red-50 text-red-600' : item.type === 'โปรเจกต์' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}
                      `}>
                        {item.type}
                      </span>
                      {item.priority === 'สูง' && (
                        <span className="text-[10px] font-bold text-red-500 uppercase">ด่วน</span>
                      )}
                    </div>
                    <p className={`font-semibold transition-colors ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {item.subject}
                    </p>
                    <p className={`text-sm ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.topic}
                    </p>
                    {item.deadline && (
                      <p className={`text-xs mt-1.5 font-medium ${isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
                        📅 {new Date(item.deadline).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

    </div>
  )
}
