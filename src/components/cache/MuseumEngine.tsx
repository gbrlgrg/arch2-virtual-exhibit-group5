import { useCallback, useRef, useState } from 'react'
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

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const handleFetch = useCallback(
    (rawInput: string, overrideForce?: ForceMode) => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
      const parsed = parseAddress(rawInput)
      if (!parsed) { setError('Enter a valid hex address, e.g. 0x1A4'); return }
      setError(null)
      setBreakdown(parsed)
      setSimState('calculating')
      setActiveIndex(parsed.index)
      setLatency(0)
      const effectiveForce = overrideForce ?? forceMode
      const t = setTimeout(() => {
        setCache((currentCache) => {
          const result = lookup(currentCache, parsed, effectiveForce)
          setLatency(result.latency)
          setSimState(result.outcome)
          if (result.outcome === 'hit') setHits(h => h + 1)
          else if (result.outcome === 'miss') setMisses(m => m + 1)
          return result.cache
        })
      }, 650)
      timersRef.current.push(t)
    },
    [forceMode],
  )

  const triggerSimulation = (address: string, fm?: ForceMode) => {
    setTriggered(true)
    setTimeout(() => setTriggered(false), 1200)
    if (fm) setForceMode(fm)
    setTimeout(() => { handleFetch(address, fm) }, 300)
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

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-[750px] bg-slate-950/40 backdrop-blur-3xl text-slate-100 rounded-2xl border border-slate-700/50 ring-1 ring-white/10 ring-inset overflow-hidden font-sans shadow-[0_0_50px_rgba(34,211,238,0.15)] my-6">

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

              <div className="flex flex-col gap-2 mt-2">
                <TriggerButton label="Try: Cache Hit (0x1A4)" sub="Delivers in ~2ns" color="emerald" onClick={() => triggerSimulation('0x1A4', 'hit')} />
                <TriggerButton label="Try: Cache Miss (0x1A4)" sub="Forces RAM fetch, 100ns penalty" color="rose" onClick={() => triggerSimulation('0x1A4', 'miss')} />
              </div>
            </div>
          )}

          {/* ─── TAB 2: MAPPING FUNCTIONS ────────────────────────── */}
          {activeTab === 'mapping' && (
            <div className="space-y-4 text-xs">
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
      <div className="w-full lg:w-[58%] relative flex flex-col items-center justify-center p-6 bg-slate-950/95 gap-4">

        {/* Background ambient glow */}
        <div className={['absolute inset-0 opacity-20 transition-colors duration-1000 pointer-events-none', glowMap[activeTab]].join(' ')}></div>

        {/* Scoreboard */}
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
                <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-semibold">Live Telemetry</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-400 uppercase flex items-center gap-1">
                  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  {replacementAlgo.toUpperCase()} Policy
                </div>
                <div className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-400 uppercase flex items-center gap-1">
                  <div className="size-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
                  Online
                </div>
              </div>
            </header>

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
          </div>
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
