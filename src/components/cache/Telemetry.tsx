import { useState, useEffect } from 'react';
import type { SimState } from './visualizer';
import { Zap, Activity, ShieldAlert, Cpu } from 'lucide-react'
import { NumberRoller } from './NumberRoller'

// ─── LIVE BANDWIDTH MONITOR ────────────────────────────────────────────────
export function LiveBandwidthMonitor({ simState }: { simState: SimState }) {
  const [history, setHistory] = useState<number[]>(Array(30).fill(5))

  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(prev => {
        const next = [...prev.slice(1)]
        if (simState === 'hit') {
          next.push(Math.random() * 15 + 15)
        } else if (simState === 'miss' || simState === 'calculating') {
          next.push(Math.random() * 40 + 60)
        } else {
          next.push(Math.random() * 5 + 2)
        }
        return next
      })
    }, 100)
    return () => clearInterval(interval)
  }, [simState])

  const isCritical = simState === 'miss' || simState === 'calculating'

  return (
    <div className={['relative overflow-hidden rounded-xl border transition-all duration-500 p-4 mt-4 shadow-xl',
      isCritical ? 'border-rose-500/60 bg-rose-950/20' : 'border-slate-800 bg-slate-950'
    ].join(' ')}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[9px] font-mono uppercase tracking-wider text-slate-500">Live Bandwidth Monitor</div>
        <div className="flex items-center gap-1.5">
          <div className={['size-1.5 rounded-full animate-pulse', isCritical ? 'bg-rose-500' : 'bg-emerald-500'].join(' ')}></div>
          <span className={['text-[9px] font-mono', isCritical ? 'text-rose-400' : 'text-emerald-400'].join(' ')}>
            {isCritical ? 'SPIKE' : 'NOMINAL'}
          </span>
        </div>
      </div>
      <div className="flex items-end gap-[2px] h-16">
        {history.map((v, i) => {
          const pct = Math.min(v, 100)
          const isSpike = v > 40
          return (
            <div key={i} className="flex-1 rounded-t transition-all duration-100"
              style={{
                height: `${pct}%`,
                background: isSpike
                  ? `linear-gradient(to top, rgb(244,63,94), rgb(251,113,133))`
                  : `linear-gradient(to top, rgb(34,211,238), rgb(6,182,212))`,
                opacity: 0.3 + (i / history.length) * 0.7
              }}
            />
          )
        })}
      </div>
      <div className="flex justify-between mt-1.5 text-[8px] font-mono text-slate-600">
        <span>-3s</span>
        <span>now</span>
      </div>
    </div>
  )
}

// ─── GLOBAL TELEMETRY CONSOLE ──────────────────────────────────────────────
export function GlobalTelemetryConsole({ hits, misses, xp, timeSaved, totalOps, hitRate, isLevelingUp, defragmentCache, reset }: any) {
  const [matrix, setMatrix] = useState<string[]>([])

  useEffect(() => {
    const arr: string[] = []
    for (let i = 0; i < 150; i++) {
      arr.push('0x' + Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0'))
    }
    setMatrix(arr)
  }, [])

  return (
    <div className="relative overflow-hidden rounded-xl border border-indigo-500/30 bg-slate-950/95 p-4 mt-4 shadow-xl">
      {/* Matrix rain background */}
      <div className="absolute inset-0 opacity-[0.04] overflow-hidden pointer-events-none font-mono text-[8px] text-emerald-400 leading-tight break-all p-2">
        {matrix.join(' ')}
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[9px] font-mono uppercase tracking-wider text-indigo-400 font-bold">System Telemetry</div>
          <div className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] font-mono text-emerald-400">ONLINE</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-slate-900/80 rounded-lg border border-slate-800 p-2 text-center">
            <div className="text-[8px] text-slate-500 font-mono uppercase">XP</div>
            <div className={['text-lg font-bold font-mono', isLevelingUp ? 'text-amber-400 animate-pulse' : 'text-indigo-400'].join(' ')}>{xp}</div>
          </div>
          <div className="bg-slate-900/80 rounded-lg border border-slate-800 p-2 text-center">
            <div className="text-[8px] text-slate-500 font-mono uppercase">Hit Rate</div>
            <div className={['text-lg font-bold font-mono', totalOps === 0 ? 'text-slate-500' : parseFloat(hitRate) >= 70 ? 'text-emerald-400' : 'text-rose-400'].join(' ')}>
              {hitRate}{totalOps > 0 ? '%' : ''}
            </div>
          </div>
          <div className="bg-slate-900/80 rounded-lg border border-slate-800 p-2 text-center">
            <div className="text-[8px] text-slate-500 font-mono uppercase">Ops</div>
            <div className="text-lg font-bold font-mono text-cyan-400">{totalOps}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={defragmentCache}
            className="flex-1 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-[9px] font-mono text-indigo-400 hover:bg-indigo-500/20 transition-all uppercase font-bold">
            Optimize
          </button>
          <button onClick={reset}
            className="flex-1 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-500 hover:text-slate-300 transition-all uppercase font-bold">
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── GRAND ANALYTICS TERMINAL ──────────────────────────────────────────────
export function GrandAnalyticsTerminal({ hits, misses, xp, timeSaved }: any) {
  const totalOps = hits + misses
  const hitPct = totalOps > 0 ? (hits / totalOps) * 100 : 0
  const grade = hitPct >= 90 ? 'A+' : hitPct >= 80 ? 'A' : hitPct >= 70 ? 'B' : hitPct >= 50 ? 'C' : 'F'
  const gradeColor = grade.startsWith('A') ? 'text-emerald-400 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
    : grade === 'B' ? 'text-cyan-400 border-cyan-500/60 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
    : grade === 'C' ? 'text-amber-400 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
    : 'text-rose-400 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.3)]'

  const [bars, setBars] = useState<number[]>(Array(40).fill(5))

  useEffect(() => {
    const interval = setInterval(() => {
      setBars(prev => {
        const next = [...prev.slice(1)]
        const base = hitPct > 0 ? hitPct * 0.8 : 5
        next.push(base + Math.random() * 20)
        return next
      })
    }, 150)
    return () => clearInterval(interval)
  }, [hitPct])

  return (
    <div className="relative overflow-hidden rounded-xl border border-violet-500/30 bg-slate-950/95 p-4 mt-4 shadow-xl">
      <div className="text-[9px] font-mono uppercase tracking-wider text-violet-400 font-bold mb-3">Analytics Terminal</div>
      <div className="flex items-center gap-4 mb-3">
        <div className={['size-16 rounded-xl border-2 flex items-center justify-center font-bold text-2xl font-mono', gradeColor].join(' ')}>
          {totalOps > 0 ? grade : '—'}
        </div>
        <div className="flex-1 space-y-1">
          <div className="text-[10px] text-slate-400">
            Overall Hit Rate: <span className="text-white font-bold">{totalOps > 0 ? hitPct.toFixed(1) + '%' : '—'}</span>
          </div>
          <div className="text-[10px] text-slate-400">
            Time Saved: <span className="text-cyan-400 font-mono">{timeSaved}ns</span>
          </div>
          <div className="text-[10px] text-slate-400">
            XP Earned: <span className="text-indigo-400 font-mono">{xp}</span>
          </div>
        </div>
      </div>
      <div className="text-[8px] text-slate-600 font-mono uppercase tracking-wider mb-1">Energy Efficiency</div>
      <div className="flex items-end gap-[1px] h-8">
        {bars.map((v, i) => (
          <div key={i} className="flex-1 rounded-t transition-all duration-100"
            style={{
              height: `${Math.min(v, 100)}%`,
              background: v > 70 ? 'rgb(16,185,129)' : v > 40 ? 'rgb(34,211,238)' : 'rgb(244,63,94)',
              opacity: 0.3 + (i / bars.length) * 0.7
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── MAPPING FUNCTIONS SIMULATOR ──────────────────────────────────────────
// Self-contained: models a tiny 4-slot cache over a 16-block memory space
// (4-bit block address) so students can watch Direct / Set-Associative /
// Fully-Associative placement decisions play out live.

type MapType = 'direct' | 'set2' | 'full'
const MAP_TOTAL_SLOTS = 4
const MAP_TOTAL_BLOCKS = 16

type MapSlot = { block: number | null }
type MapLogEntry = {
  block: number
  outcome: 'hit' | 'miss'
  placedSlot: number
  evictedSlot: number | null
  evictedBlock: number | null
}

function candidateSlots(block: number, mapType: MapType): number[] {
  if (mapType === 'direct') return [block % MAP_TOTAL_SLOTS]
  if (mapType === 'set2') {
    const set = block % 2
    const waysPerSet = MAP_TOTAL_SLOTS / 2
    return Array.from({ length: waysPerSet }, (_, w) => set * waysPerSet + w)
  }
  return Array.from({ length: MAP_TOTAL_SLOTS }, (_, i) => i) // fully associative
}

function bitInfo(mapType: MapType) {
  if (mapType === 'direct') return { tagBits: 2, indexBits: 2, label: 'Direct Mapping' }
  if (mapType === 'set2') return { tagBits: 3, indexBits: 1, label: 'Set-Associative (2-way)' }
  return { tagBits: 4, indexBits: 0, label: 'Fully Associative' }
}

const MAP_TYPE_META: Record<MapType, { label: string; color: 'cyan' | 'emerald' | 'violet'; formula: string }> = {
  direct: { label: 'Direct', color: 'cyan', formula: 'slot = block mod 4' },
  set2: { label: 'Set-Assoc. (2-way)', color: 'emerald', formula: 'set = block mod 2 → any way in set' },
  full: { label: 'Fully Assoc.', color: 'violet', formula: 'any of the 4 slots' },
}