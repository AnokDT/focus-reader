import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, X, Type } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Slider } from '@/components/ui/Slider'

interface RSVPReaderProps {
  text: string
  onClose: () => void
}

export function RSVPReader({ text, onClose }: RSVPReaderProps) {
  const words = useMemo(() => {
    return text.split(/\s+/).filter((w) => w.length > 0)
  }, [text])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [wpm, setWpm] = useState(300)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const currentWord = words[currentIndex] || ''
  const progress = words.length > 0 ? (currentIndex / words.length) * 100 : 0

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

  const handlePlay = useCallback(() => {
    if (currentIndex >= words.length - 1) {
      setCurrentIndex(0)
    }
    setIsPlaying(true)
  }, [currentIndex, words.length])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }, [])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(words.length - 1, prev + 1))
  }, [words.length])

  const handleReset = useCallback(() => {
    setIsPlaying(false)
    setCurrentIndex(0)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === ' ') {
        e.preventDefault()
        isPlaying ? handlePause() : handlePlay()
      }
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isPlaying, onClose])

  // Highlight letter (middle of word gets accent color)
  const highlightIndex = Math.floor(currentWord.length / 2)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[90] bg-[var(--color-surface-0)]/95 backdrop-blur-xl flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-surface-3)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
            <Type size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Speed Reader</h2>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">
              {wpm} WPM · {words.length} words
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Word display */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="relative w-full max-w-lg">
          {/* Focus indicator */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-16 bg-[var(--color-accent)]/5 rounded-2xl border border-[var(--color-accent)]/20" />

          {/* Current word */}
          <div className="relative text-center py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.08 }}
                className="text-5xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-reading)' }}
              >
                {currentWord.split('').map((char, i) => (
                  <span
                    key={i}
                    className={
                      i === highlightIndex
                        ? 'text-[var(--color-accent)]'
                        : 'text-[var(--color-text-primary)]'
                    }
                  >
                    {char}
                  </span>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Word counter */}
        <div className="mt-8 flex items-center gap-4 text-sm text-[var(--color-text-tertiary)]">
          <span className="tabular-nums">{currentIndex + 1} / {words.length}</span>
          <span>·</span>
          <span className="tabular-nums">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 pb-6 space-y-4">
        {/* Progress bar */}
        <div className="relative h-1.5 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-[var(--color-accent)] rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleReset} icon={<SkipBack size={16} />} />

          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Button>

          <Button
            variant="primary"
            size="lg"
            onClick={isPlaying ? handlePause : handlePlay}
            icon={isPlaying ? <Pause size={20} /> : <Play size={20} />}
            className="w-14 h-14 rounded-full !p-0"
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex >= words.length - 1}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Button>

          <Button variant="ghost" size="sm" onClick={onClose} icon={<X size={16} />} />
        </div>

        {/* WPM slider */}
        <div className="max-w-sm mx-auto">
          <Slider
            label="Reading Speed"
            min={100}
            max={800}
            step={10}
            value={wpm}
            onChange={setWpm}
            formatValue={(v: number) => `${v} WPM`}
          />
        </div>
      </div>
    </motion.div>
  )
}
