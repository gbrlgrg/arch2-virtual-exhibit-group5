import { useCallback, useRef, useState } from 'react'
import { SimulatorControls } from './cache/simulator-controls'
import { ExhibitNotes } from './cache/exhibit-notes'
import { Visualizer, type SimState } from './cache/visualizer'
import {
  createEmptyCache,
  lookup,
  parseAddress,
  type AddressBreakdown,
  type CacheRow,
} from '../lib/cache-sim'
import { MemoryStick } from 'lucide-react'

type ForceMode = 'auto' | 'hit' | 'miss'

export default function Page() {
  const [breakdown, setBreakdown] = useState<AddressBreakdown | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [forceMode, setForceMode] = useState<ForceMode>('auto')

  const [simState, setSimState] = useState<SimState>('idle')
  const [latency, setLatency] = useState(0)
  const [cache, setCache] = useState<CacheRow[]>(() => createEmptyCache())
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Track pending timers so rapid clicks don't stack overlapping animations.
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const handleFetch = useCallback(
    (rawInput: string) => {
      // Clear any in-flight animation timers.
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []

      const parsed = parseAddress(rawInput)
      if (!parsed) {
        setError('Enter a valid hex address, e.g. 0x1A4')
        return
      }
      setError(null)
      setBreakdown(parsed)

      // Step 1: show a brief "calculating" state.
      setSimState('calculating')
      setActiveIndex(parsed.index)
      setLatency(0)

      const t = setTimeout(() => {
        // Step 2: resolve the lookup against current cache state.
        const result = lookup(cache, parsed, forceMode)
        setCache(result.cache)
        setLatency(result.latency)
        setSimState(result.outcome)
      }, 650)

      timersRef.current.push(t)
    },
    [cache, forceMode],
  )

  return (
    <div className="cache-simulator rounded-xl bg-slate-950 text-slate-100 selection:bg-cyan-500/30 overflow-hidden">
      {/* subtle grid glow background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(34,211,238,0.07),transparent_45%),radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.05),transparent_45%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Title area */}
        <header className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
              <MemoryStick className="size-5" aria-hidden="true" />
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-cyan-400/80">
              CPU Cache Visualizer
            </span>
          </div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Ca-Ching! <span className="text-cyan-400">— The Cache Visualizer</span>
          </h2>
          <p className="max-w-2xl text-pretty text-sm leading-relaxed text-slate-400">
            Watch the CPU race against the hardware speed gap. Fetch a memory
            address and see whether it&apos;s a lightning-fast cache hit or a
            costly trip down to main memory.
          </p>
        </header>

        {/* Responsive split: single column on mobile, 40/60 on desktop */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr]">
          {/* LEFT: controller + notes */}
          <div className="flex flex-col gap-6">
            <SimulatorControls
              breakdown={breakdown}
              error={error}
              isBusy={simState === 'calculating'}
              forceMode={forceMode}
              onForceModeChange={setForceMode}
              onFetch={handleFetch}
            />
            <ExhibitNotes />
          </div>

          {/* RIGHT: visualizer + latency dashboard */}
          <Visualizer
            state={simState}
            latency={latency}
            cache={cache}
            activeIndex={activeIndex}
          />
        </div>
      </div>
    </div>
  )
}
