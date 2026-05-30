import { useEffect, useState, useCallback, useRef } from 'react'
import { Bell, BellRing, BellOff, X, Volume2, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useNotificationChecker from '../../hooks/useNotificationChecker'

// Generate notification sound using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, ctx.currentTime) // A5
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1) // E5
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2) // A5
    oscillator.frequency.setValueAtTime(1108, ctx.currentTime + 0.3) // C#6

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)

    // Cleanup after done
    oscillator.onended = () => ctx.close()
  } catch {
    // Audio not available, silently fail
  }
}

// Play a softer chime for less urgent notifications
function playChimeSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(660, ctx.currentTime)
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.15)

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.4)

    oscillator.onended = () => ctx.close()
  } catch {
    // Silently fail
  }
}

export default function NotificationListener() {
  const {
    notifications,
    permission,
    requestPermission,
    clearNotification,
    clearAll,
  } = useNotificationChecker()

  const navigate = useNavigate()
  const [showPanel, setShowPanel] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const previousCount = useRef(0)
  const panelRef = useRef(null)

  // Request permission on mount (with slight delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'default') {
        setShowPrompt(true)
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  // When new notifications arrive, send browser notification + sound
  useEffect(() => {
    if (notifications.length > previousCount.current) {
      const newOnes = notifications.slice(previousCount.current)

      newOnes.forEach((notif) => {
        // Play sound
        if (notif.urgency === 'overdue') {
          playNotificationSound()
        } else {
          playChimeSound()
        }

        // Send browser notification if permission granted
        if (permission) {
          try {
            const browserNotif = new Notification(notif.title, {
              body: notif.body,
              icon: '/favicon.ico',
              tag: notif.id,
              requireInteraction: notif.urgency === 'overdue',
              silent: true, // We handle sound ourselves
            })

            browserNotif.onclick = () => {
              window.focus()
              if (notif.link) {
                navigate(notif.link)
              }
              browserNotif.close()
            }

            // Auto close after 8 seconds
            setTimeout(() => browserNotif.close(), 8000)
          } catch {
            // Browser notification failed
          }
        }
      })
    }
    previousCount.current = notifications.length
  }, [notifications, permission, navigate])

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false)
      }
    }
    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPanel])

  const handleBellClick = useCallback(() => {
    if (!permission) {
      requestPermission()
    }
    setShowPanel((prev) => !prev)
  }, [permission, requestPermission])

  const handleNotificationClick = useCallback((notif) => {
    if (notif.link) {
      navigate(notif.link)
    }
    clearNotification(notif.id)
    setShowPanel(false)
  }, [navigate, clearNotification])

  if (!('Notification' in window)) return null

  const unreadCount = notifications.length

  return (
    <>
      {/* Permission prompt */}
      {showPrompt && (
        <div className="fixed bottom-4 right-4 z-50 animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 max-w-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Bell size={16} className="text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900">เปิดการแจ้งเตือน?</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  รับการแจ้งเตือนเมื่อถึงกำหนดส่งงาน ซื้อของ และสอบ
                </p>
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    onClick={() => {
                      requestPermission()
                      setShowPrompt(false)
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    เปิดการแจ้งเตือน
                  </button>
                  <button
                    onClick={() => setShowPrompt(false)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ไม่ตอนนี้
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowPrompt(false)}
                className="p-0.5 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification bell button */}
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        title={permission ? 'การแจ้งเตือนเปิดอยู่' : 'คลิกเพื่อเปิดการแจ้งเตือน'}
      >
        {notifications.length > 0 ? (
          <BellRing size={18} className="text-indigo-600 animate-[bellRing_0.5s_ease-in-out]" />
        ) : permission ? (
          <Bell size={18} />
        ) : (
          <BellOff size={18} className="text-gray-300" />
        )}

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] min-h-[18px] shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification panel */}
      {showPanel && (
        <div
          ref={panelRef}
          className="absolute top-full right-0 mt-1 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-[fadeIn_0.15s_ease-out]"
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-900">การแจ้งเตือน</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-gray-400">({unreadCount})</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Permission indicator */}
              <span
                className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                  permission
                    ? 'bg-green-50 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${permission ? 'bg-green-500' : 'bg-gray-300'}`} />
                {permission ? 'เปิดอยู่' : 'ปิด'}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="ล้างทั้งหมด"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-50 flex items-center justify-center">
                  <Volume2 size={18} className="text-green-500" />
                </div>
                <p className="text-sm text-gray-400 font-medium">ไม่มีการแจ้งเตือน</p>
                <p className="text-xs text-gray-300 mt-1">
                  เราจะแจ้งเตือนคุณเมื่อใกล้ถึงกำหนด
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className="w-full text-left px-4 py-3 hover:bg-indigo-50/50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            notif.urgency === 'overdue'
                              ? 'bg-red-500 animate-pulse'
                              : notif.urgency === '30 นาที'
                              ? 'bg-orange-500'
                              : notif.urgency === 'วันนี้'
                              ? 'bg-emerald-500'
                              : 'bg-indigo-400'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {notif.title}
                          </span>
                          <ExternalLink size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notif.body}
                        </p>
                        <span
                          className={`inline-block text-[10px] mt-1 font-medium px-1.5 py-0.5 rounded-full ${
                            notif.urgency === 'overdue'
                              ? 'bg-red-50 text-red-500'
                              : notif.urgency === '30 นาที'
                              ? 'bg-orange-50 text-orange-600'
                              : notif.urgency === 'วันนี้'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-indigo-50 text-indigo-600'
                          }`}
                        >
                          {notif.urgency === 'overdue'
                            ? 'เลยกำหนด'
                            : notif.urgency === 'วันนี้'
                            ? 'วันนี้'
                            : `เหลือ ${notif.urgency}`}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!permission && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  requestPermission()
                }}
                className="w-full py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                🔔 เปิดการแจ้งเตือนจากบราวเซอร์
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
