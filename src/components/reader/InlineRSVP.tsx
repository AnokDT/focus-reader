import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, X, Minus, Plus } from 'lucide-react'

interface WordPosition {
  word: string
  x: number
  y: number
  width: number
  height: number
}

interface InlineRSVPProps {
  text: string
  positions: WordPosition[]
  onClose: () => void
}

export function InlineRSVP({ text, positions, onClose }: InlineRSVPProps) {
  const words = useMemo(() => text.split(/\s+/).filter((w) => w.length > 0), [text])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [wpm, setWpm] = useState(300)
  const [showControls, setShowControls] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const currentWord = words[currentIndex] || ''
  const progress = words.length > 0 ? (currentIndex / words.length) * 100 : 0

  // Match current word to its position on the page
  const currentPosition = useMemo(() => {
    if (positions.length === 0 || currentIndex >= words.length) return null
    const target = words[currentIndex]
    if (!target) return null

    // Exact match
    let pos = positions.find((p, i) => p.word === target && Math.abs(i - currentIndex) < 5)
    if (pos) return pos

    // Fallback: find any occurrence of this word
    pos = positions.find((p) => p.word === target)
    if (pos) return pos

    // Fallback: partial match
    pos = positions.find((p) => p.word.includes(target.slice(0, 4)) || target.includes(p.word.slice(0, 4)))
    return pos || null
  }, [positions, currentIndex, words])

  // Auto-play timer
  useEffect(() => {
    if (isPlaying && currentIndex < words.length - 1) {
      const msPerWord = (60 / wpm) * 1000
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= words.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, msPerWord)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, wpm, words.length, currentIndex])

  useEffect(() => {
    if (currentIndex >= words.length - 1 && isPlaying) setIsPlaying(false)
  }, [currentIndex, words.length, isPlaying])

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
    if (currentIndex >= words.length - 1) setCurrentIndex(0)
    setIsPlaying(true)
    setShowControls(true)
  }, [currentIndex, words.length])

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
    setCurrentIndex((p) => Math.min(words.length - 1, p + 1))
    setShowControls(true)
  }, [words.length])

  // Click on page to jump to nearest word
  const handlePageClick = useCallback((e: MouseEvent) => {
    if (positions.length === 0) return
    const target = e.target as HTMLElement
    // Only respond to clicks on the page background, not on controls
    if (target.closest('[data-rsvp-controls]')) return

    // Find nearest word position to click
    const clickX = e.clientX / window.innerWidth
    const clickY = e.clientY / window.innerHeight

    let nearestIdx = 0
    let nearestDist = Infinity
    positions.forEach((pos, i) => {
      const dx = pos.x + pos.width / 2 - clickX
      const dy = pos.y + pos.height / 2 - clickY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < nearestDist) {
        nearestDist = dist
        nearestIdx = i
      }
    })

    // Map position index to word index
    setCurrentIndex(Math.min(nearestIdx, words.length - 1))
    setShowControls(true)
  }, [positions, words.length])

  useEffect(() => {
    window.addEventListener('click', handlePageClick)
    return () => window.removeEventListener('click', handlePageClick)
  }, [handlePageClick])

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
      {/* Word highlight overlay ON the PDF page */}
      <AnimatePresence>
        {currentPosition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            className="fixed pointer-events-none z-[60]"
            style={{
              left: `${currentPosition.x * 100}%`,
              top: `${currentPosition.y * 100}%`,
              width: `${Math.max(currentPosition.width * 100, 3)}%`,
              height: `${currentPosition.height * 100}%`,
            }}
          >
            {/* Highlight rectangle */}
            <div
              className="absolute -inset-[2px] rounded"
              style={{
                background: 'rgba(var(--color-accent-rgb, 59, 130, 246), 0.22)',
                border: '2px solid var(--color-accent)',
                boxShadow: '0 0 16px rgba(var(--color-accent-rgb, 59, 130, 246), 0.25)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
              {/* Current word display */}
              <div className="px-6 pt-3 pb-1">
                <div className="text-center" style={{ fontFamily: 'var(--font-reading)' }}>
                  <span className="text-lg font-bold text-[var(--color-accent)]">{currentWord}</span>
                  <span className="text-xs text-[var(--color-text-tertiary)] ml-2">
                    {currentIndex + 1}/{words.length}
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
