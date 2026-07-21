import { Trophy, Clock, Medal, Zap } from 'lucide-react'

export type RankInfo = {
  title: string
  xpRequired: number
  color: string
}

export const RANKS: RankInfo[] = [
  { title: 'Silicon Novice', xpRequired: 0, color: 'text-slate-400' },
  { title: 'Cache Apprentice', xpRequired: 50, color: 'text-cyan-400' },
  { title: 'SRAM Engineer', xpRequired: 150, color: 'text-emerald-400' },
  { title: 'L1 Architect', xpRequired: 300, color: 'text-indigo-400' },
  { title: 'The Silicon God', xpRequired: 600, color: 'text-amber-400' },
]

export function getCurrentRank(xp: number): { current: RankInfo; next: RankInfo | null } {
  let currentRank = RANKS[0]
  let nextRank = RANKS[1]

  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].xpRequired) {
      currentRank = RANKS[i]
      nextRank = i + 1 < RANKS.length ? RANKS[i + 1] : null
    }
  }

  return { current: currentRank, next: nextRank }
}

type ScoreboardProps = {
  xp: number
  timeSaved: number
  isLevelingUp: boolean
}

export function Scoreboard({ xp, timeSaved, isLevelingUp }: ScoreboardProps) {
  const { current, next } = getCurrentRank(xp)
  
  // Calculate progress percentage
  let progress = 100
  if (next) {
    const xpIntoCurrentLevel = xp - current.xpRequired
    const xpNeededForNext = next.xpRequired - current.xpRequired
    progress = (xpIntoCurrentLevel / xpNeededForNext) * 100
  }

  return (
    <div className={`relative flex items-center justify-between p-4 bg-slate-900/60 backdrop-blur-md border rounded-2xl shadow-lg transition-all duration-500 overflow-hidden ${
      isLevelingUp ? 'border-amber-400/80 shadow-[0_0_40px_rgba(251,191,36,0.3)] scale-[1.02]' : 'border-slate-700/50'
    }`}>
      
      {/* Dynamic background glow on level up */}
      <div className={`absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 transition-opacity duration-700 ${isLevelingUp ? 'opacity-100' : 'opacity-0'}`} />

      {/* Rank & XP */}
      <div className="flex flex-col gap-2 z-10 w-[45%]">
        <div className="flex items-center gap-2">
          {isLevelingUp ? (
            <Trophy className="size-5 text-amber-400 animate-bounce" />
          ) : (
            <Medal className={`size-5 ${current.color}`} />
          )}
          <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">Current Rank</span>
        </div>
        
        <div className="flex items-end gap-3">
          <h3 className={`text-xl font-bold tracking-tight ${current.color} ${isLevelingUp ? 'animate-pulse' : ''}`}>
            {current.title}
          </h3>
          <span className="text-sm font-mono text-slate-500 mb-0.5">{xp} XP</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              progress === 100 ? 'bg-amber-400' : 'bg-cyan-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {next && (
          <div className="text-[10px] text-slate-500 font-mono text-right">
            Next: {next.title} ({next.xpRequired} XP)
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-16 bg-slate-700/50 z-10" />

      {/* Time Saved Counter */}
      <div className="flex flex-col items-end gap-1 z-10 w-[45%]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-emerald-400/80 tracking-widest uppercase">CPU Time Saved</span>
          <Clock className="size-4 text-emerald-500" />
        </div>
        
        <div className="flex items-baseline gap-1 mt-1">
          {/* Animated counter effect can be done by changing key, but here we just show the huge number */}
          <span className="text-3xl font-bold text-emerald-400 tracking-tighter drop-shadow-sm font-mono tabular-nums">
            {timeSaved.toLocaleString()}
          </span>
          <span className="text-sm text-emerald-500/70 font-mono font-bold">ns</span>
        </div>
        <div className="text-[10px] text-slate-500 flex items-center gap-1">
          <Zap className="size-3 text-amber-500/70" />
          <span>vs DRAM Latency</span>
        </div>
      </div>
      
    </div>
  )
}
