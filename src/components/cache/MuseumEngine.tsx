import { useCallback, useRef, useState, useEffect } from 'react'
import { SimulatorControls } from './simulator-controls'
import { Visualizer, type SimState } from './visualizer'
import {
  createEmptyCache,
  lookup,
  parseAddress,
  type AddressBreakdown,
  type CacheRow,
} from '../../lib/cache-sim'
import {
  MemoryStick, ChevronRight, Zap, GraduationCap, Cpu, Layers,
  BookOpen, FlaskConical, BarChart3
} from 'lucide-react'

type ForceMode = 'auto' | 'hit' | 'miss'
type ReplacementAlgo = 'lru' | 'mru' | 'fifo' | 'random'
type TabId = 'architecture' | 'mapping' | 'replacement' | 'writepolicies' | 'canon'

// ─── LRU TRACE STEP TYPE ────────────────────────────────────────────────────
type TraceStep = {
  request: string
  outcome: 'hit' | 'miss'
  evicted: string | null
  cache: string[]
}

const LRU_TRACE: TraceStep[] = [
  { request: 'A', outcome: 'miss', evicted: null,   cache: ['A', '—', '—', '—'] },
  { request: 'B', outcome: 'miss', evicted: null,   cache: ['A', 'B', '—', '—'] },
  { request: 'C', outcome: 'miss', evicted: null,   cache: ['A', 'B', 'C', '—'] },
  { request: 'D', outcome: 'miss', evicted: null,   cache: ['A', 'B', 'C', 'D'] },
  { request: 'E', outcome: 'miss', evicted: 'A',    cache: ['E', 'B', 'C', 'D'] },
  { request: 'D', outcome: 'hit',  evicted: null,   cache: ['E', 'B', 'C', 'D'] },
  { request: 'F', outcome: 'miss', evicted: 'B',    cache: ['E', 'F', 'C', 'D'] },
]

const MRU_FAIL_TRACE: TraceStep[] = [
  { request: 'A', outcome: 'miss', evicted: null,   cache: ['A', '—', '—', '—'] },
  { request: 'B', outcome: 'miss', evicted: null,   cache: ['A', 'B', '—', '—'] },
  { request: 'C', outcome: 'miss', evicted: null,   cache: ['A', 'B', 'C', '—'] },
  { request: 'D', outcome: 'miss', evicted: null,   cache: ['A', 'B', 'C', 'D'] },
  { request: 'E', outcome: 'miss', evicted: 'A',    cache: ['E', 'B', 'C', 'D'] }, // LRU evicts A
  { request: 'A', outcome: 'miss', evicted: 'B',    cache: ['E', 'A', 'C', 'D'] }, // LRU evicts B — A was just evicted!
  { request: 'B', outcome: 'miss', evicted: 'C',    cache: ['E', 'A', 'B', 'D'] }, // LRU evicts C
]

const MRU_WIN_TRACE: TraceStep[] = [
  { request: 'A', outcome: 'miss', evicted: null,   cache: ['A', '—', '—', '—'] },
  { request: 'B', outcome: 'miss', evicted: null,   cache: ['A', 'B', '—', '—'] },
  { request: 'C', outcome: 'miss', evicted: null,   cache: ['A', 'B', 'C', '—'] },
  { request: 'D', outcome: 'miss', evicted: null,   cache: ['A', 'B', 'C', 'D'] },
  { request: 'E', outcome: 'miss', evicted: 'D',    cache: ['A', 'B', 'C', 'E'] }, // MRU evicts D (most recent)
  { request: 'A', outcome: 'hit',  evicted: null,   cache: ['A', 'B', 'C', 'E'] }, // A is still here!
  { request: 'B', outcome: 'hit',  evicted: null,   cache: ['A', 'B', 'C', 'E'] }, // B is still here!
]

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function MuseumEngine() {
  const [breakdown, setBreakdown] = useState<AddressBreakdown | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [forceMode, setForceMode] = useState<ForceMode>('auto')
  const [replacementAlgo, setReplacementAlgo] = useState<ReplacementAlgo>('lru')
  const [simState, setSimState] = useState<SimState>('idle')
  const [latency, setLatency] = useState(0)
  const [cache, setCache] = useState<CacheRow[]>(() => createEmptyCache())
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('architecture')

  // Running scoreboard
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)

  // LRU trace step index
  const [lruStep, setLruStep] = useState(0)
  const [mruMode, setMruMode] = useState<'fail' | 'win'>('fail')

  // Flash state
  const [triggered, setTriggered] = useState(false)

  // ─── GAMIFICATION STATE ──────────────────────────────────────────────────
  const [xp, setXp] = useState(0)
  const [timeSaved, setTimeSaved] = useState(0)
  const [isLevelingUp, setIsLevelingUp] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [isOverclocking, setIsOverclocking] = useState(false)
  const [thrashState, setThrashState] = useState<'A'|'B'>('A')
  const [thrashCount, setThrashCount] = useState(0)
  const [trolleyState, setTrolleyState] = useState<'idle'|'prompt'|'success'|'fail'>('idle')
  const [powerState, setPowerState] = useState<'idle'|'writing'|'blackout'|'lost'>('idle')
  const [examState, setExamState] = useState<'idle'|'running'|'success'|'fail'>('idle')
  const [examTime, setExamTime] = useState(5)
  const [hackerMode, setHackerMode] = useState(false)
  const [isGlitching, setIsGlitching] = useState(false)
  const [optimizationCount, setOptimizationCount] = useState(0)

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const simulatorRef = useRef<HTMLDivElement>(null)

  const handleFetch = useCallback(
    (rawInput: string, overrideForce?: ForceMode) => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
      const parsed = parseAddress(rawInput)
      if (!parsed) { setError('Enter a valid hex address, e.g. 0x1A4'); return }
      setError(null)
      setBreakdown(parsed)
      setActiveIndex(parsed.index)
      setLatency(0)
      const effectiveForce = overrideForce ?? forceMode

      // Let the breakdown animation finish (2000ms) before starting the visualizer
      const tCalc = setTimeout(() => {
        setSimState('calculating')
      }, 2000)

      const tResult = setTimeout(() => {
        setCache((currentCache) => {
          const result = lookup(currentCache, parsed, effectiveForce)
          setLatency(result.latency)
          setSimState(result.outcome)
          if (result.outcome === 'hit') setHits(h => h + 1)
          else if (result.outcome === 'miss') setMisses(m => m + 1)
          return result.cache
        })
      }, 3200)
      timersRef.current.push(tCalc, tResult)
    },
    [forceMode],
  )

  const triggerSimulation = (address: string, fm?: ForceMode) => {
    setTriggered(true)
    setTimeout(() => setTriggered(false), 1800)
    if (fm) setForceMode(fm)

    // Scroll to the simulator panel
    simulatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

    setTimeout(() => { handleFetch(address, fm) }, 300)
  }

  // ─── GAMIFICATION HANDLERS ─────────────────────────────────────────────────
  const handleOverclock = () => {
    if (isOverclocking) return
    setIsOverclocking(true)
    let count = 0
    const interval = setInterval(() => {
      const isHit = Math.random() > 0.35
      if (isHit) {
        setHits(h => h + 1)
        setXp(x => x + 5)
      } else {
        setMisses(m => m + 1)
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 50)
      }
      setSimState(isHit ? 'hit' : 'miss')
      count++
      if (count >= 40) {
        clearInterval(interval)
        setIsOverclocking(false)
        setSimState('idle')
      }
    }, 60)
  }

  const startExam = () => {
    setExamState('running')
    setExamTime(5)
    if ((window as any).examTimer) clearInterval((window as any).examTimer)
    ;(window as any).examTimer = setInterval(() => {
      setExamTime(t => {
        if (t <= 1) {
          clearInterval((window as any).examTimer)
          setExamState('fail')
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  const answerExam = (correct: boolean) => {
    if ((window as any).examTimer) clearInterval((window as any).examTimer)
    if (correct) {
      setExamState('success')
      setXp(x => x + 50)
    } else {
      setExamState('fail')
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 300)
    }
  }

  const defragmentCache = () => {
    setOptimizationCount(c => c + 1)
    setXp(x => x + 10)
  }

  const totalOps = hits + misses
  const hitRate = totalOps > 0 ? ((hits / totalOps) * 100).toFixed(1) : '—'

  const tabs: { id: TabId; label: string; icon: React.ReactNode; color: 'indigo'|'cyan'|'emerald'|'amber'|'violet' }[] = [
    { id: 'architecture', label: '1. Architecture',       icon: <Cpu className="size-4" />,        color: 'indigo'  },
    { id: 'mapping',      label: '2. Mapping Functions',  icon: <Layers className="size-4" />,      color: 'cyan'    },
    { id: 'replacement',  label: '3. Replacement Algos',  icon: <Zap className="size-4" />,         color: 'emerald' },
    { id: 'writepolicies',label: '4. Write Policies',     icon: <FlaskConical className="size-4" />,color: 'amber'   },
    { id: 'canon',        label: '5. Academic Canon',     icon: <BookOpen className="size-4" />,    color: 'violet'  },
  ]

  const glowMap = {
    architecture:  'bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.5)_0%,transparent_70%)]',
    mapping:       'bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.5)_0%,transparent_70%)]',
    replacement:   'bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.5)_0%,transparent_70%)]',
    writepolicies: 'bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.5)_0%,transparent_70%)]',
    canon:         'bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.5)_0%,transparent_70%)]',
  }

  // Each tab gets its own simulator identity in the right-hand panel
  const simulatorTitleMap: Record<TabId, string> = {
    architecture:  'Live Telemetry',
    mapping:       'Mapping Engine',
    replacement:   'Eviction Engine',
    writepolicies: 'Write Policy Engine',
    canon:         'Live Telemetry',
  }

  return (
    <div className={['flex flex-col lg:flex-row w-full min-h-[750px] bg-slate-950/40 backdrop-blur-3xl text-slate-100 rounded-2xl border border-slate-700/50 ring-1 ring-white/10 ring-inset overflow-hidden font-sans shadow-[0_0_50px_rgba(34,211,238,0.15)] my-6', isShaking ? 'animate-micro-screen-shake' : ''].join(' ')}>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* LEFT PANEL: EXHIBIT GUIDE                                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-[42%] flex flex-col border-b lg:border-b-0 lg:border-r border-slate-700/50 bg-slate-900/60 backdrop-blur-xl">

        {/* Header */}
        <header className="px-5 py-5 border-b border-slate-800/60 shrink-0">
          <div className="text-cyan-400 font-mono text-[9px] font-semibold tracking-[0.25em] uppercase mb-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></span>
            CSARCH2 · Group 5 · Interactive Exhibit
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="size-5 text-indigo-400 shrink-0" />
            <h3 className="text-lg font-bold tracking-tight text-white leading-tight">
              Ca-Ching! — Cache Memory Guide
            </h3>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="flex flex-col gap-0.5 px-2.5 py-2.5 shrink-0 border-b border-slate-800/60">
          {tabs.map(t => (
            <TabButton
              key={t.id}
              id={t.id}
              label={t.label}
              icon={t.icon}
              active={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              color={t.color}
            />
          ))}
        </nav>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0 custom-scrollbar">

          {/* ─── TAB 1: ARCHITECTURE ─────────────────────────────── */}
          {activeTab === 'architecture' && (
            <div className="space-y-4 text-xs">
              <SectionTitle color="indigo">The Memory Hierarchy</SectionTitle>

              <p className="text-slate-300 leading-relaxed">
                A modern CPU at <Hl color="cyan">2.0 GHz</Hl> executes one cycle every <Hl color="cyan">0.5 nanoseconds</Hl>. Yet Dynamic RAM — the main memory — takes <Hl color="rose">50–70 ns</Hl> to respond. This is the <Hl color="rose">Memory Wall</Hl>.
              </p>

              <Callout color="rose" icon="!" label="THE MEMORY WALL">
                A 2.0 GHz CPU forced to wait <strong>50 ns</strong> for RAM wastes <strong className="text-rose-300">100 clock cycles</strong> doing absolutely nothing. Cache memory exists solely to intercept this catastrophic delay.
              </Callout>

              <p className="text-slate-300 leading-relaxed">
                The solution: place ultra-fast <Hl color="cyan">Static RAM (SRAM)</Hl> directly on the CPU die. It responds in 0.5–2.5 ns, matching processor speed — but it costs exponentially more per bit, so cache is tiny.
              </p>

              {/* Full 4-row hierarchy table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <div className="bg-slate-800/60 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Memory Hierarchy — Full Comparison
                </div>
                <table className="w-full text-[10px]">
                  <thead className="border-b border-slate-800">
                    <tr className="text-slate-500 uppercase tracking-wider">
                      <th className="px-3 py-2 text-left font-semibold">Technology</th>
                      <th className="px-3 py-2 text-left font-semibold">Usage</th>
                      <th className="px-3 py-2 text-left font-semibold">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr className="bg-cyan-500/5">
                      <td className="px-3 py-2 font-semibold text-cyan-400">SRAM</td>
                      <td className="px-3 py-2 text-slate-400">Cache (on-die)</td>
                      <td className="px-3 py-2 font-mono text-emerald-400">0.5 – 2.5 ns</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-semibold text-indigo-400">DRAM</td>
                      <td className="px-3 py-2 text-slate-400">Main Memory</td>
                      <td className="px-3 py-2 font-mono text-amber-400">50 – 70 ns</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-semibold text-slate-300">Flash</td>
                      <td className="px-3 py-2 text-slate-400">Solid State Drive</td>
                      <td className="px-3 py-2 font-mono text-rose-400">5,000 – 50,000 ns</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-semibold text-slate-400">Magnetic Disk</td>
                      <td className="px-3 py-2 text-slate-400">Hard Drive</td>
                      <td className="px-3 py-2 font-mono text-rose-600">&gt; 5,000,000 ns</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <SectionTitle color="indigo">The Library Analogy</SectionTitle>
              <Callout color="indigo" icon="" label="ANALOGY">
                A <strong>researcher (CPU)</strong> works in a <strong>vast library (RAM)</strong>. Walking to shelves = high-latency RAM access. Books on the <strong>small desk (Cache)</strong> = instant retrieval. Because the desk is tiny, they must be selective — governed by the <strong>Principles of Locality</strong>.
              </Callout>

              <SectionTitle color="indigo">Cache Levels: L1, L2, L3</SectionTitle>
              <p className="text-slate-300 leading-relaxed">
                Modern CPUs don't have just one cache — they use a <Hl color="cyan">multi-level hierarchy</Hl>. Each level trades speed for capacity:<sup className="text-indigo-400">[1][2]</sup>
              </p>

              <div className="flex flex-col gap-1.5 my-2">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="w-16 font-bold text-cyan-400 shrink-0">L1 Cache</span>
                  <div className="flex-1 bg-slate-900 rounded-full h-3 border border-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-cyan-500/40" style={{ width: '15%' }} />
                  </div>
                  <span className="w-24 text-right text-slate-500 shrink-0">32–64 KB</span>
                  <span className="w-24 text-right font-mono text-slate-400 shrink-0">~1 ns</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="w-16 font-bold text-indigo-400 shrink-0">L2 Cache</span>
                  <div className="flex-1 bg-slate-900 rounded-full h-3 border border-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500/40" style={{ width: '40%' }} />
                  </div>
                  <span className="w-24 text-right text-slate-500 shrink-0">256 KB–1 MB</span>
                  <span className="w-24 text-right font-mono text-slate-400 shrink-0">~3–10 ns</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="w-16 font-bold text-violet-400 shrink-0">L3 Cache</span>
                  <div className="flex-1 bg-slate-900 rounded-full h-3 border border-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-violet-500/40" style={{ width: '75%' }} />
                  </div>
                  <span className="w-24 text-right text-slate-500 shrink-0">4–64 MB</span>
                  <span className="w-24 text-right font-mono text-slate-400 shrink-0">~10–30 ns</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="w-16 font-bold text-amber-400 shrink-0">RAM</span>
                  <div className="flex-1 bg-slate-900 rounded-full h-3 border border-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500/40" style={{ width: '100%' }} />
                  </div>
                  <span className="w-24 text-right text-slate-500 shrink-0">8–128 GB</span>
                  <span className="w-24 text-right font-mono text-slate-400 shrink-0">~50–100 ns</span>
                </div>
              </div>

              <Callout color="indigo" icon="" label="INCLUSIVE vs EXCLUSIVE">
                <strong>Inclusive:</strong> L2 contains a copy of everything in L1. Simplifies coherence but wastes space. <strong>Exclusive:</strong> Each level holds unique data — maximizes total usable cache. Most modern CPUs use a hybrid approach.<sup className="text-indigo-400">[4][14]</sup>
              </Callout>

              <SectionTitle color="indigo">Real-World Cache Configurations</SectionTitle>
              <p className="text-slate-300 leading-relaxed">
                How do these concepts translate to actual hardware? Here are cache specs from modern processors:<sup className="text-indigo-400">[20][21][22]</sup>
              </p>
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-[10px]">
                  <thead className="bg-slate-800/60 border-b border-slate-800">
                    <tr className="text-slate-400 uppercase tracking-wider">
                      <th className="px-2 py-2 text-left">Processor</th>
                      <th className="px-2 py-2 text-left">L1 (per core)</th>
                      <th className="px-2 py-2 text-left">L2</th>
                      <th className="px-2 py-2 text-left">L3</th>
                      <th className="px-2 py-2 text-left">Mapping</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr>
                      <td className="px-2 py-2 font-semibold text-cyan-400">Intel i9-13900K</td>
                      <td className="px-2 py-2 text-slate-400">80 KB (48+32)</td>
                      <td className="px-2 py-2 text-slate-400">2 MB</td>
                      <td className="px-2 py-2 text-slate-400">36 MB</td>
                      <td className="px-2 py-2 text-emerald-400">8–16 way</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-2 font-semibold text-violet-400">Apple M2</td>
                      <td className="px-2 py-2 text-slate-400">192+128 KB</td>
                      <td className="px-2 py-2 text-slate-400">16 MB</td>
                      <td className="px-2 py-2 text-slate-400">—</td>
                      <td className="px-2 py-2 text-emerald-400">8–12 way</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-2 font-semibold text-amber-400">AMD Ryzen 9 7950X</td>
                      <td className="px-2 py-2 text-slate-400">64 KB (32+32)</td>
                      <td className="px-2 py-2 text-slate-400">1 MB</td>
                      <td className="px-2 py-2 text-slate-400">64 MB</td>
                      <td className="px-2 py-2 text-emerald-400">8–16 way</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-slate-400 text-[10px]">
                Notice: all modern CPUs use <Hl color="emerald">Set-Associative mapping</Hl> (8-way or higher) — the "VIP Parking Zones" architecture from Tab 2. No major CPU uses Direct Mapping for L1.
              </p>

              <SectionTitle color="indigo">Principles of Locality</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <Callout color="cyan" icon="" label="TEMPORAL LOCALITY">
                  If data is accessed, it will likely be accessed <strong>again soon</strong>. Example: variables in a <code>for</code> loop.
                </Callout>
                <Callout color="violet" icon="" label="SPATIAL LOCALITY">
                  If data at address N is accessed, <strong>nearby addresses</strong> will be accessed soon. Example: traversing an array sequentially.
                </Callout>
              </div>

              <SectionTitle color="indigo">Hits, Misses & The AMAT Formula</SectionTitle>
              <p className="text-slate-300 leading-relaxed">
                A <Hl color="emerald">Cache Hit</Hl> delivers data instantly at ~2 ns. A <Hl color="amber">Cache Miss</Hl> forces the CPU to stall while RAM is fetched — the full delay is called the <strong>Miss Penalty</strong>.
              </p>
              <div className="bg-slate-950 border border-slate-700 rounded-xl p-4">
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2">AMAT Formula [Patterson & Hennessy]</div>
                <div className="font-mono text-sm text-white text-center py-2 border-y border-slate-800 mb-3">
                  AMAT = HitTime + (MissRate × MissPenalty)
                </div>
                <div className="text-[10px] text-slate-400 space-y-1">
                  <div className="flex justify-between"><span>Cache hit time:</span> <span className="text-emerald-400 font-mono">1 cycle</span></div>
                  <div className="flex justify-between"><span>Main memory penalty:</span> <span className="text-amber-400 font-mono">~82 cycles</span></div>
                  <div className="flex justify-between font-bold border-t border-slate-800 pt-1 mt-1"><span>Result with 95% hit rate:</span> <span className="text-cyan-400 font-mono">778 cycles</span></div>
                  <div className="flex justify-between text-slate-500"><span>Without cache:</span> <span className="font-mono">1,300 cycles</span></div>
                </div>
              </div>
              <p className="text-slate-400 text-[10px]">The cache nearly halves total execution time just by intercepting the vast majority of memory requests.</p>

              <SectionTitle color="indigo">Miss Penalty — Step-by-Step Breakdown</SectionTitle>
              <p className="text-slate-300 leading-relaxed">
                How is the <Hl color="amber">82-cycle miss penalty</Hl> calculated? Here's the complete breakdown from the textbook example:<sup className="text-indigo-400">[1][2]</sup>
              </p>
              <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 space-y-2">
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2">
                  Miss Penalty Calculation (8-word block, 10 cycles/word)
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="size-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400 shrink-0">1</span>
                  <span className="flex-1 text-slate-300">Failed cache access (check tag, realize miss)</span>
                  <span className="font-mono font-bold text-rose-400 shrink-0">1 cycle</span>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="size-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400 shrink-0">2</span>
                  <span className="flex-1 text-slate-300">Transfer 8 words from RAM → Cache (8 × 10 cycles)</span>
                  <span className="font-mono font-bold text-amber-400 shrink-0">80 cycles</span>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="size-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400 shrink-0">3</span>
                  <span className="flex-1 text-slate-300">Deliver requested word to CPU</span>
                  <span className="font-mono font-bold text-cyan-400 shrink-0">1 cycle</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] border-t border-slate-800 pt-2 mt-1">
                  <span className="size-5 shrink-0" />
                  <span className="flex-1 text-white font-bold">Total Miss Penalty</span>
                  <span className="font-mono font-bold text-rose-400 shrink-0">82 cycles</span>
                </div>
              </div>
              <p className="text-slate-400 text-[10px]">
                This is why even a small drop in hit rate (e.g. 95% → 90%) causes a <strong>disproportionate</strong> increase in total execution time — each miss costs 82× more than a hit.
              </p>

              <div className="flex flex-col gap-2 mt-2">
                <TriggerButton label="Try: Cache Hit (0x1A4)" sub="Delivers in ~2ns" color="emerald" onClick={() => triggerSimulation('0x1A4', 'hit')} />
                <TriggerButton label="Try: Cache Miss (0x1A4)" sub="Forces RAM fetch, 100ns penalty" color="rose" onClick={() => triggerSimulation('0x1A4', 'miss')} />
              </div>
            </div>
          )}

          {/* ─── TAB 2: MAPPING FUNCTIONS ────────────────────────── */}
          {activeTab === 'mapping' && (
            <div className="space-y-4 text-xs">
              <SectionTitle color="cyan">Anatomy of a Cache Line</SectionTitle>
              <p className="text-slate-300 leading-relaxed">
                Every cache slot stores more than just data. The hardware wraps each data block with metadata fields for instant lookup:<sup className="text-cyan-400">[1][4]</sup>
              </p>
              <div className="flex gap-0.5 font-mono text-[10px] my-2">
                <div className="w-10 bg-emerald-500/20 border border-emerald-500/40 rounded-l-lg p-2 text-center">
                  <div className="text-emerald-300 font-bold text-[11px]">V</div>
                  <div className="text-slate-500 text-[8px]">Valid</div>
                  <div className="text-slate-600 text-[8px]">1 bit</div>
                </div>
                <div className="w-10 bg-amber-500/20 border border-amber-500/40 p-2 text-center">
                  <div className="text-amber-300 font-bold text-[11px]">D</div>
                  <div className="text-slate-500 text-[8px]">Dirty</div>
                  <div className="text-slate-600 text-[8px]">1 bit</div>
                </div>
                <div className="flex-[2] bg-indigo-500/20 border border-indigo-500/40 p-2 text-center">
                  <div className="text-indigo-300 font-bold text-[11px]">TAG</div>
                  <div className="text-slate-500 text-[8px]">Identifies block</div>
                  <div className="text-slate-600 text-[8px]">varies (e.g. 7 bits)</div>
                </div>
                <div className="flex-[3] bg-cyan-500/20 border border-cyan-500/40 rounded-r-lg p-2 text-center">
                  <div className="text-cyan-300 font-bold text-[11px]">DATA BLOCK</div>
                  <div className="text-slate-500 text-[8px]">Actual cached bytes</div>
                  <div className="text-slate-600 text-[8px]">e.g. 4 bytes (1 word)</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="text-slate-400"><Hl color="emerald">Valid Bit (V)</Hl> — Is this slot occupied with real data? 0 after boot, 1 after first load.</div>
                <div className="text-slate-400"><Hl color="amber">Dirty Bit (D)</Hl> — Has this data been modified by the CPU? Only used with Write-Back policy.</div>
              </div>

              <SectionTitle color="cyan">Address Bit Partitioning</SectionTitle>
              <p className="text-slate-300 leading-relaxed">
                Every memory address is mathematically sliced into three binary fields by the cache controller in nanoseconds:
              </p>
              <div className="flex gap-1 font-mono text-[10px] my-2">
                <div className="flex-1 bg-indigo-500/20 border border-indigo-500/40 rounded p-2 text-center text-indigo-300 font-bold">TAG<div className="text-slate-500 font-normal text-[9px]">Unique ID</div></div>
                <div className="flex-1 bg-cyan-500/20 border border-cyan-500/40 rounded p-2 text-center text-cyan-300 font-bold">INDEX / SET<div className="text-slate-500 font-normal text-[9px]">Which slot</div></div>
                <div className="flex-1 bg-emerald-500/20 border border-emerald-500/40 rounded p-2 text-center text-emerald-300 font-bold">WORD<div className="text-slate-500 font-normal text-[9px]">Byte offset</div></div>
              </div>
              <p className="text-slate-400 leading-relaxed">Every cache line also holds a <Hl color="amber">Valid Bit</Hl> — a 1-bit flag confirming the slot holds real data, not random electronic noise from boot.</p>

              {/* Direct Mapping */}
              <SectionTitle color="cyan">1. Direct Mapping — "Assigned Parking"</SectionTitle>
              <Callout color="cyan" icon="" label="THE PARKING LOT ANALOGY">
                A lot with <strong>4 spaces</strong> serves <strong>16 executives</strong>. Every executive is assigned exactly one space via modulo: <code className="text-cyan-300">space = executive_num mod 4</code>. Executive 13 → Space 1. Executive 5 → Space 1. They can never swap.
              </Callout>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-center my-2">
                <div className="text-slate-500 text-[10px] mb-1">Cache Slot Formula</div>
                <div className="text-cyan-300">slot = block_number <span className="text-slate-400">mod</span> total_cache_blocks</div>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong>Strength:</strong> Extremely fast — no comparators needed, just wire the index bits directly.<br />
                <strong className="text-rose-400">Fatal Flaw: Thrashing.</strong> If a loop alternates between two blocks mapped to the same slot (e.g., Block 1 and Block 5 both hit Slot 1), they endlessly evict each other — 0% hit rate — even if the rest of cache is empty.
              </p>
              <div className="flex flex-col gap-2">
                <TriggerButton label="Load Block (Miss)" sub="0x1A4 → maps to its assigned slot" color="cyan" onClick={() => triggerSimulation('0x1A4', 'miss')} />
                <TriggerButton label="Thrashing: Hit Same Slot" sub="0x1A4 → instant cache hit" color="emerald" onClick={() => triggerSimulation('0x1A4', 'hit')} />
              </div>

              {/* Fully Associative */}
              <SectionTitle color="cyan">2. Fully Associative — "Park Anywhere"</SectionTitle>
              <p className="text-slate-300 leading-relaxed">
                All "Assigned Parking" signs are torn down. Any memory block may occupy <em>any</em> available cache slot freely. Block 1 and Block 5 can coexist without conflict.
              </p>
              <Callout color="violet" icon="" label="HARDWARE COST">
                Because data can be anywhere, the controller must check <strong>every single slot simultaneously</strong> using parallel hardware comparators. As cache size grows, the comparator array becomes prohibitively expensive, power-hungry, and hot. Used only in tiny, specialized structures like <strong>Translation Lookaside Buffers (TLBs)</strong>.
              </Callout>

              {/* Set-Associative */}
              <SectionTitle color="cyan">3. Set-Associative — "VIP Parking Zones"</SectionTitle>
              <p className="text-slate-300 leading-relaxed">
                The best-of-both-worlds engineering compromise. Cache blocks are grouped into <strong>Sets</strong>. A block maps to a <em>specific Set</em> via modulo (fast), but may park in <em>any slot within that set</em> (flexible).
              </p>
              <Callout color="emerald" icon="" label="INDUSTRY STANDARD">
                A <strong>4-way set-associative cache</strong> has 4 slots per set. A block maps to its set quickly, then only 4 comparators check within that set — not all of cache. Modern CPUs use <strong>4-way, 8-way, or 16-way</strong> set-associative mapping as the dominant architecture.
              </Callout>

              {/* Comparison Table */}
              <SectionTitle color="cyan">Mapping Comparison</SectionTitle>
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-[10px]">
                  <thead className="bg-slate-800/60 border-b border-slate-800">
                    <tr className="text-slate-400 uppercase tracking-wider">
                      <th className="px-2 py-2 text-left">Type</th>
                      <th className="px-2 py-2 text-left">Placement</th>
                      <th className="px-2 py-2 text-left">HW Cost</th>
                      <th className="px-2 py-2 text-left">Thrash Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr>
                      <td className="px-2 py-2 font-semibold text-cyan-400">Direct</td>
                      <td className="px-2 py-2 text-slate-400">One fixed slot</td>
                      <td className="px-2 py-2 text-emerald-400">Very Low</td>
                      <td className="px-2 py-2 text-rose-400">Very High</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-2 font-semibold text-violet-400">Fully Assoc.</td>
                      <td className="px-2 py-2 text-slate-400">Any slot</td>
                      <td className="px-2 py-2 text-rose-400">Very High</td>
                      <td className="px-2 py-2 text-emerald-400">Zero</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-2 font-semibold text-emerald-400">Set-Assoc.</td>
                      <td className="px-2 py-2 text-slate-400">Any in set</td>
                      <td className="px-2 py-2 text-amber-400">Moderate</td>
                      <td className="px-2 py-2 text-amber-400">Low</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── TAB 3: REPLACEMENT ALGORITHMS ──────────────────── */}
          {activeTab === 'replacement' && (
            <div className="space-y-4 text-xs">
              <SectionTitle color="emerald">Why Replacement Matters</SectionTitle>
              <p className="text-slate-300 leading-relaxed">
                When cache is full and a miss occurs, a resident block must be <Hl color="rose">evicted (the "victim")</Hl>. In Direct Mapping, the slot is predetermined. In Set-Associative and Fully Associative caches, an algorithm must decide <em>which</em> block to sacrifice.
              </p>

              {/* Algorithm Selector */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Select Algorithm to Explore</div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(['lru', 'mru', 'fifo', 'random'] as const).map(algo => (
                    <button
                      key={algo}
                      onClick={() => setReplacementAlgo(algo)}
                      className={['px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all border',
                        replacementAlgo === algo
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600'
                      ].join(' ')}
                    >
                      {algo === 'lru' ? 'LRU' : algo === 'mru' ? 'MRU' : algo === 'fifo' ? 'FIFO' : 'Random'}
                    </button>
                  ))}
                </div>

                {replacementAlgo === 'lru' && (
                  <div className="space-y-2">
                    <p className="text-slate-300 leading-relaxed">
                      <strong className="text-emerald-400">Least Recently Used</strong> — Evicts the block untouched for the longest time. Perfectly follows Temporal Locality. Most widely used algorithm in modern CPUs.
                    </p>
                    <p className="text-slate-400">The downside: tracking access order requires additional <strong>"age bits"</strong> and complex high-speed update logic on every read/write. Becomes exponentially expensive in 16-way+ caches.</p>
                  </div>
                )}
                {replacementAlgo === 'mru' && (
                  <div className="space-y-2">
                    <p className="text-slate-300 leading-relaxed">
                      <strong className="text-amber-400">Most Recently Used</strong> — Evicts the <em>newest</em> block. Counterintuitive, but it solves the LRU's catastrophic failure in <strong>cyclic access patterns</strong> that exceed cache capacity.
                    </p>
                    <p className="text-slate-400">Use case: streaming large media files, scanning databases in circular buffers — where LRU achieves a disastrous <strong>0% hit rate</strong>.</p>
                  </div>
                )}
                {replacementAlgo === 'fifo' && (
                  <div className="space-y-2">
                    <p className="text-slate-300 leading-relaxed">
                      <strong className="text-cyan-400">First In, First Out</strong> — Treats cache like a conveyor belt. Evicts the block that has been in cache the longest, <em>regardless</em> of how often it was used.
                    </p>
                    <p className="text-slate-400">Simple and cheap to implement. Risk: may blindly evict a heavily-used critical block simply because it was loaded a long time ago.</p>
                  </div>
                )}
                {replacementAlgo === 'random' && (
                  <div className="space-y-2">
                    <p className="text-slate-300 leading-relaxed">
                      <strong className="text-violet-400">Random Replacement</strong> — A pseudo-random number generator picks the victim. Near-zero hardware tracking overhead.
                    </p>
                    <p className="text-slate-400">Surprisingly effective: statistical analysis shows that as cache associativity grows (8-way, 16-way), Random's hit rate <strong>naturally converges to LRU's performance</strong> at a fraction of the hardware cost. Widely used in high-associativity enterprise server caches.</p>
                  </div>
                )}

                <TriggerButton
                  label={`Simulate Eviction (${replacementAlgo.toUpperCase()})`}
                  sub="Force a miss to trigger victim selection"
                  color="rose"
                  onClick={() => triggerSimulation('0x3FF', 'miss')}
                />
              </div>

              {/* LRU Step-by-Step Trace */}
              <SectionTitle color="emerald">LRU — Step-by-Step Trace</SectionTitle>
              <p className="text-slate-400 leading-relaxed">
                Cache capacity: <strong>4 blocks</strong>. Request sequence: <code className="text-cyan-300">A → B → C → D → E → D → F</code>. Step through each request:
              </p>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div className="flex gap-1 mb-3">
                  {LRU_TRACE.map((step, i) => (
                    <button
                      key={i}
                      onClick={() => setLruStep(i)}
                      className={['flex-1 py-1.5 rounded text-[10px] font-bold transition-all border',
                        lruStep === i ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                      ].join(' ')}
                    >
                      {step.request}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 mb-3">
                  {LRU_TRACE[lruStep].cache.map((block, i) => (
                    <div key={i} className={['flex-1 py-2 rounded-lg border text-center font-mono text-sm font-bold transition-all',
                      block === '—' ? 'bg-slate-900 border-slate-800 text-slate-600' :
                      block === LRU_TRACE[lruStep].evicted ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' :
                      block === LRU_TRACE[lruStep].request && LRU_TRACE[lruStep].outcome === 'hit' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' :
                      'bg-slate-800 border-slate-700 text-slate-200'
                    ].join(' ')}>
                      {block}
                    </div>
                  ))}
                </div>
                <div className={['text-[10px] font-semibold text-center py-1.5 rounded-lg',
                  LRU_TRACE[lruStep].outcome === 'hit' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                ].join(' ')}>
                  Request "<strong>{LRU_TRACE[lruStep].request}</strong>" → {LRU_TRACE[lruStep].outcome === 'hit' ? 'HIT' : 'MISS'}
                  {LRU_TRACE[lruStep].evicted && <span className="text-rose-400 ml-2">(Evicted: {LRU_TRACE[lruStep].evicted})</span>}
                </div>
              </div>

              {/* MRU Failure vs Win */}
              <SectionTitle color="emerald">MRU — Failure vs. Success</SectionTitle>
              <div className="flex gap-1.5 mb-2">
                <button onClick={() => setMruMode('fail')} className={['flex-1 py-1.5 rounded text-[10px] font-bold border transition-all', mruMode === 'fail' ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-500'].join(' ')}>LRU Fails (0% hit rate)</button>
                <button onClick={() => setMruMode('win')} className={['flex-1 py-1.5 rounded text-[10px] font-bold border transition-all', mruMode === 'win' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'].join(' ')}>MRU Wins</button>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5 font-mono text-[10px]">
                <div className="text-slate-500 mb-2">Cyclic loop: A→B→C→D→E→A→B... | Cache size: 4</div>
                {(mruMode === 'fail' ? MRU_FAIL_TRACE : MRU_WIN_TRACE).map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-slate-600 w-4">{i + 1}.</span>
                    <span className="w-4 text-slate-200 font-bold">req {step.request}</span>
                    <span className={['px-1.5 py-0.5 rounded font-bold', step.outcome === 'hit' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'].join(' ')}>
                      {step.outcome === 'hit' ? 'HIT' : 'MISS'}
                    </span>
                    {step.evicted && <span className="text-rose-400">evict {step.evicted}</span>}
                    <span className="text-slate-600 ml-auto">[{step.cache.join(', ')}]</span>
                  </div>
                ))}
              </div>
              {mruMode === 'fail' && <p className="text-rose-400 text-[10px] font-semibold text-center">LRU achieves 0% hit rate — every request is a miss.</p>}
              {mruMode === 'win'  && <p className="text-emerald-400 text-[10px] font-semibold text-center">MRU retains older blocks and achieves multiple hits.</p>}
            </div>
          )}

          {/* ─── TAB 4: WRITE POLICIES ───────────────────────────── */}
          {activeTab === 'writepolicies' && (
            <div className="space-y-4 text-xs">
              <SectionTitle color="amber">The Write Synchronization Problem</SectionTitle>
              <p className="text-slate-300 leading-relaxed">
                When the CPU <em>reads</em> data from cache, the flow is simple. But when it <em>writes</em> new data, the updated value is in cache while the original in RAM becomes <Hl color="rose">stale (outdated)</Hl>. Two fundamentally different policies govern how and when RAM is updated.
              </p>

              {/* Write-Through */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="size-2 rounded-full bg-amber-400 shrink-0"></div>
                  <h5 className="text-white font-bold">Write-Through (Store-Through)</h5>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Every single write to cache is <em>simultaneously</em> written directly to main memory. The two are always perfectly synchronized.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                    <div className="text-emerald-400 font-semibold mb-1">Advantage</div>
                    <div className="text-slate-400">Absolute data integrity. A sudden power failure loses nothing — a permanent copy always exists in RAM.</div>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2">
                    <div className="text-rose-400 font-semibold mb-1">Disadvantage</div>
                    <div className="text-slate-400">Every write incurs full RAM latency (e.g., 11 cycles). Negates cache's write speed advantage entirely.</div>
                  </div>
                </div>
              </div>

              {/* Write-Back */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="size-2 rounded-full bg-cyan-400 shrink-0"></div>
                  <h5 className="text-white font-bold">Write-Back (Write-Behind)</h5>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  The CPU writes only to cache, then immediately resumes work. The modified block is flagged with a <Hl color="amber">Dirty Bit</Hl> (marking it differs from RAM). RAM is only updated when that dirty block is <em>evicted</em> from cache.
                </p>
                <Callout color="amber" icon="" label="THE DIRTY BIT">
                  A 1-bit metadata flag on each cache line. When set, it signals: "I've been modified — write me to RAM before evicting me." Multiple rapid writes to the same variable are consolidated into a <strong>single delayed RAM update</strong>.
                </Callout>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                    <div className="text-emerald-400 font-semibold mb-1">Advantage</div>
                    <div className="text-slate-400">Lightning-fast writes at cache speed. Multiple writes to same variable cost only 1 eventual RAM write.</div>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2">
                    <div className="text-rose-400 font-semibold mb-1">Disadvantage</div>
                    <div className="text-slate-400">Vastly complex architecture. Power loss before eviction = data loss. Dirty blocks must be tracked at all times.</div>
                  </div>
                </div>
              </div>

              {/* Write Miss Strategies */}
              <SectionTitle color="amber">Write Miss Strategies</SectionTitle>
              <p className="text-slate-300 leading-relaxed">What happens if the CPU writes to an address <em>not currently in cache?</em></p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                  <div className="text-amber-400 font-bold text-[10px] uppercase mb-1">Write-Allocate</div>
                  <p className="text-slate-400 text-[10px] leading-relaxed">Load the missing block from RAM into cache first, then write. "Fetch on write." Pairs with Write-Back.</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                  <div className="text-slate-300 font-bold text-[10px] uppercase mb-1">No Write-Allocate</div>
                  <p className="text-slate-400 text-[10px] leading-relaxed">Write directly to RAM, bypassing cache entirely. "Write-Around." Pairs with Write-Through.</p>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 5: ACADEMIC CANON ───────────────────────────── */}
          {activeTab === 'canon' && (
            <div className="space-y-4 text-xs">
              <SectionTitle color="violet">The Academic Foundations</SectionTitle>
              <p className="text-slate-300 leading-relaxed">
                The mechanisms of cache memory are the culmination of decades of rigorous engineering research. The following foundational works define the global curriculum of modern computer architecture, standardized by the <Hl color="violet">IEEE</Hl> and <Hl color="violet">ACM</Hl>.
              </p>

              {/* Patterson & Hennessy */}
              <div className="bg-slate-900 border border-violet-800/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-violet-400"></div>
                  <h5 className="text-violet-300 font-bold">Patterson & Hennessy</h5>
                </div>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  <strong className="text-slate-200">David A. Patterson</strong> (UC Berkeley) and <strong className="text-slate-200">John L. Hennessy</strong> (Stanford) jointly pioneered the <strong>RISC architecture</strong>. Patterson created RAID storage; Hennessy led the commercial MIPS architecture. Both received the <strong className="text-amber-400">Turing Award</strong> — the Nobel Prize of computing.
                </p>
                <div className="space-y-1.5">
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                    <div className="text-[10px] font-bold text-white mb-0.5">Computer Organization and Design: The Hardware/Software Interface</div>
                    <div className="text-[10px] text-slate-500">5th ed. Morgan Kaufmann, 2014. — Formalizes AMAT math, Direct/Associative/Set-Associative mapping, RISC instruction sets.</div>
                    <div className="font-mono text-[9px] text-violet-400 mt-1">D. A. Patterson and J. L. Hennessy, Morgan Kaufmann, 2014.</div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                    <div className="text-[10px] font-bold text-white mb-0.5">Computer Architecture: A Quantitative Approach</div>
                    <div className="text-[10px] text-slate-500">6th ed. Morgan Kaufmann, 2017. — Advanced statistical validation of replacement policies, multiprocessor cache coherence, warehouse-scale computing.</div>
                    <div className="font-mono text-[9px] text-violet-400 mt-1">J. L. Hennessy and D. A. Patterson, Morgan Kaufmann, 2017.</div>
                  </div>
                </div>
              </div>

              {/* Hamacher */}
              <div className="bg-slate-900 border border-emerald-800/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-400"></div>
                  <h5 className="text-emerald-300 font-bold">Hamacher, Vranesic, Zaky & Manjikian</h5>
                </div>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  The hardware-centric structural framework. Covers the specific <strong>circuitry</strong> required for valid bits and tags, integration with PCI Express and USB I/O architectures, and provides the formal engineering definitions of Write-Through vs. Write-Back policies.
                </p>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] font-bold text-white mb-0.5">Computer Organization and Embedded Systems</div>
                  <div className="text-[10px] text-slate-500">6th ed. McGraw-Hill Education, 2012. — Bridges theoretical mapping functions and physical embedded system implementations.</div>
                  <div className="font-mono text-[9px] text-emerald-400 mt-1">C. Hamacher, Z. Vranesic, S. Zaky, N. Manjikian, McGraw-Hill, 2012.</div>
                </div>
              </div>

              {/* Sources comparison table */}
              <SectionTitle color="violet">Author Comparison</SectionTitle>
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-[10px]">
                  <thead className="bg-slate-800/60 border-b border-slate-800">
                    <tr className="text-slate-400 uppercase tracking-wider">
                      <th className="px-2 py-2 text-left">Author(s)</th>
                      <th className="px-2 py-2 text-left">Primary Focus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr>
                      <td className="px-2 py-2 text-violet-400 font-semibold">Patterson &amp; Hennessy</td>
                      <td className="px-2 py-2 text-slate-400">AMAT, Memory Hierarchies, RISC, Mapping</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-2 text-violet-400 font-semibold">Hennessy &amp; Patterson</td>
                      <td className="px-2 py-2 text-slate-400">Replacement Statistics, Multiprocessor Caching</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-2 text-emerald-400 font-semibold">Hamacher et al.</td>
                      <td className="px-2 py-2 text-slate-400">Write Policies, Embedded Systems, Circuitry</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* RIGHT PANEL: HARDWARE CANVAS                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div ref={simulatorRef} className="w-full lg:w-[58%] relative flex flex-col items-center justify-start p-6 bg-slate-950/95 gap-4">

        {/* Background ambient glow */}
        <div className={['absolute inset-0 opacity-20 transition-colors duration-1000 pointer-events-none', glowMap[activeTab]].join(' ')}></div>

        {/* Scoreboard — only meaningful while the address-lookup simulator (architecture tab) is active */}
        {activeTab === 'architecture' && (
          <div className="relative w-full flex items-center gap-3">
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-0.5">Session Hits</div>
                <div className="text-2xl font-bold text-emerald-400">{hits}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-0.5">Session Misses</div>
                <div className="text-2xl font-bold text-amber-400">{misses}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-0.5">Hit Rate</div>
                <div className={['text-2xl font-bold', totalOps === 0 ? 'text-slate-500' : parseFloat(hitRate) >= 70 ? 'text-emerald-400' : parseFloat(hitRate) >= 40 ? 'text-amber-400' : 'text-rose-400'].join(' ')}>
                  {hitRate}{totalOps > 0 ? '%' : ''}
                </div>
              </div>
            </div>
            <button
              onClick={() => { setHits(0); setMisses(0) }}
              className="shrink-0 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] text-slate-500 hover:text-slate-300 hover:border-slate-700 transition-all font-mono uppercase"
            >
              Reset
            </button>
          </div>
        )}

        {/* Simulator Card */}
        <div className={['relative w-full rounded-xl bg-slate-950/90 backdrop-blur-xl border transition-all duration-700 overflow-hidden shadow-2xl',
          triggered ? 'border-indigo-500/60 shadow-[0_0_50px_rgba(99,102,241,0.5)] scale-[1.005]' : 'border-slate-800/80'
        ].join(' ')}>
          <div className="relative p-5 flex flex-col gap-5">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <MemoryStick className="size-4" />
                </span>
                <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-semibold">{simulatorTitleMap[activeTab]}</span>
              </div>
              <div className="flex items-center gap-2">
                {activeTab === 'replacement' && (
                  <div className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-400 uppercase flex items-center gap-1">
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    {replacementAlgo.toUpperCase()} Policy
                  </div>
                )}
                <div className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-400 uppercase flex items-center gap-1">
                  <div className="size-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
                  Online
                </div>
              </div>
            </header>

            {activeTab === 'architecture' && (
              <>
                <SimulatorControls
                  breakdown={breakdown}
                  error={error}
                  isBusy={simState === 'calculating'}
                  forceMode={forceMode}
                  onForceModeChange={setForceMode}
                  onFetch={handleFetch}
                />

                <Visualizer
                  state={simState}
                  latency={latency}
                  cache={cache}
                  activeIndex={activeIndex}
                  replacementAlgo={replacementAlgo}
                />
              </>
            )}

            {activeTab === 'mapping' && <MappingSimulator />}

            {activeTab === 'replacement' && (
              <ReplacementSimulator algo={replacementAlgo} onAlgoChange={setReplacementAlgo} />
            )}

            {activeTab === 'writepolicies' && <WritePolicySimulator />}

            {activeTab === 'canon' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center">
                <div className="text-slate-500 text-[11px] font-mono">
                  This tab is reference-only — no live simulator.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* === RIGHT PANEL MINI-GAMES === */}
        <div className="w-full shrink-0 relative z-20">

          {/* OVERCLOCK CPU (architecture tab) */}
          {activeTab === 'architecture' && (
            <div className="mt-4 p-4 bg-rose-950/20 border border-rose-900/50 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
              {isOverclocking && <div className="absolute inset-0 bg-rose-500/20 animate-pulse"></div>}
              <div className="text-center z-10">
                <div className="text-rose-400 font-bold text-xs uppercase tracking-[0.2em] mb-1">Warning: Thermal Overload</div>
                <p className="text-slate-400 text-[10px] mb-3">Simulate a massive CPU spike. The cache must desperately try to serve requests at 100x speed.</p>
                <button
                  onClick={handleOverclock}
                  disabled={isOverclocking}
                  className={['px-6 py-2 rounded-md font-mono font-bold uppercase tracking-widest transition-all duration-75',
                    isOverclocking ? 'bg-rose-600 text-white scale-95 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]' : 'bg-rose-500/10 border border-rose-500 text-rose-400 hover:bg-rose-500 hover:text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  ].join(' ')}
                >
                  {isOverclocking ? 'OVERCLOCKING...' : '[ OVERCLOCK CPU ]'}
                </button>
              </div>
            </div>
          )}

          {/* ARCHITECTURE DASHBOARDS */}
          {activeTab === 'architecture' && (
            <>
              <LiveBandwidthMonitor simState={simState} />
              <GlobalTelemetryConsole
                hits={hits} misses={misses} xp={xp} timeSaved={timeSaved}
                totalOps={totalOps} hitRate={hitRate} isLevelingUp={isLevelingUp}
                defragmentCache={defragmentCache}
                reset={() => { setHits(0); setMisses(0); setXp(0); setTimeSaved(0) }}
              />
            </>
          )}

          {/* THE THRASHING TRAP (mapping tab) */}
          {activeTab === 'mapping' && (
            <div className="mt-4 p-4 bg-slate-950/80 border border-rose-900/50 rounded-xl flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(244,63,94,0.1)]">
              <div className="text-center z-10 w-full">
                <div className="text-rose-400 font-bold text-xs uppercase tracking-[0.2em] mb-1">The Thrashing Trap</div>
                <p className="text-slate-400 text-[10px] mb-3">CPU loop alternately asks for <span className="text-cyan-300">0x101</span> (Block A) and <span className="text-violet-300">0x501</span> (Block B). Both map to Slot 1.</p>
                <div className="flex gap-2 justify-center mb-3">
                  <button
                    onClick={() => { triggerSimulation('0x101', 'miss'); setThrashState('B'); setThrashCount(c => c + 1) }}
                    disabled={thrashState !== 'A'}
                    className={['flex-1 px-4 py-2 rounded font-mono font-bold uppercase text-[10px] transition-all',
                      thrashState === 'A' ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300 shadow-[0_0_10px_#22d3ee]' : 'bg-slate-900 border border-slate-800 text-slate-600'
                    ].join(' ')}
                  >
                    Evict B → Load A
                  </button>
                  <button
                    onClick={() => { triggerSimulation('0x501', 'miss'); setThrashState('A'); setThrashCount(c => c + 1) }}
                    disabled={thrashState !== 'B'}
                    className={['flex-1 px-4 py-2 rounded font-mono font-bold uppercase text-[10px] transition-all',
                      thrashState === 'B' ? 'bg-violet-500/20 border border-violet-500 text-violet-300 shadow-[0_0_10px_#8b5cf6]' : 'bg-slate-900 border border-slate-800 text-slate-600'
                    ].join(' ')}
                  >
                    Evict A → Load B
                  </button>
                </div>
                {thrashCount > 0 && (
                  <div className="text-[10px] font-mono text-rose-400 animate-pulse">
                    Eviction cycle: {thrashCount}. Hit Rate: 0%.
                    {thrashCount >= 6 && <span className="block mt-1 font-bold text-rose-500 text-xs">Frustrating, isn't it? This is Thrashing.</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* THE AGONY OF CHOICE — TROLLEY PROBLEM (replacement tab) */}
          {activeTab === 'replacement' && (
            <div className="mt-4 p-4 bg-slate-950/80 border border-emerald-900/50 rounded-xl flex flex-col relative overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <div className="text-center z-10 w-full">
                <div className="text-emerald-400 font-bold text-xs uppercase tracking-[0.2em] mb-1">The Agony of Choice</div>
                {trolleyState === 'idle' && (
                  <>
                    <p className="text-slate-400 text-[10px] mb-3">CPU demands Block E. Cache is 100% full. Which resident block do you destroy?</p>
                    <button
                      onClick={() => setTrolleyState('prompt')}
                      className="px-4 py-2 rounded bg-emerald-500/10 border border-emerald-500 text-emerald-400 font-mono text-[10px] uppercase font-bold hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                      [ INITIALIZE EVICTION ]
                    </button>
                  </>
                )}
                {trolleyState === 'prompt' && (
                  <>
                    <div className="flex gap-2 justify-center mb-3 text-[10px] font-mono">
                      <button onClick={() => setTrolleyState('fail')} className="flex-1 py-2 bg-slate-900 border border-slate-700 text-slate-300 hover:bg-rose-900 hover:text-rose-300 transition-all rounded">Evict A</button>
                      <button onClick={() => setTrolleyState('success')} className="flex-1 py-2 bg-slate-900 border border-slate-700 text-slate-300 hover:bg-emerald-900 hover:text-emerald-300 transition-all rounded">Evict B</button>
                      <button onClick={() => setTrolleyState('fail')} className="flex-1 py-2 bg-slate-900 border border-slate-700 text-slate-300 hover:bg-rose-900 hover:text-rose-300 transition-all rounded">Evict C</button>
                      <button onClick={() => setTrolleyState('fail')} className="flex-1 py-2 bg-slate-900 border border-slate-700 text-slate-300 hover:bg-rose-900 hover:text-rose-300 transition-all rounded">Evict D</button>
                    </div>
                    <div className="text-[9px] text-amber-400 animate-pulse">Awaiting your command... Make the right choice.</div>
                  </>
                )}
                {trolleyState === 'fail' && (
                  <div className="text-center">
                    <div className="text-rose-500 font-bold text-lg mb-1">FATAL MISS PENALTY</div>
                    <p className="text-rose-300 text-[10px] mb-3">You evicted a block the CPU needed 3 cycles later. The pipeline stalled for 100ns.</p>
                    <button onClick={() => setTrolleyState('idle')} className="text-[10px] font-mono text-slate-500 hover:text-slate-300 underline">Try Again</button>
                  </div>
                )}
                {trolleyState === 'success' && (
                  <div className="text-center">
                    <div className="text-emerald-500 font-bold text-lg mb-1">EVICTION SUCCESS</div>
                    <p className="text-emerald-300 text-[10px] mb-3">You evicted Block B, which wasn't needed again. The pipeline flows smoothly.</p>
                    <button onClick={() => setTrolleyState('idle')} className="text-[10px] font-mono text-slate-500 hover:text-slate-300 underline">Reset</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* THE VOLATILITY THREAT — POWER OUTAGE (writepolicies tab) */}
          {activeTab === 'writepolicies' && (
            <div className="mt-4 p-4 bg-slate-950/80 border border-amber-900/50 rounded-xl flex flex-col relative overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.1)]">
              {powerState === 'blackout' && <div className="absolute inset-0 bg-black z-20"></div>}
              {powerState === 'lost' && <div className="absolute inset-0 bg-rose-950/20 z-0 mix-blend-color-dodge"></div>}
              <div className="text-center z-10 w-full relative">
                <div className="text-amber-400 font-bold text-xs uppercase tracking-[0.2em] mb-1">The Volatility Threat</div>
                {powerState === 'idle' && (
                  <>
                    <p className="text-slate-400 text-[10px] mb-3">Simulate a Write-Back policy. Write critical data to cache without syncing to RAM.</p>
                    <button
                      onClick={() => {
                        setPowerState('writing')
                        setTimeout(() => setPowerState('blackout'), 1500)
                        setTimeout(() => setPowerState('lost'), 2200)
                      }}
                      className="px-4 py-2 rounded bg-amber-500/10 border border-amber-500 text-amber-400 font-mono text-[10px] uppercase font-bold hover:bg-amber-500 hover:text-white transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    >
                      [ WRITE CRITICAL DATA ]
                    </button>
                  </>
                )}
                {powerState === 'writing' && (
                  <div className="text-cyan-400 font-mono text-[10px] animate-pulse">
                    Writing to Cache... <br/>
                    Dirty Bit: 1 <br/>
                    Sync to RAM: Pending...
                  </div>
                )}
                {powerState === 'lost' && (
                  <div className="text-center">
                    <div className="text-rose-500 font-bold text-lg mb-1">POWER OUTAGE</div>
                    <p className="text-rose-400 text-[10px] font-mono break-words mb-3">
                      DATA CORRUPTION: 0xDEADBEEF 0x{Math.floor(Math.random()*65535).toString(16).toUpperCase()} 0x{Math.floor(Math.random()*65535).toString(16).toUpperCase()}
                    </p>
                    <p className="text-rose-300 text-[10px] mb-3">All unsynced "Dirty" blocks were permanently lost.</p>
                    <button onClick={() => setPowerState('idle')} className="text-[10px] font-mono text-slate-500 hover:text-slate-300 underline">Reboot System</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* THE CACHE CONTROLLER EXAM (canon tab) */}
          {activeTab === 'canon' && (
            <div className="mt-4 p-4 bg-slate-950/80 border border-violet-900/50 rounded-xl flex flex-col relative overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.1)]">
              <div className="text-center z-10 w-full relative">
                <div className="text-violet-400 font-bold text-xs uppercase tracking-[0.2em] mb-1">The Cache Controller Exam</div>
                {examState === 'idle' && (
                  <>
                    <p className="text-slate-400 text-[10px] mb-3">Prove you have the instincts of a hardware controller. You have 5 seconds.</p>
                    <button
                      onClick={startExam}
                      className="px-4 py-2 rounded bg-violet-500/10 border border-violet-500 text-violet-400 font-mono text-[10px] uppercase font-bold hover:bg-violet-500 hover:text-white transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                    >
                      [ INITIALIZE TURING TEST ]
                    </button>
                  </>
                )}
                {examState === 'running' && (
                  <div className="animate-pulse">
                    <div className="text-[20px] font-mono text-rose-400 font-bold mb-2">{examTime}.00s</div>
                    <p className="text-white text-[10px] mb-3">CPU wants Block 9. Cache is 4-Way Set Associative (Total 16 slots). Which Set does it check?</p>
                    <div className="flex gap-2 justify-center text-[10px] font-mono">
                      <button onClick={() => answerExam(false)} className="flex-1 py-2 bg-slate-900 border border-slate-700 text-slate-300 hover:bg-rose-900 hover:text-rose-300 transition-all rounded">Set 0</button>
                      <button onClick={() => answerExam(true)} className="flex-1 py-2 bg-slate-900 border border-slate-700 text-slate-300 hover:bg-emerald-900 hover:text-emerald-300 transition-all rounded">Set 1</button>
                      <button onClick={() => answerExam(false)} className="flex-1 py-2 bg-slate-900 border border-slate-700 text-slate-300 hover:bg-rose-900 hover:text-rose-300 transition-all rounded">Set 2</button>
                      <button onClick={() => answerExam(false)} className="flex-1 py-2 bg-slate-900 border border-slate-700 text-slate-300 hover:bg-rose-900 hover:text-rose-300 transition-all rounded">Set 9</button>
                    </div>
                  </div>
                )}
                {examState === 'fail' && (
                  <div className="text-center">
                    <div className="text-rose-500 font-bold text-lg mb-1">SYSTEM FAILURE</div>
                    <p className="text-rose-300 text-[10px] mb-3">Incorrect or out of time. A 4-Way cache with 16 slots has 4 Sets. Block 9 mod 4 = Set 1.</p>
                    <button onClick={() => setExamState('idle')} className="text-[10px] font-mono text-slate-500 hover:text-slate-300 underline">Retake Exam</button>
                  </div>
                )}
                {examState === 'success' && (
                  <div className="text-center">
                    <div className="text-emerald-500 font-bold text-lg mb-1">CERTIFIED CONTROLLER</div>
                    <p className="text-emerald-300 text-[10px] mb-3">Perfect execution under pressure. 9 mod 4 = Set 1. +50 XP Awarded.</p>
                    <button onClick={() => setExamState('idle')} className="text-[10px] font-mono text-slate-500 hover:text-slate-300 underline">Reset</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CANON DASHBOARD */}
          {activeTab === 'canon' && (
            <GrandAnalyticsTerminal hits={hits} misses={misses} xp={xp} timeSaved={timeSaved} />
          )}

        </div>
      </div>

    </div>
  )
}

// ─── REUSABLE HELPERS ─────────────────────────────────────────────────────────

function SectionTitle({ children, color }: { children: React.ReactNode; color: 'indigo'|'cyan'|'emerald'|'amber'|'violet' }) {
  const c = { indigo: 'text-indigo-400', cyan: 'text-cyan-400', emerald: 'text-emerald-400', amber: 'text-amber-400', violet: 'text-violet-400' }
  return <h4 className={`${c[color]} font-bold text-sm mt-2 mb-1 flex items-center gap-2`}>{children}</h4>
}

function Hl({ children, color }: { children: React.ReactNode; color: 'cyan'|'rose'|'emerald'|'amber'|'violet' }) {
  const c = { cyan: 'text-cyan-400', rose: 'text-rose-400', emerald: 'text-emerald-400', amber: 'text-amber-400', violet: 'text-violet-400' }
  return <strong className={c[color]}>{children}</strong>
}

function Callout({ children, color, icon, label }: { children: React.ReactNode; color: string; icon: string; label: string }) {
  const styles: Record<string, string> = {
    rose:   'border-rose-500/60 bg-rose-500/5',
    indigo: 'border-indigo-500/60 bg-indigo-500/5',
    cyan:   'border-cyan-500/60 bg-cyan-500/5',
    emerald:'border-emerald-500/60 bg-emerald-500/5',
    amber:  'border-amber-500/60 bg-amber-500/5',
    violet: 'border-violet-500/60 bg-violet-500/5',
  }
  const labelStyles: Record<string, string> = {
    rose:   'text-rose-400',
    indigo: 'text-indigo-400',
    cyan:   'text-cyan-400',
    emerald:'text-emerald-400',
    amber:  'text-amber-400',
    violet: 'text-violet-400',
  }
  return (
    <div className={`border-l-4 rounded-r-xl p-3 ${styles[color] ?? 'border-slate-700 bg-slate-900'}`}>
      <div className={`text-[9px] font-bold uppercase tracking-wider mb-1.5 ${labelStyles[color] ?? 'text-slate-400'}`}>
        {label}
      </div>
      <div className="text-slate-300 text-[11px] leading-relaxed">{children}</div>
    </div>
  )
}

function TriggerButton({ label, sub, color, onClick }: { label: string; sub: string; color: 'cyan'|'emerald'|'rose'|'amber'; onClick: () => void }) {
  const hover = { cyan: 'group-hover/btn:text-cyan-400', emerald: 'group-hover/btn:text-emerald-400', rose: 'group-hover/btn:text-rose-400', amber: 'group-hover/btn:text-amber-400' }
  const chevron = { cyan: 'group-hover/btn:text-cyan-400', emerald: 'group-hover/btn:text-emerald-400', rose: 'group-hover/btn:text-rose-400', amber: 'group-hover/btn:text-amber-400' }
  return (
    <button
      className="flex items-center justify-between w-full bg-slate-950 hover:bg-slate-900 transition-colors p-3 rounded-xl border border-slate-800 group/btn"
      onClick={onClick}
    >
      <div className="text-left">
        <div className={`text-xs font-semibold text-white transition-colors ${hover[color]}`}>{label}</div>
        <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
      </div>
      <ChevronRight className={`size-4 text-slate-600 transition-all group-hover/btn:translate-x-1 ${chevron[color]}`} />
    </button>
  )
}

function TabButton({ id, label, icon, active, onClick, color }: {
  id: string; label: string; icon: React.ReactNode; active: boolean; onClick: () => void;
  color: 'indigo'|'cyan'|'emerald'|'amber'|'violet'
}) {
  const colorMap = {
    indigo:  'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    cyan:    'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    amber:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
    violet:  'text-violet-400 bg-violet-500/10 border-violet-500/30',
  }
  return (
    <button
      onClick={onClick}
      className={['flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 border text-left w-full',
        active ? colorMap[color] : 'border-transparent hover:bg-slate-800/50 text-slate-500 hover:text-slate-200'
      ].join(' ')}
    >
      <div className={['p-1 rounded-lg', active ? 'bg-slate-900/60' : 'bg-transparent'].join(' ')}>
        {icon}
      </div>
      <span className="font-medium text-[11px] leading-tight">{label}</span>
    </button>
  )
}

// ─── LIVE BANDWIDTH MONITOR ────────────────────────────────────────────────
function LiveBandwidthMonitor({ simState }: { simState: SimState }) {
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
function GlobalTelemetryConsole({ hits, misses, xp, timeSaved, totalOps, hitRate, isLevelingUp, defragmentCache, reset }: any) {
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
function GrandAnalyticsTerminal({ hits, misses, xp, timeSaved }: any) {
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

function MappingSimulator() {
  const [mapType, setMapType] = useState<MapType>('direct')
  const [block, setBlock] = useState(1)
  const [slots, setSlots] = useState<MapSlot[]>(() => Array.from({ length: MAP_TOTAL_SLOTS }, () => ({ block: null })))
  const [order, setOrder] = useState<number[]>([]) // slot indices, oldest-used first (LRU order)
  const [log, setLog] = useState<MapLogEntry[]>([])
  const [flash, setFlash] = useState<{ slot: number; kind: 'hit' | 'placed' | 'evicted' }[]>([])
  const [laserFiring, setLaserFiring] = useState<number[]>([])

  const candidates = candidateSlots(block, mapType)
  const bits = bitInfo(mapType)
  const willHit = candidates.some(s => slots[s].block === block)

  const touchOrder = (prev: number[], slot: number) => [...prev.filter(s => s !== slot), slot]

  const runAccess = (b: number) => {
    const cslots = candidateSlots(b, mapType)
    setLaserFiring(cslots)

    setTimeout(() => {
      setLaserFiring([])
      setSlots(prevSlots => {
        const hitSlot = cslots.find(s => prevSlots[s].block === b)

        if (hitSlot !== undefined) {
          setOrder(o => touchOrder(o, hitSlot))
          setFlash([{ slot: hitSlot, kind: 'hit' }])
          setLog(l => [{ block: b, outcome: 'hit' as const, placedSlot: hitSlot, evictedSlot: null, evictedBlock: null }, ...l].slice(0, 6))
          return prevSlots
        }

        // miss — find an empty candidate slot first
        const emptySlot = cslots.find(s => prevSlots[s].block === null)
        let targetSlot: number
        let evictedBlock: number | null = null

        if (emptySlot !== undefined) {
          targetSlot = emptySlot
        } else {
          // evict the least-recently-used slot among the candidates
          const lruOrdered = [...cslots].sort((a, b2) => {
            const ai = order.indexOf(a), bi = order.indexOf(b2)
            return ai - bi
          })
          targetSlot = lruOrdered[0]
          evictedBlock = prevSlots[targetSlot].block
        }

        const next = prevSlots.map((s, i) => (i === targetSlot ? { block: b } : s))
        setOrder(o => touchOrder(o, targetSlot))
        setFlash(evictedBlock !== null
          ? [{ slot: targetSlot, kind: 'evicted' }]
          : [{ slot: targetSlot, kind: 'placed' }])
        setLog(l => [{ block: b, outcome: 'miss' as const, placedSlot: targetSlot, evictedSlot: evictedBlock !== null ? targetSlot : null, evictedBlock }, ...l].slice(0, 6))
        return next
      })
      setTimeout(() => setFlash([]), 900)
    }, 400)
  }

  const runConflictDemo = () => {
    setSlots(Array.from({ length: MAP_TOTAL_SLOTS }, () => ({ block: null })))
    setOrder([])
    setLog([])
    const sequence = [1, 5, 1, 5]
    sequence.forEach((b, i) => setTimeout(() => runAccess(b), i * 950))
  }

  const reset = () => {
    setSlots(Array.from({ length: MAP_TOTAL_SLOTS }, () => ({ block: null })))
    setOrder([])
    setLog([])
    setFlash([])
  }

  const meta = MAP_TYPE_META[mapType]
  const colorClasses = {
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    violet: 'bg-violet-500/20 text-violet-400 border-violet-500/50',
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Mapping type selector */}
      <div className="flex gap-1.5">
        {(['direct', 'set2', 'full'] as const).map(mt => (
          <button
            key={mt}
            onClick={() => setMapType(mt)}
            className={['flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all',
              mapType === mt ? colorClasses[MAP_TYPE_META[mt].color] : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-slate-300'
            ].join(' ')}
          >
            {MAP_TYPE_META[mt].label}
          </button>
        ))}
      </div>

      {/* Address bit breakdown */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
        <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider mb-2">
          Block {block} · 4-bit address · {bits.label}
        </div>
        <div className="flex gap-1 font-mono text-[10px]">
          <div className="rounded-l-lg bg-indigo-500/20 border border-indigo-500/40 p-2 text-center" style={{ flex: Math.max(bits.tagBits, 0.5) }}>
            <div className="text-indigo-300 font-bold">TAG</div>
            <div className="text-slate-500 text-[8px]">{bits.tagBits} bits</div>
          </div>
          {bits.indexBits > 0 && (
            <div className="bg-cyan-500/20 border border-cyan-500/40 p-2 text-center" style={{ flex: bits.indexBits }}>
              <div className="text-cyan-300 font-bold">{mapType === 'set2' ? 'SET' : 'INDEX'}</div>
              <div className="text-slate-500 text-[8px]">{bits.indexBits} bit{bits.indexBits > 1 ? 's' : ''}</div>
            </div>
          )}
          <div className="rounded-r-lg bg-slate-800 border border-slate-700 p-2 text-center flex-[0.6]">
            <div className="text-slate-400 font-bold">···</div>
            <div className="text-slate-600 text-[8px]">offset</div>
          </div>
        </div>
        <div className="text-center text-[10px] text-slate-500 font-mono mt-2">{meta.formula}</div>
      </div>

      {/* Block picker */}
      <div className="flex items-center gap-2">
        <button onClick={() => setBlock(b => (b + MAP_TOTAL_BLOCKS - 1) % MAP_TOTAL_BLOCKS)}
          className="size-8 shrink-0 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 font-bold">−</button>
        <div className="flex-1 grid grid-cols-8 gap-1">
          {Array.from({ length: MAP_TOTAL_BLOCKS }, (_, b) => (
            <button
              key={b}
              onClick={() => setBlock(b)}
              className={['py-1.5 rounded text-[10px] font-mono font-bold border transition-all',
                b === block ? 'bg-white/10 border-white/40 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              ].join(' ')}
            >
              {b}
            </button>
          ))}
        </div>
        <button onClick={() => setBlock(b => (b + 1) % MAP_TOTAL_BLOCKS)}
          className="size-8 shrink-0 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 font-bold">+</button>
      </div>

      {/* Cache slots visualization */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
            {laserFiring.length > 0 ? 'TAG COMPARATOR' : `Cache (${MAP_TOTAL_SLOTS} slots${mapType === 'set2' ? ' · 2 sets × 2 ways' : ''})`}
          </div>
          <div className={['text-[9px] font-mono font-bold px-2 py-0.5 rounded', willHit ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'].join(' ')}>
            Block {block} will {willHit ? 'HIT' : 'MISS'}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {slots.map((s, i) => {
            const isCandidate = candidates.includes(i)
            const f = flash.find(fl => fl.slot === i)
            let cls = 'bg-slate-900 border-slate-800 text-slate-600'
            if (f?.kind === 'hit') cls = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 scale-105'
            else if (f?.kind === 'evicted') cls = 'bg-rose-500/20 border-rose-500/60 text-rose-300 scale-105'
            else if (f?.kind === 'placed') cls = 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 scale-105'
            else if (isCandidate) cls = 'bg-slate-800 border-cyan-500/40 text-slate-200'
            else if (s.block !== null) cls = 'bg-slate-800 border-slate-700 text-slate-300'
            return (
              <div key={i} className={['relative rounded-lg border p-3 text-center font-mono transition-all duration-300 overflow-hidden', cls].join(' ')}>
                {laserFiring.includes(i) && (
                  <div className="absolute inset-0 bg-cyan-400/20 border border-cyan-400/60 animate-pulse" style={{ boxShadow: '0 0 15px rgba(34,211,238,0.4)' }} />
                )}
                <div className="text-[8px] text-slate-500 mb-1 relative z-10">Slot {i}</div>
                <div className="text-lg font-bold relative z-10">{s.block === null ? '—' : s.block}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={() => runAccess(block)}
          className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold uppercase tracking-wide text-slate-200 hover:border-slate-600 transition-all">
          Access Block {block}
        </button>
        <button onClick={runConflictDemo}
          className="flex-1 py-2 rounded-xl bg-rose-500/10 border border-rose-500/40 text-[10px] font-bold uppercase tracking-wide text-rose-300 hover:bg-rose-500/20 transition-all">
          Conflict Demo (1→5→1→5)
        </button>
        <button onClick={reset}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-500 hover:text-slate-300 transition-all font-mono uppercase">
          Reset
        </button>
      </div>

      {/* Access log */}
      {log.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] space-y-1">
          <div className="text-slate-500 uppercase tracking-wider mb-1">Access Log</div>
          {log.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-400">
              <span className="text-slate-600">{i === 0 ? 'now' : `-${i}`}</span>
              <span className="text-slate-200 font-bold">block {entry.block}</span>
              <span className={entry.outcome === 'hit' ? 'text-emerald-400' : 'text-amber-400'}>
                {entry.outcome === 'hit' ? 'HIT' : 'MISS'}
              </span>
              <span className="text-slate-600">→ slot {entry.placedSlot}</span>
              {entry.evictedBlock !== null && <span className="text-rose-400">evicted block {entry.evictedBlock}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── REPLACEMENT ALGORITHMS SIMULATOR ─────────────────────────────────────
// Self-contained: a 4-slot cache fed by lettered block requests (A-H).
// Lets you step through accesses (or run presets) under LRU / MRU / FIFO /
// Random and watch victim-selection diverge in real time.

const REPL_SLOTS = 4
const REPL_BLOCKS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

type ReplLogEntry = {
  block: string
  outcome: 'hit' | 'miss'
  placedSlot: number
  evictedBlock: string | null
}

type ReplState = {
  slots: (string | null)[]
  recencyOrder: number[] // slot indices, oldest-touched → newest-touched (LRU/MRU)
  insertOrder: number[]  // slot indices, oldest-inserted → newest-inserted (FIFO)
}

const emptyReplState = (): ReplState => ({
  slots: Array.from({ length: REPL_SLOTS }, () => null),
  recencyOrder: [],
  insertOrder: [],
})

const REPL_ALGO_META: Record<ReplacementAlgo, { label: string; color: 'emerald' | 'amber' | 'cyan' | 'violet' }> = {
  lru: { label: 'LRU', color: 'emerald' },
  mru: { label: 'MRU', color: 'amber' },
  fifo: { label: 'FIFO', color: 'cyan' },
  random: { label: 'Random', color: 'violet' },
}

function ReplacementSimulator({ algo, onAlgoChange }: { algo: ReplacementAlgo; onAlgoChange: (a: ReplacementAlgo) => void }) {
  const [state, setState] = useState<ReplState>(emptyReplState)
  const [log, setLog] = useState<ReplLogEntry[]>([])
  const [flash, setFlash] = useState<{ slot: number; kind: 'hit' | 'placed' | 'evicted' } | null>(null)
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)

  const touch = (arr: number[], slot: number) => [...arr.filter(s => s !== slot), slot]

  const access = (block: string, algoUsed: ReplacementAlgo) => {
    setState(prev => {
      const hitSlot = prev.slots.indexOf(block)

      if (hitSlot !== -1) {
        setFlash({ slot: hitSlot, kind: 'hit' })
        setHits(h => h + 1)
        setLog(l => [{ block, outcome: 'hit' as const, placedSlot: hitSlot, evictedBlock: null }, ...l].slice(0, 6))
        return { ...prev, recencyOrder: touch(prev.recencyOrder, hitSlot) }
      }

      const emptySlot = prev.slots.indexOf(null)
      let target: number
      let evictedBlock: string | null = null

      if (emptySlot !== -1) {
        target = emptySlot
      } else {
        const occupied = prev.slots.map((_, i) => i)
        if (algoUsed === 'lru') {
          target = prev.recencyOrder.find(s => occupied.includes(s)) ?? occupied[0]
        } else if (algoUsed === 'mru') {
          target = [...prev.recencyOrder].reverse().find(s => occupied.includes(s)) ?? occupied[0]
        } else if (algoUsed === 'fifo') {
          target = prev.insertOrder.find(s => occupied.includes(s)) ?? occupied[0]
        } else {
          target = occupied[Math.floor(Math.random() * occupied.length)]
        }
        evictedBlock = prev.slots[target]
      }

      const nextSlots = prev.slots.map((b, i) => (i === target ? block : b))
      setFlash({ slot: target, kind: evictedBlock !== null ? 'evicted' : 'placed' })
      setMisses(m => m + 1)
      setLog(l => [{ block, outcome: 'miss' as const, placedSlot: target, evictedBlock }, ...l].slice(0, 6))
      return {
        slots: nextSlots,
        recencyOrder: touch(prev.recencyOrder, target),
        insertOrder: touch(prev.insertOrder, target),
      }
    })
    setTimeout(() => setFlash(null), 900)
  }

  const runPreset = (sequence: string[]) => {
    setState(emptyReplState())
    setLog([])
    setHits(0)
    setMisses(0)
    sequence.forEach((b, i) => setTimeout(() => access(b, algo), i * 950))
  }

  const reset = () => {
    setState(emptyReplState())
    setLog([])
    setFlash(null)
    setHits(0)
    setMisses(0)
  }

  const meta = REPL_ALGO_META[algo]
  const algoColorClasses: Record<'emerald' | 'amber' | 'cyan' | 'violet', string> = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
    violet: 'bg-violet-500/20 text-violet-400 border-violet-500/50',
  }

  const totalOps = hits + misses
  const hitRate = totalOps > 0 ? ((hits / totalOps) * 100).toFixed(0) : '—'

  const recencyBlocks = state.recencyOrder.map(s => state.slots[s]).filter(Boolean) as string[]
  const insertBlocks = state.insertOrder.map(s => state.slots[s]).filter(Boolean) as string[]

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Algorithm selector */}
      <div className="flex gap-1.5">
        {(['lru', 'mru', 'fifo', 'random'] as const).map(a => (
          <button
            key={a}
            onClick={() => onAlgoChange(a)}
            className={['flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all',
              algo === a ? algoColorClasses[REPL_ALGO_META[a].color] : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-slate-300'
            ].join(' ')}
          >
            {REPL_ALGO_META[a].label}
          </button>
        ))}
      </div>

      {/* Cache slots visualization */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Cache ({REPL_SLOTS} slots)</div>
          <div className="text-[9px] font-mono font-bold px-2 py-0.5 rounded text-slate-400 bg-slate-900">
            {hits}H / {misses}M {totalOps > 0 ? `· ${hitRate}%` : ''}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {state.slots.map((b, i) => {
            const f = flash?.slot === i ? flash : null
            // Visual aging: older blocks in recency order appear more faded/sepia
            const recIdx = state.recencyOrder.indexOf(i)
            const maxIdx = Math.max(1, state.recencyOrder.length - 1)
            const ageFactor = recIdx !== -1 ? 1 - (recIdx / maxIdx) : 0
            let cls = 'bg-slate-900 border-slate-800 text-slate-600'
            if (f?.kind === 'hit') cls = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 scale-105'
            else if (f?.kind === 'evicted') cls = 'bg-rose-500/20 border-rose-500/60 text-rose-300 scale-105'
            else if (f?.kind === 'placed') cls = 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 scale-105'
            else if (b !== null) cls = 'bg-slate-800 border-slate-700 text-slate-200'
            return (
              <div key={i}
                className={['relative rounded-lg border p-3 text-center font-mono transition-all duration-300 overflow-hidden', cls].join(' ')}
                style={b !== null && !f ? {
                  opacity: Math.max(0.35, 1 - (ageFactor * 0.65)),
                  filter: `sepia(${ageFactor * 0.8}) hue-rotate(-20deg)`
                } : undefined}
              >
                {f?.kind === 'evicted' && (
                  <div className="absolute inset-0 bg-rose-500/30 flex items-center justify-center gap-1 animate-pulse" style={{ zIndex: 20 }}>
                    <span className="text-rose-300 font-bold text-[9px] line-through">{b}</span>
                    <span className="text-rose-500 font-bold text-[8px]">VICTIM</span>
                  </div>
                )}
                <div className="text-[8px] text-slate-500 mb-1 relative z-10">Slot {i}</div>
                <div className="text-lg font-bold relative z-10">{b ?? '—'}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Order tracking — makes the algorithm's memory visible */}
      {algo !== 'random' ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px]">
          <div className="text-slate-500 uppercase tracking-wider mb-1.5">
            {algo === 'fifo' ? 'Insertion order (oldest → newest)' : 'Recency order (least → most recently used)'}
          </div>
          <div className="flex items-center gap-1.5">
            {(algo === 'fifo' ? insertBlocks : recencyBlocks).length === 0
              ? <span className="text-slate-600">— empty —</span>
              : (algo === 'fifo' ? insertBlocks : recencyBlocks).map((b, i, arr) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className={['px-1.5 py-0.5 rounded border',
                    i === 0 ? 'border-rose-500/50 text-rose-300 bg-rose-500/10' : 'border-slate-700 text-slate-300'
                  ].join(' ')}>{b}</span>
                  {i < arr.length - 1 && <span className="text-slate-700">→</span>}
                </span>
              ))
            }
          </div>
          <div className="text-slate-600 text-[9px] mt-1.5">
            Red-outlined block is the next eviction victim under {meta.label}.
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] text-slate-500">
          No order is tracked under Random — the victim is chosen with a fresh coin-flip among occupied slots every time.
        </div>
      )}

      {/* Manual access */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {REPL_BLOCKS.map(b => (
          <button
            key={b}
            onClick={() => access(b, algo)}
            className="size-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono font-bold text-xs hover:border-slate-600 hover:text-white transition-all"
          >
            {b}
          </button>
        ))}
      </div>

      {/* Presets + reset */}
      <div className="flex gap-2">
        <button onClick={() => runPreset(['A', 'B', 'C', 'D', 'E', 'D', 'F'])}
          className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold uppercase tracking-wide text-slate-200 hover:border-slate-600 transition-all">
          Fill Demo (A→B→C→D→E→D→F)
        </button>
        <button onClick={() => runPreset(['A', 'B', 'C', 'D', 'E', 'A', 'B'])}
          className="flex-1 py-2 rounded-xl bg-rose-500/10 border border-rose-500/40 text-[10px] font-bold uppercase tracking-wide text-rose-300 hover:bg-rose-500/20 transition-all">
          Cyclic Demo (A→B→C→D→E→A→B)
        </button>
        <button onClick={reset}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-500 hover:text-slate-300 transition-all font-mono uppercase">
          Reset
        </button>
      </div>

      {/* Access log */}
      {log.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] space-y-1">
          <div className="text-slate-500 uppercase tracking-wider mb-1">Access Log</div>
          {log.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-400">
              <span className="text-slate-600">{i === 0 ? 'now' : `-${i}`}</span>
              <span className="text-slate-200 font-bold">block {entry.block}</span>
              <span className={entry.outcome === 'hit' ? 'text-emerald-400' : 'text-amber-400'}>
                {entry.outcome === 'hit' ? 'HIT' : 'MISS'}
              </span>
              <span className="text-slate-600">→ slot {entry.placedSlot}</span>
              {entry.evictedBlock !== null && <span className="text-rose-400">evicted block {entry.evictedBlock}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── WRITE POLICY SIMULATOR ────────────────────────────────────────────────
// Self-contained: a 4-slot cache (FIFO victim selection, kept simple since
// replacement strategy isn't this tab's point) that visualizes CPU → Cache →
// RAM data flow on writes, toggling Write-Through/Write-Back and
// Write-Allocate/No-Write-Allocate so the dirty bit and RAM-sync timing
// become visible instead of just described.

const WP_SLOTS = 4
const WP_BLOCKS = ['A', 'B', 'C', 'D', 'E']

type WritePolicy = 'writethrough' | 'writeback'
type MissPolicy = 'allocate' | 'noallocate'

type WPSlot = { block: string | null; dirty: boolean }
type WPState = { slots: WPSlot[]; insertOrder: number[] }

const emptyWPState = (): WPState => ({
  slots: Array.from({ length: WP_SLOTS }, () => ({ block: null, dirty: false })),
  insertOrder: [],
})

type WPLogEntry = {
  block: string
  kind: 'hit' | 'allocate' | 'bypass'
  policy: WritePolicy
  dirty: boolean
  flushedBlock: string | null
}

type WPFlow = { cache: number | null; ram: boolean; flush: boolean; kind: 'hit' | 'allocate' | 'bypass' } | null

function WritePolicySimulator() {
  const [policy, setPolicy] = useState<WritePolicy>('writeback')
  const [missPolicy, setMissPolicy] = useState<MissPolicy>('allocate')
  const [state, setState] = useState<WPState>(emptyWPState)
  const [log, setLog] = useState<WPLogEntry[]>([])
  const [flow, setFlow] = useState<WPFlow>(null)

  const write = (block: string, wp: WritePolicy, mp: MissPolicy) => {
    setState(prev => {
      const hitSlot = prev.slots.findIndex(s => s.block === block)

      if (hitSlot !== -1) {
        const dirty = wp === 'writeback'
        const nextSlots = prev.slots.map((s, i) => (i === hitSlot ? { block, dirty } : s))
        setFlow({ cache: hitSlot, ram: wp === 'writethrough', flush: false, kind: 'hit' })
        setLog(l => [{ block, kind: 'hit' as const, policy: wp, dirty, flushedBlock: null }, ...l].slice(0, 6))
        return { ...prev, slots: nextSlots }
      }

      if (mp === 'noallocate') {
        setFlow({ cache: null, ram: true, flush: false, kind: 'bypass' })
        setLog(l => [{ block, kind: 'bypass' as const, policy: wp, dirty: false, flushedBlock: null }, ...l].slice(0, 6))
        return prev
      }

      const emptySlot = prev.slots.findIndex(s => s.block === null)
      let target: number
      let flushedBlock: string | null = null

      if (emptySlot !== -1) {
        target = emptySlot
      } else {
        target = prev.insertOrder[0]
        const victim = prev.slots[target]
        if (victim.dirty) flushedBlock = victim.block
      }

      const dirty = wp === 'writeback'
      const nextSlots = prev.slots.map((s, i) => (i === target ? { block, dirty } : s))
      const nextInsertOrder = [...prev.insertOrder.filter(s => s !== target), target]
      setFlow({ cache: target, ram: wp === 'writethrough' || flushedBlock !== null, flush: flushedBlock !== null, kind: 'allocate' })
      setLog(l => [{ block, kind: 'allocate' as const, policy: wp, dirty, flushedBlock }, ...l].slice(0, 6))
      return { slots: nextSlots, insertOrder: nextInsertOrder }
    })
    setTimeout(() => setFlow(null), 1100)
  }

  const runPreset = (name: 'consolidate' | 'flush') => {
    setState(emptyWPState())
    setLog([])
    if (name === 'consolidate') {
      setPolicy('writeback')
      setMissPolicy('allocate')
      ;['A', 'A', 'A'].forEach((b, i) => setTimeout(() => write(b, 'writeback', 'allocate'), i * 1150))
    } else {
      setPolicy('writeback')
      setMissPolicy('allocate')
      ;['A', 'B', 'C', 'D', 'E'].forEach((b, i) => setTimeout(() => write(b, 'writeback', 'allocate'), i * 1150))
    }
  }

  const reset = () => {
    setState(emptyWPState())
    setLog([])
    setFlow(null)
  }

  const dirtyCount = state.slots.filter(s => s.dirty).length

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Policy toggles */}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-1.5">
          {(['writethrough', 'writeback'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPolicy(p)}
              className={['flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all',
                policy === p ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-slate-300'
              ].join(' ')}
            >
              {p === 'writethrough' ? 'Write-Through' : 'Write-Back'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5">
        {(['allocate', 'noallocate'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMissPolicy(m)}
            className={['flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all',
              missPolicy === m ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-slate-300'
            ].join(' ')}
          >
            {m === 'allocate' ? 'Write-Allocate' : 'No-Write-Allocate'}
          </button>
        ))}
      </div>

      {/* CPU → Cache → RAM flow diagram */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-0 mb-3">
          <div className={['flex-1 rounded-lg border p-2 text-center transition-all duration-300',
            flow ? 'border-white/40 bg-white/10 text-white' : 'border-slate-800 bg-slate-900 text-slate-400'
          ].join(' ')}>
            <div className="text-[9px] font-mono uppercase tracking-wider">CPU</div>
            <div className="text-[8px] text-slate-500">writes {flow ? log[0]?.block ?? '' : ''}</div>
          </div>
          <div className={['h-1 w-8 rounded-full transition-all duration-500',
            flow?.cache !== null && flow?.cache !== undefined ? 'bg-cyan-500 shadow-[0_0_8px] shadow-cyan-500/50' : 'bg-slate-800'
          ].join(' ')} style={flow?.cache !== null && flow?.cache !== undefined ? { animation: 'conduit-flow 0.6s ease-in-out infinite' } : undefined} />
          <div className={['flex-1 rounded-lg border p-2 text-center transition-all duration-300',
            flow?.kind === 'bypass' ? 'border-slate-800 bg-slate-900 text-slate-600 opacity-40' :
            flow?.cache !== null && flow?.cache !== undefined ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-300' :
            'border-slate-800 bg-slate-900 text-slate-400'
          ].join(' ')}>
            <div className="text-[9px] font-mono uppercase tracking-wider">Cache</div>
            <div className="text-[8px] text-slate-500">{dirtyCount} dirty line{dirtyCount === 1 ? '' : 's'}</div>
          </div>
          <div className={['h-1 w-8 rounded-full transition-all duration-500',
            flow?.ram ? (flow.flush ? 'bg-rose-500 shadow-[0_0_8px] shadow-rose-500/50' : 'bg-amber-500 shadow-[0_0_8px] shadow-amber-500/50') : 'bg-slate-800'
          ].join(' ')} style={flow?.ram ? { animation: 'conduit-flow 0.6s ease-in-out infinite' } : undefined} />
          <div className={['flex-1 rounded-lg border p-2 text-center transition-all duration-300',
            flow?.ram ? (flow.flush ? 'border-rose-500/60 bg-rose-500/10 text-rose-300' : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300') : 'border-slate-800 bg-slate-900 text-slate-400'
          ].join(' ')}>
            <div className="text-[9px] font-mono uppercase tracking-wider">Main Memory</div>
            <div className="text-[8px] text-slate-500">{flow?.ram ? (flow.flush ? 'dirty flush' : 'synced now') : 'idle'}</div>
          </div>
        </div>

        {/* Cache slots */}
        <div className="grid grid-cols-4 gap-2">
          {state.slots.map((s, i) => {
            const isFlowSlot = flow?.cache === i
            let cls = 'bg-slate-900 border-slate-800 text-slate-600'
            if (isFlowSlot && flow?.flush) cls = 'bg-rose-500/20 border-rose-500/60 text-rose-300 scale-105'
            else if (isFlowSlot) cls = 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 scale-105'
            else if (s.block !== null) cls = 'bg-slate-800 border-slate-700 text-slate-200'
            return (
              <div key={i} className={['rounded-lg border p-2 text-center font-mono transition-all duration-300', cls].join(' ')}>
                <div className="text-[8px] text-slate-500 mb-0.5">Slot {i}</div>
                <div className="text-sm font-bold">{s.block ?? '—'}</div>
                <div className={['text-[8px] font-bold mt-0.5', s.dirty ? 'text-amber-400' : 'text-slate-700'].join(' ')}>
                  {s.dirty ? 'D' : '·'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Manual writes */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {WP_BLOCKS.map(b => (
          <button
            key={b}
            onClick={() => write(b, policy, missPolicy)}
            className="size-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono font-bold text-xs hover:border-slate-600 hover:text-white transition-all"
          >
            {b}
          </button>
        ))}
        <span className="text-[9px] text-slate-600 font-mono ml-1">click to write</span>
      </div>

      {/* Presets + reset */}
      <div className="flex gap-2">
        <button onClick={() => runPreset('consolidate')}
          className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold uppercase tracking-wide text-slate-200 hover:border-slate-600 transition-all">
          Consolidation Demo (write A×3)
        </button>
        <button onClick={() => runPreset('flush')}
          className="flex-1 py-2 rounded-xl bg-rose-500/10 border border-rose-500/40 text-[10px] font-bold uppercase tracking-wide text-rose-300 hover:bg-rose-500/20 transition-all">
          Dirty Eviction Flush (A→E)
        </button>
        <button onClick={reset}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-500 hover:text-slate-300 transition-all font-mono uppercase">
          Reset
        </button>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] space-y-1">
          <div className="text-slate-500 uppercase tracking-wider mb-1">Write Log</div>
          {log.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-400 flex-wrap">
              <span className="text-slate-600">{i === 0 ? 'now' : `-${i}`}</span>
              <span className="text-slate-200 font-bold">write {entry.block}</span>
              <span className={
                entry.kind === 'hit' ? 'text-emerald-400' : entry.kind === 'bypass' ? 'text-slate-400' : 'text-amber-400'
              }>
                {entry.kind === 'hit' ? 'CACHE HIT' : entry.kind === 'bypass' ? 'RAM BYPASS' : 'MISS→ALLOCATE'}
              </span>
              {entry.kind !== 'bypass' && (
                <span className={entry.dirty ? 'text-amber-400' : 'text-emerald-400'}>
                  {entry.dirty ? 'marked dirty' : 'synced to RAM'}
                </span>
              )}
              {entry.flushedBlock !== null && <span className="text-rose-400">flushed dirty block {entry.flushedBlock}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
