'use client'

import { useCallback } from 'react'
import Particles from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { Engine, Container, ISourceOptions } from '@tsparticles/engine'
import type { SimState } from './visualizer'

type ParticleStreamProps = {
  state: SimState | 'level-up'
  /** unique key to force re-burst on each new simulation */
  burstKey: number
}

// ── LEVEL UP: massive radial golden explosion ──────────────────────────────
const levelUpConfig: ISourceOptions = {
  fullScreen: false,
  fpsLimit: 60,
  background: { color: { value: 'transparent' } },
  particles: {
    number: { value: 0 },
    color: { value: ['#fbbf24', '#f59e0b', '#d97706', '#ffffff'] },
    shape: { type: ['star', 'circle'] },
    opacity: {
      value: 1,
      random: true,
      animation: { enable: true, speed: 2, minimumValue: 0, sync: false, destroy: 'min' },
    },
    size: {
      value: 5,
      random: { enable: true, minimumValue: 2 },
      animation: { enable: true, speed: 5, minimumValue: 0, sync: false, destroy: 'min' }
    },
    life: {
      count: 1,
      duration: { sync: false, value: 2.0 },
    },
    move: {
      enable: true,
      speed: { min: 200, max: 400 },
      direction: 'none', // radial explosion
      straight: false,
      random: false,
      outModes: { default: 'destroy' },
      gravity: { enable: true, acceleration: 4 },
    },
  },
  emitters: {
    direction: 'none',
    rate: { delay: 0, quantity: 150 },
    position: { x: 50, y: 50 },
    size: { width: 0, height: 0 },
    life: { count: 1, duration: 0.1, delay: 0 },
  },
}

// ── HIT: fast cyan + emerald sparks shooting up (data returned fast) ───────
const hitConfig: ISourceOptions = {
  fullScreen: false,
  fpsLimit: 60,
  background: { color: { value: 'transparent' } },
  particles: {
    number: { value: 0 },
    color: { value: ['#22d3ee', '#34d399', '#a5f3fc', '#ffffff'] },
    shape: { type: 'circle' },
    opacity: {
      value: 0.9,
      random: true,
      animation: { enable: true, speed: 3, minimumValue: 0, sync: false, destroy: 'min' },
    },
    size: {
      value: 3,
      random: { enable: true, minimumValue: 1.5 },
    },
    life: {
      count: 1,
      duration: { sync: false, value: 0.7 },
    },
    move: {
      enable: true,
      speed: { min: 120, max: 200 },
      direction: 'top',
      straight: false,
      random: true,
      outModes: { default: 'destroy' },
      gravity: { enable: false },
    },
  },
  emitters: {
    direction: 'top',
    rate: { delay: 0.03, quantity: 6 },
    position: { x: 50, y: 60 },
    size: { width: 35, height: 0 },
    life: { count: 1, duration: 0.5, delay: 0 },
  },
}

// ── MISS: slow amber sparks drifting downward toward RAM ──────────────────
const missConfig: ISourceOptions = {
  fullScreen: false,
  fpsLimit: 60,
  background: { color: { value: 'transparent' } },
  particles: {
    number: { value: 0 },
    color: { value: ['#fbbf24', '#f97316', '#fb923c', '#fde68a'] },
    shape: { type: 'circle' },
    opacity: {
      value: 0.8,
      random: true,
      animation: { enable: true, speed: 1.5, minimumValue: 0, sync: false, destroy: 'min' },
    },
    size: {
      value: 2.5,
      random: { enable: true, minimumValue: 1 },
    },
    life: {
      count: 1,
      duration: { sync: false, value: 1.2 },
    },
    move: {
      enable: true,
      speed: { min: 50, max: 90 },
      direction: 'bottom',
      straight: false,
      random: true,
      outModes: { default: 'destroy' },
      gravity: { enable: true, acceleration: 2 },
    },
  },
  emitters: {
    direction: 'bottom',
    rate: { delay: 0.05, quantity: 3 },
    position: { x: 50, y: 40 },
    size: { width: 25, height: 0 },
    life: { count: 1, duration: 0.9, delay: 0 },
  },
}

// ── CALCULATING: streaming cyan/indigo data bits flowing upward ────────────
const calcConfig: ISourceOptions = {
  fullScreen: false,
  fpsLimit: 60,
  background: { color: { value: 'transparent' } },
  particles: {
    number: { value: 0 },
    color: { value: ['#22d3ee', '#818cf8', '#60a5fa', '#c4b5fd'] },
    shape: { type: ['square', 'circle'] },
    opacity: {
      value: 0.85,
      random: true,
      animation: { enable: true, speed: 4, minimumValue: 0.1, sync: false, destroy: 'min' },
    },
    size: {
      value: 2,
      random: { enable: true, minimumValue: 1 },
    },
    life: {
      count: 1,
      duration: { sync: false, value: 1.0 },
    },
    move: {
      enable: true,
      speed: { min: 80, max: 140 },
      direction: 'top',
      straight: false,
      random: false,
      outModes: { default: 'destroy' },
    },
  },
  emitters: {
    direction: 'top',
    rate: { delay: 0.05, quantity: 4 },
    position: { x: 50, y: 85 },
    size: { width: 40, height: 0 },
    life: { count: 1, duration: 1.4, delay: 0 },
  },
}

export function ParticleStream({ state, burstKey }: ParticleStreamProps) {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  const particlesLoaded = useCallback(async (_container: Container | undefined) => {
    // no-op
  }, [])

  if (state === 'idle') return null

  const config =
    state === 'level-up'
      ? levelUpConfig
      : state === 'hit'
      ? hitConfig
      : state === 'miss'
      ? missConfig
      : calcConfig

  return (
    <Particles
      key={`${state}-${burstKey}`}
      id={`cache-particles-${state}-${burstKey}`}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: '100%', height: '100%' }}
      options={config}
      init={particlesInit}
      loaded={particlesLoaded}
    />
  )
}
