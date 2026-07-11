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
  const prevTextRef = useRef(text)
  const autoPlayRef = useRef(autoPlay)
  const scrollCooldownRef = useRef(false)
  const lastScrollTopRef = useRef(0)
  const displayPageRef = useRef(pageNumber || 1)

  autoPlayRef.current = autoPlay
  if (pageNumber !== undefined) displayPageRef.current = pageNumber

  const posMap = useMemo(() => buildPositionMap(tokens, wordPositions), [tokens, wordPositions])

  // Reset when text changes (new page)
  useEffect(() => {
    if (prevTextRef.current !== text) {
      prevTextRef.current = text
      setCurrentIndex(0)
      setIsTransitioning(false)
      scrollCooldownRef.current = false
      if (autoPlayRef.current) {
        setTimeout(() => setIsPlaying(true), 300)
      }
    }
  }, [text])

  const currentWord = tokens[currentIndex] || ''
  const currentPos = posMap.get(currentIndex)
  const progress = tokens.length > 0 ? (currentIndex / tokens.length) * 100 : 0

  // Get word's position relative to the scroll container
  const getWordYInScrollContainer = useCallback((): number | null => {
    if (!currentPos || !pageContainerRef?.current) return null
    const pageRect = pageContainerRef.current.getBoundingClientRect()
    const scrollContainer = pageContainerRef.current.closest('[class*="overflow-auto"]') as HTMLElement | null
    if (!scrollContainer) return null
    const scrollRect = scrollContainer.getBoundingClientRect()
    // Word's position relative to scroll container's visible area + current scroll
    return pageRect.top - scrollRect.top + currentPos.y - scrollContainer.scrollTop
  }, [currentPos, pageContainerRef])

  // AUTO-SCROLL: only scroll DOWN when highlight goes below 55% of viewport
  useEffect(() => {
    if (isTransitioning || scrollCooldownRef.current || !isPlaying) return
    const wordY = getWordYInScrollContainer()
    if (wordY === null) return

    const scrollContainer = pageContainerRef?.current?.closest('[class*="overflow-auto"]') as HTMLElement | null
    if (!scrollContainer) return

    const viewportHeight = scrollContainer.clientHeight

    // Only scroll DOWN when word is below the comfortable reading zone
    if (wordY > viewportHeight * 0.55) {
      // Scroll down to bring the word to ~35% from top
      const targetScrollTop = scrollContainer.scrollTop + wordY - viewportHeight * 0.35

      // Don't scroll if we're already near the target
      if (Math.abs(targetScrollTop - scrollContainer.scrollTop) < 10) return

      scrollCooldownRef.current = true
      scrollContainer.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      })

      // Cooldown to let smooth scroll settle
      setTimeout(() => {
        scrollCooldownRef.current = false
      }, 350)
    }
    // NEVER scroll up — let the words flow naturally from top to bottom
  }, [currentIndex, isPlaying, isTransitioning, getWordYInScrollContainer, pageContainerRef])

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

  // Calculate highlight screen position for rendering
  const highlightScreen = useMemo(() => {
    if (currentIndex >= tokens.length || !pageContainerRef?.current || !currentPos) return null
    const pageRect = pageContainerRef.current.getBoundingClientRect()
    return {
      x: pageRect.left + currentPos.x,
      y: pageRect.top + currentPos.y,
      w: Math.max(currentPos.width, 30),
      h: Math.max(currentPos.height, 14),
    }
  }, [currentIndex, currentPos, pageContainerRef])

  const hasNextPage = (pageNumber || 0) < (totalPages || 0)

  return (
    <>
      {/* Highlight on the word */}
      {highlightScreen && !isTransitioning && (
        <div
          className="fixed pointer-events-none"
          style={{
            left: highlightScreen.x,
            top: highlightScreen.y,
            width: highlightScreen.w,
            height: highlightScreen.h,
            zIndex: 55,
          }}
        >
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

      {/* Control bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            data-rsvp-controls
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[70]"
          >
            <div className="bg-[var(--color-surface-0)]/95 backdrop-blur-2xl border border-[var(--color-surface-3)] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.15)] overflow-hidden">
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
                  <span className="text-[10px] text-[var(--color-text-tertiary)]">
                    Page {displayPageRef.current}
                  </span>
                </div>
              </div>

              <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setWpm((w) => Math.max(100, w - 25))} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors">
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-semibold text-[var(--color-accent)] tabular-nums w-14 text-center">
                    {wpm} <span className="text-[9px] font-normal text-[var(--color-text-tertiary)]">WPM</span>
                  </span>
                  <button onClick={() => setWpm((w) => Math.min(800, w + 25))} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors">
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
                    >
                      Next <ChevronRight size={12} />
                    </button>
                  )}
                  <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors">
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
