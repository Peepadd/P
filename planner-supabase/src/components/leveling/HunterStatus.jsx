import React from 'react'
import { Shield, Swords, Zap } from 'lucide-react'
import { useLeveling } from '../../hooks/useLeveling'

export default function HunterStatus() {
  const { stats, loading } = useLeveling()

  if (loading || !stats) {
    return <div className="p-4 mx-4 mb-4 bg-gray-100 rounded-xl animate-pulse h-24"></div>
  }

  const expNeeded = stats.level * 100
  const progressPercent = Math.min((stats.current_exp / expNeeded) * 100, 100)

  // กำหนดสีตาม Rank แบบเกม RPG
  const getRankColor = (rank) => {
    if (rank === 'S-Rank') return 'text-yellow-400 bg-yellow-400/20'
    if (rank === 'A-Rank') return 'text-red-400 bg-red-400/20'
    if (rank === 'B-Rank') return 'text-purple-400 bg-purple-400/20'
    if (rank === 'C-Rank') return 'text-blue-400 bg-blue-400/20'
    if (rank === 'D-Rank') return 'text-green-400 bg-green-400/20'
    return 'text-gray-300 bg-gray-600' // E-Rank
  }

  return (
    <div className="mx-4 mb-4 p-4 bg-slate-900 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group">
      {/* Background Effect */}
      <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-indigo-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
      
      <div className="relative z-10 flex items-center justify-between mb-3">
        <div>
          <h4 className="text-white font-bold tracking-wider flex items-center gap-1.5">
            <Swords size={16} className="text-indigo-400" />
            Lv. {stats.level}
          </h4>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm mt-1 inline-block ${getRankColor(stats.rank)}`}>
            {stats.rank}
          </span>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Total EXP</p>
          <p className="text-sm font-mono text-indigo-300 font-bold">{stats.total_exp.toLocaleString()}</p>
        </div>
      </div>

      {/* EXP Bar */}
      <div className="relative pt-1">
        <div className="flex mb-1 items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold inline-block text-indigo-400 uppercase">
              EXP
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-semibold inline-block text-slate-300 font-mono">
              {stats.current_exp} / {expNeeded}
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-1 text-xs flex rounded-full bg-slate-800 border border-slate-700">
          <div
            style={{ width: `${progressPercent}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out relative"
          >
             <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InBhdHRlcm4iIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwb2x5Z29uIHBvaW50cz0iMCAwIDQgMCAwIDQiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xNSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjcGF0dGVybikiLz48L3N2Zz4=')] opacity-50"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
