import type { SimState } from './visualizer'

type ConduitType = 'cpu-cache' | 'cache-ram'

type AnimatedConduitProps = {
  type: ConduitType
  state: SimState
  isDirtyFlush?: boolean
}

export function AnimatedConduit({ type, state, isDirtyFlush = false }: AnimatedConduitProps) {
  // Determine if the pipe should be active/glowing based on state and type
  const isActive = 
    type === 'cpu-cache' 
      ? (state === 'calculating' || state === 'hit' || state === 'miss') 
      : (state === 'miss' || isDirtyFlush)

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
    } else if (isDirtyFlush && type === 'cache-ram') {
      pipeGlow = 'border-rose-500/60 bg-rose-500/20 shadow-[0_0_20px_rgba(225,29,72,0.4)]'
      label = 'DIRTY FLUSH LOCKDOWN'
      labelColor = 'text-rose-400'
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
        
        {/* Dirty Flush Dragdown */}
        {isDirtyFlush && type === 'cache-ram' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-full h-full bg-rose-500/20 shadow-[inset_0_0_20px_rgba(225,29,72,0.5)] animate-pulse border-x border-rose-500/50" />
            <div className="w-3 h-4 bg-rose-600 rounded-sm shadow-[0_0_15px_rgba(225,29,72,1)] absolute -top-4 animate-[photon-down-slow_2s_cubic-bezier(0.65,0,0.35,1)_forwards]" />
          </div>
        )}

        {/* The Photon (Light Pulse) or Pneumatic Assembly */}
        {isActive && !isDirtyFlush && (
          isMiss && type === 'cache-ram' ? (
            <div className="absolute inset-0 flex flex-col justify-end items-center pointer-events-none">
              {[0, 1, 2, 3].map(i => (
                <div 
                  key={i} 
                  className="w-2.5 h-2.5 bg-amber-300 rounded-sm shadow-[0_0_15px_rgba(251,191,36,1)] absolute -bottom-4 animate-photon-up-slow"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          ) : (
            <div
              className={`absolute left-0 right-0 h-8 rounded-full blur-[2px] -top-8 ${
                isCalc && type === 'cpu-cache' 
                  ? 'bg-cyan-300 shadow-[0_0_15px_rgba(103,232,249,1)] animate-photon-down-fast' 
                  : isHit && type === 'cpu-cache'
                  ? 'bg-emerald-300 shadow-[0_0_15px_rgba(110,231,183,1)] animate-photon-up-fast'
                  : isMiss && type === 'cpu-cache'
                  ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,1)] animate-photon-up-slow-delay'
                  : ''
              }`}
            />
          )
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
