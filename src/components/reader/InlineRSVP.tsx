import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, X, Minus, Plus, ChevronRight } from 'lucide-react'
import type { WordPos } from '@/components/pdf/PDFPageRenderer'

interface InlineRSVPProps {
  text: string
  wordPositions: WordPos[]
  onClose: () => void
  pageContainerRef?: React.RefObject<HTMLDivElement | null>
  pageNumber?: number
  totalPages?: number
  onPageEnd?: () => void
  onPageStart?: () => void
  autoPlay?: boolean
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
    let found = false
    for (let search = posIdx; search < Math.min(posIdx + 5, positions.length); search++) {
      if (positions[search].word === tokens[t]) {
        map.set(t, positions[search])
        posIdx = search + 1
        found = true
        break
      }
    }
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

export function InlineRSVP({
  text,
  wordPositions,
  onClose,
  pageContainerRef,
  pageNumber,
  totalPages,
  onPageEnd,
  onPageStart,
  autoPlay = false,
}: InlineRSVPProps) {
  const tokens = useMemo(() => tokenize(text), [text])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [wpm, setWpm] = useState(300)
  const [showControls, setShowControls] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [, forceUpdate] = useState(0)
  const prevTextRef = useRef(text)
  const autoPlayRef = useRef(autoPlay)

  autoPlayRef.current = autoPlay

  const posMap = useMemo(() => buildPositionMap(tokens, wordPositions), [tokens, wordPositions])

  // Reset when text changes (new page)
  useEffect(() => {
    if (prevTextRef.current !== text) {
      prevTextRef.current = text
      setCurrentIndex(0)
      setIsTransitioning(false)
      if (autoPlayRef.current) {
        setTimeout(() => setIsPlaying(true), 200)
      }
    }
  }, [text])

  const currentWord = tokens[currentIndex] || ''
  const currentPos = posMap.get(currentIndex)
  const progress = tokens.length > 0 ? (currentIndex / tokens.length) * 100 : 0

  // Calculate screen position for the current word highlight
  const highlight = useMemo(() => {
    if (currentIndex >= tokens.length || !pageContainerRef?.current || !currentPos) return null

    const pageRect = pageContainerRef.current.getBoundingClientRect()
    const scrollContainer = pageContainerRef.current.closest('[class*="overflow-auto"]') as HTMLElement | null
    const scrollRect = scrollContainer?.getBoundingClientRect()
    if (!scrollRect) return null

    return {
      screenX: pageRect.left + currentPos.x,
      screenY: pageRect.top + currentPos.y,
      width: currentPos.width,
      height: currentPos.height,
    }
  }, [currentIndex, currentPos, pageContainerRef, forceUpdate])

  // Auto-scroll: keep highlight in the upper 30-50% of the viewport
  useEffect(() => {
    if (!highlight || isTransitioning) return
    const scrollContainer = pageContainerRef?.current?.closest('[class*="overflow-auto"]') as HTMLElement | null
    if (!scrollContainer) return

    const scrollRect = scrollContainer.getBoundingClientRect()
    const viewportHeight = scrollRect.height

    // Where the highlight is on screen (relative to viewport)
    const highlightOnScreen = highlight.screenY - scrollRect.top

    // Target zone: keep highlight between 30% and 50% of viewport
    const targetMin = viewportHeight * 0.3
    const targetMax = viewportHeight * 0.5

    // If highlight is below target zone, scroll down
    if (highlightOnScreen > targetMax) {
      const scrollAmount = highlightOnScreen - (viewportHeight * 0.4)
      scrollContainer.scrollBy({ top: scrollAmount, behavior: 'smooth' })
    }
    // If highlight is above target zone, scroll up
    else if (highlightOnScreen < targetMin) {
      const scrollAmount = highlightOnScreen - (viewportHeight * 0.4)
      scrollContainer.scrollBy({ top: scrollAmount, behavior: 'smooth' })
    }
  }, [highlight, isTransitioning, pageContainerRef])

  // Recalculate on external scroll
  useEffect(() => {
    const scrollEl = pageContainerRef?.current?.closest('[class*="overflow-auto"]') as HTMLElement | null
    if (!scrollEl) return
    const onScroll = () => forceUpdate((n) => n + 1)
    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    return () => scrollEl.removeEventListener('scroll', onScroll)
  }, [pageContainerRef])

  // Auto-advance to next page
  const advanceToNextPage = useCallback(() => {
    if (!onPageEnd) {
      setIsPlaying(false)
      return
    }
    setIsTransitioning(true)
    onPageEnd()
  }, [onPageEnd])

  // Auto-play interval
  useEffect(() => {
    if (isPlaying && !isTransitioning) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= tokens.length - 1) {
            clearInterval(intervalRef.current)
            setTimeout(() => advanceToNextPage(), 100)
            return prev
          }
          return prev + 1
        })
      }, (60 / wpm) * 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, wpm, tokens.length, isTransitioning, advanceToNextPage])

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
    if (currentIndex >= tokens.length - 1) {
      setCurrentIndex(0)
      onPageStart?.()
    }
    setIsPlaying(true)
    setIsTransitioning(false)
    setShowControls(true)
  }, [currentIndex, tokens.length, onPageStart])

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

  const handleSkipToEnd = useCallback(() => {
    advanceToNextPage()
  }, [advanceToNextPage])

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === ' ') { e.preventDefault(); isPlaying ? handlePause() : handlePlay() }
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'n' || e.key === 'Enter') handleSkipToEnd()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isPlaying, onClose, handlePlay, handlePause, handlePrev, handleNext, handleSkipToEnd])

  // Show controls on mouse move
  useEffect(() => {
    const handleMove = () => setShowControls(true)
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  const hasNextPage = (pageNumber || 0) < (totalPages || 0)

  return (
    <>
      {/* Highlight — follows the word, page scrolls to keep it in upper viewport */}
      {highlight && !isTransitioning && (
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
          {/* Glow behind the word */}
          <div
            className="absolute -inset-[6px] rounded-lg"
            style={{
              background: 'rgba(var(--color-accent-rgb, 59, 130, 246), 0.18)',
              border: '2px solid var(--color-accent)',
              boxShadow: '0 0 20px rgba(var(--color-accent-rgb, 59, 130, 246), 0.3), 0 0 40px rgba(var(--color-accent-rgb, 59, 130, 246), 0.1)',
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
              {/* Progress */}
              <div className="px-5 pt-3">
                <div className="relative h-1 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--color-accent)] to-purple-500 rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-[var(--color-text-tertiary)] tabular-nums">
                    {currentIndex + 1}/{tokens.length}
                  </span>
                  {pageNumber && (
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">
                      Page {pageNumber}
                    </span>
                  )}
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

                <div className="flex items-center gap-1.5">
                  {hasNextPage && (
                    <button
                      onClick={handleSkipToEnd}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent-muted)] transition-colors"
                      title="Skip to next page (N)"
                    >
                      Next page <ChevronRight size={12} />
                    </button>
                  )}
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
