'use client'

import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Cpu, Database, Server, ArrowDown, CheckCircle2, AlertTriangle } from 'lucide-react'
import { CACHE_ROWS, type CacheRow } from '../../lib/cache-sim'

export type SimState = 'idle' | 'calculating' | 'hit' | 'miss'

type VisualizerProps = {
  state: SimState
  latency: number
  cache: CacheRow[]
  activeIndex: number | null
}

export function Visualizer({ state, latency, cache, activeIndex }: VisualizerProps) {
  const isHit = state === 'hit'
  const isMiss = state === 'miss'
  const isCalc = state === 'calculating'

  // Path from CPU -> Cache is active on every lookup attempt.
  const topPathActive = isHit || isMiss || isCalc
  // Path from Cache -> RAM is only traversed on a miss.
  const bottomPathActive = isMiss

  return (
    <div className="flex flex-col gap-5">
      <StatusDashboard state={state} latency={latency} />

      <Card className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 gap-0">
        <div className="flex flex-col items-center">
          {/* CPU BLOCK */}
          <HardwareBlock
            icon={<Cpu className="size-6" aria-hidden="true" />}
            title="CPU"
            subtitle="Requests data"
            tone="cyan"
            glowing={topPathActive}
          />

          {/* CPU -> Cache connector */}
          <Connector
            active={topPathActive}
            tone={isHit ? 'emerald' : isMiss ? 'slate' : 'cyan'}
            label={isHit ? 'Hit' : undefined}
          />

          {/* CACHE L1 BLOCK */}
          <Card
            className={[
              'w-full max-w-sm gap-3 p-4 transition-all duration-500',
              isHit
                ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : 'border-slate-800/60 bg-slate-950/40',
            ].join(' ')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server
                  className={[
                    'size-4 transition-colors duration-500',
                    isHit ? 'text-emerald-400' : 'text-slate-400',
                  ].join(' ')}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-slate-200">
                  L1 Cache
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-500">~2 ns</span>
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
                return (
                  <div
                    key={row.index}
                    role="gridcell"
                    aria-label={`Cache row ${row.index}, ${
                      row.valid ? 'occupied' : 'empty'
                    }`}
                    className={[
                      'flex h-11 flex-col items-center justify-center rounded-md border text-[10px] font-mono transition-all duration-500',
                      activeHit
                        ? 'border-emerald-400/70 bg-emerald-500/20 text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.4)] animate-pulse'
                        : activeMiss
                          ? 'border-amber-400/70 bg-amber-500/15 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.35)] animate-pulse'
                          : row.valid
                            ? 'border-slate-700/70 bg-slate-800/50 text-slate-300'
                            : 'border-slate-800/50 bg-slate-950/40 text-slate-600',
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
              {CACHE_ROWS} direct-mapped rows · tag shown when occupied
            </p>
          </Card>

          {/* Cache -> RAM connector */}
          <Connector
            active={bottomPathActive}
            tone={isMiss ? 'amber' : 'slate'}
            label={isMiss ? 'Miss — fetch from RAM' : undefined}
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
            <div className="flex flex-col gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={[
                    'h-3 rounded-sm transition-all duration-500',
                    isMiss
                      ? 'bg-amber-500/25'
                      : 'bg-slate-800/60',
                  ].join(' ')}
                  style={{ width: `${100 - i * 12}%` }}
                />
              ))}
            </div>
          </Card>
        </div>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status dashboard
// ---------------------------------------------------------------------------
function StatusDashboard({ state, latency }: { state: SimState; latency: number }) {
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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-4 gap-2">
        <span className="text-[11px] uppercase tracking-wider text-slate-500">
          Current State
        </span>
        <div className="flex items-center gap-2">
          {state === 'hit' ? (
            <CheckCircle2 className="size-5 text-emerald-400" aria-hidden="true" />
          ) : state === 'miss' ? (
            <AlertTriangle className="size-5 text-amber-400" aria-hidden="true" />
          ) : null}
          <span className={`font-mono text-2xl font-semibold tracking-tight ${stateTone}`}>
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
          <span className="text-[11px] text-slate-600">Awaiting request…</span>
        )}
      </Card>

      <Card className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-4 gap-2">
        <span className="text-[11px] uppercase tracking-wider text-slate-500">
          Latency Counter
        </span>
        <span className={`font-mono text-2xl font-semibold tracking-tight transition-colors duration-500 ${latencyTone}`}>
          {latency} ns
        </span>
        <span className="text-[11px] text-slate-600">
          Time the CPU waited for this fetch
        </span>
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
          'flex size-11 items-center justify-center rounded-lg transition-all duration-500',
          glowing
            ? 'bg-cyan-500/15 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
            : 'bg-slate-800/60 text-slate-400',
        ].join(' ')}
      >
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-100">{title}</span>
        <span className="text-[11px] text-slate-500">{subtitle}</span>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Animated connector between blocks
// ---------------------------------------------------------------------------
function Connector({
  active,
  tone,
  label,
  dimmed,
}: {
  active: boolean
  tone: 'cyan' | 'emerald' | 'amber' | 'slate'
  label?: string
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
          'h-7 w-0.5 rounded-full transition-all duration-500',
          active ? lineTone : 'bg-slate-800',
          active && tone !== 'slate' ? 'animate-pulse' : '',
        ].join(' ')}
      />
      <ArrowDown
        className={[
          'size-4 -mt-1 transition-colors duration-500',
          active ? arrowTone : 'text-slate-800',
        ].join(' ')}
        aria-hidden="true"
      />
      {label ? (
        <span
          className={[
            'mt-0.5 text-[10px] font-medium transition-colors duration-500',
            tone === 'emerald'
              ? 'text-emerald-400'
              : tone === 'amber'
                ? 'text-amber-400'
                : 'text-slate-500',
          ].join(' ')}
        >
          {label}
        </span>
      ) : null}
    </div>
  )
}
