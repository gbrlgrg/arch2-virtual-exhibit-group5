import type { SimState } from './visualizer'

type ConduitType = 'cpu-cache' | 'cache-ram'

type AnimatedConduitProps = {
  type: ConduitType
  state: SimState
}

export function AnimatedConduit({ type, state }: AnimatedConduitProps) {
  // Determine if the pipe should be active/glowing based on state and type
  const isActive = 
    type === 'cpu-cache' 
      ? (state === 'calculating' || state === 'hit' || state === 'miss') 
      : state === 'miss'

  // Determine colors based on state
  const isHit = state === 'hit'
  const isMiss = state === 'miss'
  const isCalc = state === 'calculating'

  let pipeGlow = 'border-slate-800/50 bg-slate-900/40 shadow-none'
  let label = ''
  let labelColor = 'text-slate-500'

  if (isActive) {
    if (isHit && type === 'cpu-cache') {
      pipeGlow = 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
      label = 'CACHE HIT'
      labelColor = 'text-emerald-400'
    } else if (isMiss && type === 'cpu-cache') {
      pipeGlow = 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
      label = 'BOTTLENECK'
      labelColor = 'text-amber-400'
    } else if (isMiss && type === 'cache-ram') {
      pipeGlow = 'border-amber-500/60 bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
      label = 'MEMORY WALL DELAY'
      labelColor = 'text-amber-400'
    } else if (isCalc && type === 'cpu-cache') {
      pipeGlow = 'border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
      label = 'TRANSMITTING ADDRESS'
      labelColor = 'text-cyan-400'
    }
  }

  return (
    <div className="relative w-full h-16 flex flex-col items-center justify-center my-1 z-0">
      
      {/* The Pipe */}
      <div className={`relative w-3 h-full border-x transition-all duration-500 overflow-hidden ${pipeGlow}`}>
        
        {/* The Photon (Light Pulse) */}
        {isActive && (
          <div
            className={`absolute left-0 right-0 h-8 rounded-full blur-[2px] -top-8 ${
              isCalc && type === 'cpu-cache' 
                ? 'bg-cyan-300 shadow-[0_0_15px_rgba(103,232,249,1)] animate-photon-down-fast' 
                : isHit && type === 'cpu-cache'
                ? 'bg-emerald-300 shadow-[0_0_15px_rgba(110,231,183,1)] animate-photon-up-fast'
                : isMiss && type === 'cache-ram'
                ? 'bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,1)] animate-photon-up-slow'
                : isMiss && type === 'cpu-cache'
                ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,1)] animate-photon-up-slow-delay' // Waits for RAM to finish
                : ''
            }`}
          />
        )}
      </div>

      {/* Floating Label */}
      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 ml-4 flex flex-col pointer-events-none">
        <span className={`text-[9px] font-bold tracking-widest uppercase transition-colors duration-300 whitespace-nowrap ${labelColor} ${isActive ? 'opacity-100' : 'opacity-0'}`}>
          {label}
        </span>
      </div>
    </div>
  )
}
