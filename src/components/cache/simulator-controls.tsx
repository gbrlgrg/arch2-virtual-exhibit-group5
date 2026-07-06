'use client'

import { useState } from 'react'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Cpu, Search, Zap, ZapOff } from 'lucide-react'
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

export function SimulatorControls({
  breakdown,
  error,
  isBusy,
  forceMode,
  onForceModeChange,
  onFetch,
}: SimulatorControlsProps) {
  const [value, setValue] = useState('0x1A4')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onFetch(value)
  }

  const forceOptions: { id: ForceMode; label: string }[] = [
    { id: 'auto', label: 'Auto' },
    { id: 'hit', label: 'Force Hit' },
    { id: 'miss', label: 'Force Miss' },
  ]

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

        {/* Forced outcome toggle for testing/teaching */}
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
                  'flex-1 rounded px-2 py-1.5 text-xs font-medium transition-all duration-300',
                  active
                    ? opt.id === 'hit'
                      ? 'bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                      : opt.id === 'miss'
                        ? 'bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                        : 'bg-cyan-500/15 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                    : 'text-slate-500 hover:text-slate-300',
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
          className="group w-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.35)] transition-all duration-300 disabled:opacity-60"
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

      {/* Address breakdown — appears after a successful parse */}
      {breakdown ? (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-800/60 bg-slate-950/40 p-4 transition-all duration-500">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">
              Binary Conversion
            </span>
            <code className="font-mono text-sm text-slate-200">
              {breakdown.binaryGrouped}
            </code>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">
              Sliced Bits
            </span>
            <div className="flex flex-wrap items-center gap-2 font-mono">
              <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/15">
                Tag {breakdown.tagBits}
              </Badge>
              <Badge className="bg-blue-500/15 text-blue-300 border border-blue-500/40 hover:bg-blue-500/15">
                Index {breakdown.indexBits}
              </Badge>
              <Badge className="bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/40 hover:bg-fuchsia-500/15">
                Offset {breakdown.offsetBits}
              </Badge>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              The <span className="text-blue-300">index</span> picks cache row{' '}
              <span className="text-blue-300">#{breakdown.index}</span>; the{' '}
              <span className="text-emerald-300">tag</span> is compared to confirm
              the block is the one we want.
            </p>
          </div>
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
