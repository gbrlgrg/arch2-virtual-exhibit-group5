'use client'

import { useEffect, useRef, useState } from 'react'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import {
  Cpu, Database, Server, ArrowDown, CheckCircle2, AlertTriangle,
  Loader2, Search, Send,
} from 'lucide-react'
import { CACHE_ROWS, type CacheRow } from '../../lib/cache-sim'

export type SimState = 'idle' | 'calculating' | 'hit' | 'miss'

type VisualizerProps = {
  state: SimState
  latency: number
  cache: CacheRow[]
  activeIndex: number | null
  replacementAlgo?: 'lru' | 'mru' | 'fifo' | 'random'
}

export function Visualizer({ state, latency, cache, activeIndex, replacementAlgo = 'lru' }: VisualizerProps) {
  const isHit = state === 'hit'
  const isMiss = state === 'miss'
  const isCalc = state === 'calculating'

  const topPathActive = isHit || isMiss || isCalc
  const bottomPathActive = isMiss

  // ── Eviction animation ────────────────────────────────────────────────
  const prevCacheRef = useRef<CacheRow[]>(cache)
  const [evictedIndex, setEvictedIndex] = useState<number | null>(null)
  const evictTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isMiss && activeIndex !== null) {
      const prev = prevCacheRef.current[activeIndex]
      const curr = cache[activeIndex]
      if (prev.valid && prev.tag !== null && prev.tag !== curr.tag) {
        if (evictTimerRef.current) clearTimeout(evictTimerRef.current)
        setEvictedIndex(activeIndex)
        evictTimerRef.current = setTimeout(() => setEvictedIndex(null), 1200)
      }
    }
    prevCacheRef.current = cache
  }, [cache, isMiss, activeIndex])

  // ── Dynamic labels based on state ─────────────────────────────────────
  const cpuSubtitle = isCalc
    ? 'Sending address...'
    : isHit
      ? 'Data received!'
      : isMiss
        ? 'Stalling — RAM fetch'
        : 'Requests data'

  const cacheStatusText = isCalc
    ? activeIndex !== null
      ? `Checking row #${activeIndex}...`
      : 'Looking up...'
    : isHit
      ? `HIT — tag matched`
      : isMiss
        ? 'MISS — tag mismatch'
        : 'Idle'

  const connectorLabel = isCalc
    ? 'Address sent'
    : isHit
      ? 'Tag match!'
      : undefined

  // Lookup pipeline step: 1=CPU, 2=Cache, 3=RAM, 4=Result
  const pipelineStep = isCalc ? 2 : isHit || isMiss ? 4 : 0

  return (
    <div className="flex flex-col gap-4">

      {/* ── LOOKUP PIPELINE INDICATOR ───────────────────────────────── */}
      <div className="flex items-center gap-0 rounded-lg border border-slate-800/60 bg-slate-950/40 p-2.5">
        {[
          { num: 1, label: 'CPU Send', icon: <Send className="size-3" /> },
          { num: 2, label: 'Cache Check', icon: <Search className="size-3" /> },
          { num: 3, label: 'RAM Fetch', icon: <Database className="size-3" /> },
          { num: 4, label: 'Result', icon: isHit ? <CheckCircle2 className="size-3" /> : isMiss ? <AlertTriangle className="size-3" /> : <Loader2 className="size-3" /> },
        ].map((step, i) => {
          const reached = pipelineStep >= step.num
          const isCurrent = pipelineStep === step.num
          const isRamStep = step.num === 3

          // RAM step only lights on miss
          const active = isRamStep ? (isMiss && pipelineStep >= 3) : reached

          return (
            <div key={step.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-0.5 flex-1">
                <div
                  className={[
                    'size-6 rounded-full flex items-center justify-center border transition-all duration-500',
                    active
                      ? isCurrent
                        ? isHit
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 animate-step-glow'
                          : isMiss && step.num >= 3
                            ? 'bg-amber-500/25 border-amber-400 text-amber-300 animate-step-glow'
                            : 'bg-cyan-500/25 border-cyan-400 text-cyan-300 animate-step-glow'
                        : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                      : 'bg-slate-900 border-slate-800 text-slate-600',
                  ].join(' ')}
                >
                  {step.icon}
                </div>
                <span
                  className={[
                    'text-[8px] font-medium transition-colors duration-300',
                    active ? 'text-slate-300' : 'text-slate-600',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </div>
              {i < 3 && (
                <div
                  className={[
                    'h-px w-4 transition-colors duration-500 mt-[-10px]',
                    active && pipelineStep > step.num ? 'bg-cyan-500/50' : 'bg-slate-800',
                  ].join(' ')}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* ── HARDWARE DIAGRAM ────────────────────────────────────────── */}
      <Card className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 gap-0">
        <div className="flex flex-col items-center">

          {/* CPU BLOCK */}
          <HardwareBlock
            icon={<Cpu className="size-6" aria-hidden="true" />}
            title="CPU"
            subtitle={cpuSubtitle}
            tone="cyan"
            glowing={topPathActive}
          />

          {/* CPU -> Cache connector */}
          <Connector
            active={topPathActive}
            tone={isHit ? 'emerald' : isMiss ? 'amber' : 'cyan'}
            label={connectorLabel}
            subtitle={isCalc ? 'Transmitting address...' : isHit ? 'Data flowing back' : undefined}
          />

          {/* CACHE L1 BLOCK */}
          <Card
            className={[
              'w-full max-w-sm gap-3 p-4 transition-all duration-500',
              isHit
                ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : isMiss
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-slate-800/60 bg-slate-950/40 animate-ambient-breathe',
            ].join(' ')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server
                  className={[
                    'size-4 transition-colors duration-500',
                    isHit ? 'text-emerald-400' : isMiss ? 'text-amber-400' : 'text-slate-400',
                  ].join(' ')}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-slate-200">
                  L1 Cache
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400 uppercase border border-slate-700">
                  {replacementAlgo}
                </span>
                <span className="exhibit-badge exhibit-badge--valid">Valid</span>
                <span className="exhibit-badge exhibit-badge--tag">Tag</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500">~2 ns</span>
            </div>

            {/* Dynamic status line */}
            <div className={[
              'text-[10px] font-medium px-2 py-1 rounded-md transition-all duration-300 text-center',
              isCalc
                ? 'bg-cyan-500/10 text-cyan-400 animate-pulse'
                : isHit
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : isMiss
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-slate-800/40 text-slate-500',
            ].join(' ')}>
              {cacheStatusText}
            </div>

            {/* Cache rows grid */}
            <div
              className="grid grid-cols-4 gap-2"
              role="grid"
              aria-label="Cache rows"
            >
              {cache.map((row) => {
                const isActive = activeIndex === row.index
                const activeHit = isActive && isHit
                const activeMiss = isActive && isMiss
                const isChecking = isActive && isCalc
                const isEvicting = evictedIndex === row.index

                let cellClass: string
                if (isEvicting) {
                  cellClass =
                    'border-rose-500/80 bg-rose-500/20 text-rose-200 shadow-[0_0_18px_rgba(239,68,68,0.55)] animate-hardware-shake exhibit-eviction-flash'
                } else if (activeHit) {
                  cellClass =
                    'border-emerald-400/70 bg-emerald-500/20 text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.4)] animate-pulse'
                } else if (activeMiss) {
                  cellClass =
                    'border-amber-400/70 bg-amber-500/15 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.35)] animate-pulse'
                } else if (isChecking) {
                  cellClass =
                    'border-cyan-400/60 bg-cyan-500/10 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.25)] animate-pulse'
                } else if (row.valid) {
                  cellClass =
                    'border-slate-700/70 bg-slate-800/50 text-slate-300'
                } else {
                  cellClass =
                    'border-slate-800/50 bg-slate-950/40 text-slate-600'
                }

                return (
                  <div
                    key={row.index}
                    role="gridcell"
                    aria-label={`Cache row ${row.index}, ${
                      row.valid ? 'occupied' : 'empty'
                    }${isEvicting ? ', evicting' : ''}${isChecking ? ', checking' : ''}`}
                    className={[
                      'flex h-11 flex-col items-center justify-center rounded-md border text-[10px] font-mono transition-all duration-500',
                      cellClass,
                    ].join(' ')}
                  >
                    <span className="opacity-60">#{row.index}</span>
                    <span>
                      {row.valid && row.tag !== null
                        ? '0x' + row.tag.toString(16).toUpperCase()
                        : '—'}
                    </span>
                  </div>
                )
              })}
            </div>

            <p className="text-[10px] text-slate-600">
              {CACHE_ROWS} direct-mapped rows · tag shown when occupied ·{' '}
              <span className="text-cyan-500/70">cyan = checking</span> ·{' '}
              <span className="text-rose-500/70">crimson = eviction</span>
            </p>
          </Card>

          {/* Cache -> RAM connector */}
          <Connector
            active={bottomPathActive}
            tone={isMiss ? 'amber' : 'slate'}
            label={isMiss ? 'MISS — fetch from RAM' : undefined}
            subtitle={isMiss ? 'Block transfer in progress...' : undefined}
            dimmed={!bottomPathActive}
          />

          {/* MAIN MEMORY / RAM BLOCK */}
          <Card
            className={[
              'w-full max-w-sm gap-2 p-4 transition-all duration-500',
              isMiss
                ? 'border-amber-500/50 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                : 'border-slate-800/60 bg-slate-950/40',
            ].join(' ')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database
                  className={[
                    'size-4 transition-colors duration-500',
                    isMiss ? 'text-amber-400' : 'text-slate-500',
                  ].join(' ')}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-slate-200">
                  Main Memory (RAM)
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-500">
                ~100 ns
              </span>
            </div>
            {isMiss && (
              <div className="text-[10px] text-amber-400/80 font-medium px-2 py-1 rounded-md bg-amber-500/10 text-center animate-pulse">
                Delivering 4-byte block to cache...
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={[
                    'h-3 rounded-sm transition-all duration-500',
                    isMiss ? 'bg-amber-500/25' : 'bg-slate-800/60',
                  ].join(' ')}
                  style={{ width: `${100 - i * 12}%` }}
                />
              ))}
            </div>
          </Card>
        </div>
      </Card>

      {/* ── STATUS DASHBOARD (now below the diagram) ────────────────── */}
      <StatusDashboard state={state} latency={latency} activeIndex={activeIndex} />

      {/* ── CANDY-CRUSH-STYLE HIT/MISS POPUP ─────────────────────── */}
      <HitMissPopup state={state} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status dashboard — moved below the hardware diagram
// ---------------------------------------------------------------------------
function StatusDashboard({ state, latency, activeIndex }: { state: SimState; latency: number; activeIndex: number | null }) {
  const label =
    state === 'idle'
      ? 'IDLE'
      : state === 'calculating'
        ? 'CALCULATING'
        : state.toUpperCase()

  const stateTone =
    state === 'hit'
      ? 'text-emerald-400'
      : state === 'miss'
        ? 'text-amber-400'
        : state === 'calculating'
          ? 'text-cyan-400 animate-pulse'
          : 'text-slate-400'

  const latencyTone =
    state === 'hit'
      ? 'text-emerald-400'
      : state === 'miss'
        ? 'text-amber-400'
        : 'text-slate-300'

  const detailText = (() => {
    if (state === 'idle') return 'Awaiting request...'
    if (state === 'calculating') return activeIndex !== null
      ? `Comparing tag in row #${activeIndex}...`
      : 'Sending address to cache controller...'
    if (state === 'hit') return `Tag matched — data served directly from L1 in ${latency}ns`
    return `Tag mismatch — block fetched from RAM in ${latency}ns (miss penalty)`
  })()

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-3 gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          Current State
        </span>
        <div className="flex items-center gap-2">
          {state === 'hit' && <CheckCircle2 className="size-5 text-emerald-400" aria-hidden="true" />}
          {state === 'miss' && <AlertTriangle className="size-5 text-amber-400" aria-hidden="true" />}
          {state === 'calculating' && <Loader2 className="size-5 text-cyan-400 animate-spin" aria-hidden="true" />}
          {state === 'idle' && <Server className="size-5 text-slate-500" aria-hidden="true" />}
          <span className={['text-xl font-bold font-mono tracking-wide', stateTone,
            state === 'hit' ? 'neon-text-emerald' : state === 'miss' ? 'neon-text-amber' : ''].join(' ')}>
            {label}
          </span>
        </div>
        {state === 'hit' ? (
          <Badge className="w-fit bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)] hover:bg-emerald-500/15">
            Cache Hit!
          </Badge>
        ) : state === 'miss' ? (
          <Badge className="w-fit bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:bg-amber-500/15">
            Cache Miss!
          </Badge>
        ) : (
          <span className="text-[10px] text-slate-600">Awaiting request…</span>
        )}
      </Card>

      <Card className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-3 gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          Latency
        </span>
        <div className="flex items-baseline gap-1">
          <span className={['text-xl font-bold font-mono tracking-wide', latencyTone,
            state === 'hit' ? 'neon-text-emerald' : state === 'miss' ? 'neon-text-amber' : ''].join(' ')}>
            {latency > 0 ? latency : '—'}
          </span>
          <span className="text-xs text-slate-500">ns</span>
        </div>
        <span className="text-[10px] text-slate-600">
          {state === 'hit' ? 'Lightning-fast SRAM' : state === 'miss' ? 'DRAM access penalty' : 'CPU wait time'}
        </span>
      </Card>

      <Card className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-3 gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          Lookup Detail
        </span>
        <p className="text-[11px] leading-relaxed text-slate-400">
          {detailText}
        </p>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reusable hardware block
// ---------------------------------------------------------------------------
function HardwareBlock({
  icon,
  title,
  subtitle,
  tone,
  glowing,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  tone: 'cyan'
  glowing: boolean
}) {
  return (
    <Card
      className={[
        'w-full max-w-sm flex-row items-center gap-3 p-4 transition-all duration-500',
        glowing
          ? 'border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
          : 'border-slate-800/60 bg-slate-950/40',
      ].join(' ')}
    >
      <div
        className={[
          'relative flex size-11 items-center justify-center rounded-lg transition-all duration-500',
          glowing
            ? 'bg-cyan-500/15 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)] animate-cyber-pulse'
            : 'bg-slate-800/60 text-slate-400',
        ].join(' ')}
      >
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-100">{title}</span>
        <span className={[
          'text-[11px] transition-colors duration-300',
          glowing ? 'text-cyan-400' : 'text-slate-500',
        ].join(' ')}>
          {subtitle}
        </span>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Animated connector between blocks
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Candy-Crush-style HIT / MISS popup overlay
// ---------------------------------------------------------------------------
function HitMissPopup({ state }: { state: SimState }) {
  const [popup, setPopup] = useState<'hit' | 'miss' | null>(null)
  const [dismissing, setDismissing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (state === 'hit' || state === 'miss') {
      if (timerRef.current) clearTimeout(timerRef.current)
      setPopup(state)
      setDismissing(false)
      timerRef.current = setTimeout(() => {
        setDismissing(true)
        setTimeout(() => setPopup(null), 450)
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [state])

  if (!popup) return null

  const isHit = popup === 'hit'

  const baseClass =
    'fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center'

  const textClass = [
    'font-black tracking-tight select-none',
    isHit
      ? 'bg-gradient-to-br from-yellow-200 via-emerald-300 to-green-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(16,185,129,0.5)]'
      : 'bg-gradient-to-br from-red-400 via-indigo-400 to-rose-500 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(239,68,68,0.5)]',
  ].join(' ')

  const animClass = dismissing
    ? isHit
      ? 'animate-popup-hit-dismiss'
      : 'animate-popup-miss-dismiss'
    : isHit
      ? 'animate-popup-hit'
      : 'animate-popup-miss'

  return (
    <div className={baseClass}>
      <div className={`${textClass} text-[clamp(4.5rem,14vw,10rem)] ${animClass}`}>
        {isHit ? 'HIT' : 'MISS'}
      </div>
    </div>
  )
}

function Connector({
  active,
  tone,
  label,
  subtitle,
  dimmed,
}: {
  active: boolean
  tone: 'cyan' | 'emerald' | 'amber' | 'slate'
  label?: string
  subtitle?: string
  dimmed?: boolean
}) {
  const lineTone = {
    cyan: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]',
    emerald: 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]',
    amber: 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.6)]',
    slate: 'bg-slate-700',
  }[tone]

  const arrowTone = {
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    slate: 'text-slate-700',
  }[tone]

  return (
    <div
      className={[
        'flex flex-col items-center py-1 transition-opacity duration-500',
        dimmed ? 'opacity-40' : 'opacity-100',
      ].join(' ')}
    >
      <div
        className={[
          'relative h-7 w-0.5 rounded-full overflow-hidden transition-all duration-500',
          active ? lineTone : 'bg-slate-800',
        ].join(' ')}
      >
        {active && <div className="absolute inset-0 bg-white/60 animate-data-packet" />}
      </div>
      <ArrowDown
        className={[
          'size-4 -mt-1 transition-colors duration-500',
          active ? arrowTone : 'text-slate-800',
        ].join(' ')}
        aria-hidden="true"
      />
      {label ? (
        <div className="flex flex-col items-center">
          <span
            className={[
              'text-[10px] font-semibold transition-colors duration-500',
              tone === 'emerald'
                ? 'text-emerald-400'
                : tone === 'amber'
                  ? 'text-amber-400'
                  : 'text-slate-500',
            ].join(' ')}
          >
            {label}
          </span>
          {subtitle && (
            <span className="text-[9px] text-slate-600 animate-pulse">
              {subtitle}
            </span>
          )}
        </div>
      ) : null}
    </div>
  )
}
