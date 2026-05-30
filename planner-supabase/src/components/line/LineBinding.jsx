import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../supabase/supabaseClient'
import { MessageCircle, Link2, Link2Off, ExternalLink, Loader, Smartphone } from 'lucide-react'

const LIFF_ID = import.meta.env.VITE_LIFF_ID

export default function LineBinding() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [binding, setBinding] = useState(false)
  const [liffReady, setLiffReady] = useState(false)
  const liffRef = useRef(null)
  const [message, setMessage] = useState(null)

  // Load current user profile
  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setProfile(data || null)
    } catch (err) {
      console.error('Load profile error:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProfile() }, [loadProfile])

  // Initialize LIFF once and share instance via ref
  const initLiffOnce = useCallback(async () => {
    if (liffRef.current) return liffRef.current
    const liffModule = await import('@line/liff')
    const liff = liffModule.default
    await liff.init({ liffId: LIFF_ID })
    liffRef.current = liff
    return liff
  }, [])

  // Auto-initialize LIFF on mount (handles redirect-back from login)
  useEffect(() => {
    if (!LIFF_ID) return

    let cancelled = false

    const init = async () => {
      try {
        const liff = await initLiffOnce()
        if (cancelled) return
        setLiffReady(true)

        // Check if we just came back from LINE login
        if (liff.isLoggedIn()) {
          setBinding(true)
          setMessage({ type: 'success', text: 'เชื่อมต่อ LINE สำเร็จ! กำลังบันทึกข้อมูล...' })

          try {
            const lineProfile = await liff.getProfile()
            const lineUserId = lineProfile.userId

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase
              .from('user_profiles')
              .upsert({
                id: user.id,
                email: user.email,
                line_user_id: lineUserId,
              }, { onConflict: 'id' })

            if (error) throw error

            if (!cancelled) {
              setProfile(prev => ({ ...prev, line_user_id: lineUserId, email: user.email }))
              setMessage({ type: 'success', text: 'เชื่อมต่อบัญชี LINE เรียบร้อย! 🎉' })
            }
          } catch (err) {
            if (!cancelled) {
              setMessage({ type: 'error', text: `เชื่อมต่อไม่สำเร็จ: ${err.message}` })
            }
          } finally {
            liff.logout()
            if (!cancelled) setBinding(false)
            setTimeout(() => setMessage(null), 4000)
          }
        }
      } catch (err) {
        console.error('LIFF init error:', err.message)
      }
    }

    init()
    return () => { cancelled = true }
  }, [LIFF_ID, initLiffOnce])

  // Open LIFF for LINE binding
  const handleBindLine = async () => {
    if (!LIFF_ID) {
      setMessage({ type: 'error', text: 'กรุณาตั้งค่า VITE_LIFF_ID ใน .env.local ก่อน' })
      setTimeout(() => setMessage(null), 4000)
      return
    }

    try {
      const liff = await initLiffOnce()

      if (!liff.isLoggedIn()) {
        liff.login()
        return // Will resume after redirect
      }

      setBinding(true)
      setMessage(null)

      // Get LINE profile
      const lineProfile = await liff.getProfile()
      const lineUserId = lineProfile.userId

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: user.email,
          line_user_id: lineUserId,
        }, { onConflict: 'id' })

      if (error) throw error

      setProfile(prev => ({ ...prev, line_user_id: lineUserId, email: user.email }))
      setMessage({ type: 'success', text: 'เชื่อมต่อบัญชี LINE เรียบร้อย! 🎉' })

      // Logout from LIFF
      liff.logout()
    } catch (err) {
      console.error('LINE binding error:', err.message)
      setMessage({ type: 'error', text: `เชื่อมต่อไม่สำเร็จ: ${err.message}` })
    } finally {
      setBinding(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  // Disconnect LINE
  const handleUnlinkLine = async () => {
    if (!confirm('ต้องการยกเลิกการเชื่อมต่อ LINE หรือไม่?')) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_profiles')
        .update({ line_user_id: null })
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => prev ? { ...prev, line_user_id: null } : null)
      setMessage({ type: 'success', text: 'ยกเลิกการเชื่อมต่อ LINE เรียบร้อย' })
    } catch (err) {
      console.error('Unlink error:', err.message)
      setMessage({ type: 'error', text: `เกิดข้อผิดพลาด: ${err.message}` })
    }
    setTimeout(() => setMessage(null), 4000)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Loader size={20} className="animate-spin text-indigo-600 mx-auto" />
        <p className="text-sm text-gray-400 mt-2">กำลังโหลด...</p>
      </div>
    )
  }

  const isBound = profile?.line_user_id

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Message */}
      {message && (
        <div className={`px-5 py-3 text-sm font-medium flex items-center gap-2 border-b ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.type === 'success' ? '✅ ' : '❌ '}
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-green-600" />
          <h3 className="font-semibold text-gray-900">เชื่อมต่อ LINE</h3>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          รับการแจ้งเตือนและบันทึกรายการผ่าน LINE
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isBound ? 'bg-green-50' : 'bg-gray-100'
            }`}>
              {isBound ? (
                <MessageCircle size={20} className="text-green-600" />
              ) : (
                <MessageCircle size={20} className="text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isBound ? 'เชื่อมต่อ LINE แล้ว' : 'ยังไม่ได้เชื่อมต่อ LINE'}
              </p>
              <p className="text-xs text-gray-400">
                {isBound
                  ? 'สามารถรับการแจ้งเตือนและใช้คำสั่งผ่าน LINE ได้'
                  : 'เชื่อมต่อเพื่อรับการแจ้งเตือนทาง LINE'}
              </p>
            </div>
          </div>
          <div>
            {isBound ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                <Link2 size={12} />
                เชื่อมต่อแล้ว
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-400 text-xs font-medium rounded-full">
                <Link2Off size={12} />
                ยังไม่ได้เชื่อมต่อ
              </span>
            )}
          </div>
        </div>

        {/* LINE Features Info */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
            <Smartphone size={14} />
            ความสามารถเมื่อเชื่อมต่อ LINE:
          </p>
          <ul className="text-xs text-gray-500 space-y-1.5 pl-1">
            <li>🔔 แจ้งเตือนเมื่อใกล้ถึงกำหนดส่งงาน/สอบ</li>
            <li>💬 บันทึกรายการผ่าน LINE: <code className="bg-gray-200 px-1 rounded text-[10px]">จ่าย 50 ข้าวแกง</code></li>
            <li>📊 สรุปรายรับ-รายจ่าย: พิมพ์ <code className="bg-gray-200 px-1 rounded text-[10px]">สรุป</code></li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isBound ? (
            <button
              onClick={handleBindLine}
              disabled={binding}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {binding ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <ExternalLink size={16} />
              )}
              {binding ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ LINE'}
            </button>
          ) : (
            <button
              onClick={handleUnlinkLine}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
            >
              <Link2Off size={16} />
              ยกเลิกการเชื่อมต่อ
            </button>
          )}
        </div>

        {/* LIFF ID warning */}
        {!LIFF_ID && !isBound && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700">
              ⚠️ ยังไม่ได้ตั้งค่า <code className="bg-amber-100 px-1 rounded">VITE_LIFF_ID</code> 
              ใน .env.local — ไปที่ <a href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer" className="underline font-medium">LINE Developers Console</a> 
              เพื่อสร้าง LIFF app และรับ LIFF ID
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
