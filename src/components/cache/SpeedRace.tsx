'use client'

import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/card'
import { Zap, Database, Timer } from 'lucide-react'
import type { SimState } from './visualizer'

export function SpeedRace({ state }: { state: SimState }) {
  // progress from 0 to 100
  const [hitProgress, setHitProgress] = useState(0)
  const [missProgress, setMissProgress] = useState(0)
  const [showMissOverlay, setShowMissOverlay] = useState(false)

  useEffect(() => {
    if (state === 'idle' || state === 'calculating') {
      setHitProgress(0)
      setMissProgress(0)
      setShowMissOverlay(false)
    } else if (state === 'hit') {
      // Instant hit
      setTimeout(() => setHitProgress(100), 50)
    } else if (state === 'miss') {
      // Cache check fails fast
      setTimeout(() => setHitProgress(15), 50) // jumps a bit then stops
      // RAM takes a long time
      setTimeout(() => setMissProgress(100), 50)

      // Show overlay after race finishes
      setTimeout(() => setShowMissOverlay(true), 2900)
    }
  }, [state])

  const hitColor = state === 'miss' ? 'bg-slate-700' : 'bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.8)]'
  const missColor = 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)]'

  return (
    <Card className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-4 w-full flex flex-col gap-3 relative overflow-hidden">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-slate-300">
          <Timer className="size-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider">Memory Wall Race</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Hit (2ns) vs Miss (100ns)</span>
      </div>

      {/* Track 1: Cache Hit */}
      <div className="flex items-center gap-3">
        <div className="w-16 flex items-center gap-1.5 shrink-0">
          <Zap className="size-3 text-emerald-400" />
          <span className="text-[10px] font-mono text-slate-400">L1 Hit</span>
        </div>
        <div className="flex-1 bg-slate-800/50 h-3 rounded-full overflow-hidden border border-slate-700 relative">
          <div
            className={`h-full rounded-full transition-all ${state === 'hit' ? 'duration-100 ease-out' : 'duration-300'} ${hitColor}`}
            style={{ width: `${hitProgress}%` }}
          />
          {/* Finish line */}
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 border-l border-white/40" />
        </div>
      </div>

      {/* Track 2: Cache Miss / RAM */}
      <div className="flex items-center gap-3">
        <div className="w-16 flex items-center gap-1.5 shrink-0">
          <Database className="size-3 text-amber-400" />
          <span className="text-[10px] font-mono text-slate-400">RAM Miss</span>
        </div>
        <div className="flex-1 bg-slate-800/50 h-3 rounded-full overflow-hidden border border-slate-700 relative">
          <div
            className={`h-full rounded-full transition-all duration-[2800ms] ease-linear ${missColor}`}
            style={{ width: `${missProgress}%` }}
          />
          {/* Finish line */}
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 border-l border-white/40" />
        </div>
      </div>

      {/* Dynamic textual conclusion */}
      {state === 'hit' && hitProgress === 100 && (
        <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex items-center justify-center animate-fade-in border border-emerald-500/30 rounded-xl">
          <span className="text-emerald-400 font-bold tracking-widest uppercase text-sm drop-shadow-md">
            Hit: Instant Data Delivery!
          </span>
        </div>
      )}

      {state === 'miss' && showMissOverlay && (
        <div className="absolute inset-0 bg-amber-950/80 backdrop-blur-sm flex items-center justify-center animate-fade-in border border-amber-500/30 rounded-xl">
          <span className="text-amber-400 font-bold tracking-widest uppercase text-sm drop-shadow-md flex flex-col items-center">
            <span>Miss: The Memory Wall</span>
            <span className="text-[10px] text-amber-200/70 normal-case tracking-normal">CPU stalled for 100ns waiting for RAM</span>
          </span>
        </div>
      )}
    </Card>
  )
}
