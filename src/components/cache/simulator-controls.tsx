'use client'

import { useEffect, useRef, useState } from 'react'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Cpu, Search, Zap, ZapOff, ChevronRight, Check } from 'lucide-react'
import type { AddressBreakdown } from '../../lib/cache-sim'

type ForceMode = 'auto' | 'hit' | 'miss'

type SimulatorControlsProps = {
  breakdown: AddressBreakdown | null
  error: string | null
  isBusy: boolean
  forceMode: ForceMode
  onForceModeChange: (mode: ForceMode) => void
  onFetch: (rawInput: string) => void
}

const STEP_LABELS = ['Parse', 'Convert', 'Slice', 'Ready'] as const

export function SimulatorControls({
  breakdown,
  error,
  isBusy,
  forceMode,
  onForceModeChange,
  onFetch,
}: SimulatorControlsProps) {
  const [value, setValue] = useState('0x1A4')
  const [animStep, setAnimStep] = useState(0)

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    if (breakdown) {
      setAnimStep(1)
      const t1 = setTimeout(() => setAnimStep(2), 400)
      const t2 = setTimeout(() => setAnimStep(3), 1200)
      const t3 = setTimeout(() => setAnimStep(4), 2000)
      timersRef.current.push(t1, t2, t3)
    } else {
      setAnimStep(0)
    }

    return () => {
      timersRef.current.forEach(clearTimeout)
    }
  }, [breakdown])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onFetch(value)
  }

  const forceOptions: { id: ForceMode; label: string }[] = [
    { id: 'auto', label: 'Auto' },
    { id: 'hit', label: 'Force Hit' },
    { id: 'miss', label: 'Force Miss' },
  ]

  const binaryNibbles = breakdown
    ? breakdown.binaryGrouped.split(' ')
    : []

  return (
    <Card className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-5 gap-4">
      <div className="flex items-center gap-2">
        <Cpu className="size-4 text-cyan-400" aria-hidden="true" />
        <h2 className="text-sm font-medium tracking-wide text-slate-200">
          Simulator Controls
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="address-input"
            className="text-xs text-slate-400"
          >
            Enter Hex Memory Address
          </label>
          <Input
            id="address-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 0x1A4"
            spellCheck={false}
            autoComplete="off"
            className="font-mono bg-slate-950/60 border-slate-700/60 text-slate-100 placeholder:text-slate-600 focus-visible:ring-cyan-400/40 focus-visible:border-cyan-400/60"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'address-error' : undefined}
          />
          {error ? (
            <p id="address-error" className="text-xs text-amber-400">
              {error}
            </p>
          ) : null}
        </div>

        <div
          className="flex items-center gap-1 rounded-md border border-slate-800/60 bg-slate-950/40 p-1"
          role="group"
          aria-label="Force lookup outcome"
        >
          {forceOptions.map((opt) => {
            const active = forceMode === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onForceModeChange(opt.id)}
                className={[
                  'flex-1 rounded px-2 py-1.5 text-xs font-medium font-mono transition-all duration-300 active:scale-95',
                  active
                    ? opt.id === 'hit'
                      ? 'bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-1 ring-emerald-500/50 neon-text-emerald'
                      : opt.id === 'miss'
                        ? 'bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-1 ring-amber-500/50 neon-text-amber'
                        : 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.4)] ring-1 ring-cyan-500/50 neon-text-cyan'
                    : 'text-slate-300',
                ].join(' ')}
                aria-pressed={active}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        <Button
          type="submit"
          disabled={isBusy}
          className="group w-full bg-cyan-500/20 text-cyan-300 font-bold tracking-wide border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.15)] transition-all duration-300 disabled:opacity-60"
        >
          {isBusy ? (
            <>
              <Search className="size-4 animate-pulse" aria-hidden="true" />
              Calculating...
            </>
          ) : (
            <>
              <Zap className="size-4 transition-transform group-hover:scale-110" aria-hidden="true" />
              Fetch Data
            </>
          )}
        </Button>
      </form>

      {breakdown ? (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-800/60 bg-slate-950/40 p-4 transition-all duration-500 relative overflow-hidden">
          {animStep >= 1 && animStep < 4 && (
            <div className="absolute inset-0 pointer-events-none animate-scan-line" />
          )}

          {/* Step progress indicators */}
          <div className="flex items-center gap-1">
            {STEP_LABELS.map((label, i) => {
              const stepNum = i + 1
              const isActive = animStep >= stepNum
              const isCurrent = animStep === stepNum
              return (
                <div key={i} className="flex items-center gap-1">
                  <div
                    className={[
                      'size-4 rounded-full flex items-center justify-center text-[8px] font-bold border transition-all duration-500 shrink-0',
                      isActive
                        ? isCurrent
                          ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 animate-step-glow'
                          : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                        : 'bg-slate-900 border-slate-800 text-slate-600',
                    ].join(' ')}
                  >
                    {isActive && !isCurrent ? (
                      <Check className="size-2.5" />
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span
                    className={[
                      'text-[9px] font-medium transition-colors duration-300',
                      isActive ? 'text-cyan-400' : 'text-slate-600',
                    ].join(' ')}
                  >
                    {label}
                  </span>
                  {i < STEP_LABELS.length - 1 && (
                    <ChevronRight className="size-2.5 text-slate-700 mx-0.5" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Step 1–2: Binary Conversion */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              {animStep >= 2 ? (
                <>
                  <Check className="size-3 text-cyan-400" />
                  Binary Conversion
                </>
              ) : animStep >= 1 ? (
                <span className="text-cyan-400">Converting to binary…</span>
              ) : (
                'Binary Conversion'
              )}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <code
                className={[
                  'font-mono text-sm transition-all duration-500 px-1.5 py-0.5 rounded',
                  animStep >= 1
                    ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/20'
                    : 'text-slate-200',
                ].join(' ')}
              >
                {breakdown.hex}
              </code>
              <span className="text-slate-600 text-xs">→</span>
              <div className="flex gap-0.5 font-mono text-sm">
                {binaryNibbles.map((nibble, i) => (
                  <span
                    key={i}
                    className={[
                      'inline-block rounded px-0.5 transition-all',
                      animStep >= 2
                        ? 'animate-nibble-appear text-slate-200 bg-slate-800/50'
                        : 'text-slate-600',
                    ].join(' ')}
                    style={
                      animStep >= 2
                        ? { animationDelay: `${i * 200}ms` }
                        : undefined
                    }
                  >
                    {nibble}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3: Bit Slicing */}
          {animStep >= 3 && (
            <div className="flex flex-col gap-2 animate-explanation-fade">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Check className="size-3 text-cyan-400" />
                Bit Slicing — Tag / Index / Offset
              </span>

              <div className="flex font-mono text-sm rounded-lg overflow-hidden border border-slate-800">
                <span className="bg-emerald-500/15 text-emerald-300 px-2 py-1 border-r border-slate-700 highlight-tag font-bold tracking-wider">
                  {breakdown.tagBits}
                </span>
                <span className="bg-blue-500/15 text-blue-300 px-2 py-1 border-r border-slate-700 highlight-index font-bold tracking-wider">
                  {breakdown.indexBits}
                </span>
                <span className="bg-fuchsia-500/15 text-fuchsia-300 px-2 py-1 highlight-offset font-bold tracking-wider">
                  {breakdown.offsetBits}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 font-mono">
                <span
                  className="inline-flex animate-badge-enter bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{ animationDelay: '0ms' }}
                >
                  Tag [{breakdown.tagBits}]
                </span>
                <span
                  className="inline-flex animate-badge-enter bg-blue-500/15 text-blue-300 border border-blue-500/40 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{ animationDelay: '150ms' }}
                >
                  Index [{breakdown.indexBits}]
                </span>
                <span
                  className="inline-flex animate-badge-enter bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/40 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{ animationDelay: '300ms' }}
                >
                  Offset [{breakdown.offsetBits}]
                </span>
              </div>
            </div>
          )}

          {/* Step 4: Explanation */}
          {animStep >= 4 && (
            <div className="animate-explanation-fade flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Check className="size-3 text-cyan-400" />
                Lookup Ready
              </span>
              <p className="text-[11px] leading-relaxed text-slate-400">
                The <span className="text-blue-300 font-semibold">index</span> selects cache row{' '}
                <span className="text-blue-300 font-semibold">#{breakdown.index}</span>, then the{' '}
                <span className="text-emerald-300 font-semibold">tag</span>{' '}
                <span className="text-emerald-300 font-mono">[{breakdown.tagBits}]</span> is compared
                against the stored tag to confirm a hit or miss.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-800/60 bg-slate-950/20 p-4 text-xs text-slate-600">
          <ZapOff className="size-4" aria-hidden="true" />
          Enter an address and fetch to see its bit breakdown.
        </div>
      )}
    </Card>
  )
}
