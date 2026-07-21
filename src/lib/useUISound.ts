'use client'

import { useCallback, useEffect, useRef } from 'react'

export function useUISound() {
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Initialize AudioContext on first user interaction to comply with browser policies
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
  }, [])

  useEffect(() => {
    const handleInteraction = () => initAudio()
    window.addEventListener('click', handleInteraction)
    window.addEventListener('keydown', handleInteraction)
    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
    }
  }, [initAudio])

  const playHover = useCallback(() => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    // Soft, high-pitched tick
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.03)

    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.04)
  }, [])

  const playHit = useCallback(() => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    // Satisfying "ping" (C6 to E6 interval)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime) // C6
    osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.1) // E6

    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  }, [])

  const playMiss = useCallback(() => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') return

    // 1. The heavy "clunk"
    const clunkOsc = ctx.createOscillator()
    const clunkGain = ctx.createGain()
    clunkOsc.type = 'square'
    
    clunkOsc.frequency.setValueAtTime(150, ctx.currentTime)
    clunkOsc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15)
    
    clunkGain.gain.setValueAtTime(0, ctx.currentTime)
    clunkGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02)
    clunkGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)

    clunkOsc.connect(clunkGain)
    clunkGain.connect(ctx.destination)
    clunkOsc.start()
    clunkOsc.stop(ctx.currentTime + 0.2)

    // 2. The low hum representing RAM delay (lasts ~2.8s)
    const humOsc = ctx.createOscillator()
    const humGain = ctx.createGain()
    humOsc.type = 'sine'
    
    humOsc.frequency.setValueAtTime(55, ctx.currentTime + 0.15) // low hum
    
    humGain.gain.setValueAtTime(0, ctx.currentTime + 0.15)
    humGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.3)
    humGain.gain.setValueAtTime(0.15, ctx.currentTime + 2.5)
    humGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 2.9)

    humOsc.connect(humGain)
    humGain.connect(ctx.destination)
    humOsc.start(ctx.currentTime + 0.15)
    humOsc.stop(ctx.currentTime + 3.0)
  }, [])

  const playGlitch = useCallback(() => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') return

    const bufferSize = ctx.sampleRate * 0.2; // 0.2 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  }, [])

  const playOptimize = useCallback(() => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') return

    // Play 5 fast mechanical clicks
    for (let i = 0; i < 5; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(1200 + i * 200, ctx.currentTime + i * 0.05)
      
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.05)
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.05 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.04)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.05)
      osc.stop(ctx.currentTime + i * 0.05 + 0.05)
    }

    // Heavy thud at the end
    const thudOsc = ctx.createOscillator()
    const thudGain = ctx.createGain()
    thudOsc.type = 'sine'
    thudOsc.frequency.setValueAtTime(100, ctx.currentTime + 0.25)
    thudOsc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.4)
    
    thudGain.gain.setValueAtTime(0, ctx.currentTime + 0.25)
    thudGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.26)
    thudGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)

    thudOsc.connect(thudGain)
    thudGain.connect(ctx.destination)
    thudOsc.start(ctx.currentTime + 0.25)
    thudOsc.stop(ctx.currentTime + 0.5)
  }, [])

  
  const playComboHit = useCallback((combo: number) => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    // C Major Pentatonic Scale
    const baseFreq = 523.25; // C5
    const intervals = [1, 1.122, 1.259, 1.498, 1.681]; 
    const intervalIndex = (combo - 1) % intervals.length;
    const octave = Math.floor((combo - 1) / intervals.length) + 1;
    const freq = baseFreq * intervals[intervalIndex] * octave;

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    osc.frequency.setValueAtTime(freq * 1.5, ctx.currentTime + 0.1)

    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  }, [])

  const playComboBreak = useCallback(() => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') return

    const osc = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc2.type = 'square'
    
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4)
    
    osc2.frequency.setValueAtTime(1200, ctx.currentTime)
    osc2.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3)

    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)

    osc.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc2.start()
    osc.stop(ctx.currentTime + 0.4)
    osc2.stop(ctx.currentTime + 0.4)
  }, [])

  const flowSynthRef = useRef<{ osc: OscillatorNode, gain: GainNode } | null>(null)

  const startFlowStateSynth = useCallback(() => {
    if (!audioCtxRef.current || flowSynthRef.current) return
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(65.41, ctx.currentTime) // C2

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(400, ctx.currentTime)
    filter.Q.value = 1

    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 2) // Slow fade in

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    flowSynthRef.current = { osc, gain }
  }, [])

  const stopFlowStateSynth = useCallback(() => {
    if (!audioCtxRef.current || !flowSynthRef.current) return
    const ctx = audioCtxRef.current
    const { osc, gain } = flowSynthRef.current

    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 1.5) // Slow fade out
    osc.stop(ctx.currentTime + 1.5)
    
    flowSynthRef.current = null
  }, [])

  return { 
    playHover, playHit, playMiss, playGlitch, playOptimize,
    playComboHit, playComboBreak, startFlowStateSynth, stopFlowStateSynth
  }
}
