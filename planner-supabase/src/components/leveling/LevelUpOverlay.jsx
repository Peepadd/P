import { useEffect, useRef } from 'react'

/**
 * LevelUpOverlay — แสดง animation เมื่อ Level Up
 * ใช้แทน alert() ทั้งโปรเจกต์
 *
 * Props:
 *   result: { expGained, leveledUp, rankUp, oldLevel, newLevel, newRank, description? }
 *   onClose: () => void
 */
export default function LevelUpOverlay({ result, onClose }) {
  const overlayRef = useRef(null)

  // Auto-close หลัง 4 วินาที (ถ้าไม่ level up)
  useEffect(() => {
    if (!result) return
    const timeout = result.leveledUp ? 5000 : 2500
    const timer = setTimeout(onClose, timeout)
    return () => clearTimeout(timer)
  }, [result, onClose])

  // ปิดเมื่อกด backdrop
  const handleBackdropClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  if (!result) return null

  const { expGained, leveledUp, rankUp, oldLevel, newLevel, newRank, description } = result

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      {leveledUp ? (
        // ====== LEVEL UP SCREEN ======
        <div
          className="relative flex flex-col items-center text-center px-8 py-10 rounded-3xl max-w-sm w-full mx-4"
          style={{
            background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
            border: '1px solid rgba(139, 92, 246, 0.5)',
            boxShadow: '0 0 60px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            animation: 'levelUpPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          {/* Glow rings */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '1.5rem',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.3) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />

          {/* Stars effect */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 4, height: 4,
                background: '#a78bfa',
                borderRadius: '50%',
                top: `${10 + Math.random() * 80}%`,
                left: `${5 + Math.random() * 90}%`,
                animation: `starTwinkle ${1 + Math.random()}s ${Math.random() * 0.5}s infinite alternate ease-in-out`,
                opacity: 0.7,
              }}
            />
          ))}

          {/* Badge */}
          <div style={{
            fontSize: 14, fontWeight: 700, letterSpacing: '0.2em',
            color: '#a78bfa', textTransform: 'uppercase', marginBottom: 8,
          }}>
            ⚡ System Alert
          </div>

          {/* Headline */}
          <div style={{
            fontSize: 38, fontWeight: 900, color: '#ffffff',
            letterSpacing: '0.05em', lineHeight: 1,
            textShadow: '0 0 30px rgba(167,139,250,0.8)',
            animation: 'glowPulse 1.5s ease-in-out infinite alternate',
          }}>
            LEVEL UP!
          </div>

          {/* Level number */}
          <div style={{ marginTop: 16, marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>Lv.</span>
            <span style={{
              fontSize: 52, fontWeight: 900, color: '#c4b5fd',
              fontVariantNumeric: 'tabular-nums',
              textShadow: '0 0 20px rgba(196,181,253,0.6)',
            }}>{newLevel}</span>
          </div>

          {/* Rank badge */}
          <div style={{
            display: 'inline-block',
            padding: '4px 16px',
            borderRadius: 999,
            background: getRankBg(newRank),
            color: getRankColor(newRank),
            fontWeight: 800, fontSize: 13, letterSpacing: '0.15em',
            marginBottom: 16,
          }}>
            {rankUp ? `🎖️ ${newRank} (RANK UP!)` : newRank}
          </div>

          {/* EXP gained */}
          <div style={{
            fontSize: 13, color: '#94a3b8', marginBottom: 20,
          }}>
            {description || 'ความพยายามสัมฤทธิ์ผล!'}<br />
            <span style={{ color: '#34d399', fontWeight: 700 }}>+{expGained} EXP</span>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '10px 32px',
              background: 'rgba(139,92,246,0.2)',
              border: '1px solid rgba(139,92,246,0.5)',
              borderRadius: 12, color: '#c4b5fd',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.2)' }}
          >
            รับทราบ ✓
          </button>
        </div>
      ) : (
        // ====== EXP GAINED TOAST (non level-up) ======
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 20px', borderRadius: 16,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            boxShadow: '0 8px 32px rgba(99,102,241,0.2)',
            animation: 'toastSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            maxWidth: 320,
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(99,102,241,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>
            ⚔️
          </div>
          <div>
            <div style={{ color: '#34d399', fontWeight: 700, fontSize: 15 }}>
              +{expGained} EXP
            </div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
              {description || 'ภารกิจสำเร็จ!'}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes levelUpPop {
          from { opacity: 0; transform: scale(0.7) translateY(30px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes glowPulse {
          from { text-shadow: 0 0 20px rgba(167,139,250,0.6); }
          to   { text-shadow: 0 0 50px rgba(167,139,250,1), 0 0 80px rgba(139,92,246,0.6); }
        }
        @keyframes starTwinkle {
          from { opacity: 0.3; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1.4); }
        }
        @keyframes toastSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

function getRankColor(rank) {
  if (rank === 'S-Rank') return '#fbbf24'
  if (rank === 'A-Rank') return '#f87171'
  if (rank === 'B-Rank') return '#c084fc'
  if (rank === 'C-Rank') return '#60a5fa'
  if (rank === 'D-Rank') return '#4ade80'
  return '#94a3b8' // E-Rank
}

function getRankBg(rank) {
  if (rank === 'S-Rank') return 'rgba(251,191,36,0.2)'
  if (rank === 'A-Rank') return 'rgba(248,113,113,0.2)'
  if (rank === 'B-Rank') return 'rgba(192,132,252,0.2)'
  if (rank === 'C-Rank') return 'rgba(96,165,250,0.2)'
  if (rank === 'D-Rank') return 'rgba(74,222,128,0.2)'
  return 'rgba(148,163,184,0.2)'
}
