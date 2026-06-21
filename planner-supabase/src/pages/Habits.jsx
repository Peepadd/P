import { useState, useEffect } from 'react'
import { CheckSquare, Plus, Trash2, Activity } from 'lucide-react'
import { supabase } from '../supabase/supabaseClient'

export default function Habits() {
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)

  const [newTitle, setNewTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchHabits = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      setHabits(data || [])
    } catch (err) {
      console.error('Error fetching habits:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHabits()
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    try {
      setIsSubmitting(true)
      const newHabit = {
        id: crypto.randomUUID(),
        name: newTitle.trim(),
        frequency: 'Daily'
      }

      const { error } = await supabase.from('habits').insert([newHabit])
      if (error) throw error

      setHabits([...habits, newHabit])
      setNewTitle('')
    } catch (err) {
      console.error('Error adding habit:', err)
      alert('Failed to add habit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    // Optimistic delete
    const previous = [...habits]
    setHabits(habits.filter(h => h.id !== id))

    try {
      const { error } = await supabase.from('habits').delete().eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error('Error deleting habit:', err)
      setHabits(previous)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">สร้างนิสัย</h1>
          <p className="text-muted text-lg mt-1">Habit Builder</p>
        </div>
      </header>

      {/* Inline Add Form */}
      <div className="bg-surface rounded-md border border-border p-2 shadow-card">
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <div className="w-10 h-10 bg-accent-soft text-accent rounded-lg flex items-center justify-center shrink-0 ml-1">
            <Activity size={20} />
          </div>
          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 bg-transparent px-2 py-2 text-gray-900 placeholder-gray-400 focus:outline-none"
            placeholder="นิสัยที่คุณต้องการสร้าง..."
          />
          <button
            type="submit"
            disabled={isSubmitting || !newTitle.trim()}
            className="w-10 h-10 bg-accent text-white rounded-lg flex items-center justify-center shrink-0 hover:bg-accent-hover transition-colors disabled:opacity-50 mr-1"
          >
            <Plus size={20} />
          </button>
        </form>
      </div>

      {/* Habits List */}
      <section>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-md animate-pulse" />
            ))}
          </div>
        ) : habits.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-md border border-border">
            <CheckSquare size={32} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-1">ยังไม่ได้ตั้งเป้าหมาย</h3>
            <p className="text-muted">เริ่มสร้างนิสัยใหม่ของคุณได้ที่นี่</p>
          </div>
        ) : (
          <div className="space-y-2">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="group flex items-center justify-between p-4 bg-surface rounded-md border border-border hover:border-accent shadow-card transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full border-2 border-accent bg-accent-soft flex items-center justify-center shrink-0" />
                  <p className="font-semibold text-gray-900">{habit.title || habit.name}</p>
                </div>

                <button
                  onClick={() => handleDelete(habit.id)}
                  className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                  title="หยุดติดตาม"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
