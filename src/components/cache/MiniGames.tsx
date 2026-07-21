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
export function ControllerExamMiniGame({ examState, setExamState, examTime, startExam, answerExam }: any) {
  return (
    <div className="mt-8 p-4 bg-slate-950/80 border border-violet-900/50 rounded-xl flex flex-col relative overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.1)]">
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
          <div className="text-center animate-micro-screen-shake">
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
  );
}
