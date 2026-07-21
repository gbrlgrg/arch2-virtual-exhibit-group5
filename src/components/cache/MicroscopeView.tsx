import React, { useEffect, useState } from 'react'
import type { CacheRow } from '../../lib/cache-sim'
import { X, Search } from 'lucide-react'

type MicroscopeViewProps = {
  row: CacheRow
  onClose: () => void
}

export function MicroscopeView({ row, onClose }: MicroscopeViewProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Small delay to allow CSS transitions to trigger
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  if (!row.valid || row.tag === null) {
    return null
  }

  const tagBinary = row.tag.toString(2).padStart(7, '0').split('')
  
  // Deterministic mock data based on the tag so it looks stable
  const seed = row.tag * 12345
  const mockDataBinary = Array.from({ length: 32 }, (_, i) => {
    return ((seed >> (i % 16)) & 1).toString()
  })

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-700 ${
        mounted ? 'bg-slate-950/80 backdrop-blur-3xl opacity-100' : 'bg-transparent backdrop-blur-none opacity-0'
      }`}
      onClick={onClose}
    >
      <div 
        className={`relative w-full max-w-4xl p-8 rounded-2xl border border-cyan-500/30 bg-slate-950 shadow-[0_0_80px_rgba(34,211,238,0.15)] overflow-hidden transition-all duration-700 ${
          mounted ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-10 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Laser Scan Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="w-full h-full border-t border-cyan-400 animate-laser-scan blur-[1px]"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3 text-cyan-400">
            <Search className="size-6 animate-pulse" />
            <h2 className="text-xl font-bold uppercase tracking-widest font-mono">
              Silicon Inspection: Row #{row.index}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-600 hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Architecture Grid */}
        <div className="flex flex-col gap-10">
          
          {/* TAG SECTION (7 bits) */}
          <div>
            <div className="flex items-end justify-between mb-3">
              <h3 className="text-sm font-mono font-bold text-slate-400 tracking-wider">
                SRAM Cells: Tag Array <span className="text-cyan-500/50">(7 Bits)</span>
              </h3>
              <span className="text-xs font-mono text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded bg-cyan-500/10">
                0x{row.tag.toString(16).toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-7 gap-3">
              {tagBinary.map((bit, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="text-[10px] font-mono text-slate-600">T{6 - i}</div>
                  <div className={`w-full aspect-square flex items-center justify-center rounded border transition-all duration-1000 ${
                    mounted 
                      ? (bit === '1' ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'border-slate-800 bg-slate-900/50')
                      : 'border-slate-900 bg-slate-950'
                  }`}>
                    <span className={`text-xl font-bold font-mono ${bit === '1' ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,1)]' : 'text-slate-700'}`}>
                      {bit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DATA SECTION (32 bits = 4 bytes) */}
          <div>
            <div className="flex items-end justify-between mb-3">
              <h3 className="text-sm font-mono font-bold text-slate-400 tracking-wider">
                SRAM Cells: Data Array <span className="text-emerald-500/50">(1 Block = 4 Bytes = 32 Bits)</span>
              </h3>
              <span className="text-xs font-mono text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded bg-emerald-500/10">
                0x{(seed).toString(16).toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-16 gap-2 sm:grid-cols-16" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
              {mockDataBinary.map((bit, i) => (
                <div key={i} className={`w-full aspect-square flex items-center justify-center rounded border transition-all duration-[1500ms] ${
                  mounted 
                    ? (bit === '1' ? 'border-emerald-400/80 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-slate-800 bg-slate-900/50')
                    : 'border-slate-900 bg-slate-950'
                }`} style={{ transitionDelay: `${i * 15}ms` }}>
                  <span className={`text-[10px] font-bold font-mono ${bit === '1' ? 'text-emerald-300 drop-shadow-[0_0_5px_rgba(16,185,129,1)]' : 'text-slate-700'}`}>
                    {bit}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer legend */}
        <div className="mt-8 flex items-center gap-6 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-cyan-500/20 border border-cyan-400"></div>
            <span>High Voltage (1)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-900 border border-slate-800"></div>
            <span>Ground (0)</span>
          </div>
        </div>

      </div>
    </div>
  )
}
