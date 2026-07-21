import React from 'react';

// --- OVERCLOCK SURGE ---
export function OverclockSurge({ isOverclocking, handleOverclock }: any) {
  return (
    <div className="mt-8 p-4 bg-rose-950/20 border border-rose-900/50 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
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
  );
}

// --- THRASHING NIGHTMARE ---
export function ThrashingNightmare({ thrashState, setThrashState, thrashCount, setThrashCount, triggerSimulation }: any) {
  return (
    <div className="mt-8 p-4 bg-slate-950/80 border border-rose-900/50 rounded-xl flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(244,63,94,0.1)]">
      <div className="text-center z-10 w-full">
        <div className="text-rose-400 font-bold text-xs uppercase tracking-[0.2em] mb-1">The Thrashing Trap</div>
        <p className="text-slate-400 text-[10px] mb-3">CPU loop alternately asks for <span className="text-cyan-300">0x101</span> (Block A) and <span className="text-violet-300">0x501</span> (Block B). Both map to Slot 1.</p>
        
        <div className="flex gap-2 justify-center mb-3">
          <button 
            onClick={() => {
              triggerSimulation('0x101', 'miss')
              setThrashState('B')
              setThrashCount((c: number) => c + 1)
            }}
            disabled={thrashState !== 'A'}
            className={['flex-1 px-4 py-2 rounded font-mono font-bold uppercase text-[10px] transition-all',
              thrashState === 'A' ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300 shadow-[0_0_10px_#22d3ee]' : 'bg-slate-900 border border-slate-800 text-slate-600'
            ].join(' ')}
          >
            Evict B &rarr; Load A
          </button>
          <button 
            onClick={() => {
              triggerSimulation('0x501', 'miss')
              setThrashState('A')
              setThrashCount((c: number) => c + 1)
            }}
            disabled={thrashState !== 'B'}
            className={['flex-1 px-4 py-2 rounded font-mono font-bold uppercase text-[10px] transition-all',
              thrashState === 'B' ? 'bg-violet-500/20 border border-violet-500 text-violet-300 shadow-[0_0_10px_#8b5cf6]' : 'bg-slate-900 border border-slate-800 text-slate-600'
            ].join(' ')}
          >
            Evict A &rarr; Load B
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
  );
}

// --- EVICTION TROLLEY PROBLEM ---
export function TrolleyMiniGame({ trolleyState, setTrolleyState }: any) {
  return (
    <div className="mt-8 p-4 bg-slate-950/80 border border-emerald-900/50 rounded-xl flex flex-col relative overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.1)]">
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
          <div className="text-center animate-micro-screen-shake">
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
  );
}

// --- POWER OUTAGE ---
export function PowerOutageMiniGame({ powerState, setPowerState }: any) {
  return (
    <div className="mt-8 p-4 bg-slate-950/80 border border-amber-900/50 rounded-xl flex flex-col relative overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.1)]">
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
          <div className="text-center animate-micro-screen-shake">
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
  );
}

// --- CONTROLLER EXAM ---
export const EXAM_QUESTIONS = [
  {
    text: "What are the three types of mapping functions?",
    options: [
      { label: "Direct, Associative, Block Set", correct: true },
      { label: "Linear, Circular, Block", correct: false },
      { label: "Temporal, Spatial, Random", correct: false },
      { label: "Write-Through, Write-Back", correct: false }
    ]
  },
  {
    text: "In direct mapping, how are main memory blocks mapped onto cache blocks?",
    options: [
      { label: "Randomly", correct: false },
      { label: "Modulo fashion", correct: true },
      { label: "LRU algorithm", correct: false },
      { label: "Set Associative", correct: false }
    ]
  },
  {
    text: "Given a direct-mapped cache of 4 blocks, which block does Memory Block 13 map to?",
    options: [
      { label: "Block 0", correct: false },
      { label: "Block 1", correct: true },
      { label: "Block 2", correct: false },
      { label: "Block 3", correct: false }
    ]
  },
  {
    text: "In direct mapping, the main memory address is partitioned into what fields?",
    options: [
      { label: "TAG, WORD", correct: false },
      { label: "SET, WORD", correct: false },
      { label: "TAG, SET, WORD", correct: false },
      { label: "TAG, BLOCK, WORD", correct: true }
    ]
  },
  {
    text: "In full associative mapping, where can a main memory block be placed?",
    options: [
      { label: "Only its modulo block", correct: false },
      { label: "Only in Set 0", correct: false },
      { label: "Any empty cache block", correct: true },
      { label: "Directly in DRAM", correct: false }
    ]
  },
  {
    text: "Which cache mapping method maps a memory block to a specific set based on a modulo operation?",
    options: [
      { label: "Direct Mapping", correct: false },
      { label: "Block Set Associative", correct: true },
      { label: "Full Associative", correct: false },
      { label: "Write-Around", correct: false }
    ]
  },
  {
    text: "In an associative-mapped cache, the main memory address is partitioned into which fields?",
    options: [
      { label: "TAG, WORD", correct: true },
      { label: "TAG, BLOCK, WORD", correct: false },
      { label: "TAG, SET, WORD", correct: false },
      { label: "BLOCK, WORD", correct: false }
    ]
  },
  {
    text: "A '4-way block set associative cache' means what?",
    options: [
      { label: "There are 4 blocks total", correct: false },
      { label: "The set size is 4 blocks", correct: true },
      { label: "Each block is 4 words", correct: false },
      { label: "It uses 4 replacement algorithms", correct: false }
    ]
  },
  {
    text: "In a direct cache with 256 memory words (8-bit address) and 4 cache blocks (4 words/block), how many bits is the TAG?",
    options: [
      { label: "2 bits", correct: false },
      { label: "3 bits", correct: false },
      { label: "4 bits", correct: true },
      { label: "6 bits", correct: false }
    ]
  },
  {
    text: "Which replacement algorithm overwrites the block that has not been accessed for the longest time?",
    options: [
      { label: "MRU", correct: false },
      { label: "Random", correct: false },
      { label: "FIFO", correct: false },
      { label: "LRU", correct: true }
    ]
  },
  {
    text: "Which replacement algorithm replaces the block that was accessed most recently?",
    options: [
      { label: "MRU", correct: true },
      { label: "LRU", correct: false },
      { label: "LIFO", correct: false },
      { label: "Write-Through", correct: false }
    ]
  },
  {
    text: "In direct mapping, what handles the replacement algorithm?",
    options: [
      { label: "LRU Policy", correct: false },
      { label: "MRU Policy", correct: false },
      { label: "Automatically by modulo", correct: true },
      { label: "Cache Controller", correct: false }
    ]
  },
  {
    text: "Which write hit policy writes to both main memory and cache simultaneously?",
    options: [
      { label: "Write-Through", correct: true },
      { label: "Write-Back", correct: false },
      { label: "Write-Allocate", correct: false },
      { label: "No Write-Allocate", correct: false }
    ]
  },
  {
    text: "Which write hit policy writes to cache only and updates main memory later?",
    options: [
      { label: "Write-Through", correct: false },
      { label: "Write-Allocate", correct: false },
      { label: "Write-Back", correct: true },
      { label: "Write-Around", correct: false }
    ]
  },
  {
    text: "On a read miss, if data is sent to the processor prior to cache fill completion, it's called?",
    options: [
      { label: "Fetch-on-write", correct: false },
      { label: "Load-through", correct: true },
      { label: "Write-behind", correct: false },
      { label: "Temporal Locality", correct: false }
    ]
  },
  {
    text: "On a cache write miss, what policy writes directly to main memory without loading into cache?",
    options: [
      { label: "Write Allocate", correct: false },
      { label: "Write-Back", correct: false },
      { label: "Write-Through", correct: false },
      { label: "No Write-Allocate", correct: true }
    ]
  },
  {
    text: "On a cache write miss, what policy loads data into cache followed by a write-hit operation?",
    options: [
      { label: "Write Allocate", correct: true },
      { label: "No Write-Allocate", correct: false },
      { label: "Write-Around", correct: false },
      { label: "Load-Through", correct: false }
    ]
  },
  {
    text: "What is the formula for average memory access time (T_avg)?",
    options: [
      { label: "h * C * M", correct: false },
      { label: "hC + (1-h)*M", correct: true },
      { label: "M + (1-h)*C", correct: false },
      { label: "hM + (1-C)*h", correct: false }
    ]
  },
  {
    text: "If Hit Rate=0.95, Cache Time=1ns, Miss Penalty=82ns, what is T_avg?",
    options: [
      { label: "4.15 ns", correct: false },
      { label: "5.05 ns", correct: true },
      { label: "9.10 ns", correct: false },
      { label: "15.00 ns", correct: false }
    ]
  },
  {
    text: "Why are replacement algorithms needed?",
    options: [
      { label: "To write data to DRAM", correct: false },
      { label: "To identify which block to overwrite when full", correct: true },
      { label: "To calculate hit rate", correct: false },
      { label: "To partition the memory address", correct: false }
    ]
  }
];

export function ControllerExamMiniGame({ examState, setExamState, examTime, examIndex, startExam, answerExam }: any) {
  const q = EXAM_QUESTIONS[examIndex] || EXAM_QUESTIONS[0];
  
  // No need for custom local rank variable anymore because Scoreboard is now above!
  // But we still show total results at the end as requested.

  return (
    <div className="mt-8 p-4 bg-slate-950/80 border border-violet-900/50 rounded-xl flex flex-col relative overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.1)]">
      <div className="text-center z-10 w-full relative">
        <div className="text-violet-400 font-bold text-xs uppercase tracking-[0.2em] mb-1">The Cache Controller Exam</div>
        
        {examState === 'idle' && (
          <>
            <p className="text-slate-400 text-[10px] mb-3">Prove you have the instincts of a hardware controller. 20 Questions. 15 seconds each. Earn XP per correct hit.</p>
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
            {/* Numbering format requested by user: Question 1/20: ... */}
            <p className="text-white text-[12px] mb-3 px-4">
              <span className="text-violet-400 font-bold mr-2">Question {examIndex + 1}/20:</span>
              {q.text}
            </p>
            <div className="grid grid-cols-2 gap-2 justify-center text-[10px] font-mono mt-4">
              {q.options.map((opt: any, i: number) => (
                <button 
                  key={i} 
                  onClick={() => answerExam(opt.correct, examIndex === EXAM_QUESTIONS.length - 1)} 
                  className="py-2 px-2 bg-slate-900 border border-slate-700 text-slate-300 hover:bg-violet-900 hover:text-violet-300 transition-all rounded break-words"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {examState === 'success' && (
          <div className="text-emerald-400 font-mono text-[10px] animate-pulse py-4">
            <div className="text-xl mb-1">TURING TEST PASSED</div>
            <div className="text-sm text-emerald-300 mb-2">Final Result: 20 / 20 Correct</div>
            <div>+300 TOTAL XP GRANTED</div>
          </div>
        )}
        {examState === 'fail' && (
          <div className="text-rose-500 font-mono text-[10px] py-2">
            <div className="text-xl mb-1">SYSTEM OVERLOAD</div>
            <div className="text-sm text-rose-300 mb-2">Failed at Question {examIndex + 1}</div>
            <div>INCORRECT ANSWER OR TIMEOUT</div>
            <button onClick={() => setExamState('idle')} className="mt-4 px-3 py-2 bg-rose-900/50 border border-rose-500 text-rose-300 rounded hover:bg-rose-500 hover:text-white transition-colors">RETRY EXAM</button>
          </div>
        )}
      </div>
    </div>
  );
}
