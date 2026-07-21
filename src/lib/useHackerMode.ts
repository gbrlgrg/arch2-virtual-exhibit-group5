import { useState, useCallback } from 'react'

export function useHackerMode(playGlitch: () => void) {
  const [hackerMode, setHackerMode] = useState(false)
  const [isGlitching, setIsGlitching] = useState(false)

  const toggleHackerMode = useCallback(() => {
    if (playGlitch) playGlitch()
    setIsGlitching(true)
    setTimeout(() => {
      setHackerMode(h => !h)
      setIsGlitching(false)
    }, 600)
  }, [playGlitch])

  return { hackerMode, isGlitching, toggleHackerMode }
}

export function toHexDump(text: string): string {
  return Array.from(text).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ').toUpperCase();
}