import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, X, Minus, Plus } from 'lucide-react'

interface InlineRSVPProps {
  text: string
  onClose: () => void
}

export function InlineRSVP({ text, onClose }: InlineRSVPProps) {
  const words = useMemo(() => text.split(/\s+/).filter((w) => w.length > 0), [text])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [wpm, setWpm] = useState(300)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentWord = words[currentIndex] || ''
  const progress = words.length > 0 ? (currentIndex / words.length) * 100 : 0

  // Context words (show before/after for flow)
  const contextStart = Math.max(0, currentIndex - 3)
  const contextEnd = Math.min(words.length, currentIndex + 4)
  const contextWords = words.slice(contextStart, contextEnd)

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
    if (currentIndex >= words.length - 1 && isPlaying) {
      setIsPlaying(false)
    }
  }, [currentIndex, words.length, isPlaying])

  const handlePlay = useCallback(() => {
    if (currentIndex >= words.length - 1) setCurrentIndex(0)
    setIsPlaying(true)
  }, [currentIndex, words.length])

  const handlePrev = useCallback(() => {
    setCurrentIndex((p) => Math.max(0, p - 5))
  }, [])

  const handleNext = useCallback(() => {
    setCurrentIndex((p) => Math.min(words.length - 1, p + 5))
  }, [words.length])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === ' ') { e.preventDefault(); isPlaying ? setIsPlaying(false) : handlePlay() }
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isPlaying, onClose, handlePlay, handlePrev, handleNext])

  const highlightIdx = currentIndex - contextStart

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[70] w-[680px] max-w-[90vw]"
    >
      <div className="bg-[var(--color-surface-0)]/95 backdrop-blur-2xl border border-[var(--color-surface-3)] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden">
        {/* Word display area */}
        <div className="px-8 py-6 min-h-[120px] flex items-center justify-center relative overflow-hidden">
          {/* Subtle tracking line */}
          <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 bg-[var(--color-accent)]/10 rounded-full" />

          {/* Context words */}
          <div className="flex items-baseline gap-2 flex-wrap justify-center relative z-10">
            {contextWords.map((word, i) => {
              const isCurrent = i === highlightIdx
              const isPast = i < highlightIdx
              return (
                <span
                  key={`${currentIndex}-${i}`}
                  className={`
                    transition-all duration-150 ease-out
                    ${isCurrent
                      ? 'text-2xl font-bold text-[var(--color-accent)] scale-110'
                      : isPast
                        ? 'text-base text-[var(--color-text-tertiary)] opacity-40'
                        : 'text-base text-[var(--color-text-secondary)] opacity-70'
                    }
                  `}
                  style={{ fontFamily: 'var(--font-reading)' }}
                >
                  {isCurrent ? (
                    <span className="relative">
                      <span className="relative z-10">{word}</span>
                      <motion.span
                        layoutId="rsvp-glow"
                        className="absolute inset-0 -mx-2 -my-1 bg-[var(--color-accent)]/10 rounded-lg"
                        transition={{ duration: 0.1 }}
                      />
                    </span>
                  ) : (
                    word
                  )}
                </span>
              )
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6">
          <div className="relative h-1 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--color-accent)] to-purple-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* WPM controls */}
            <button
              onClick={() => setWpm((w) => Math.max(100, w - 25))}
              className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <Minus size={14} />
            </button>
            <span className="text-xs font-semibold text-[var(--color-accent)] tabular-nums w-14 text-center">
              {wpm} <span className="text-[9px] font-normal text-[var(--color-text-tertiary)]">WPM</span>
            </span>
            <button
              onClick={() => setWpm((w) => Math.min(800, w + 25))}
              className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-1.5">
            <button onClick={handlePrev} className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-colors">
              <SkipBack size={16} />
            </button>
            <button
              onClick={() => isPlaying ? setIsPlaying(false) : handlePlay()}
              className="p-3 rounded-xl bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors shadow-lg shadow-[var(--color-accent)]/25"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <button onClick={handleNext} className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-colors">
              <SkipForward size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[var(--color-text-tertiary)] tabular-nums">
              {currentIndex + 1}/{words.length}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
