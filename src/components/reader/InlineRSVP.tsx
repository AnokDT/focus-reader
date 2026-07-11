import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, X, Minus, Plus } from 'lucide-react'
import type * as pdfjsLib from 'pdfjs-dist'

interface WordPosition {
  word: string
  x: number
  y: number
  width: number
  height: number
}

interface InlineRSVPProps {
  text: string
  pdf: pdfjsLib.PDFDocumentProxy
  pageNumber: number
  scale: number
  onClose: () => void
}

export function InlineRSVP({ text, pdf, pageNumber, scale, onClose }: InlineRSVPProps) {
  const words = useMemo(() => text.split(/\s+/).filter((w) => w.length > 0), [text])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [wpm, setWpm] = useState(300)
  const [wordPositions, setWordPositions] = useState<WordPosition[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const pageRef = useRef<HTMLDivElement>(null)

  const currentWord = words[currentIndex] || ''
  const progress = words.length > 0 ? (currentIndex / words.length) * 100 : 0

  // Extract word positions from PDF text content
  useEffect(() => {
    let cancelled = false
    const extractPositions = async () => {
      try {
        const page = await pdf.getPage(pageNumber)
        const viewport = page.getViewport({ scale })
        const content = await page.getTextContent()
        const positions: WordPosition[] = []

        content.items.forEach((item: any) => {
          if (!item.str || !item.transform) return
          const [x, y, , , w, h] = item.transform
          // Split text items into individual words
          const itemWords = item.str.split(/\s+/).filter((w: string) => w.length > 0)
          let currentX = x
          const avgCharWidth = w / Math.max(item.str.length, 1)

          itemWords.forEach((word: string) => {
            const wordWidth = word.length * avgCharWidth
            positions.push({
              word,
              x: currentX / viewport.width,
              y: (viewport.height - y - h) / viewport.height,
              width: wordWidth / viewport.width,
              height: h / viewport.height,
            })
            currentX += wordWidth + avgCharWidth // space between words
          })
        })

        if (!cancelled) setWordPositions(positions)
      } catch (err) {
        console.error('Failed to extract word positions:', err)
      }
    }
    extractPositions()
    return () => { cancelled = true }
  }, [pdf, pageNumber, scale])

  // Find the best matching position for the current word
  const currentPosition = useMemo(() => {
    if (wordPositions.length === 0 || currentIndex >= words.length) return null
    const target = words[currentIndex]
    // Try exact match first
    let pos = wordPositions.find((p, i) => p.word === target && i >= currentIndex * 0.8)
    // Fallback: find closest word
    if (!pos) pos = wordPositions.find((p) => p.word === target)
    // Fallback: find word containing the target
    if (!pos) pos = wordPositions.find((p) => p.word.includes(target) || target.includes(p.word))
    return pos
  }, [wordPositions, currentIndex, words])

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

  const handlePlay = useCallback(() => {
    if (currentIndex >= words.length - 1) setCurrentIndex(0)
    setIsPlaying(true)
  }, [currentIndex, words.length])

  const handlePrev = useCallback(() => setCurrentIndex((p) => Math.max(0, p - 5)), [])
  const handleNext = useCallback(() => setCurrentIndex((p) => Math.min(words.length - 1, p + 5)), [words.length])

  // Keyboard shortcuts
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

  return (
    <>
      {/* Word highlight overlay ON the PDF page */}
      {currentPosition && (
        <motion.div
          ref={pageRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed z-[65] pointer-events-none"
          style={{
            left: `${currentPosition.x * 100}%`,
            top: `${currentPosition.y * 100}%`,
            width: `${currentPosition.width * 100}%`,
            height: `${currentPosition.height * 100}%`,
          }}
        >
          {/* Highlight box */}
          <motion.div
            layoutId="rsvp-word-highlight"
            className="absolute -inset-1 rounded"
            style={{
              background: 'rgba(var(--color-accent-rgb, 59, 130, 246), 0.25)',
              border: '2px solid var(--color-accent)',
              boxShadow: '0 0 12px rgba(var(--color-accent-rgb, 59, 130, 246), 0.3)',
            }}
            transition={{ duration: 0.08, ease: 'easeOut' }}
          />
          {/* Word label */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-[var(--color-accent)] text-white text-xs font-bold whitespace-nowrap shadow-lg"
          >
            {currentWord}
          </motion.div>
        </motion.div>
      )}

      {/* Floating control bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[70]"
      >
        <div className="bg-[var(--color-surface-0)]/95 backdrop-blur-2xl border border-[var(--color-surface-3)] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden">
          {/* Progress bar */}
          <div className="px-4 pt-3">
            <div className="relative h-1 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--color-accent)] to-purple-500 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="px-4 py-3 flex items-center justify-between gap-4">
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
    </>
  )
}
