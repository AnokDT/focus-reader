import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, X, Minus, Plus } from 'lucide-react'
import type { WordPos } from '@/components/pdf/PDFPageRenderer'

interface InlineRSVPProps {
  text: string
  wordPositions: WordPos[]
  onClose: () => void
  pageContainerRef?: React.RefObject<HTMLDivElement | null>
}

function tokenize(text: string): string[] {
  const tokens: string[] = []
  const regex = /[\p{L}\p{N}]+/gu
  let match
  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[0])
  }
  return tokens
}

function buildPositionMap(tokens: string[], positions: WordPos[]): Map<number, WordPos> {
  const map = new Map<number, WordPos>()
  let posIdx = 0

  for (let t = 0; t < tokens.length; t++) {
    // Try to find a matching position
    let found = false
    for (let search = posIdx; search < Math.min(posIdx + 5, positions.length); search++) {
      if (positions[search].word === tokens[t]) {
        map.set(t, positions[search])
        posIdx = search + 1
        found = true
        break
      }
    }
    // Fallback: interpolate position from neighbors
    if (!found && positions.length > 0) {
      const prevPos = positions[Math.max(0, posIdx - 1)]
      const nextPos = positions[Math.min(posIdx, positions.length - 1)]
      const avgX = (prevPos.x + nextPos.x) / 2
      const avgY = (prevPos.y + nextPos.y) / 2
      map.set(t, {
        word: tokens[t],
        x: avgX + t * 40,
        y: avgY,
        width: tokens[t].length * 10,
        height: prevPos.height,
      })
    }
  }
  return map
}

export function InlineRSVP({ text, wordPositions, onClose, pageContainerRef }: InlineRSVPProps) {
  const tokens = useMemo(() => tokenize(text), [text])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [wpm, setWpm] = useState(300)
  const [showControls, setShowControls] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [, forceUpdate] = useState(0)

  const posMap = useMemo(() => buildPositionMap(tokens, wordPositions), [tokens, wordPositions])

  const currentWord = tokens[currentIndex] || ''
  const progress = tokens.length > 0 ? (currentIndex / tokens.length) * 100 : 0

  // Calculate screen position for the current word
  const highlight = useMemo(() => {
    if (currentIndex >= tokens.length || !pageContainerRef?.current) return null
    const pos = posMap.get(currentIndex)
    if (!pos) return null

    const pageRect = pageContainerRef.current.getBoundingClientRect()
    const scrollContainer = pageContainerRef.current.closest('[class*="overflow-auto"]') as HTMLElement | null
    const scrollRect = scrollContainer?.getBoundingClientRect()

    if (!scrollRect) return null

    // Calculate scroll offset of the page within the scroll container
    const pageOffsetTop = pageRect.top - scrollRect.top + scrollContainer!.scrollTop

    return {
      screenX: pageRect.left + pos.x,
      screenY: scrollRect.top + pageOffsetTop - scrollContainer!.scrollTop + pos.y,
      width: pos.width,
      height: pos.height,
    }
  }, [currentIndex, posMap, pageContainerRef, tokens.length, forceUpdate])

  // Recalculate on scroll
  useEffect(() => {
    const scrollEl = pageContainerRef?.current?.closest('[class*="overflow-auto"]') as HTMLElement | null
    if (!scrollEl) return
    const onScroll = () => forceUpdate((n) => n + 1)
    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    return () => scrollEl.removeEventListener('scroll', onScroll)
  }, [pageContainerRef])

  // Auto-play
  useEffect(() => {
    if (isPlaying && currentIndex < tokens.length - 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= tokens.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, (60 / wpm) * 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, wpm, tokens.length, currentIndex])

  useEffect(() => {
    if (currentIndex >= tokens.length - 1 && isPlaying) setIsPlaying(false)
  }, [currentIndex, tokens.length, isPlaying])

  // Hide controls after inactivity
  useEffect(() => {
    if (showControls) {
      clearTimeout(controlsTimeoutRef.current)
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false)
      }, 3000)
    }
    return () => clearTimeout(controlsTimeoutRef.current)
  }, [showControls, isPlaying, currentIndex])

  const handlePlay = useCallback(() => {
    if (currentIndex >= tokens.length - 1) setCurrentIndex(0)
    setIsPlaying(true)
    setShowControls(true)
  }, [currentIndex, tokens.length])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
    setShowControls(true)
  }, [])

  const handlePrev = useCallback(() => {
    setIsPlaying(false)
    setCurrentIndex((p) => Math.max(0, p - 1))
    setShowControls(true)
  }, [])

  const handleNext = useCallback(() => {
    setIsPlaying(false)
    setCurrentIndex((p) => Math.min(tokens.length - 1, p + 1))
    setShowControls(true)
  }, [tokens.length])

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === ' ') { e.preventDefault(); isPlaying ? handlePause() : handlePlay() }
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isPlaying, onClose, handlePlay, handlePause, handlePrev, handleNext])

  // Show controls on mouse move
  useEffect(() => {
    const handleMove = () => setShowControls(true)
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  return (
    <>
      {/* Word highlight — positioned at actual screen coordinates */}
      {highlight && (
        <div
          className="fixed pointer-events-none"
          style={{
            left: highlight.screenX,
            top: highlight.screenY,
            width: Math.max(highlight.width, 30),
            height: Math.max(highlight.height, 14),
            zIndex: 55,
          }}
        >
          <div
            className="absolute -inset-[3px] rounded-md"
            style={{
              background: 'rgba(var(--color-accent-rgb, 59, 130, 246), 0.3)',
              border: '2px solid var(--color-accent)',
              boxShadow: '0 0 24px rgba(var(--color-accent-rgb, 59, 130, 246), 0.35), 0 0 48px rgba(var(--color-accent-rgb, 59, 130, 246), 0.15)',
            }}
          />
        </div>
      )}

      {/* Floating control bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            data-rsvp-controls
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[70]"
          >
            <div className="bg-[var(--color-surface-0)]/95 backdrop-blur-2xl border border-[var(--color-surface-3)] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.15)] overflow-hidden">
              {/* Current word */}
              <div className="px-6 pt-3 pb-1">
                <div className="text-center" style={{ fontFamily: 'var(--font-reading)' }}>
                  <span className="text-lg font-bold text-[var(--color-accent)]">{currentWord}</span>
                  <span className="text-xs text-[var(--color-text-tertiary)] ml-2">
                    {currentIndex + 1}/{tokens.length}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="px-5">
                <div className="relative h-1 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--color-accent)] to-purple-500 rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setWpm((w) => Math.max(100, w - 25))} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors">
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-semibold text-[var(--color-accent)] tabular-nums w-14 text-center">
                    {wpm} <span className="text-[9px] font-normal text-[var(--color-text-tertiary)]">WPM</span>
                  </span>
                  <button onClick={() => setWpm((w) => Math.min(800, w + 25))} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors">
                    <Plus size={14} />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button onClick={handlePrev} className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-colors">
                    <SkipBack size={16} />
                  </button>
                  <button
                    onClick={() => isPlaying ? handlePause() : handlePlay()}
                    className="p-3 rounded-xl bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors shadow-lg shadow-[var(--color-accent)]/25"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>
                  <button onClick={handleNext} className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-colors">
                    <SkipForward size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
