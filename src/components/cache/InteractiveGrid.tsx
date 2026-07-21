import React, { useEffect, useState } from 'react'

export function InteractiveGrid({ children }: { children: React.ReactNode }) {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="relative w-full h-full min-h-screen">
      {/* The base dot grid */}
      <div 
        className="fixed inset-0 pointer-events-none z-[-2] opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(100, 116, 139, 0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
      
      {/* The glowing mouse-tracking mask */}
      <div 
        className="fixed inset-0 pointer-events-none z-[-1] transition-opacity duration-300 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(34, 211, 238, 0.8) 1px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          maskImage: `radial-gradient(circle 150px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(circle 150px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`
        }}
      />

      {/* Volumetric background blobs */}
      <div className="fixed inset-0 pointer-events-none z-[-3] overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-blob-orbit pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-blob-orbit pointer-events-none" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  )
}
